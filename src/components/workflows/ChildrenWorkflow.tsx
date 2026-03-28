import { useMachine } from '@xstate/react';
import { childrenMachine } from '../../machines/childrenMachine';
import type { CSPData, ChildInfo, ChildrenResult } from '../../types';
import { getTaxYearConfig } from '../../config';
import { formatCurrency } from '../../utils/csp';

interface ChildrenWorkflowProps {
  cspData: CSPData;
  onComplete: (result: ChildrenResult) => void;
  onClose: () => void;
}

function uid() { return `child-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`; }

function createChild(): ChildInfo {
  return { id: uid(), name: '', birth_year: new Date().getFullYear(), has_earned_income: false, has_disability: false };
}

export function ChildrenWorkflow({ cspData, onComplete, onClose }: ChildrenWorkflowProps) {
  const [state, send] = useMachine(childrenMachine);
  const ctx = state.context;
  const step = state.value as string;
  const taxConfig = getTaxYearConfig(cspData.tax_year);
  const currentYear = new Date().getFullYear();

  const addChild = () => send({ type: 'SET_CHILDREN', children: [...ctx.children, createChild()] });
  const removeChild = (id: string) => send({ type: 'SET_CHILDREN', children: ctx.children.filter(c => c.id !== id) });
  const updateChild = (id: string, field: keyof ChildInfo, value: unknown) =>
    send({ type: 'SET_CHILDREN', children: ctx.children.map(c => c.id === id ? { ...c, [field]: value } : c) });

  return (
    <div>
      {step === 'children_list' && (
        <div>
          {ctx.children.map(child => {
            const age = currentYear - child.birth_year;
            return (
              <div key={child.id} className="child-card" style={{ marginBottom: '12px' }}>
                <div className="child-card__header">
                  <input type="text" value={child.name} onChange={(e) => updateChild(child.id, 'name', e.target.value)} placeholder="Child's name" style={{ border: 'none', background: 'transparent', fontWeight: 600, fontSize: '0.9rem', width: '100%' }} />
                  <button type="button" className="fixed-costs__remove" onClick={() => removeChild(child.id)}>&times;</button>
                </div>
                <div className="child-card__fields">
                  <div className="form__field">
                    <label>Birth Year</label>
                    <input type="number" min="1990" max={currentYear} value={child.birth_year} onChange={(e) => updateChild(child.id, 'birth_year', Number(e.target.value))} />
                    {age >= 0 && <span style={{ fontSize: '0.75rem', color: '#666' }}>Age: {age}</span>}
                  </div>
                  <div className="form__field">
                    <label>Has earned income?</label>
                    <div className="choice-cards">
                      <button type="button" className={`choice-card choice-card--compact ${child.has_earned_income ? 'choice-card--selected' : ''}`} onClick={() => updateChild(child.id, 'has_earned_income', true)}>Yes</button>
                      <button type="button" className={`choice-card choice-card--compact ${!child.has_earned_income ? 'choice-card--selected' : ''}`} onClick={() => updateChild(child.id, 'has_earned_income', false)}>No</button>
                    </div>
                  </div>
                  {child.has_earned_income && (
                    <div className="form__field">
                      <label>Annual Earned Income</label>
                      <div className="form__input-group"><span className="form__prefix">$</span>
                        <input type="number" min="0" value={child.earned_income_annual ?? ''} onChange={(e) => updateChild(child.id, 'earned_income_annual', Number(e.target.value))} />
                      </div>
                    </div>
                  )}
                  <div className="form__field">
                    <label>Has a disability?</label>
                    <div className="choice-cards">
                      <button type="button" className={`choice-card choice-card--compact ${child.has_disability ? 'choice-card--selected' : ''}`} onClick={() => updateChild(child.id, 'has_disability', true)}>Yes</button>
                      <button type="button" className={`choice-card choice-card--compact ${!child.has_disability ? 'choice-card--selected' : ''}`} onClick={() => updateChild(child.id, 'has_disability', false)}>No</button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          <button type="button" className="fixed-costs__add" onClick={addChild}>+ Add a child</button>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
            <button type="button" className="btn btn--secondary" onClick={onClose}>Cancel</button>
            <button type="button" className="btn btn--primary" onClick={() => send({ type: 'NEXT' })} disabled={ctx.children.length === 0}>See Recommendations</button>
          </div>
        </div>
      )}

      {step === 'recommendations' && (
        <div>
          {ctx.children.map(child => {
            const age = currentYear - child.birth_year;
            const eligibleTrump = child.birth_year >= taxConfig.trump_account.eligible_birth_year_start && child.birth_year <= taxConfig.trump_account.eligible_birth_year_end;
            return (
              <div key={child.id} className="child-card" style={{ marginBottom: '16px' }}>
                <h3 className="child-card__name" style={{ marginBottom: '12px' }}>{child.name || 'Child'} (age {age})</h3>
                <div className="child-card__recs">
                  <div className="child-card__rec"><span className="child-card__rec-badge">REC</span><span>529 Plan -- tax-free growth for education. {formatCurrency(taxConfig.plan_529.gift_tax_exclusion)}/yr per donor.</span></div>
                  {eligibleTrump && <div className="child-card__rec"><span className="child-card__rec-badge" style={{ background: '#FB4D30' }}>NEW</span><span>Trump Account -- {formatCurrency(taxConfig.trump_account.government_seed)} free seed money. Available July 2026.</span></div>}
                  {child.has_earned_income && <div className="child-card__rec"><span className="child-card__rec-badge">REC</span><span>Custodial Roth IRA -- tax-free compounding for {65 - age}+ years.</span></div>}
                  {child.has_disability && <div className="child-card__rec"><span className="child-card__rec-badge">REC</span><span>ABLE Account -- best FAFSA treatment, tax-free for disability expenses.</span></div>}
                </div>
              </div>
            );
          })}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
            <button type="button" className="btn btn--secondary" onClick={onClose}>Close</button>
            <button type="button" className="btn btn--primary" onClick={() => onComplete({ children: ctx.children })}>Save</button>
          </div>
        </div>
      )}
    </div>
  );
}
