import { assign, setup } from 'xstate';

export interface RetirementContext {
  target_retirement_age: number;
  expected_return: number;
}

type RetirementEvent =
  | { type: 'NEXT' }
  | { type: 'BACK' }
  | { type: 'UPDATE'; data: Partial<RetirementContext> };

export const retirementMachine = setup({
  types: {
    context: {} as RetirementContext,
    events: {} as RetirementEvent,
  },
  actions: {
    updateCtx: assign(({ context, event }) =>
      event.type === 'UPDATE' ? { ...context, ...event.data } : context,
    ),
  },
}).createMachine({
  id: 'retirement',
  initial: 'inputs',
  context: { target_retirement_age: 65, expected_return: 0.07 },
  on: { UPDATE: { actions: 'updateCtx' } },

  states: {
    inputs: {
      meta: { title: 'Retirement Goals', subtitle: 'When do you want to retire and what assumptions should we use?' },
      on: { NEXT: 'projections' },
    },
    projections: {
      meta: { title: 'Retirement Projections', subtitle: 'Here is what your future looks like.' },
      type: 'final',
    },
  },
});
