import type { TaxYearConfig } from '../types';

export const taxYear2025: TaxYearConfig = {
  tax_year: 2025,
  effective_date: '2025-01-01',

  employer_plans: {
    deferral_limit: 23_500,
    catch_up_50: 7_500,
    super_catch_up_60_63: 11_250,
    total_annual_addition_415: 70_000,
    compensation_cap: 350_000,
  },

  simple_ira: {
    deferral_limit: 16_500,
    catch_up_50: 3_500,
    super_catch_up_60_63: 5_250,
    enhanced_deferral_25_or_fewer: 17_600,
    enhanced_catch_up_25_or_fewer: 3_850,
  },

  ira: {
    contribution_limit: 7_000,
    catch_up_50: 1_000,
  },

  roth_ira_phase_out: {
    single: { start: 150_000, end: 165_000 },
    married_joint: { start: 236_000, end: 246_000 },
    married_separate: { start: 0, end: 10_000 },
    head_of_household: { start: 150_000, end: 165_000 },
  },

  traditional_ira_deduction_phase_out: {
    single_covered: { start: 79_000, end: 89_000 },
    married_joint_both_covered: { start: 126_000, end: 146_000 },
    married_joint_spouse_covered: { start: 236_000, end: 246_000 },
    married_separate_covered: { start: 0, end: 10_000 },
  },

  hsa: {
    individual: 4_300,
    family: 8_550,
    catch_up_55: 1_000,
    hdhp_min_deductible_individual: 1_650,
    hdhp_min_deductible_family: 3_300,
    hdhp_max_oop_individual: 8_300,
    hdhp_max_oop_family: 16_600,
  },

  sep_ira: {
    max_contribution_pct: 0.25,
    self_employed_effective_pct: 0.20,
    compensation_cap: 350_000,
    max_contribution: 70_000,
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
    annual_limit: 19_000,
    able_to_work_additional: 15_650,
    onset_age_limit: 26,
  },

  gift_tax: {
    annual_exclusion: 19_000,
    lifetime_exemption: 13_990_000,
  },

  social_security: {
    wage_base: 176_100,
    se_tax_rate: 0.153,
    bend_point_1: 1_226,
    bend_point_2: 7_391,
  },

  rmd: {
    age_born_1951_1959: 73,
    age_born_1960_plus: 75,
    penalty_rate: 0.25,
    corrected_penalty_rate: 0.10,
  },
};
