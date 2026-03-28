import type { TaxYearConfig } from '../types';

export const taxYear2026: TaxYearConfig = {
  tax_year: 2026,
  effective_date: '2026-01-01',

  employer_plans: {
    deferral_limit: 24_500,
    catch_up_50: 7_500,
    super_catch_up_60_63: 11_250,
    total_annual_addition_415: 73_500,
    compensation_cap: 350_000,
  },

  simple_ira: {
    deferral_limit: 17_000,
    catch_up_50: 3_500,
    super_catch_up_60_63: 5_250,
    enhanced_deferral_25_or_fewer: 17_600,
    enhanced_catch_up_25_or_fewer: 3_850,
  },

  ira: {
    contribution_limit: 7_500,
    catch_up_50: 1_100,
  },

  roth_ira_phase_out: {
    single: { start: 153_000, end: 168_000 },
    married_joint: { start: 242_000, end: 252_000 },
    married_separate: { start: 0, end: 10_000 },
    head_of_household: { start: 153_000, end: 168_000 },
  },

  traditional_ira_deduction_phase_out: {
    single_covered: { start: 83_000, end: 93_000 },
    married_joint_both_covered: { start: 130_000, end: 150_000 },
    married_joint_spouse_covered: { start: 242_000, end: 252_000 },
    married_separate_covered: { start: 0, end: 10_000 },
  },

  hsa: {
    individual: 4_400,
    family: 8_750,
    catch_up_55: 1_000,
    hdhp_min_deductible_individual: 1_700,
    hdhp_min_deductible_family: 3_400,
    hdhp_max_oop_individual: 8_500,
    hdhp_max_oop_family: 17_000,
  },

  sep_ira: {
    max_contribution_pct: 0.25,
    self_employed_effective_pct: 0.20,
    compensation_cap: 350_000,
    max_contribution: 73_500,
  },

  plan_529: {
    gift_tax_exclusion: 19_000,
    superfunding_5yr: 95_000,
    roth_rollover_lifetime: 35_000,
    roth_rollover_min_account_age_years: 15,
    k12_annual_limit: 20_000,
    student_loan_lifetime: 10_000,
  },

  trump_account: {
    annual_limit: 5_000,
    employer_contribution_limit: 2_500,
    government_seed: 1_000,
    eligible_birth_year_start: 2025,
    eligible_birth_year_end: 2028,
    available_date: '2026-07-05',
  },

  coverdell: {
    annual_limit: 2_000,
    contributor_phase_out_single: { start: 95_000, end: 110_000 },
    contributor_phase_out_mfj: { start: 190_000, end: 220_000 },
  },

  able: {
    annual_limit: 20_000,
    able_to_work_additional: 15_650,
    onset_age_limit: 46, // ABLE Age Adjustment Act effective 2026
  },

  gift_tax: {
    annual_exclusion: 19_000,
    lifetime_exemption: 15_000_000,
  },

  social_security: {
    wage_base: 181_200,
    se_tax_rate: 0.153,
    bend_point_1: 1_286,
    bend_point_2: 7_749,
  },

  rmd: {
    age_born_1951_1959: 73,
    age_born_1960_plus: 75,
    penalty_rate: 0.25,
    corrected_penalty_rate: 0.10,
  },
};
