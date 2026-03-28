import { assign, setup } from 'xstate';
import type { ChildInfo } from '../types';

export interface ChildrenContext {
  children: ChildInfo[];
}

type ChildrenEvent =
  | { type: 'NEXT' }
  | { type: 'BACK' }
  | { type: 'SET_CHILDREN'; children: ChildInfo[] };

export const childrenMachine = setup({
  types: {
    context: {} as ChildrenContext,
    events: {} as ChildrenEvent,
  },
}).createMachine({
  id: 'children',
  initial: 'children_list',
  context: { children: [] },
  on: { SET_CHILDREN: { actions: assign({ children: ({ event }) => event.children }) } },

  states: {
    children_list: {
      meta: { title: 'Your Children', subtitle: 'Tell us about each child so we can recommend the right accounts.' },
      on: { NEXT: 'recommendations' },
    },
    recommendations: {
      meta: { title: 'Recommended Accounts', subtitle: 'Based on your children, here are the accounts to open.' },
      type: 'final',
    },
  },
});
