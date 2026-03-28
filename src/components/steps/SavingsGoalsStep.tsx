import { StepLayout } from '../ui/StepLayout';
import type { StepMeta } from '../../machines/cspBuilderMachine';
import type { CSPData, SavingsGoal } from '../../types';
import { formatCurrency } from '../../utils/csp';

interface SavingsGoalsStepProps {
  meta: StepMeta | null;
  cspData: CSPData;
  onUpdate: (data: Partial<CSPData>) => void;
  onNext: () => void;
  onBack: () => void;
}

function createGoal(): SavingsGoal {
  return {
    id: `goal-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    name: '', target_amount: 0, current_amount: 0, monthly_contribution: 0,
    target_date: '', status: 'active', owner: 'individual',
  };
}

export function SavingsGoalsStep({ meta, cspData, onUpdate, onNext, onBack }: SavingsGoalsStepProps) {
  const goals = cspData.savings_goals;

  const updateGoal = (id: string, field: keyof SavingsGoal, value: string | number) =>
    onUpdate({ savings_goals: goals.map(g => g.id === id ? { ...g, [field]: value } : g) });
  const removeGoal = (id: string) =>
    onUpdate({ savings_goals: goals.filter(g => g.id !== id) });
  const addGoal = () =>
    onUpdate({ savings_goals: [...goals, createGoal()] });

  const totalMonthly = goals.filter(g => g.status === 'active').reduce((s, g) => s + g.monthly_contribution, 0);
  const netMonthly = cspData.net_monthly_income + (cspData.partner_net_monthly ?? 0);
  const pct = netMonthly > 0 ? totalMonthly / netMonthly : 0;

  return (
    <StepLayout meta={meta} onNext={onNext} onBack={onBack} canGoBack nextLabel="See My CSP">
      <div className="savings-goals__list">
        {goals.map((goal) => {
          const progress = goal.target_amount > 0 ? Math.min(1, goal.current_amount / goal.target_amount) : 0;
          return (
            <div key={goal.id} className="savings-goal">
              <div className="savings-goal__header">
                <input
                  type="text" value={goal.name}
                  onChange={(e) => updateGoal(goal.id, 'name', e.target.value)}
                  placeholder="Goal name (e.g., Emergency Fund, Car, Wedding)"
                  style={{ border: 'none', background: 'transparent', fontWeight: 600, fontSize: '0.9rem', width: '100%' }}
                />
                <button type="button" className="fixed-costs__remove" onClick={() => removeGoal(goal.id)}>&times;</button>
              </div>
              <div className="savings-goal__fields">
                <div className="savings-goal__field">
                  <label>Target Amount</label>
                  <div className="form__input-group">
                    <span className="form__prefix">$</span>
                    <input type="number" min="0" value={goal.target_amount || ''} onChange={(e) => updateGoal(goal.id, 'target_amount', Number(e.target.value))} />
                  </div>
                </div>
                <div className="savings-goal__field">
                  <label>Saved So Far</label>
                  <div className="form__input-group">
                    <span className="form__prefix">$</span>
                    <input type="number" min="0" value={goal.current_amount || ''} onChange={(e) => updateGoal(goal.id, 'current_amount', Number(e.target.value))} />
                  </div>
                </div>
                <div className="savings-goal__field">
                  <label>Monthly Contribution</label>
                  <div className="form__input-group">
                    <span className="form__prefix">$</span>
                    <input type="number" min="0" value={goal.monthly_contribution || ''} onChange={(e) => updateGoal(goal.id, 'monthly_contribution', Number(e.target.value))} />
                  </div>
                </div>
                <div className="savings-goal__field">
                  <label>Target Date</label>
                  <input type="date" value={goal.target_date} onChange={(e) => updateGoal(goal.id, 'target_date', e.target.value)} />
                </div>
              </div>
              {goal.target_amount > 0 && (
                <div className="savings-goal__progress">
                  <div className="savings-goal__progress-fill" style={{ width: `${progress * 100}%` }} />
                </div>
              )}
              {goal.target_amount > 0 && goal.current_amount >= goal.target_amount && (
                <p style={{ color: '#2E7D32', fontWeight: 600, fontSize: '0.8rem', marginTop: '8px' }}>Goal reached!</p>
              )}
            </div>
          );
        })}
      </div>

      <button type="button" className="fixed-costs__add" onClick={addGoal}>+ Add a savings goal</button>

      {goals.length > 0 && (
        <div className="fixed-costs__total" style={{ marginTop: '16px' }}>
          <div>
            <span>Total Monthly Savings</span>
            {netMonthly > 0 && <div className="fixed-costs__buffer">{Math.round(pct * 100)}% of take-home (target: 5-10%)</div>}
          </div>
          <span className="fixed-costs__total-amount">{formatCurrency(totalMonthly)}/mo</span>
        </div>
      )}

      {goals.length === 0 && (
        <div className="form__callout" style={{ marginTop: '16px' }}>
          <p>Common goals: <strong>Emergency fund</strong> (3-6 months), <strong>house down payment</strong>, <strong>car fund</strong>, <strong>wedding</strong>, <strong>vacation</strong>. Even one is a great start.</p>
        </div>
      )}
    </StepLayout>
  );
}
