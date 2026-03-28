import { assign, setup } from 'xstate';
import type { EmployerPlanType, EmploymentType } from '../types';

export interface InvestmentLadderContext {
  employment_type: EmploymentType;
  employer_plan_type: EmployerPlanType;
  employer_match: boolean;
  employer_match_pct: number;
  employer_match_cap_pct: number;
  employer_allows_after_tax: boolean;
  partner_employer_plan_type: EmployerPlanType;
  partner_employer_match: boolean;
  partner_employer_match_pct: number;
  partner_employer_match_cap_pct: number;
  partner_employer_allows_after_tax: boolean;
  magi: number;
  combined_magi: number;
  has_hdhp: boolean;
  hdhp_coverage_type: 'individual' | 'family';
  has_traditional_ira_balance: boolean;
  has_self_employment_income: boolean;
  self_employment_net_income: number;
}

type LadderEvent =
  | { type: 'NEXT' }
  | { type: 'BACK' }
  | { type: 'UPDATE'; data: Partial<InvestmentLadderContext> };

export const investmentLadderMachine = setup({
  types: {
    context: {} as InvestmentLadderContext,
    events: {} as LadderEvent,
  },
  actions: {
    updateCtx: assign(({ context, event }) =>
      event.type === 'UPDATE' ? { ...context, ...event.data } : context,
    ),
  },
}).createMachine({
  id: 'investmentLadder',
  initial: 'employment',
  context: {
    employment_type: 'w2', employer_plan_type: 'none', employer_match: false,
    employer_match_pct: 0, employer_match_cap_pct: 0, employer_allows_after_tax: false,
    partner_employer_plan_type: 'none', partner_employer_match: false,
    partner_employer_match_pct: 0, partner_employer_match_cap_pct: 0,
    partner_employer_allows_after_tax: false,
    magi: 0, combined_magi: 0, has_hdhp: false, hdhp_coverage_type: 'individual',
    has_traditional_ira_balance: false, has_self_employment_income: false,
    self_employment_net_income: 0,
  },

  on: { UPDATE: { actions: 'updateCtx' } },

  states: {
    employment: {
      meta: { title: 'Employment Type', subtitle: 'How do you earn your income?' },
      on: { NEXT: 'employer_plan' },
    },
    employer_plan: {
      meta: { title: 'Employer Retirement Plan', subtitle: 'What does your employer offer?' },
      on: { NEXT: 'tax_situation', BACK: 'employment' },
    },
    tax_situation: {
      meta: { title: 'Tax Situation', subtitle: 'MAGI, health plan, and existing accounts.' },
      on: { NEXT: 'recommendations', BACK: 'employer_plan' },
    },
    recommendations: {
      meta: { title: 'Your Investment Ladder', subtitle: 'The optimal order to invest every dollar.' },
      type: 'final',
    },
  },
});
