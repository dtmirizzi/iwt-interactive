import { useMachine } from '@xstate/react';
import { automationMachine } from '../../machines/automationMachine';
import type { AutomationResult, CSPData } from '../../types';
import { calculateCSPBuckets, formatCurrency } from '../../utils/csp';

interface AutomationWorkflowProps {
  cspData: CSPData;
  onComplete: (result: AutomationResult) => void;
  onClose: () => void;
}

export function AutomationWorkflow({ cspData, onComplete, onClose }: AutomationWorkflowProps) {
  const [state, send] = useMachine(automationMachine);
  const ctx = state.context;
  const step = state.value as string;
  const buckets = calculateCSPBuckets(cspData);
  const net = buckets?.net_monthly ?? 0;

  const savingsTotal = cspData.savings_goals.filter(g => g.status === 'active').reduce((s, g) => s + g.monthly_contribution, 0);

  return (
    <div>
      {step === 'schedule' && (
        <div>
          <div className="form" style={{ marginBottom: '20px' }}>
            <div className="form__field">
              <label>How often are you paid?</label>
              <div className="choice-cards">
                {(['monthly', 'biweekly', 'weekly'] as const).map(s => (
                  <button key={s} type="button" className={`choice-card choice-card--compact ${ctx.payday_schedule === s ? 'choice-card--selected' : ''}`} onClick={() => send({ type: 'UPDATE', data: { payday_schedule: s } })}>
                    {s === 'monthly' ? 'Monthly' : s === 'biweekly' ? 'Every 2 Weeks' : 'Weekly'}
                  </button>
                ))}
              </div>
            </div>
            {ctx.payday_schedule === 'monthly' && (
              <div className="form__field">
                <label>What day of the month?</label>
                <input type="number" min="1" max="31" value={ctx.payday_date} onChange={(e) => send({ type: 'UPDATE', data: { payday_date: Number(e.target.value) } })} />
              </div>
            )}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <button type="button" className="btn btn--secondary" onClick={onClose}>Cancel</button>
            <button type="button" className="btn btn--primary" onClick={() => send({ type: 'NEXT' })}>See Blueprint</button>
          </div>
        </div>
      )}

      {step === 'blueprint' && (
        <div>
          <div className="results__flow" style={{ marginBottom: '20px' }}>
            <div className="results__flow-step" style={{ borderLeftColor: '#2E7D32' }}>
              <span className="results__flow-label">Paycheck lands in checking</span>
              <span className="results__flow-amount">{formatCurrency(net)}</span>
            </div>
            <div className="results__flow-arrow">{'\u2193'} Day {ctx.payday_schedule === 'monthly' ? ctx.payday_date + 2 : 2}</div>

            {cspData.current_investments.filter(i => i.monthly_contribution > 0).map(inv => (
              <div key={inv.id}>
                <div className="results__flow-step">
                  <span className="results__flow-label">{inv.label || inv.account_type}</span>
                  <span className="results__flow-amount">{formatCurrency(inv.monthly_contribution)}</span>
                </div>
                <div className="results__flow-arrow">{'\u2193'}</div>
              </div>
            ))}

            {savingsTotal > 0 && (
              <>
                <div className="results__flow-step" style={{ borderLeftColor: '#FFB74D' }}>
                  <span className="results__flow-label">Savings Goals</span>
                  <span className="results__flow-amount">{formatCurrency(savingsTotal)}</span>
                </div>
                <div className="results__flow-arrow">{'\u2193'}</div>
              </>
            )}

            <div className="results__flow-step" style={{ borderLeftColor: '#FF8A65' }}>
              <span className="results__flow-label">Bills auto-pay from checking</span>
              <span className="results__flow-amount">{formatCurrency(buckets?.fixed_costs.amount ?? 0)}</span>
            </div>
            <div className="results__flow-arrow">{'\u2193'}</div>

            <div className="results__flow-step" style={{ borderLeftColor: '#4CAF50', background: '#E8F5E9' }}>
              <span className="results__flow-label"><strong>Guilt-Free Spending</strong></span>
              <span className="results__flow-amount">{formatCurrency(buckets?.guilt_free.amount ?? 0)}</span>
            </div>
          </div>

          <div className="form__callout" style={{ marginBottom: '20px' }}>
            <p><strong>Key rules:</strong></p>
            <ul style={{ margin: '8px 0 0 16px', fontSize: '0.85rem' }}>
              <li>Set all transfers to fire 2 days after payday</li>
              <li>Put all bills on auto-pay (credit card where possible for rewards)</li>
              <li>Credit card: auto-pay full balance monthly</li>
              <li>Whatever remains in checking is guilt-free</li>
            </ul>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <button type="button" className="btn btn--secondary" onClick={onClose}>Close</button>
            <button type="button" className="btn btn--primary" onClick={() => onComplete({
              payday_schedule: ctx.payday_schedule, payday_date: ctx.payday_date,
              accounts: cspData.current_investments.map(i => i.label || i.account_type),
              transfers: cspData.current_investments.filter(i => i.monthly_contribution > 0).map(i => ({
                from: 'Checking', to: i.label || i.account_type, amount: i.monthly_contribution, day: ctx.payday_date + 2,
              })),
            })}>Save Blueprint</button>
          </div>
        </div>
      )}
    </div>
  );
}
