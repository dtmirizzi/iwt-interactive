import { describe, it, expect } from 'vitest';
import { taxYear2025 } from '../config';
import {
  maxDeferral,
  maxIRAContribution,
  rothIRALimit,
  needsBackdoorRoth,
  hasProRataIssue,
  maxHSA,
  megaBackdoorSpace,
  selfEmployedContribution,
  annualEmployerMatch,
  buildInvestmentLadder,
} from '../utils/retirement';

const c = taxYear2025;

describe('Retirement Account Calculations', () => {
  describe('maxDeferral', () => {
    it('returns $23,500 for standard age', () => {
      expect(maxDeferral(c, 35, '401k')).toBe(23_500);
    });

    it('adds catch-up for age 50+', () => {
      expect(maxDeferral(c, 52, '401k')).toBe(31_000);
    });

    it('adds super catch-up for age 60-63', () => {
      expect(maxDeferral(c, 61, '401k')).toBe(34_750);
    });

    it('returns 0 for no plan', () => {
      expect(maxDeferral(c, 35, 'none')).toBe(0);
    });

    it('uses SIMPLE IRA limits for SIMPLE plan', () => {
      expect(maxDeferral(c, 35, 'simple_ira')).toBe(16_500);
      expect(maxDeferral(c, 52, 'simple_ira')).toBe(20_000);
    });
  });

  describe('maxIRAContribution', () => {
    it('returns $7,000 for under 50', () => {
      expect(maxIRAContribution(c, 35)).toBe(7_000);
    });

    it('returns $8,000 for 50+', () => {
      expect(maxIRAContribution(c, 55)).toBe(8_000);
    });
  });

  describe('rothIRALimit', () => {
    it('returns full amount when under phase-out', () => {
      expect(rothIRALimit(c, 30, 100_000, 'single')).toBe(7_000);
    });

    it('returns 0 when above phase-out', () => {
      expect(rothIRALimit(c, 30, 200_000, 'single')).toBe(0);
    });

    it('returns reduced amount in phase-out range', () => {
      const limit = rothIRALimit(c, 30, 157_500, 'single');
      expect(limit).toBeGreaterThan(0);
      expect(limit).toBeLessThan(7_000);
    });

    it('handles MFJ phase-outs', () => {
      expect(rothIRALimit(c, 30, 235_000, 'married_joint')).toBe(7_000);
      expect(rothIRALimit(c, 30, 250_000, 'married_joint')).toBe(0);
    });
  });

  describe('needsBackdoorRoth', () => {
    it('returns false when under phase-out', () => {
      expect(needsBackdoorRoth(c, 100_000, 'single')).toBe(false);
    });

    it('returns true when in phase-out range', () => {
      expect(needsBackdoorRoth(c, 155_000, 'single')).toBe(true);
    });

    it('returns true when above phase-out', () => {
      expect(needsBackdoorRoth(c, 200_000, 'single')).toBe(true);
    });
  });

  describe('hasProRataIssue', () => {
    it('returns false with no IRA balances', () => {
      expect(hasProRataIssue({})).toBe(false);
    });

    it('returns true with traditional IRA balance', () => {
      expect(hasProRataIssue({ has_traditional_ira_balance: true })).toBe(true);
    });

    it('returns true with SEP IRA balance', () => {
      expect(hasProRataIssue({ has_sep_ira_balance: true })).toBe(true);
    });
  });

  describe('maxHSA', () => {
    it('returns individual limit for under 55', () => {
      expect(maxHSA(c, 35, 'individual')).toBe(4_300);
    });

    it('adds catch-up for 55+', () => {
      expect(maxHSA(c, 57, 'individual')).toBe(5_300);
    });

    it('returns family limit', () => {
      expect(maxHSA(c, 35, 'family')).toBe(8_550);
    });
  });

  describe('megaBackdoorSpace', () => {
    it('calculates remaining after-tax space', () => {
      // $70,000 total - $23,500 deferral - $10,000 match = $36,500
      expect(megaBackdoorSpace(c, 35, 23_500, 10_000)).toBe(36_500);
    });

    it('accounts for catch-up in total limit', () => {
      // $77,500 total (with catch-up) - $31,000 deferral - $10,000 match = $36,500
      expect(megaBackdoorSpace(c, 52, 31_000, 10_000)).toBe(36_500);
    });
  });

  describe('selfEmployedContribution', () => {
    it('calculates 20% of adjusted earnings', () => {
      const result = selfEmployedContribution(c, 100_000);
      expect(result.max_employer_contribution).toBeGreaterThan(0);
      expect(result.max_employer_contribution).toBeLessThan(25_000);
    });

    it('respects compensation cap', () => {
      const result = selfEmployedContribution(c, 500_000);
      expect(result.max_employer_contribution).toBeLessThanOrEqual(c.sep_ira.max_contribution);
    });
  });

  describe('annualEmployerMatch', () => {
    it('calculates match correctly', () => {
      // 100% match up to 6% of $100k = $6,000
      expect(annualEmployerMatch(100_000, 1.0, 0.06)).toBe(6_000);
    });

    it('calculates 50% match correctly', () => {
      // 50% match up to 6% of $100k = $3,000
      expect(annualEmployerMatch(100_000, 0.5, 0.06)).toBe(3_000);
    });
  });

  describe('buildInvestmentLadder', () => {
    it('returns employer match as priority 1 when available', () => {
      const ladder = buildInvestmentLadder(c, {
        employer_plan_type: '401k',
        employer_match: true,
        employer_match_pct: 1.0,
        employer_match_cap_pct: 0.06,
        gross_monthly_income: 10_000,
        age: 30,
        filing_status: 'single',
        magi: 120_000,
      });

      expect(ladder[0].account_type).toBe('401k');
      expect(ladder[0].is_employer_match).toBe(true);
    });

    it('includes HSA when HDHP is available', () => {
      const ladder = buildInvestmentLadder(c, {
        has_hdhp: true,
        hdhp_coverage_type: 'individual',
        age: 30,
        filing_status: 'single',
        magi: 100_000,
      });

      const hsa = ladder.find(r => r.account_type === 'hsa');
      expect(hsa).toBeDefined();
      expect(hsa!.annual_amount).toBe(4_300);
    });

    it('recommends backdoor Roth for high earners', () => {
      const ladder = buildInvestmentLadder(c, {
        age: 30,
        filing_status: 'single',
        magi: 200_000,
      });

      const backdoor = ladder.find(r => r.account_type === 'backdoor_roth');
      expect(backdoor).toBeDefined();
    });

    it('warns about pro-rata rule when IRA balances exist', () => {
      const ladder = buildInvestmentLadder(c, {
        age: 30,
        filing_status: 'single',
        magi: 200_000,
        has_traditional_ira_balance: true,
      });

      const backdoor = ladder.find(r => r.account_type === 'backdoor_roth');
      expect(backdoor).toBeDefined();
      expect(backdoor!.reason).toContain('pro-rata');
    });

    it('always ends with taxable brokerage', () => {
      const ladder = buildInvestmentLadder(c, { age: 30 });
      const last = ladder[ladder.length - 1];
      expect(last.account_type).toBe('taxable_brokerage');
    });
  });
});
