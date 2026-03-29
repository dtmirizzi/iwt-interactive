import { useMachine } from '@xstate/react';
import { useMemo } from 'react';
import { debtPayoffMachine } from '../../machines/debtPayoffMachine';
import type { CSPData, DebtPayoffResult } from '../../types';
import { compareStrategies, formatMonths, totalDebtBalance, totalMinimumPayments } from '../../utils/debt';
import { formatCurrency } from '../../utils/csp';

interface DebtPayoffWorkflowProps {
  cspData: CSPData;
  onComplete: (result: DebtPayoffResult) => void;
  onClose: () => void;
}

export function DebtPayoffWorkflow({ cspData, onComplete, onClose }: DebtPayoffWorkflowProps) {
  const [state, send] = useMachine(debtPayoffMachine);
  const ctx = state.context;
  const step = state.value as string;
  const activeDebts = useMemo(() => cspData.debts.filter(d => d.balance > 0), [cspData.debts]);

  const comparison = useMemo(
    () => compareStrategies(activeDebts, ctx.extra_monthly),
    [activeDebts, ctx.extra_monthly],
  );

  const activePlan = ctx.strategy === 'avalanche' ? comparison.avalanche : comparison.snowball;

  const handleComplete = () => {
    onComplete({ strategy: ctx.strategy, extra_monthly: ctx.extra_monthly, plan: activePlan });
  };

  return (
    <div>
      {/* Step: Overview */}
      {step === 'overview' && (
        <div>
          <div className="results__csp-grid" style={{ marginBottom: '20px' }}>
            <div className="results__bucket-card">
              <div className="results__bucket-label">Total Debt</div>
              <div className="results__bucket-amount" style={{ color: '#C62828' }}>{formatCurrency(totalDebtBalance(activeDebts))}</div>
              <div className="results__bucket-target">{activeDebts.length} account{activeDebts.length !== 1 ? 's' : ''}</div>
            </div>
            <div className="results__bucket-card">
              <div className="results__bucket-label">Total Minimums</div>
              <div className="results__bucket-amount">{formatCurrency(totalMinimumPayments(activeDebts))}/mo</div>
            </div>
          </div>
          <div className="results__flow">
            {activeDebts.map(d => (
              <div key={d.id} className="results__flow-step" style={{ borderLeftColor: d.apr >= 0.06 ? '#C62828' : '#FF8A65' }}>
                <div style={{ flex: 1 }}>
                  <span className="results__flow-label">{d.name || d.category}</span>
                  <div style={{ fontSize: '0.75rem', color: '#666' }}>{(d.apr * 100).toFixed(1)}% APR | Min: {formatCurrency(d.minimum_payment)}/mo</div>
                </div>
                <span className="results__flow-amount">{formatCurrency(d.balance)}</span>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
            <button type="button" className="btn btn--secondary" onClick={onClose}>Cancel</button>
            <button type="button" className="btn btn--primary" onClick={() => send({ type: 'NEXT' })}>Choose Strategy</button>
          </div>
        </div>
      )}

      {/* Step: Strategy */}
      {step === 'strategy' && (
        <div>
          <div className="choice-cards" style={{ marginBottom: '20px' }}>
            <button type="button" className={`choice-card ${ctx.strategy === 'avalanche' ? 'choice-card--selected' : ''}`} onClick={() => send({ type: 'SET_STRATEGY', strategy: 'avalanche' })}>
              <span className="choice-card__label">Avalanche</span>
              <span className="choice-card__desc">Pay highest interest rate first. Saves the most money. Ramit's recommendation.</span>
            </button>
            <button type="button" className={`choice-card ${ctx.strategy === 'snowball' ? 'choice-card--selected' : ''}`} onClick={() => send({ type: 'SET_STRATEGY', strategy: 'snowball' })}>
              <span className="choice-card__label">Snowball</span>
              <span className="choice-card__desc">Pay smallest balance first. Faster psychological wins.</span>
            </button>
          </div>
          {comparison.interestSaved > 0 && (
            <div className="form__callout" style={{ borderLeftColor: '#2E7D32', marginBottom: '20px' }}>
              <p>Avalanche saves <strong>{formatCurrency(comparison.interestSaved)}</strong> in interest vs snowball.</p>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <button type="button" className="btn btn--secondary" onClick={() => send({ type: 'BACK' })}>Back</button>
            <button type="button" className="btn btn--primary" onClick={() => send({ type: 'NEXT' })}>Set Extra Payment</button>
          </div>
        </div>
      )}

      {/* Step: Extra Payment */}
      {step === 'extra_payment' && (
        <div>
          <div className="form" style={{ marginBottom: '20px' }}>
            <div className="form__field">
              <label>How much extra can you commit above minimums each month?</label>
              <p className="form__hint">Even $100 extra makes a significant difference over time.</p>
              <div className="form__input-group">
                <span className="form__prefix">$</span>
                <input type="number" min="0" value={ctx.extra_monthly || ''} onChange={(e) => send({ type: 'SET_EXTRA', amount: Number(e.target.value) })} placeholder="0" />
              </div>
            </div>
          </div>
          {ctx.extra_monthly > 0 && (
            <div className="form__callout" style={{ marginBottom: '20px' }}>
              <p>Paying {formatCurrency(totalMinimumPayments(activeDebts) + ctx.extra_monthly)}/mo total. Debt-free in <strong>{formatMonths(activePlan.total_months)}</strong>.</p>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <button type="button" className="btn btn--secondary" onClick={() => send({ type: 'BACK' })}>Back</button>
            <button type="button" className="btn btn--primary" onClick={() => send({ type: 'NEXT' })}>See Plan</button>
          </div>
        </div>
      )}

      {/* Step: Plan (final) */}
      {step === 'plan' && (
        <div>
          <div style={{ background: '#FDE8E4', padding: '20px', borderRadius: '8px', textAlign: 'center', marginBottom: '20px' }}>
            <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: '8px' }}>
              {ctx.strategy === 'avalanche' ? 'Avalanche' : 'Snowball'} | {formatCurrency(activePlan.monthly_payment)}/mo
            </p>
            <p style={{ fontSize: '1.5rem', fontWeight: 700, color: '#FB4D30' }}>Debt-free by {activePlan.debt_free_date}</p>
            <p style={{ fontSize: '0.85rem', color: '#666', marginTop: '4px' }}>{formatCurrency(activePlan.total_interest)} total interest</p>
          </div>
          <div className="results__flow" style={{ marginBottom: '20px' }}>
            {activePlan.debts_in_order.map((schedule, idx) => {
              const debt = activeDebts.find(d => d.id === schedule.debt_id);
              return (
                <div key={schedule.debt_id} className="results__flow-step" style={{ borderLeftColor: debt && debt.apr >= 0.06 ? '#C62828' : '#FF8A65' }}>
                  <span className="ladder__badge" style={{ background: idx === 0 ? '#C62828' : '#FF8A65', fontSize: '0.7rem' }}>{idx + 1}</span>
                  <div style={{ flex: 1 }}>
                    <span className="results__flow-label">{schedule.debt_name}</span>
                    <div style={{ fontSize: '0.75rem', color: '#666' }}>{formatCurrency(debt?.balance ?? 0)} at {((debt?.apr ?? 0) * 100).toFixed(1)}%</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="results__flow-amount">{formatMonths(schedule.months_to_payoff)}</div>
                    <div style={{ fontSize: '0.7rem', color: '#666' }}>{formatCurrency(schedule.total_interest_paid)} interest</div>
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <button type="button" className="btn btn--secondary" onClick={onClose}>Close</button>
            <button type="button" className="btn btn--primary" onClick={handleComplete}>Save Plan</button>
          </div>
        </div>
      )}
    </div>
  );
}
