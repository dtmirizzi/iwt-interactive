import { assign, setup } from 'xstate';

export interface RichLifeContext {
  money_dials: string[];
  vision_answers: Record<string, string>;
}

type RichLifeEvent =
  | { type: 'NEXT' }
  | { type: 'BACK' }
  | { type: 'SET_DIALS'; dials: string[] }
  | { type: 'SET_VISION'; key: string; value: string };

export const richLifeMachine = setup({
  types: {
    context: {} as RichLifeContext,
    events: {} as RichLifeEvent,
  },
}).createMachine({
  id: 'richLife',
  initial: 'money_dials',
  context: { money_dials: [], vision_answers: {} },

  on: {
    SET_DIALS: { actions: assign({ money_dials: ({ event }) => event.dials }) },
    SET_VISION: {
      actions: assign({
        vision_answers: ({ context, event }) => ({ ...context.vision_answers, [event.key]: event.value }),
      }),
    },
  },

  states: {
    money_dials: {
      meta: { title: 'Your Money Dials', subtitle: 'Pick your top 3. Spend extravagantly here, cut mercilessly everywhere else.' },
      on: { NEXT: 'vision' },
    },
    vision: {
      meta: { title: 'Your Rich Life', subtitle: 'Money is a tool. What life are you building?' },
      on: { NEXT: 'summary', BACK: 'money_dials' },
    },
    summary: {
      meta: { title: 'Your Rich Life Statement', subtitle: 'This is what your CSP serves.' },
      type: 'final',
    },
  },
});
