import { assign, setup } from 'xstate';
import type { CSPData } from '../types';

// ─── Step metadata ──────────────────────────────────────────────────
export interface StepMeta {
  title: string;
  subtitle: string;
  section: 'setup' | 'spending' | 'complete';
  stepNumber: number;
}

export const SECTION_LABELS: Record<string, string> = {
  setup: 'Setup',
  spending: 'Conscious Spending',
  complete: 'Your CSP',
};

// ─── Initial data ───────────────────────────────────────────────────
const initialData: CSPData = {
  user_name: '',
  partner_name: '',
  has_partner: false,
  filing_status: 'single',
  tax_year: new Date().getFullYear(),
  age: 30,
  gross_monthly_income: 0,
  net_monthly_income: 0,
  assets: [],
  cash_savings: 0,
  current_investments: [],
  debts: [],
  fixed_costs: [],
  miscellaneous_buffer_pct: 0.15,
  savings_goals: [],
};

// ─── Events ─────────────────────────────────────────────────────────
type BuilderEvent =
  | { type: 'NEXT' }
  | { type: 'BACK' }
  | { type: 'UPDATE_DATA'; data: Partial<CSPData> }
  | { type: 'SET_TAX_YEAR'; year: number };

// ─── The Machine (7 linear states, no branching) ────────────────────
export const cspBuilderMachine = setup({
  types: {
    context: {} as { cspData: CSPData },
    events: {} as BuilderEvent,
  },
  actions: {
    updateData: assign({
      cspData: ({ context, event }) => {
        if (event.type === 'UPDATE_DATA') {
          return { ...context.cspData, ...event.data };
        }
        return context.cspData;
      },
    }),
  },
}).createMachine({
  id: 'cspBuilder',
  initial: 'welcome',
  context: { cspData: initialData },

  on: {
    UPDATE_DATA: { actions: 'updateData' },
    SET_TAX_YEAR: {
      actions: assign({
        cspData: ({ context, event }) => ({
          ...context.cspData,
          tax_year: event.year,
        }),
      }),
    },
  },

  states: {
    welcome: {
      meta: {
        title: 'Build Your Conscious Spending Plan',
        subtitle: 'Answer a few questions about your finances and we will build your personalized CSP.',
        section: 'setup',
        stepNumber: 0,
      } satisfies StepMeta,
      on: { NEXT: 'net_worth' },
    },

    net_worth: {
      meta: {
        title: 'Net Worth',
        subtitle: 'What do you own and what do you owe? This builds the full picture.',
        section: 'setup',
        stepNumber: 1,
      } satisfies StepMeta,
      on: {
        NEXT: 'income',
        BACK: 'welcome',
      },
    },

    income: {
      meta: {
        title: 'Income',
        subtitle: 'How much do you earn? We need both gross (before taxes) and net (take-home).',
        section: 'setup',
        stepNumber: 2,
      } satisfies StepMeta,
      on: {
        NEXT: 'fixed_costs',
        BACK: 'net_worth',
      },
    },

    fixed_costs: {
      meta: {
        title: 'Fixed Costs',
        subtitle: 'Target: 50-60% of take-home. List every non-negotiable monthly expense.',
        section: 'spending',
        stepNumber: 3,
      } satisfies StepMeta,
      on: {
        NEXT: 'investments',
        BACK: 'income',
      },
    },

    investments: {
      meta: {
        title: 'Current Investments',
        subtitle: 'What investment accounts are you currently contributing to each month?',
        section: 'spending',
        stepNumber: 4,
      } satisfies StepMeta,
      on: {
        NEXT: 'savings_goals',
        BACK: 'fixed_costs',
      },
    },

    savings_goals: {
      meta: {
        title: 'Savings Goals',
        subtitle: 'Target: 5-10% of take-home. What are you saving toward?',
        section: 'spending',
        stepNumber: 5,
      } satisfies StepMeta,
      on: {
        NEXT: 'complete',
        BACK: 'investments',
      },
    },

    complete: {
      meta: {
        title: 'Your Conscious Spending Plan',
        subtitle: 'Here is your complete financial picture.',
        section: 'complete',
        stepNumber: 6,
      } satisfies StepMeta,
      type: 'final',
    },
  },
});
