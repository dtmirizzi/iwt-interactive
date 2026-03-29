import { useMachine } from '@xstate/react';
import { useMemo } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip as ChartTooltip } from 'chart.js';
import { Line } from 'react-chartjs-2';
import { retirementMachine } from '../../machines/retirementMachine';
import type { CSPData, RetirementResult } from '../../types';
import { isRetirementAccount } from '../../types';
import { formatCurrency } from '../../utils/csp';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, ChartTooltip);

interface RetirementWorkflowProps {
  cspData: CSPData;
  onComplete: (result: RetirementResult) => void;
  onClose: () => void;
}

function project(currentAge: number, retireAge: number, balance: number, monthly: number, rate: number) {
  const years: { age: number; balance: number }[] = [];
  let b = balance;
  const mr = rate / 12;
  for (let age = currentAge; age <= Math.max(retireAge + 10, 70); age++) {
    years.push({ age, balance: b });
    for (let m = 0; m < 12; m++) b = b * (1 + mr) + (age < retireAge ? monthly : 0);
  }
  return years;
}

export function RetirementWorkflow({ cspData, onComplete, onClose }: RetirementWorkflowProps) {
  const [state, send] = useMachine(retirementMachine);
  const ctx = state.context;
  const step = state.value as string;

  const retirementInvestments = cspData.current_investments.filter(i => isRetirementAccount(i.account_type));
  const totalRetBalance = retirementInvestments.reduce((s, i) => s + i.current_balance, 0);
  const monthlyInv = retirementInvestments.reduce((s, i) => s + i.monthly_contribution, 0);

  const projection = useMemo(
    () => project(cspData.age, ctx.target_retirement_age, totalRetBalance, monthlyInv, ctx.expected_return),
    [cspData.age, ctx.target_retirement_age, totalRetBalance, monthlyInv, ctx.expected_return],
  );

  const retBalance = projection.find(p => p.age === ctx.target_retirement_age)?.balance ?? 0;
  const monthlyIncome = retBalance * 0.04 / 12;

  const lineData = {
    labels: projection.map(p => p.age.toString()),
    datasets: [{ label: 'Portfolio', data: projection.map(p => p.balance), borderColor: '#FB4D30', backgroundColor: 'rgba(251,77,48,0.08)', fill: true, tension: 0.3, pointRadius: 0, pointHoverRadius: 5 }],
  };

  const lineOptions = {
    responsive: true,
    plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c: { raw: unknown }) => formatCurrency(c.raw as number), title: (items: { label: string }[]) => `Age ${items[0].label}` } } },
    scales: { x: { title: { display: true, text: 'Age' }, grid: { display: false } }, y: { title: { display: true, text: 'Value' }, ticks: { callback: (v: string | number) => formatCurrency(Number(v)) } } },
  };

  return (
    <div>
      {step === 'inputs' && (
        <div>
          <div className="form" style={{ marginBottom: '20px' }}>
            <div className="form__field">
              <label>Target Retirement Age</label>
              <input type="number" min="40" max="80" value={ctx.target_retirement_age} onChange={(e) => send({ type: 'UPDATE', data: { target_retirement_age: Number(e.target.value) } })} />
            </div>
            <div className="form__field">
              <label>Expected Annual Return (%)</label>
              <p className="form__hint">Historical S&P 500 average: ~10% nominal, ~7% inflation-adjusted. Enter as a whole number (e.g., 7 for 7%).</p>
              <input type="number" step="0.5" min="0" max="20" value={Math.round(ctx.expected_return * 100 * 10) / 10} onChange={(e) => send({ type: 'UPDATE', data: { expected_return: Number(e.target.value) / 100 } })} />
            </div>
            <div className="form__callout">
              <p>Current retirement balance: <strong>{formatCurrency(totalRetBalance)}</strong></p>
              <p>Currently investing: <strong>{formatCurrency(monthlyInv)}/mo</strong></p>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <button type="button" className="btn btn--secondary" onClick={onClose}>Cancel</button>
            <button type="button" className="btn btn--primary" onClick={() => send({ type: 'NEXT' })}>See Projections</button>
          </div>
        </div>
      )}

      {step === 'projections' && (
        <div>
          <div style={{ marginBottom: '20px' }}>
            <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '8px' }}>
              Investing {formatCurrency(monthlyInv)}/mo at {(ctx.expected_return * 100).toFixed(0)}% return
            </p>
            <p style={{ marginBottom: '16px' }}>
              At {ctx.target_retirement_age}: <strong style={{ color: '#FB4D30', fontSize: '1.2rem' }}>{formatCurrency(retBalance)}</strong>
              {' '}providing ~{formatCurrency(monthlyIncome)}/mo (4% safe withdrawal)
            </p>
            <Line data={lineData} options={lineOptions} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <button type="button" className="btn btn--secondary" onClick={onClose}>Close</button>
            <button type="button" className="btn btn--primary" onClick={() => onComplete({
              target_retirement_age: ctx.target_retirement_age, expected_return: ctx.expected_return,
              current_total_balance: totalRetBalance, monthly_investment: monthlyInv,
              projected_balance_at_retirement: retBalance, monthly_retirement_income: monthlyIncome,
            })}>Save Projection</button>
          </div>
        </div>
      )}
    </div>
  );
}
