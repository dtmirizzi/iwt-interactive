import type { CSPData } from './types';

/**
 * Sample CSP data for development — skip the builder and go straight to the dashboard.
 * Based on a realistic couple scenario. No real personal data.
 */
export const SAMPLE_CSP_DATA: CSPData = {
  user_name: 'Alex',
  partner_name: 'Jordan',
  has_partner: true,
  filing_status: 'married_joint',
  tax_year: 2026,
  age: 30,
  partner_age: 31,

  // Income
  gross_monthly_income: 12000,
  net_monthly_income: 8500,
  partner_gross_monthly: 9000,
  partner_net_monthly: 6500,

  // Assets
  assets: [
    { id: 'a1', category: 'vehicle', label: 'Honda Civic', value: 18000, owner: 'individual' },
    { id: 'a2', category: 'vehicle', label: 'Toyota RAV4', value: 25000, owner: 'partner' },
  ],

  // Cash
  cash_savings: 30000,
  partner_cash_savings: 20000,

  // Investment accounts
  current_investments: [
    { id: 'i1', account_type: '401k_traditional', label: 'Fidelity 401(k)', monthly_contribution: 1500, current_balance: 85000, owner: 'individual' },
    { id: 'i2', account_type: 'roth_ira', label: 'Vanguard Roth IRA', monthly_contribution: 500, current_balance: 42000, owner: 'individual' },
    { id: 'i3', account_type: '401k_roth', label: 'Schwab 401(k) Roth', monthly_contribution: 1200, current_balance: 65000, owner: 'partner' },
    { id: 'i4', account_type: 'roth_ira', label: 'Fidelity Roth IRA', monthly_contribution: 500, current_balance: 35000, owner: 'partner' },
    { id: 'i5', account_type: 'brokerage', label: 'Schwab Brokerage', monthly_contribution: 300, current_balance: 28000, owner: 'individual' },
  ],

  // Debts
  debts: [
    { id: 'd1', name: 'Chase Sapphire', category: 'credit_card', balance: 4500, apr: 0.2299, minimum_payment: 125 },
    { id: 'd2', name: 'Federal Student Loan', category: 'student_loan_federal', balance: 18000, apr: 0.055, minimum_payment: 200 },
    { id: 'd3', name: 'Car Loan (RAV4)', category: 'auto_loan', balance: 12000, apr: 0.059, minimum_payment: 350 },
  ],

  // Fixed Costs (each person enters their own — the builder collects per person)
  // Alex's fixed costs
  fixed_costs: [
    { id: 'fc1', category: 'housing', label: 'Rent', amount: 1400, owner: 'individual' },
    { id: 'fc2', category: 'utilities', label: 'Utilities', amount: 150, owner: 'individual' },
    { id: 'fc3', category: 'insurance', label: 'Insurance', amount: 400, owner: 'individual' },
    { id: 'fc5', category: 'transportation', label: 'Transportation', amount: 300, owner: 'individual' },
    { id: 'fc7', category: 'groceries', label: 'Groceries', amount: 350, owner: 'individual' },
    { id: 'fc8', category: 'phone', label: 'Phone', amount: 80, owner: 'individual' },
    { id: 'fc10', category: 'subscriptions', label: 'Subscriptions', amount: 70, owner: 'individual' },
    { id: 'fc11', category: 'personal', label: 'Personal', amount: 200, owner: 'individual' },
    { id: 'fc13', category: 'debt', label: 'Debt Payments', amount: 400, owner: 'individual' },
    // Jordan's fixed costs
    { id: 'fc14', category: 'housing', label: 'Rent', amount: 1000, owner: 'partner' },
    { id: 'fc15', category: 'utilities', label: 'Utilities', amount: 100, owner: 'partner' },
    { id: 'fc16', category: 'insurance', label: 'Insurance', amount: 200, owner: 'partner' },
    { id: 'fc17', category: 'transportation', label: 'Transportation', amount: 150, owner: 'partner' },
    { id: 'fc18', category: 'groceries', label: 'Groceries', amount: 250, owner: 'partner' },
    { id: 'fc19', category: 'phone', label: 'Phone', amount: 53, owner: 'partner' },
    { id: 'fc20', category: 'subscriptions', label: 'Subscriptions', amount: 50, owner: 'partner' },
    { id: 'fc21', category: 'personal', label: 'Personal', amount: 150, owner: 'partner' },
    { id: 'fc22', category: 'debt', label: 'Debt Payments', amount: 275, owner: 'partner' },
  ],
  miscellaneous_buffer_pct: 0.15,

  // Savings Goals
  savings_goals: [
    { id: 'sg1', name: 'House Down Payment', target_amount: 80000, current_amount: 35000, monthly_contribution: 1200, target_date: '2027-06-01', status: 'active', owner: 'individual' },
    { id: 'sg1b', name: 'House Down Payment', target_amount: 80000, current_amount: 35000, monthly_contribution: 800, target_date: '2027-06-01', status: 'active', owner: 'partner' },
    { id: 'sg2', name: 'Emergency Fund Top-Up', target_amount: 50000, current_amount: 50000, monthly_contribution: 0, target_date: '', status: 'done', owner: 'individual' },
    { id: 'sg3', name: 'Vacation Fund', target_amount: 5000, current_amount: 1200, monthly_contribution: 250, target_date: '2026-12-01', status: 'active', owner: 'individual' },
    { id: 'sg3b', name: 'Vacation Fund', target_amount: 5000, current_amount: 1200, monthly_contribution: 150, target_date: '2026-12-01', status: 'active', owner: 'partner' },
  ],
};

/**
 * Solo version of the sample data.
 */
export const SAMPLE_CSP_DATA_SOLO: CSPData = {
  user_name: 'Sam',
  partner_name: '',
  has_partner: false,
  filing_status: 'single',
  tax_year: 2026,
  age: 28,

  gross_monthly_income: 8500,
  net_monthly_income: 6200,

  assets: [
    { id: 'a1', category: 'vehicle', label: 'Subaru Outback', value: 22000, owner: 'individual' },
  ],

  cash_savings: 15000,

  current_investments: [
    { id: 'i1', account_type: '401k_traditional', label: 'Company 401(k)', monthly_contribution: 850, current_balance: 45000, owner: 'individual' },
    { id: 'i2', account_type: 'roth_ira', label: 'Roth IRA', monthly_contribution: 500, current_balance: 22000, owner: 'individual' },
  ],

  debts: [
    { id: 'd1', name: 'Student Loans', category: 'student_loan_federal', balance: 28000, apr: 0.065, minimum_payment: 300 },
  ],

  fixed_costs: [
    { id: 'fc1', category: 'housing', label: 'Rent', amount: 1800, owner: 'individual' },
    { id: 'fc2', category: 'utilities', label: 'Utilities + Internet', amount: 180, owner: 'individual' },
    { id: 'fc3', category: 'insurance', label: 'Insurance', amount: 250, owner: 'individual' },
    { id: 'fc4', category: 'transportation', label: 'Gas + Car Insurance', amount: 200, owner: 'individual' },
    { id: 'fc5', category: 'groceries', label: 'Groceries', amount: 400, owner: 'individual' },
    { id: 'fc6', category: 'phone', label: 'Phone', amount: 45, owner: 'individual' },
    { id: 'fc7', category: 'subscriptions', label: 'Subscriptions', amount: 80, owner: 'individual' },
    { id: 'fc8', category: 'debt', label: 'Student Loan Minimum', amount: 300, owner: 'individual' },
  ],
  miscellaneous_buffer_pct: 0.15,

  savings_goals: [
    { id: 'sg1', name: 'Emergency Fund', target_amount: 20000, current_amount: 15000, monthly_contribution: 500, target_date: '2026-09-01', status: 'active', owner: 'individual' },
  ],
};

/**
 * Over-budget couple: fixed costs above 70%, triggers danger health and locked workflows.
 */
export const SAMPLE_CSP_DATA_OVERBUDGET: CSPData = {
  user_name: 'Chris',
  partner_name: 'Taylor',
  has_partner: true,
  filing_status: 'married_joint',
  tax_year: 2026,
  age: 34,
  partner_age: 32,

  // Moderate combined income
  gross_monthly_income: 7500,
  net_monthly_income: 5500,
  partner_gross_monthly: 5000,
  partner_net_monthly: 3800,
  // Combined net: $9,300

  assets: [
    { id: 'a1', category: 'vehicle', label: '2019 Honda CR-V', value: 14000, owner: 'individual' },
  ],

  cash_savings: 4000,
  partner_cash_savings: 2500,

  current_investments: [
    { id: 'i1', account_type: '401k_traditional', label: 'Work 401(k)', monthly_contribution: 200, current_balance: 18000, owner: 'individual' },
    // Partner not investing — no employer plan
  ],

  // Heavy debt load
  debts: [
    { id: 'd1', name: 'Visa Platinum', category: 'credit_card', balance: 12000, apr: 0.2499, minimum_payment: 350 },
    { id: 'd2', name: 'Capital One', category: 'credit_card', balance: 6500, apr: 0.2199, minimum_payment: 180 },
    { id: 'd3', name: 'Chris Student Loans', category: 'student_loan_federal', balance: 35000, apr: 0.065, minimum_payment: 400 },
    { id: 'd4', name: 'Taylor Student Loans', category: 'student_loan_private', balance: 22000, apr: 0.089, minimum_payment: 280 },
    { id: 'd5', name: 'Car Loan', category: 'auto_loan', balance: 8000, apr: 0.069, minimum_payment: 250 },
  ],

  // Fixed costs eating 75%+ of take-home (per person, no shared)
  fixed_costs: [
    // Chris
    { id: 'fc1', category: 'housing', label: 'Rent', amount: 1300, owner: 'individual' },
    { id: 'fc2', category: 'utilities', label: 'Utilities', amount: 170, owner: 'individual' },
    { id: 'fc3', category: 'insurance', label: 'Insurance', amount: 450, owner: 'individual' },
    { id: 'fc5', category: 'transportation', label: 'Transportation', amount: 350, owner: 'individual' },
    { id: 'fc7', category: 'debt', label: 'Debt Payments', amount: 900, owner: 'individual' },
    { id: 'fc8', category: 'groceries', label: 'Groceries', amount: 400, owner: 'individual' },
    { id: 'fc9', category: 'phone', label: 'Phone', amount: 90, owner: 'individual' },
    { id: 'fc11', category: 'subscriptions', label: 'Subscriptions', amount: 100, owner: 'individual' },
    { id: 'fc12', category: 'personal', label: 'Personal', amount: 150, owner: 'individual' },
    // Taylor
    { id: 'fc14', category: 'housing', label: 'Rent', amount: 900, owner: 'partner' },
    { id: 'fc15', category: 'utilities', label: 'Utilities', amount: 110, owner: 'partner' },
    { id: 'fc16', category: 'insurance', label: 'Insurance', amount: 320, owner: 'partner' },
    { id: 'fc17', category: 'transportation', label: 'Transportation', amount: 85, owner: 'partner' },
    { id: 'fc18', category: 'debt', label: 'Debt Payments', amount: 560, owner: 'partner' },
    { id: 'fc19', category: 'groceries', label: 'Groceries', amount: 300, owner: 'partner' },
    { id: 'fc20', category: 'phone', label: 'Phone', amount: 90, owner: 'partner' },
    { id: 'fc21', category: 'subscriptions', label: 'Subscriptions', amount: 80, owner: 'partner' },
    { id: 'fc22', category: 'personal', label: 'Personal', amount: 120, owner: 'partner' },
  ],
  miscellaneous_buffer_pct: 0.15,

  savings_goals: [
    { id: 'sg1', name: 'Emergency Fund', target_amount: 15000, current_amount: 6500, monthly_contribution: 100, target_date: '2027-12-01', status: 'active', owner: 'individual' },
    { id: 'sg2', name: 'Emergency Fund', target_amount: 15000, current_amount: 6500, monthly_contribution: 50, target_date: '2027-12-01', status: 'active', owner: 'partner' },
  ],
};
