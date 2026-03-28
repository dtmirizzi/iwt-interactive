import { describe, it, expect } from 'vitest';
import { getTaxYearConfig, getAvailableTaxYears, taxYear2025, taxYear2026 } from '../config';

describe('Tax Year Configuration', () => {
  it('returns 2025 config', () => {
    const config = getTaxYearConfig(2025);
    expect(config.tax_year).toBe(2025);
  });

  it('returns 2026 config', () => {
    const config = getTaxYearConfig(2026);
    expect(config.tax_year).toBe(2026);
  });

  it('falls back to most recent year for unknown year', () => {
    const config = getTaxYearConfig(2030);
    expect(config.tax_year).toBe(2026);
  });

  it('lists available tax years in descending order', () => {
    const years = getAvailableTaxYears();
    expect(years).toEqual([2026, 2025]);
  });

  describe('2025 limits', () => {
    const c = taxYear2025;

    it('401k deferral limit is $23,500', () => {
      expect(c.employer_plans.deferral_limit).toBe(23_500);
    });

    it('401k catch-up (50+) is $7,500', () => {
      expect(c.employer_plans.catch_up_50).toBe(7_500);
    });

    it('super catch-up (60-63) is $11,250', () => {
      expect(c.employer_plans.super_catch_up_60_63).toBe(11_250);
    });

    it('415(c) total annual addition is $70,000', () => {
      expect(c.employer_plans.total_annual_addition_415).toBe(70_000);
    });

    it('IRA limit is $7,000', () => {
      expect(c.ira.contribution_limit).toBe(7_000);
    });

    it('Roth IRA phase-out for single starts at $150k', () => {
      expect(c.roth_ira_phase_out.single.start).toBe(150_000);
      expect(c.roth_ira_phase_out.single.end).toBe(165_000);
    });

    it('Roth IRA phase-out for MFJ starts at $236k', () => {
      expect(c.roth_ira_phase_out.married_joint.start).toBe(236_000);
      expect(c.roth_ira_phase_out.married_joint.end).toBe(246_000);
    });

    it('HSA individual limit is $4,300', () => {
      expect(c.hsa.individual).toBe(4_300);
    });

    it('HSA family limit is $8,550', () => {
      expect(c.hsa.family).toBe(8_550);
    });

    it('529 gift tax exclusion is $19,000', () => {
      expect(c.plan_529.gift_tax_exclusion).toBe(19_000);
    });

    it('Trump Account annual limit is $5,000', () => {
      expect(c.trump_account.annual_limit).toBe(5_000);
    });

    it('ABLE onset age limit is 26 for 2025', () => {
      expect(c.able.onset_age_limit).toBe(26);
    });
  });

  describe('2026 limits', () => {
    const c = taxYear2026;

    it('401k deferral limit is $24,500', () => {
      expect(c.employer_plans.deferral_limit).toBe(24_500);
    });

    it('IRA limit is $7,500', () => {
      expect(c.ira.contribution_limit).toBe(7_500);
    });

    it('Roth IRA phase-out for single starts at $153k', () => {
      expect(c.roth_ira_phase_out.single.start).toBe(153_000);
    });

    it('HSA individual limit is $4,400', () => {
      expect(c.hsa.individual).toBe(4_400);
    });

    it('ABLE onset age limit increases to 46 in 2026', () => {
      expect(c.able.onset_age_limit).toBe(46);
    });

    it('lifetime estate/gift exemption is $15M', () => {
      expect(c.gift_tax.lifetime_exemption).toBe(15_000_000);
    });
  });
});
