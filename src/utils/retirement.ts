import type {
  AccountRecommendation,
  EmployerPlanType,
  FilingStatus,
  TaxYearConfig,
  WizardData,
} from '../types';
import { getAgeBracket } from '../types';

/**
 * Calculate the max employee deferral for an employer plan based on age.
 */
export function maxDeferral(config: TaxYearConfig, age: number, planType: EmployerPlanType): number {
  if (planType === 'none') return 0;

  const bracket = getAgeBracket(age);
  let base: number;
  let catchUp: number;

  if (planType === 'simple_ira') {
    base = config.simple_ira.deferral_limit;
    catchUp =
      bracket === 'super_catch_up' ? config.simple_ira.super_catch_up_60_63 :
      bracket === 'catch_up' || bracket === 'post_super' ? config.simple_ira.catch_up_50 : 0;
  } else {
    base = config.employer_plans.deferral_limit;
    catchUp =
      bracket === 'super_catch_up' ? config.employer_plans.super_catch_up_60_63 :
      bracket === 'catch_up' || bracket === 'post_super' ? config.employer_plans.catch_up_50 : 0;
  }

  return base + catchUp;
}

/**
 * Calculate employer match annual amount.
 */
export function annualEmployerMatch(
  grossAnnual: number,
  matchPct: number,
  matchCapPct: number,
): number {
  const employeeContribution = grossAnnual * matchCapPct;
  return employeeContribution * matchPct;
}

/**
 * Calculate the max IRA contribution based on age.
 */
export function maxIRAContribution(config: TaxYearConfig, age: number): number {
  const bracket = getAgeBracket(age);
  const catchUp = bracket !== 'standard' ? config.ira.catch_up_50 : 0;
  return config.ira.contribution_limit + catchUp;
}

/**
 * Calculate Roth IRA contribution limit considering MAGI phase-outs.
 */
export function rothIRALimit(
  config: TaxYearConfig,
  age: number,
  magi: number,
  filingStatus: FilingStatus,
): number {
  const maxContrib = maxIRAContribution(config, age);
  const phaseOut = config.roth_ira_phase_out[filingStatus];

  if (magi <= phaseOut.start) return maxContrib;
  if (magi >= phaseOut.end) return 0;

  // Proportional reduction
  const ratio = (phaseOut.end - magi) / (phaseOut.end - phaseOut.start);
  // Round up to nearest $10 per IRS rules
  return Math.ceil((maxContrib * ratio) / 10) * 10;
}

/**
 * Determine if backdoor Roth is needed/recommended.
 */
export function needsBackdoorRoth(
  config: TaxYearConfig,
  magi: number,
  filingStatus: FilingStatus,
): boolean {
  const phaseOut = config.roth_ira_phase_out[filingStatus];
  return magi > phaseOut.start;
}

/**
 * Check if pro-rata rule is a concern for backdoor Roth.
 */
export function hasProRataIssue(data: Partial<WizardData>): boolean {
  return !!(
    data.has_traditional_ira_balance ||
    data.has_sep_ira_balance ||
    data.has_simple_ira_balance
  );
}

/**
 * Calculate max HSA contribution.
 */
export function maxHSA(
  config: TaxYearConfig,
  age: number,
  coverageType: 'individual' | 'family',
): number {
  const base = coverageType === 'family' ? config.hsa.family : config.hsa.individual;
  const catchUp = age >= 55 ? config.hsa.catch_up_55 : 0;
  return base + catchUp;
}

/**
 * Calculate mega backdoor Roth space.
 */
export function megaBackdoorSpace(
  config: TaxYearConfig,
  age: number,
  employeeDeferral: number,
  employerContributions: number,
): number {
  const bracket = getAgeBracket(age);
  let totalLimit = config.employer_plans.total_annual_addition_415;
  if (bracket === 'catch_up' || bracket === 'post_super') {
    totalLimit += config.employer_plans.catch_up_50;
  } else if (bracket === 'super_catch_up') {
    totalLimit += config.employer_plans.super_catch_up_60_63;
  }

  return Math.max(0, totalLimit - employeeDeferral - employerContributions);
}

/**
 * Calculate SEP IRA or Solo 401k employer contribution for self-employed.
 */
export function selfEmployedContribution(
  config: TaxYearConfig,
  netSEIncome: number,
): { adjusted_earnings: number; max_employer_contribution: number } {
  // Deduct 1/2 of SE tax
  const seTax = netSEIncome * config.social_security.se_tax_rate;
  const halfSETax = seTax / 2;
  const adjustedEarnings = Math.min(netSEIncome - halfSETax, config.sep_ira.compensation_cap);

  const maxContrib = Math.min(
    adjustedEarnings * config.sep_ira.self_employed_effective_pct,
    config.sep_ira.max_contribution,
  );

  return { adjusted_earnings: adjustedEarnings, max_employer_contribution: maxContrib };
}

/**
 * Build the prioritized investment ladder (Ramit's order, extended).
 * This is the core recommendation engine.
 */
export function buildInvestmentLadder(
  config: TaxYearConfig,
  data: Partial<WizardData>,
): AccountRecommendation[] {
  const recommendations: AccountRecommendation[] = [];
  let priority = 1;
  const age = data.age ?? 30;
  const magi = data.combined_magi ?? data.magi ?? 0;
  const filingStatus = data.filing_status ?? 'single';
  const grossAnnual = (data.gross_monthly_income ?? 0) * 12;

  // ── Priority 1: Employer Match (Free Money) ──────────────────────
  if (data.employer_match && data.employer_match_pct && data.employer_match_cap_pct && data.employer_plan_type !== 'none') {
    const matchAmount = annualEmployerMatch(grossAnnual, data.employer_match_pct, data.employer_match_cap_pct);
    const employeeNeeded = grossAnnual * data.employer_match_cap_pct;

    recommendations.push({
      priority: priority++,
      account_type: data.employer_plan_type ?? '401k',
      label: `${(data.employer_plan_type ?? '401k').toUpperCase()} (to employer match)`,
      annual_amount: employeeNeeded,
      monthly_amount: employeeNeeded / 12,
      reason: `Contribute ${Math.round((data.employer_match_cap_pct) * 100)}% to get full employer match of ${formatUSD(matchAmount)}/year. This is a ${Math.round(data.employer_match_pct * 100)}% instant return.`,
      is_employer_match: true,
      match_details: `${Math.round(data.employer_match_pct * 100)}% match up to ${Math.round(data.employer_match_cap_pct * 100)}% of salary`,
    });
  }

  // ── Priority 2: High-Interest Debt ───────────────────────────────
  const highInterestDebts = (data.debts ?? []).filter(d => d.apr >= 0.06 && d.balance > 0);
  if (highInterestDebts.length > 0) {
    const totalHighInterest = highInterestDebts.reduce((s, d) => s + d.balance, 0);
    const totalMinPayments = highInterestDebts.reduce((s, d) => s + d.minimum_payment, 0);
    const highestRate = Math.max(...highInterestDebts.map(d => d.apr));
    const extra = data.debt_extra_monthly ?? 0;
    const monthlyDebtPayment = totalMinPayments + extra;

    recommendations.push({
      priority: priority++,
      account_type: 'debt_payoff',
      label: `Pay Off High-Interest Debt (${highInterestDebts.length} account${highInterestDebts.length > 1 ? 's' : ''})`,
      annual_amount: monthlyDebtPayment * 12,
      monthly_amount: monthlyDebtPayment,
      reason: `${formatUSD(totalHighInterest)} across ${highInterestDebts.length} debt${highInterestDebts.length > 1 ? 's' : ''} at up to ${(highestRate * 100).toFixed(1)}% APR. Paying this off is a guaranteed ${(highestRate * 100).toFixed(1)}% return. Attack aggressively before investing beyond the employer match.`,
    });
  } else if (data.has_high_interest_debt && data.high_interest_debt_balance) {
    // Legacy fallback
    recommendations.push({
      priority: priority++,
      account_type: 'debt_payoff',
      label: 'Pay Off High-Interest Debt',
      annual_amount: data.high_interest_debt_balance,
      monthly_amount: Math.ceil(data.high_interest_debt_balance / 12),
      reason: `Paying off ${data.high_interest_debt_rate ? `${data.high_interest_debt_rate}%` : 'high-interest'} debt is a guaranteed return. Attack this before investing beyond the employer match.`,
    });
  }

  // ── Priority 3: Emergency Fund ───────────────────────────────────
  if (!data.has_emergency_fund || (data.emergency_fund_months ?? 0) < 3) {
    const monthlyExpenses = (data.net_monthly_income ?? 0) * 0.55; // rough estimate
    const targetMonths = 6;
    const currentMonths = data.emergency_fund_months ?? 0;
    const gap = (targetMonths - currentMonths) * monthlyExpenses;

    if (gap > 0) {
      recommendations.push({
        priority: priority++,
        account_type: 'emergency_fund',
        label: 'Build Emergency Fund',
        annual_amount: Math.min(gap, monthlyExpenses * 12),
        monthly_amount: Math.min(gap / 12, monthlyExpenses),
        reason: `Build to ${targetMonths} months of expenses. Currently at ${currentMonths} months. This protects everything else.`,
      });
    }
  }

  // ── Priority 4: HSA (Triple Tax Advantage) ───────────────────────
  if (data.has_hdhp) {
    const hsaMax = maxHSA(config, age, data.hdhp_coverage_type ?? 'individual');
    recommendations.push({
      priority: priority++,
      account_type: 'hsa',
      label: 'Health Savings Account (HSA)',
      annual_amount: hsaMax,
      monthly_amount: Math.round(hsaMax / 12),
      reason: 'The only account with triple tax advantage: deductible contributions, tax-free growth, tax-free withdrawals for medical. At 65 it works like an extra IRA.',
    });
  }

  // ── Priority 5: Roth IRA (or Backdoor) ───────────────────────────
  const directRothLimit = rothIRALimit(config, age, magi, filingStatus);
  const needsBackdoor = needsBackdoorRoth(config, magi, filingStatus);
  const iraMax = maxIRAContribution(config, age);

  if (directRothLimit > 0) {
    recommendations.push({
      priority: priority++,
      account_type: 'roth_ira',
      label: 'Roth IRA',
      annual_amount: directRothLimit,
      monthly_amount: Math.round(directRothLimit / 12),
      reason: 'Tax-free growth and tax-free withdrawals in retirement. No RMDs. Contributions can be withdrawn anytime penalty-free.',
    });
  } else if (needsBackdoor) {
    const hasProRata = hasProRataIssue(data);
    recommendations.push({
      priority: priority++,
      account_type: 'backdoor_roth',
      label: 'Backdoor Roth IRA',
      annual_amount: iraMax,
      monthly_amount: Math.round(iraMax / 12),
      reason: hasProRata
        ? `Your income exceeds Roth limits. Use backdoor strategy. WARNING: You have existing Traditional IRA balances — the pro-rata rule will make part of your conversion taxable. Consider rolling those into your employer 401(k) first.`
        : 'Your income exceeds direct Roth IRA limits. Contribute to a nondeductible Traditional IRA, then convert to Roth. Clean and simple with no existing IRA balances.',
    });
  }

  // ── Priority 6: Max Employer Plan ────────────────────────────────
  if (data.employer_plan_type && data.employer_plan_type !== 'none') {
    const maxDefer = maxDeferral(config, age, data.employer_plan_type);
    const alreadyContributed = data.employer_match && data.employer_match_cap_pct
      ? grossAnnual * data.employer_match_cap_pct
      : 0;
    const remaining = Math.max(0, maxDefer - alreadyContributed);

    if (remaining > 0) {
      recommendations.push({
        priority: priority++,
        account_type: data.employer_plan_type,
        label: `Max ${data.employer_plan_type.toUpperCase()} (beyond match)`,
        annual_amount: remaining,
        monthly_amount: Math.round(remaining / 12),
        reason: `Max out your ${data.employer_plan_type.toUpperCase()} up to the ${formatUSD(maxDefer)} annual limit for tax-deferred growth.`,
      });
    }
  }

  // ── Priority 7: Mega Backdoor Roth ───────────────────────────────
  if (data.employer_allows_after_tax && data.employer_plan_type === '401k') {
    const employeeDeferral = maxDeferral(config, age, '401k');
    const matchAmount = data.employer_match && data.employer_match_pct && data.employer_match_cap_pct
      ? annualEmployerMatch(grossAnnual, data.employer_match_pct, data.employer_match_cap_pct)
      : 0;
    const space = megaBackdoorSpace(config, age, employeeDeferral, matchAmount);

    if (space > 0) {
      recommendations.push({
        priority: priority++,
        account_type: 'mega_backdoor_roth',
        label: 'Mega Backdoor Roth',
        annual_amount: space,
        monthly_amount: Math.round(space / 12),
        reason: `Your plan allows after-tax contributions. Convert up to ${formatUSD(space)}/year to Roth — this is the largest Roth contribution vehicle available.`,
      });
    }
  }

  // ── Priority 8: Self-Employed Accounts ───────────────────────────
  if (data.has_self_employment_income && data.self_employment_net_income) {
    const se = selfEmployedContribution(config, data.self_employment_net_income);
    recommendations.push({
      priority: priority++,
      account_type: 'solo_401k',
      label: 'Solo 401(k) — Employer Contribution',
      annual_amount: se.max_employer_contribution,
      monthly_amount: Math.round(se.max_employer_contribution / 12),
      reason: `Based on ${formatUSD(data.self_employment_net_income)} net SE income. Employer profit-sharing up to 20% of adjusted earnings. Also accepts rollovers to clear Traditional IRA balances for backdoor Roth.`,
    });
  }

  // ── Priority 9: Taxable Brokerage ────────────────────────────────
  recommendations.push({
    priority: priority++,
    account_type: 'taxable_brokerage',
    label: 'Taxable Brokerage Account',
    annual_amount: 0, // remainder
    monthly_amount: 0,
    reason: 'After maxing all tax-advantaged space, invest the remainder here. Long-term capital gains rates are favorable, and you get a step-up in basis at death.',
  });

  return recommendations;
}

function formatUSD(n: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}
