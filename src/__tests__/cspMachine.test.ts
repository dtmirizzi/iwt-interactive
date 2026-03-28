import { describe, it, expect } from 'vitest';
import { createActor } from 'xstate';
import { cspBuilderMachine } from '../machines/cspBuilderMachine';

function createTestActor() {
  const actor = createActor(cspBuilderMachine);
  actor.start();
  return actor;
}

describe('CSP Builder Machine', () => {
  it('starts at welcome', () => {
    const actor = createTestActor();
    expect(actor.getSnapshot().value).toBe('welcome');
  });

  it('follows linear path: welcome → net_worth → income → fixed_costs → investments → savings_goals → complete', () => {
    const actor = createTestActor();
    const expectedStates = ['welcome', 'net_worth', 'income', 'fixed_costs', 'investments', 'savings_goals', 'complete'];

    for (let i = 0; i < expectedStates.length; i++) {
      expect(actor.getSnapshot().value).toBe(expectedStates[i]);
      if (i < expectedStates.length - 1) {
        actor.send({ type: 'NEXT' });
      }
    }
  });

  it('supports BACK navigation', () => {
    const actor = createTestActor();
    actor.send({ type: 'NEXT' }); // → net_worth
    actor.send({ type: 'NEXT' }); // → income
    actor.send({ type: 'BACK' }); // → net_worth
    expect(actor.getSnapshot().value).toBe('net_worth');
    actor.send({ type: 'BACK' }); // → welcome
    expect(actor.getSnapshot().value).toBe('welcome');
  });

  it('preserves data across transitions', () => {
    const actor = createTestActor();
    actor.send({ type: 'UPDATE_DATA', data: { user_name: 'Alex', gross_monthly_income: 10000 } });
    actor.send({ type: 'NEXT' });
    const data = actor.getSnapshot().context.cspData;
    expect(data.user_name).toBe('Alex');
    expect(data.gross_monthly_income).toBe(10000);
  });

  it('sets tax year', () => {
    const actor = createTestActor();
    actor.send({ type: 'SET_TAX_YEAR', year: 2025 });
    expect(actor.getSnapshot().context.cspData.tax_year).toBe(2025);
  });

  it('reaches final state (complete)', () => {
    const actor = createTestActor();
    for (let i = 0; i < 6; i++) actor.send({ type: 'NEXT' });
    expect(actor.getSnapshot().value).toBe('complete');
    expect(actor.getSnapshot().status).toBe('done');
  });

  it('has no branching — every NEXT from every state leads to exactly one target', () => {
    const states = ['welcome', 'net_worth', 'income', 'fixed_costs', 'investments', 'savings_goals'];
    for (const startState of states) {
      const actor = createTestActor();
      // Navigate to the target state
      let current = 'welcome';
      while (current !== startState) {
        actor.send({ type: 'NEXT' });
        current = actor.getSnapshot().value as string;
      }
      // Send NEXT
      actor.send({ type: 'NEXT' });
      // Should have moved to exactly one state (no guards)
      expect(actor.getSnapshot().value).not.toBe(startState);
    }
  });
});
