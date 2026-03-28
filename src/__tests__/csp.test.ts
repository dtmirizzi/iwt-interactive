import { describe, it, expect } from 'vitest';
import { evaluateBucket, calculateCSPBuckets, formatCurrency, formatPct, healthColor } from '../utils/csp';

describe('CSP Bucket Evaluation', () => {
  describe('fixed_costs', () => {
    it('excellent when at or below 50%', () => {
      expect(evaluateBucket('fixed_costs', 0.40).health).toBe('excellent');
    });

    it('good when 50-60%', () => {
      expect(evaluateBucket('fixed_costs', 0.55).health).toBe('good');
    });

    it('warning when 60-70%', () => {
      expect(evaluateBucket('fixed_costs', 0.65).health).toBe('warning');
    });

    it('danger when over 70%', () => {
      expect(evaluateBucket('fixed_costs', 0.75).health).toBe('danger');
    });
  });

  describe('investments', () => {
    it('excellent when 20%+', () => {
      expect(evaluateBucket('investments', 0.25).health).toBe('excellent');
    });

    it('good when 10-20%', () => {
      expect(evaluateBucket('investments', 0.12).health).toBe('good');
    });

    it('warning when 5-10%', () => {
      expect(evaluateBucket('investments', 0.07).health).toBe('warning');
    });

    it('danger when under 5%', () => {
      expect(evaluateBucket('investments', 0.03).health).toBe('danger');
    });
  });

  describe('savings', () => {
    it('excellent when 10%+', () => {
      expect(evaluateBucket('savings', 0.12).health).toBe('excellent');
    });

    it('good when 5-10%', () => {
      expect(evaluateBucket('savings', 0.07).health).toBe('good');
    });

    it('warning when 1-5%', () => {
      expect(evaluateBucket('savings', 0.03).health).toBe('warning');
    });

    it('danger when 0%', () => {
      expect(evaluateBucket('savings', 0).health).toBe('danger');
    });
  });

  describe('guilt_free', () => {
    it('good when 20-35%', () => {
      expect(evaluateBucket('guilt_free', 0.25).health).toBe('good');
    });

    it('warning when under 20% but above 10%', () => {
      expect(evaluateBucket('guilt_free', 0.15).health).toBe('warning');
    });

    it('danger when under 10%', () => {
      expect(evaluateBucket('guilt_free', 0.08).health).toBe('danger');
    });

    it('warning when above 35%', () => {
      expect(evaluateBucket('guilt_free', 0.40).health).toBe('warning');
    });
  });
});

describe('calculateCSPBuckets', () => {
  it('returns null when no income', () => {
    expect(calculateCSPBuckets({})).toBeNull();
  });

  it('calculates fixed costs with 15% buffer', () => {
    const result = calculateCSPBuckets({
      net_monthly_income: 10_000,
      fixed_costs: [
        { id: '1', category: 'housing', label: 'Rent', amount: 2_000, owner: 'individual' },
        { id: '2', category: 'utilities', label: 'Utilities', amount: 200, owner: 'individual' },
      ],
      miscellaneous_buffer_pct: 0.15,
    });

    expect(result).not.toBeNull();
    // $2,200 + 15% buffer = $2,530
    expect(result!.fixed_costs.amount).toBe(2_530);
    expect(result!.fixed_costs.pct).toBeCloseTo(0.253, 2);
  });

  it('includes partner income', () => {
    const result = calculateCSPBuckets({
      net_monthly_income: 8_000,
      partner_net_monthly: 5_000,
      fixed_costs: [],
      miscellaneous_buffer_pct: 0.15,
    });

    expect(result!.net_monthly).toBe(13_000);
  });
});

describe('Formatters', () => {
  it('formatCurrency formats correctly', () => {
    expect(formatCurrency(1234)).toBe('$1,234');
    expect(formatCurrency(0)).toBe('$0');
    expect(formatCurrency(1_000_000)).toBe('$1,000,000');
  });

  it('formatPct formats correctly', () => {
    expect(formatPct(0.55)).toBe('55%');
    expect(formatPct(0.10)).toBe('10%');
    expect(formatPct(1.0)).toBe('100%');
  });

  it('healthColor returns correct colors', () => {
    expect(healthColor('excellent')).toBe('#2E7D32');
    expect(healthColor('good')).toBe('#4CAF50');
    expect(healthColor('warning')).toBe('#E65100');
    expect(healthColor('danger')).toBe('#C62828');
  });
});
