import { CSP_TARGETS, type CSPBucket, type CSPData, type CSPHealth } from '../types';

/**
 * Evaluate a CSP bucket percentage against Ramit's targets.
 * Returns a health status and actionable message.
 */
export function evaluateBucket(
  bucket: CSPBucket,
  actual_pct: number,
): { health: CSPHealth; message: string } {
  const target = CSP_TARGETS[bucket];

  switch (bucket) {
    case 'fixed_costs':
      if (actual_pct <= target.min) return { health: 'excellent', message: 'Well below target. Great cost control.' };
      if (actual_pct <= target.max) return { health: 'good', message: 'Within the recommended 50-60% range.' };
      if (actual_pct <= 0.70) return { health: 'warning', message: 'Above 60%. Look at your top 3 expenses (housing, car, insurance) for savings.' };
      return { health: 'danger', message: 'Over 70% on fixed costs leaves little room. Consider reducing housing costs or eliminating subscriptions.' };

    case 'investments':
      if (actual_pct >= 0.20) return { health: 'excellent', message: 'Outstanding. You are building serious wealth.' };
      if (actual_pct >= target.min) return { health: 'good', message: 'Meeting the 10%+ target. Try to increase 1% each year.' };
      if (actual_pct >= 0.05) return { health: 'warning', message: 'Below 10%. Even a 1% increase makes a huge difference over time.' };
      return { health: 'danger', message: 'Under 5% invested. Start with your employer match — it is free money.' };

    case 'savings':
      if (actual_pct >= target.max) return { health: 'excellent', message: 'Strong savings rate.' };
      if (actual_pct >= target.min) return { health: 'good', message: 'Within the 5-10% savings target.' };
      if (actual_pct > 0) return { health: 'warning', message: 'Below 5%. Prioritize building a 3-6 month emergency fund.' };
      return { health: 'danger', message: 'No savings allocation. Even $50/month builds the habit.' };

    case 'guilt_free':
      if (actual_pct >= target.min && actual_pct <= target.max) return { health: 'good', message: 'In the sweet spot. Enjoy it guilt-free.' };
      if (actual_pct < target.min && actual_pct > 0.10) return { health: 'warning', message: 'Below 20%. Make sure you are enjoying your money — burnout is real.' };
      if (actual_pct < 0.10) return { health: 'danger', message: 'Under 10% guilt-free. You may be over-optimizing. A rich life includes spending on what you love.' };
      if (actual_pct > target.max) return { health: 'warning', message: 'Above 35%. Check if some of this should shift to investments or savings goals.' };
      return { health: 'good', message: '' };
  }
}

/**
 * Calculate CSP bucket percentages from wizard data.
 */
export function calculateCSPBuckets(data: Partial<CSPData>) {
  const net = (data.net_monthly_income ?? 0) + (data.partner_net_monthly ?? 0);
  if (net === 0) return null;

  const fixedTotal = (data.fixed_costs ?? []).reduce((sum, item) => sum + item.amount, 0);
  const miscBuffer = fixedTotal * (data.miscellaneous_buffer_pct ?? 0.15);
  const fixedWithBuffer = fixedTotal + miscBuffer;

  const savingsTotal = (data.savings_goals ?? [])
    .filter(g => g.status === 'active')
    .reduce((sum, g) => sum + g.monthly_contribution, 0);

  const investmentTotal = (data.current_investments ?? [])
    .reduce((sum, inv) => sum + inv.monthly_contribution, 0);

  const guiltFree = net - fixedWithBuffer - savingsTotal - investmentTotal;

  return {
    net_monthly: net,
    fixed_costs: { amount: fixedWithBuffer, pct: fixedWithBuffer / net },
    investments: { amount: investmentTotal, pct: investmentTotal / net },
    savings: { amount: savingsTotal, pct: savingsTotal / net },
    guilt_free: { amount: Math.max(0, guiltFree), pct: Math.max(0, guiltFree) / net },
  };
}

/**
 * Format currency for display.
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format percentage for display.
 */
export function formatPct(pct: number): string {
  return `${Math.round(pct * 100)}%`;
}

/**
 * Get the health color for UI rendering.
 */
export function healthColor(health: CSPHealth): string {
  switch (health) {
    case 'excellent': return '#2E7D32';
    case 'good': return '#4CAF50';
    case 'warning': return '#E65100';
    case 'danger': return '#C62828';
  }
}
