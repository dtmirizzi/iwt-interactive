import { assign, setup } from 'xstate';

export interface AutomationContext {
  payday_schedule: 'monthly' | 'biweekly' | 'weekly';
  payday_date: number;
}

type AutomationEvent =
  | { type: 'NEXT' }
  | { type: 'BACK' }
  | { type: 'UPDATE'; data: Partial<AutomationContext> };

export const automationMachine = setup({
  types: {
    context: {} as AutomationContext,
    events: {} as AutomationEvent,
  },
  actions: {
    updateCtx: assign(({ context, event }) =>
      event.type === 'UPDATE' ? { ...context, ...event.data } : context,
    ),
  },
}).createMachine({
  id: 'automation',
  initial: 'schedule',
  context: { payday_schedule: 'biweekly', payday_date: 1 },
  on: { UPDATE: { actions: 'updateCtx' } },

  states: {
    schedule: {
      meta: { title: 'Payday Schedule', subtitle: 'When does your paycheck land?' },
      on: { NEXT: 'blueprint' },
    },
    blueprint: {
      meta: { title: 'Your Automation Blueprint', subtitle: 'Set it and forget it. Here is your automated money flow.' },
      type: 'final',
    },
  },
});
