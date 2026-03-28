import type { DebtItem, DebtPayoffSchedule, DebtPlan, DebtStrategy } from '../types';
import { HIGH_INTEREST_THRESHOLD } from '../types';

/**
 * Build a full debt payoff plan using avalanche or snowball method.
 *
 * Algorithm:
 * 1. Sort debts by priority (avalanche = highest APR first, snowball = lowest balance first)
 * 2. Each month: accrue interest on all debts, pay minimums, apply extra to priority debt
 * 3. When a debt is paid off, its minimum rolls into extra ("cascade effect")
 * 4. Overpayment on a debt flows to the next priority debt in the same month
 */
export function buildDebtPlan(
  debts: DebtItem[],
  extraMonthly: number,
  strategy: DebtStrategy,
): DebtPlan {
  if (debts.length === 0 || debts.every(d => d.balance <= 0)) {
    return {
      strategy,
      debts_in_order: [],
      total_months: 0,
      total_interest: 0,
      debt_free_date: new Date().toISOString().slice(0, 7),
      monthly_payment: 0,
    };
  }

  // Sort by strategy
  const sorted = [...debts].filter(d => d.balance > 0).sort((a, b) => {
    if (strategy === 'avalanche') return b.apr - a.apr;
    return a.balance - b.balance;
  });

  // Working state
  const balances: Record<string, number> = {};
  const interestPaid: Record<string, number> = {};
  const paidOffMonth: Record<string, number> = {};

  for (const debt of sorted) {
    balances[debt.id] = debt.balance;
    interestPaid[debt.id] = 0;
  }

  const totalMinimum = sorted.reduce((s, d) => s + d.minimum_payment, 0);
  const totalMonthlyPayment = totalMinimum + extraMonthly;
  let month = 0;
  const maxMonths = 600;

  while (month < maxMonths) {
    // Check if all paid off
    const totalRemaining = Object.values(balances).reduce((s, b) => s + b, 0);
    if (totalRemaining <= 0.01) break;

    month++;

    // Step 1: Accrue interest on all active debts
    for (const debt of sorted) {
      if (balances[debt.id] <= 0.01) continue;
      const interest = balances[debt.id] * (debt.apr / 12);
      balances[debt.id] += interest;
      interestPaid[debt.id] += interest;
    }

    // Step 2: Calculate total available payment this month
    // = extra + all minimums from paid-off debts + regular extra
    let pool = extraMonthly;
    for (const debt of sorted) {
      if (balances[debt.id] <= 0.01) {
        // Already paid off — its minimum is freed
        pool += debt.minimum_payment;
      }
    }

    // Step 3: Pay minimums on all active debts
    for (const debt of sorted) {
      if (balances[debt.id] <= 0.01) continue;
      const payment = Math.min(debt.minimum_payment, balances[debt.id]);
      balances[debt.id] -= payment;

      if (balances[debt.id] <= 0.01) {
        balances[debt.id] = 0;
        if (!(debt.id in paidOffMonth)) {
          paidOffMonth[debt.id] = month;
          // Freed minimum goes into pool for this month
          pool += debt.minimum_payment;
        }
      }
    }

    // Step 4: Apply extra pool to priority debts (in sorted order)
    for (const debt of sorted) {
      if (pool <= 0.01) break;
      if (balances[debt.id] <= 0.01) continue;

      const payment = Math.min(pool, balances[debt.id]);
      balances[debt.id] -= payment;
      pool -= payment;

      if (balances[debt.id] <= 0.01) {
        balances[debt.id] = 0;
        if (!(debt.id in paidOffMonth)) {
          paidOffMonth[debt.id] = month;
          // This debt's minimum also frees up for remaining debts this month
          pool += debt.minimum_payment;
        }
      }
    }
  }

  // Build schedule
  const now = new Date();
  const debtsInOrder: DebtPayoffSchedule[] = sorted.map(debt => {
    const months = paidOffMonth[debt.id] ?? month;
    const payoffDate = new Date(now);
    payoffDate.setMonth(payoffDate.getMonth() + months);

    return {
      debt_id: debt.id,
      debt_name: debt.name || debt.category,
      months_to_payoff: months,
      total_interest_paid: Math.round(interestPaid[debt.id] ?? 0),
      payoff_date: payoffDate.toISOString().slice(0, 7),
    };
  });

  debtsInOrder.sort((a, b) => a.months_to_payoff - b.months_to_payoff);

  const debtFreeDate = new Date(now);
  debtFreeDate.setMonth(debtFreeDate.getMonth() + month);

  return {
    strategy,
    debts_in_order: debtsInOrder,
    total_months: month,
    total_interest: debtsInOrder.reduce((s, d) => s + d.total_interest_paid, 0),
    debt_free_date: debtFreeDate.toISOString().slice(0, 7),
    monthly_payment: totalMonthlyPayment,
  };
}

/**
 * Compare avalanche vs snowball and return both plans.
 */
export function compareStrategies(
  debts: DebtItem[],
  extraMonthly: number,
): { avalanche: DebtPlan; snowball: DebtPlan; interestSaved: number } {
  const avalanche = buildDebtPlan(debts, extraMonthly, 'avalanche');
  const snowball = buildDebtPlan(debts, extraMonthly, 'snowball');

  return {
    avalanche,
    snowball,
    interestSaved: snowball.total_interest - avalanche.total_interest,
  };
}

/**
 * Check if any debts are above the high-interest threshold (6% APR per Ramit Sethi).
 */
export function hasHighInterestDebt(debts: DebtItem[]): boolean {
  return debts.some(d => d.apr >= HIGH_INTEREST_THRESHOLD && d.balance > 0);
}

export function totalDebtBalance(debts: DebtItem[]): number {
  return debts.reduce((s, d) => s + d.balance, 0);
}

export function totalMinimumPayments(debts: DebtItem[]): number {
  return debts.reduce((s, d) => s + d.minimum_payment, 0);
}

export function formatMonths(months: number): string {
  if (months <= 0) return 'Debt-free!';
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  if (years === 0) return `${remainingMonths} month${remainingMonths !== 1 ? 's' : ''}`;
  if (remainingMonths === 0) return `${years} year${years !== 1 ? 's' : ''}`;
  return `${years}yr ${remainingMonths}mo`;
}
