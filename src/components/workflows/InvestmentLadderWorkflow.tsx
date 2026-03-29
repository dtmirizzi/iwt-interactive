import { useMachine } from '@xstate/react';
import { useMemo } from 'react';
import { investmentLadderMachine } from '../../machines/investmentLadderMachine';
import type { CSPData, EmployerPlanType, EmploymentType, InvestmentLadderResult } from '../../types';
import { buildInvestmentLadder } from '../../utils/retirement';
import { formatCurrency } from '../../utils/csp';
import { getTaxYearConfig } from '../../config';

interface InvestmentLadderWorkflowProps {
  cspData: CSPData;
  onComplete: (result: InvestmentLadderResult) => void;
  onClose: () => void;
}

export function InvestmentLadderWorkflow({ cspData, onComplete, onClose }: InvestmentLadderWorkflowProps) {
  const [state, send] = useMachine(investmentLadderMachine);
  const ctx = state.context;
  const step = state.value as string;
  const taxConfig = getTaxYearConfig(cspData.tax_year);

  const ladder = useMemo(() => {
    return buildInvestmentLadder(taxConfig, {
      ...cspData, ...ctx,
      gross_monthly_income: cspData.gross_monthly_income,
      age: cspData.age,
      filing_status: cspData.filing_status,
      magi: ctx.magi || cspData.gross_monthly_income * 12,
      combined_magi: ctx.combined_magi || (cspData.gross_monthly_income + (cspData.partner_gross_monthly ?? 0)) * 12,
      debts: cspData.debts,
      debt_extra_monthly: 0,
    });
  }, [taxConfig, cspData, ctx]);

  const handleComplete = () => {
    onComplete({ ...ctx, magi: ctx.magi, combined_magi: ctx.combined_magi, recommendations: ladder });
  };

  return (
    <div>
      {/* Step: Employment */}
      {step === 'employment' && (
        <div>
          <div className="choice-cards choice-cards--vertical" style={{ marginBottom: '20px' }}>
            {([
              { value: 'w2', label: 'Employed (W-2)', desc: 'Work for a company, receive a W-2' },
              { value: 'self_employed', label: 'Self-Employed (1099)', desc: 'Run your own business, freelance, or contract' },
              { value: 'both', label: 'Both', desc: 'W-2 job and self-employment income' },
            ] as const).map(opt => (
              <button key={opt.value} type="button" className={`choice-card ${ctx.employment_type === opt.value ? 'choice-card--selected' : ''}`} onClick={() => send({ type: 'UPDATE', data: { employment_type: opt.value as EmploymentType } })}>
                <span className="choice-card__label">{opt.label}</span>
                <span className="choice-card__desc">{opt.desc}</span>
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <button type="button" className="btn btn--secondary" onClick={onClose}>Cancel</button>
            <button type="button" className="btn btn--primary" onClick={() => send({ type: 'NEXT' })}>Next</button>
          </div>
        </div>
      )}

      {/* Step: Employer Plan */}
      {step === 'employer_plan' && (
        <div>
          <div className="form" style={{ marginBottom: '20px' }}>
            <div className="form__field">
              <label>Employer Plan Type</label>
              <select value={ctx.employer_plan_type} onChange={(e) => send({ type: 'UPDATE', data: { employer_plan_type: e.target.value as EmployerPlanType } })}>
                <option value="none">No employer plan</option>
                <option value="401k">401(k)</option>
                <option value="403b">403(b)</option>
                <option value="457b_gov">457(b) Governmental</option>
                <option value="simple_ira">SIMPLE IRA</option>
                <option value="tsp">TSP</option>
              </select>
            </div>
            {ctx.employer_plan_type !== 'none' && (
              <>
                <div className="form__field">
                  <label>Employer matches contributions?</label>
                  <div className="choice-cards">
                    <button type="button" className={`choice-card choice-card--compact ${ctx.employer_match ? 'choice-card--selected' : ''}`} onClick={() => send({ type: 'UPDATE', data: { employer_match: true } })}>Yes</button>
                    <button type="button" className={`choice-card choice-card--compact ${!ctx.employer_match ? 'choice-card--selected' : ''}`} onClick={() => send({ type: 'UPDATE', data: { employer_match: false } })}>No</button>
                  </div>
                </div>
                {ctx.employer_match && (
                  <>
                    <div className="form__field">
                      <label>Match Rate (e.g., 0.50 for 50%, 1.00 for dollar-for-dollar)</label>
                      <input type="number" step="0.01" min="0" max="1" value={ctx.employer_match_pct || ''} onChange={(e) => send({ type: 'UPDATE', data: { employer_match_pct: Number(e.target.value) } })} />
                    </div>
                    <div className="form__field">
                      <label>Match Cap (% of salary, e.g., 0.06 for 6%)</label>
                      <input type="number" step="0.01" min="0" max="1" value={ctx.employer_match_cap_pct || ''} onChange={(e) => send({ type: 'UPDATE', data: { employer_match_cap_pct: Number(e.target.value) } })} />
                    </div>
                  </>
                )}
                <div className="form__field">
                  <label>Plan allows after-tax (non-Roth) contributions?</label>
                  <p className="form__hint">Enables Mega Backdoor Roth. If unsure, select No.</p>
                  <div className="choice-cards">
                    <button type="button" className={`choice-card choice-card--compact ${ctx.employer_allows_after_tax ? 'choice-card--selected' : ''}`} onClick={() => send({ type: 'UPDATE', data: { employer_allows_after_tax: true } })}>Yes</button>
                    <button type="button" className={`choice-card choice-card--compact ${!ctx.employer_allows_after_tax ? 'choice-card--selected' : ''}`} onClick={() => send({ type: 'UPDATE', data: { employer_allows_after_tax: false } })}>No</button>
                  </div>
                </div>
              </>
            )}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <button type="button" className="btn btn--secondary" onClick={() => send({ type: 'BACK' })}>Back</button>
            <button type="button" className="btn btn--primary" onClick={() => send({ type: 'NEXT' })}>Next</button>
          </div>
        </div>
      )}

      {/* Step: Tax Situation */}
      {step === 'tax_situation' && (
        <div>
          <div className="form" style={{ marginBottom: '20px' }}>
            <div className="form__field">
              <label>MAGI ({cspData.tax_year})</label>
              <p className="form__hint">Modified Adjusted Gross Income. For most people, MAGI is roughly gross annual income.</p>
              <div className="form__input-group">
                <span className="form__prefix">$</span>
                <input type="number" value={ctx.magi || cspData.gross_monthly_income * 12 || ''} onChange={(e) => send({ type: 'UPDATE', data: { magi: Number(e.target.value), combined_magi: Number(e.target.value) + (cspData.partner_gross_monthly ?? 0) * 12 } })} />
              </div>
            </div>
            <div className="form__field">
              <label>Enrolled in a High Deductible Health Plan (HDHP)?</label>
              <div className="choice-cards">
                <button type="button" className={`choice-card choice-card--compact ${ctx.has_hdhp ? 'choice-card--selected' : ''}`} onClick={() => send({ type: 'UPDATE', data: { has_hdhp: true } })}>Yes</button>
                <button type="button" className={`choice-card choice-card--compact ${!ctx.has_hdhp ? 'choice-card--selected' : ''}`} onClick={() => send({ type: 'UPDATE', data: { has_hdhp: false } })}>No</button>
              </div>
            </div>
            <div className="form__field">
              <label>Have existing Traditional IRA / SEP IRA balances?</label>
              <p className="form__hint">Affects the Backdoor Roth strategy (pro-rata rule).</p>
              <div className="choice-cards">
                <button type="button" className={`choice-card choice-card--compact ${ctx.has_traditional_ira_balance ? 'choice-card--selected' : ''}`} onClick={() => send({ type: 'UPDATE', data: { has_traditional_ira_balance: true } })}>Yes</button>
                <button type="button" className={`choice-card choice-card--compact ${!ctx.has_traditional_ira_balance ? 'choice-card--selected' : ''}`} onClick={() => send({ type: 'UPDATE', data: { has_traditional_ira_balance: false } })}>No</button>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <button type="button" className="btn btn--secondary" onClick={() => send({ type: 'BACK' })}>Back</button>
            <button type="button" className="btn btn--primary" onClick={() => send({ type: 'NEXT' })}>See Ladder</button>
          </div>
        </div>
      )}

      {/* Step: Recommendations (final) */}
      {step === 'recommendations' && (
        <div>
          <ol className="ladder__list" style={{ marginBottom: '20px' }}>
            {ladder.filter(r => r.annual_amount > 0).map(rec => (
              <li key={rec.account_type} className="ladder__item">
                <div className="ladder__item-header">
                  <span className={`ladder__badge ${rec.priority <= 2 ? 'ladder__badge--critical' : rec.priority <= 5 ? 'ladder__badge--important' : 'ladder__badge--optional'}`}>{rec.priority}</span>
                  <span className="ladder__item-label">{rec.label}</span>
                  <span className="ladder__item-amount">{formatCurrency(rec.monthly_amount)}/mo</span>
                </div>
                <p className="ladder__item-reason">{rec.reason}</p>
                {rec.is_employer_match && <p className="ladder__item-match">Employer match: {rec.match_details}</p>}
              </li>
            ))}
          </ol>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <button type="button" className="btn btn--secondary" onClick={onClose}>Close</button>
            <button type="button" className="btn btn--primary" onClick={handleComplete}>Save Ladder</button>
          </div>
        </div>
      )}
    </div>
  );
}
