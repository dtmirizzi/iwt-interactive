import { describe, it, expect } from 'vitest';
import {
  buildDebtPlan,
  compareStrategies,
  hasHighInterestDebt,
  totalDebtBalance,
  totalMinimumPayments,
  formatMonths,
} from '../utils/debt';
import type { DebtItem } from '../types';

const sampleDebts: DebtItem[] = [
  { id: '1', name: 'Chase Sapphire', category: 'credit_card', balance: 5000, apr: 0.2299, minimum_payment: 150 },
  { id: '2', name: 'Student Loan', category: 'student_loan_federal', balance: 20000, apr: 0.055, minimum_payment: 250 },
  { id: '3', name: 'Car Loan', category: 'auto_loan', balance: 8000, apr: 0.069, minimum_payment: 300 },
];

describe('Debt Utilities', () => {
  describe('hasHighInterestDebt', () => {
    it('returns true when any debt has APR >= 8%', () => {
      expect(hasHighInterestDebt(sampleDebts)).toBe(true);
    });

    it('returns false when all debts are below 8%', () => {
      const lowDebts = sampleDebts.filter(d => d.apr < 0.06);
      expect(hasHighInterestDebt(lowDebts)).toBe(false);
    });

    it('returns false for empty array', () => {
      expect(hasHighInterestDebt([])).toBe(false);
    });
  });

  describe('totalDebtBalance', () => {
    it('sums all balances', () => {
      expect(totalDebtBalance(sampleDebts)).toBe(33000);
    });
  });

  describe('totalMinimumPayments', () => {
    it('sums all minimums', () => {
      expect(totalMinimumPayments(sampleDebts)).toBe(700);
    });
  });

  describe('formatMonths', () => {
    it('formats 0 as debt-free', () => {
      expect(formatMonths(0)).toBe('Debt-free!');
    });

    it('formats months only', () => {
      expect(formatMonths(5)).toBe('5 months');
    });

    it('formats 1 month singular', () => {
      expect(formatMonths(1)).toBe('1 month');
    });

    it('formats years + months', () => {
      expect(formatMonths(14)).toBe('1yr 2mo');
    });

    it('formats exact years', () => {
      expect(formatMonths(24)).toBe('2 years');
    });
  });

  describe('buildDebtPlan - avalanche', () => {
    it('pays highest APR first', () => {
      const plan = buildDebtPlan(sampleDebts, 200, 'avalanche');
      // Credit card (22.99%) should be first in payoff order
      expect(plan.debts_in_order[0].debt_name).toBe('Chase Sapphire');
      expect(plan.total_months).toBeGreaterThan(0);
      expect(plan.total_months).toBeLessThan(600);
      expect(plan.total_interest).toBeGreaterThan(0);
    });

    it('produces a debt-free date', () => {
      const plan = buildDebtPlan(sampleDebts, 200, 'avalanche');
      expect(plan.debt_free_date).toMatch(/^\d{4}-\d{2}$/);
    });
  });

  describe('buildDebtPlan - snowball', () => {
    it('pays smallest balance first', () => {
      const plan = buildDebtPlan(sampleDebts, 200, 'snowball');
      // Credit card ($5000) is smallest, should be first
      expect(plan.debts_in_order[0].debt_name).toBe('Chase Sapphire');
      expect(plan.total_months).toBeGreaterThan(0);
    });
  });

  describe('compareStrategies', () => {
    it('avalanche pays less interest than snowball', () => {
      const comparison = compareStrategies(sampleDebts, 200);
      expect(comparison.avalanche.total_interest).toBeLessThanOrEqual(comparison.snowball.total_interest);
      expect(comparison.interestSaved).toBeGreaterThanOrEqual(0);
    });

    it('both strategies pay off all debts', () => {
      const comparison = compareStrategies(sampleDebts, 200);
      expect(comparison.avalanche.debts_in_order).toHaveLength(3);
      expect(comparison.snowball.debts_in_order).toHaveLength(3);
    });
  });

  describe('edge cases', () => {
    it('handles empty debts', () => {
      const plan = buildDebtPlan([], 500, 'avalanche');
      expect(plan.total_months).toBe(0);
      expect(plan.total_interest).toBe(0);
    });

    it('handles single debt', () => {
      const plan = buildDebtPlan([sampleDebts[0]], 100, 'avalanche');
      expect(plan.debts_in_order).toHaveLength(1);
      expect(plan.total_months).toBeGreaterThan(0);
    });

    it('handles 0% APR debt', () => {
      const zeroAPR: DebtItem[] = [
        { id: 'z', name: 'BNPL', category: 'bnpl', balance: 1000, apr: 0, minimum_payment: 100 },
      ];
      const plan = buildDebtPlan(zeroAPR, 0, 'avalanche');
      expect(plan.total_interest).toBe(0);
      expect(plan.total_months).toBe(10);
    });
  });
});
