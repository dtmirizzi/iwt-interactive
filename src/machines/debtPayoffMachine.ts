import { assign, setup } from 'xstate';
import type { DebtStrategy } from '../types';

export interface DebtPayoffContext {
  strategy: DebtStrategy;
  extra_monthly: number;
}

type DebtPayoffEvent =
  | { type: 'NEXT' }
  | { type: 'BACK' }
  | { type: 'SET_STRATEGY'; strategy: DebtStrategy }
  | { type: 'SET_EXTRA'; amount: number };

export const debtPayoffMachine = setup({
  types: {
    context: {} as DebtPayoffContext,
    events: {} as DebtPayoffEvent,
  },
}).createMachine({
  id: 'debtPayoff',
  initial: 'overview',
  context: { strategy: 'avalanche', extra_monthly: 0 },

  on: {
    SET_STRATEGY: { actions: assign({ strategy: ({ event }) => event.strategy }) },
    SET_EXTRA: { actions: assign({ extra_monthly: ({ event }) => event.amount }) },
  },

  states: {
    overview: {
      meta: { title: 'Your Current Debt', subtitle: 'Here is what you owe. Let us build a plan to eliminate it.' },
      on: { NEXT: 'strategy' },
    },
    strategy: {
      meta: { title: 'Choose Your Strategy', subtitle: 'Avalanche saves the most money. Snowball gives faster wins.' },
      on: { NEXT: 'extra_payment', BACK: 'overview' },
    },
    extra_payment: {
      meta: { title: 'Extra Monthly Payment', subtitle: 'How much extra can you commit above your minimums each month?' },
      on: { NEXT: 'plan', BACK: 'strategy' },
    },
    plan: {
      meta: { title: 'Your Payoff Plan', subtitle: 'Here is your path to debt-free.' },
      type: 'final',
    },
  },
});
