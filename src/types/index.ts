// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SHARED TYPES (used by builder, dashboard, and workflows)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export type FilingStatus = 'single' | 'married_joint' | 'married_separate' | 'head_of_household';
export type EmploymentType = 'w2' | 'self_employed' | 'both';
export type EmployerPlanType = '401k' | '403b' | '457b_gov' | '457b_nongov' | 'simple_ira' | 'tsp' | 'none';

// ─── Age Bracket (for catch-up contribution logic) ──────────────────
export type AgeBracket = 'standard' | 'catch_up' | 'super_catch_up' | 'post_super';

export function getAgeBracket(age: number): AgeBracket {
  if (age >= 60 && age <= 63) return 'super_catch_up';
  if (age >= 64) return 'post_super';
  if (age >= 50) return 'catch_up';
  return 'standard';
}

// ─── Phase-Out Range ────────────────────────────────────────────────
export interface PhaseOutRange {
  start: number;
  end: number;
}

// ─── Tax Year Config Shape ──────────────────────────────────────────
export interface TaxYearConfig {
  tax_year: number;
  effective_date: string;
  employer_plans: {
    deferral_limit: number;
    catch_up_50: number;
    super_catch_up_60_63: number;
    total_annual_addition_415: number;
    compensation_cap: number;
  };
  simple_ira: {
    deferral_limit: number;
    catch_up_50: number;
    super_catch_up_60_63: number;
    enhanced_deferral_25_or_fewer: number;
    enhanced_catch_up_25_or_fewer: number;
  };
  ira: { contribution_limit: number; catch_up_50: number };
  roth_ira_phase_out: Record<FilingStatus, PhaseOutRange>;
  traditional_ira_deduction_phase_out: {
    single_covered: PhaseOutRange;
    married_joint_both_covered: PhaseOutRange;
    married_joint_spouse_covered: PhaseOutRange;
    married_separate_covered: PhaseOutRange;
  };
  hsa: {
    individual: number; family: number; catch_up_55: number;
    hdhp_min_deductible_individual: number; hdhp_min_deductible_family: number;
    hdhp_max_oop_individual: number; hdhp_max_oop_family: number;
  };
  sep_ira: { max_contribution_pct: number; self_employed_effective_pct: number; compensation_cap: number; max_contribution: number };
  plan_529: { gift_tax_exclusion: number; superfunding_5yr: number; roth_rollover_lifetime: number; roth_rollover_min_account_age_years: number; k12_annual_limit: number; student_loan_lifetime: number };
  trump_account: { annual_limit: number; employer_contribution_limit: number; government_seed: number; eligible_birth_year_start: number; eligible_birth_year_end: number; available_date: string };
  coverdell: { annual_limit: number; contributor_phase_out_single: PhaseOutRange; contributor_phase_out_mfj: PhaseOutRange };
  able: { annual_limit: number; able_to_work_additional: number; onset_age_limit: number };
  gift_tax: { annual_exclusion: number; lifetime_exemption: number };
  social_security: { wage_base: number; se_tax_rate: number; bend_point_1: number; bend_point_2: number };
  rmd: { age_born_1951_1959: number; age_born_1960_plus: number; penalty_rate: number; corrected_penalty_rate: number };
}

// ─── CSP Buckets ────────────────────────────────────────────────────
export interface CSPTargets {
  fixed_costs: { min: number; max: number };
  investments: { min: number; max: number };
  savings: { min: number; max: number };
  guilt_free: { min: number; max: number };
}

export const CSP_TARGETS: CSPTargets = {
  fixed_costs: { min: 0.50, max: 0.60 },
  investments: { min: 0.10, max: 1.0 },
  savings: { min: 0.05, max: 0.10 },
  guilt_free: { min: 0.20, max: 0.35 },
};

export type CSPBucket = 'fixed_costs' | 'investments' | 'savings' | 'guilt_free';
export type CSPHealth = 'excellent' | 'good' | 'warning' | 'danger';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// DATA ITEM TYPES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// ─── Debt ───────────────────────────────────────────────────────────
export type DebtCategory = 'credit_card' | 'student_loan_federal' | 'student_loan_private' | 'auto_loan' | 'personal_loan' | 'medical' | 'mortgage' | 'bnpl' | 'other';

export const DEBT_CATEGORIES: { value: DebtCategory; label: string; typical_apr: string }[] = [
  { value: 'credit_card', label: 'Credit Card', typical_apr: '20-28%' },
  { value: 'student_loan_federal', label: 'Federal Student Loan', typical_apr: '5-7%' },
  { value: 'student_loan_private', label: 'Private Student Loan', typical_apr: '4-15%' },
  { value: 'auto_loan', label: 'Auto Loan', typical_apr: '5-11%' },
  { value: 'personal_loan', label: 'Personal Loan', typical_apr: '8-25%' },
  { value: 'medical', label: 'Medical Debt', typical_apr: '0-25%' },
  { value: 'mortgage', label: 'Mortgage', typical_apr: '6-7%' },
  { value: 'bnpl', label: 'Buy Now Pay Later', typical_apr: '0-36%' },
  { value: 'other', label: 'Other', typical_apr: 'varies' },
];

export const HIGH_INTEREST_THRESHOLD = 0.06;

export type DebtStrategy = 'avalanche' | 'snowball';

export interface DebtItem {
  id: string;
  name: string;
  category: DebtCategory;
  balance: number;
  apr: number;
  minimum_payment: number;
}

export interface DebtPayoffSchedule {
  debt_id: string;
  debt_name: string;
  months_to_payoff: number;
  total_interest_paid: number;
  payoff_date: string;
}

export interface DebtPlan {
  strategy: DebtStrategy;
  debts_in_order: DebtPayoffSchedule[];
  total_months: number;
  total_interest: number;
  debt_free_date: string;
  monthly_payment: number;
}

// ─── Assets ─────────────────────────────────────────────────────────
export type AssetCategory = 'real_estate' | 'vehicle' | 'business' | 'personal_property' | 'other';

export const ASSET_CATEGORIES: { value: AssetCategory; label: string; hint: string }[] = [
  { value: 'real_estate', label: 'Real Estate', hint: 'Home, rental property, land' },
  { value: 'vehicle', label: 'Vehicle', hint: 'Car, motorcycle, boat' },
  { value: 'business', label: 'Business', hint: 'Business equity, ownership stake' },
  { value: 'personal_property', label: 'Personal Property', hint: 'Jewelry, art, collectibles' },
  { value: 'other', label: 'Other', hint: 'Any other asset with significant value' },
];

export interface AssetItem {
  id: string;
  category: AssetCategory;
  label: string;
  value: number;
  owner: 'individual' | 'partner' | 'shared';
}

// ─── Investments ────────────────────────────────────────────────────
export type InvestmentAccountType =
  | '401k_traditional' | '401k_roth' | '403b' | '457b' | 'tsp'
  | 'traditional_ira' | 'roth_ira' | 'sep_ira' | 'simple_ira' | 'solo_401k'
  | 'hsa' | 'brokerage' | '529' | 'other';

export const INVESTMENT_ACCOUNT_TYPES: { value: InvestmentAccountType; label: string }[] = [
  { value: '401k_traditional', label: '401(k) - Traditional (Pre-Tax)' },
  { value: '401k_roth', label: '401(k) - Roth' },
  { value: '403b', label: '403(b)' },
  { value: '457b', label: '457(b)' },
  { value: 'tsp', label: 'TSP (Thrift Savings Plan)' },
  { value: 'traditional_ira', label: 'Traditional IRA' },
  { value: 'roth_ira', label: 'Roth IRA' },
  { value: 'sep_ira', label: 'SEP IRA' },
  { value: 'simple_ira', label: 'SIMPLE IRA' },
  { value: 'solo_401k', label: 'Solo 401(k)' },
  { value: 'hsa', label: 'HSA (Health Savings Account)' },
  { value: 'brokerage', label: 'Taxable Brokerage' },
  { value: '529', label: '529 Plan' },
  { value: 'other', label: 'Other' },
];

export interface CurrentInvestment {
  id: string;
  account_type: InvestmentAccountType;
  label: string;
  monthly_contribution: number;
  current_balance: number;
  owner: 'individual' | 'partner';
}

// ─── Savings Goal ───────────────────────────────────────────────────
export interface SavingsGoal {
  id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  monthly_contribution: number;
  target_date: string;
  status: 'active' | 'done';
  owner: 'individual' | 'partner' | 'shared';
}

// ─── Fixed Costs ────────────────────────────────────────────────────
export interface FixedCostItem {
  id: string;
  category: string;
  label: string;
  amount: number;
  owner: 'individual' | 'partner' | 'shared';
}

// ─── Children ───────────────────────────────────────────────────────
export interface ChildInfo {
  id: string;
  name: string;
  birth_year: number;
  has_earned_income: boolean;
  earned_income_annual?: number;
  has_disability: boolean;
  disability_onset_age?: number;
}

// ─── Investment Recommendation ──────────────────────────────────────
export interface AccountRecommendation {
  priority: number;
  account_type: string;
  label: string;
  annual_amount: number;
  monthly_amount: number;
  reason: string;
  is_employer_match?: boolean;
  match_details?: string;
}

// ─── Money Dials ────────────────────────────────────────────────────
export const MONEY_DIALS = [
  'Eating Out / Food',
  'Travel',
  'Health / Wellness',
  'Convenience',
  'Experiences',
  'Relationships',
  'Generosity',
  'Luxury',
  'Social Status',
  'Self-Improvement',
] as const;

export type MoneyDial = (typeof MONEY_DIALS)[number];

// ─── Investment Account Classification ──────────────────────────────
const RETIREMENT_ACCOUNT_TYPES: Set<InvestmentAccountType> = new Set([
  '401k_traditional', '401k_roth', '403b', '457b', 'tsp',
  'traditional_ira', 'roth_ira', 'sep_ira', 'simple_ira', 'solo_401k',
]);

export function isRetirementAccount(type: InvestmentAccountType): boolean {
  return RETIREMENT_ACCOUNT_TYPES.has(type);
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// LAYER 1: CSP BUILDER DATA
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface CSPData {
  // Identity
  user_name: string;
  partner_name: string;
  has_partner: boolean;
  filing_status: FilingStatus;
  tax_year: number;
  age: number;
  partner_age?: number;

  // Income (per person)
  gross_monthly_income: number;
  net_monthly_income: number;
  partner_gross_monthly?: number;
  partner_net_monthly?: number;

  // Net Worth: Assets (property, vehicles, business)
  assets: AssetItem[];

  // Net Worth: Cash & Checking
  cash_savings: number;
  partner_cash_savings?: number;

  // Investment Accounts (balances entered in net worth, contributions entered in investments step)
  current_investments: CurrentInvestment[];

  // Net Worth: Debt
  debts: DebtItem[];

  // Fixed Costs
  fixed_costs: FixedCostItem[];
  miscellaneous_buffer_pct: number;

  // Savings Goals
  savings_goals: SavingsGoal[];
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// LAYER 2: DASHBOARD STATE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export type WorkflowId = 'debt_payoff' | 'investment_ladder' | 'retirement' | 'children' | 'automation' | 'rich_life';

// ─── Workflow Result Types ──────────────────────────────────────────
export interface DebtPayoffResult {
  strategy: DebtStrategy;
  extra_monthly: number;
  plan: DebtPlan;
}

export interface InvestmentLadderResult {
  employment_type: EmploymentType;
  employer_plan_type: EmployerPlanType;
  employer_match: boolean;
  employer_match_pct?: number;
  employer_match_cap_pct?: number;
  employer_allows_after_tax?: boolean;
  partner_employer_plan_type?: EmployerPlanType;
  partner_employer_match?: boolean;
  partner_employer_match_pct?: number;
  partner_employer_match_cap_pct?: number;
  partner_employer_allows_after_tax?: boolean;
  magi: number;
  combined_magi?: number;
  has_hdhp: boolean;
  hdhp_coverage_type?: 'individual' | 'family';
  has_traditional_ira_balance: boolean;
  has_self_employment_income: boolean;
  self_employment_net_income?: number;
  recommendations: AccountRecommendation[];
}

export interface RetirementResult {
  target_retirement_age: number;
  expected_return: number;
  current_total_balance: number;
  monthly_investment: number;
  projected_balance_at_retirement: number;
  monthly_retirement_income: number;
}

export interface ChildrenResult {
  children: ChildInfo[];
  // recommendations are computed from children + tax config
}

export interface AutomationResult {
  payday_schedule: 'monthly' | 'biweekly' | 'weekly';
  payday_date?: number; // day of month
  accounts: string[];
  transfers: { from: string; to: string; amount: number; day: number }[];
}

export interface RichLifeResult {
  money_dials: string[];
  vision_answers: Record<string, string>;
}

export interface DashboardState {
  cspData: CSPData;
  debtResult?: DebtPayoffResult;
  investmentResult?: InvestmentLadderResult;
  retirementResult?: RetirementResult;
  childrenResult?: ChildrenResult;
  automationResult?: AutomationResult;
  richLifeResult?: RichLifeResult;
  activeWorkflow: WorkflowId | null;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// LEGACY COMPAT (for utils that accept Partial<WizardData>)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/** @deprecated Use CSPData + workflow result types instead */
export type WizardData = CSPData & {
  employment_type: EmploymentType;
  employer_plan_type: EmployerPlanType;
  employer_match: boolean;
  employer_match_pct?: number;
  employer_match_cap_pct?: number;
  employer_allows_after_tax?: boolean;
  employer_allows_roth?: boolean;
  partner_employer_plan_type?: EmployerPlanType;
  partner_employer_match?: boolean;
  partner_employer_match_pct?: number;
  partner_employer_match_cap_pct?: number;
  partner_employer_allows_after_tax?: boolean;
  has_debt: boolean;
  debt_extra_monthly: number;
  debt_strategy: DebtStrategy;
  has_high_interest_debt: boolean;
  high_interest_debt_balance?: number;
  high_interest_debt_rate?: number;
  has_emergency_fund: boolean;
  emergency_fund_months?: number;
  magi: number;
  partner_magi?: number;
  combined_magi?: number;
  has_hdhp: boolean;
  hdhp_coverage_type?: 'individual' | 'family';
  has_traditional_ira_balance: boolean;
  traditional_ira_balance?: number;
  has_sep_ira_balance?: boolean;
  has_simple_ira_balance?: boolean;
  has_self_employment_income?: boolean;
  self_employment_net_income?: number;
  has_children: boolean;
  children: ChildInfo[];
  money_dials: string[];
};
