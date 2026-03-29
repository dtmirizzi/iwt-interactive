import { useEffect, useMemo, useState } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import type { CSPData, DashboardState, WorkflowId } from '../types';
import { isRetirementAccount } from '../types';
import { calculateCSPBuckets, evaluateBucket, formatCurrency, formatPct, healthColor } from '../utils/csp';
import { getTaxYearConfig } from '../config';
import { CSPTable } from './dashboard/CSPTable';
import { DebtPayoffWorkflow } from './workflows/DebtPayoffWorkflow';
import { InvestmentLadderWorkflow } from './workflows/InvestmentLadderWorkflow';
import { RetirementWorkflow } from './workflows/RetirementWorkflow';
import { ChildrenWorkflow } from './workflows/ChildrenWorkflow';
import { AutomationWorkflow } from './workflows/AutomationWorkflow';
import { RichLifeWorkflow } from './workflows/RichLifeWorkflow';

ChartJS.register(ArcElement, Tooltip, Legend);

interface DashboardProps {
  cspData: CSPData;
  onEditCSP: () => void;
  onUpdateCSP: (data: CSPData) => void;
}

interface WorkflowDef {
  id: WorkflowId;
  title: string;
  description: string;
  locked: boolean;
  lockMessage: string;
  hasData: boolean;
}

export function Dashboard({ cspData, onEditCSP, onUpdateCSP }: DashboardProps) {
  const [dashState, setDashState] = useState<DashboardState>({
    cspData,
    activeWorkflow: null,
  });

  // Keep dashState.cspData in sync when cspData prop changes (e.g., inline table edits)
  useEffect(() => {
    setDashState(s => ({ ...s, cspData }));
  }, [cspData]);

  const taxConfig = getTaxYearConfig(cspData.tax_year);
  const closeWorkflow = () => setDashState(s => ({ ...s, activeWorkflow: null }));

  const cspBuckets = useMemo(() => calculateCSPBuckets(cspData), [cspData]);
  const cspHealth = useMemo(() => {
    if (!cspBuckets) return null;
    return {
      fixed_costs: evaluateBucket('fixed_costs', cspBuckets.fixed_costs.pct),
      investments: evaluateBucket('investments', cspBuckets.investments.pct),
      savings: evaluateBucket('savings', cspBuckets.savings.pct),
      guilt_free: evaluateBucket('guilt_free', cspBuckets.guilt_free.pct),
    };
  }, [cspBuckets]);

  if (!cspBuckets || !cspHealth) {
    return <div className="wizard"><p>Not enough data. Go back and complete the CSP builder.</p></div>;
  }

  const userName = cspData.user_name || 'Your';
  const partnerName = cspData.partner_name || 'Partner';
  const fixedCostHealthy = cspHealth.fixed_costs.health !== 'danger';
  const investmentsHealthy = cspHealth.investments.health !== 'danger';
  const hasDebt = cspData.debts.some(d => d.balance > 0);
  const hasInvestments = cspBuckets.investments.amount > 0;
  const net = cspBuckets.net_monthly;

  // Net worth calcs
  const totalSavings = cspData.cash_savings + (cspData.partner_cash_savings ?? 0);
  const retirementAccounts = cspData.current_investments.filter(i => isRetirementAccount(i.account_type));
  const nonRetirementAccounts = cspData.current_investments.filter(i => !isRetirementAccount(i.account_type));
  const totalRetirement = retirementAccounts.reduce((s, i) => s + i.current_balance, 0);
  const totalNonRetirement = nonRetirementAccounts.reduce((s, i) => s + i.current_balance, 0);
  const totalAssets = cspData.assets.reduce((s, a) => s + a.value, 0);
  const totalDebt = cspData.debts.reduce((s, d) => s + d.balance, 0);
  const netWorth = totalAssets + totalNonRetirement + totalRetirement + totalSavings - totalDebt;


  // Compute FOO (Financial Order of Operations) current step for gating
  // Steps 7-9 (indices 6-8): Hyperaccumulation, Prepay Future, Prepay Low-Interest
  const fooCurrentStep = (() => {
    if (!dashState.investmentResult) return 0;
    const ir = dashState.investmentResult;
    const employerOffersMatch = ir.employer_plan_type !== 'none';
    const noHighDebt = !cspData.debts.some(d => d.apr >= 0.06 && d.balance > 0);
    const efOk = totalSavings >= (net * 3);
    const rothOrHSA = cspData.current_investments.some(i => i.account_type === 'roth_ira' || i.account_type === 'hsa');
    const invPct = net > 0 ? cspData.current_investments.reduce((s, i) => s + i.monthly_contribution, 0) / net : 0;
    const maxedPlans = invPct >= 0.20;
    const noLowDebt = cspData.debts.every(d => d.balance <= 0);
    const steps = [
      { done: true, skip: false },                                    // 1: Deductibles
      { done: ir.employer_match, skip: !employerOffersMatch },        // 2: Employer Match
      { done: noHighDebt, skip: false },                              // 3: High-Interest Debt
      { done: efOk, skip: false },                                    // 4: Emergency Fund
      { done: rothOrHSA, skip: false },                               // 5: Roth/HSA
      { done: maxedPlans, skip: false },                              // 6: Max Employer Plans
      { done: false, skip: false },                                   // 7: Hyperaccumulation
      { done: false, skip: false },                                   // 8: Prepay Future
      { done: noLowDebt, skip: false },                               // 9: Prepay Low-Interest
    ];
    const idx = steps.findIndex(s => !s.done && !s.skip);
    return idx >= 0 ? idx + 1 : 10; // 1-indexed, 10 = all done
  })();
  const atStep7OrHigher = fooCurrentStep >= 7;

  const workflows: WorkflowDef[] = [
    { id: 'debt_payoff', title: 'Debt Payoff Strategy', description: 'Avalanche vs Snowball. Build your payoff plan.', locked: !hasDebt, lockMessage: 'No debt to pay off. Nice!', hasData: !!dashState.debtResult },
    { id: 'investment_ladder', title: 'Investment Ladder', description: 'Optimize where every investment dollar goes.', locked: !fixedCostHealthy, lockMessage: 'Get fixed costs below 70% to unlock.', hasData: !!dashState.investmentResult },
    { id: 'retirement', title: 'Retirement Projections', description: 'See when you can retire and how much you will have.', locked: !investmentsHealthy, lockMessage: 'Start investing at least 5% to unlock.', hasData: !!dashState.retirementResult },
    { id: 'children', title: 'Children & Education', description: '529 plans, Trump Accounts, Custodial Roth IRAs.', locked: !atStep7OrHigher, lockMessage: 'Reach step 7 (Hyperaccumulation) on the Financial Order of Operations to unlock.', hasData: !!dashState.childrenResult },
    { id: 'rich_life', title: 'Rich Life Design', description: 'Money Dials + your Rich Life vision.', locked: false, lockMessage: '', hasData: !!dashState.richLifeResult },
    { id: 'automation', title: 'Account Automation', description: 'Automate your money flow on payday.', locked: !(fixedCostHealthy && hasInvestments), lockMessage: 'Complete your CSP buckets first.', hasData: !!dashState.automationResult },
  ];

  // Doughnut
  const bucketList = [
    { label: 'Fixed Costs', amount: cspBuckets.fixed_costs.amount, pct: cspBuckets.fixed_costs.pct, key: 'fixed_costs' as const, target: '50-60%' },
    { label: 'Investments', amount: cspBuckets.investments.amount, pct: cspBuckets.investments.pct, key: 'investments' as const, target: '10%+' },
    { label: 'Savings', amount: cspBuckets.savings.amount, pct: cspBuckets.savings.pct, key: 'savings' as const, target: '5-10%' },
    { label: 'Guilt-Free', amount: cspBuckets.guilt_free.amount, pct: cspBuckets.guilt_free.pct, key: 'guilt_free' as const, target: '20-35%' },
  ];

  const doughnutData = {
    labels: bucketList.map(b => b.label),
    datasets: [{ data: bucketList.map(b => b.amount), backgroundColor: ['#FF8A65', '#FB4D30', '#FFB74D', '#4CAF50'], borderWidth: 2, borderColor: '#fff' }],
  };
  const doughnutOptions = {
    responsive: true, cutout: '65%',
    plugins: {
      legend: { position: 'bottom' as const, labels: { padding: 16, usePointStyle: true, font: { size: 12 } } },
      tooltip: { callbacks: { label: (ctx: { label: string; raw: unknown }) => `${ctx.label}: ${formatCurrency(ctx.raw as number)}/mo` } },
    },
  };

  return (
    <div className="wizard" style={{ maxWidth: '960px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.75rem', margin: 0 }}>
            {userName === 'Your' ? 'Your' : `${userName}'s`} Conscious Spending Plan
          </h1>
          <p style={{ color: '#666', fontSize: '0.85rem' }}>
            {taxConfig.tax_year} Tax Year
            {cspData.has_partner && ` | ${userName} & ${partnerName}`}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button type="button" className="btn btn--secondary" onClick={onEditCSP}>Edit CSP</button>
          <button type="button" className="btn btn--secondary" onClick={() => window.print()}>Print</button>
        </div>
      </div>

      {/* Net Worth */}
      <div className="results__section">
        <h2 className="results__section-title">Net Worth</h2>
        {(() => {
          // Per-person net worth breakdown
          const myAssets = cspData.assets.filter(a => a.owner === 'individual' || a.owner === 'shared').reduce((s, a) => s + (a.owner === 'shared' ? Math.round(a.value / 2) : a.value), 0);
          const pAssets = cspData.assets.filter(a => a.owner === 'partner' || a.owner === 'shared').reduce((s, a) => s + (a.owner === 'shared' ? a.value - Math.round(a.value / 2) : a.value), 0);
          const myInvBal = cspData.current_investments.filter(i => i.owner === 'individual').reduce((s, i) => s + i.current_balance, 0);
          const pInvBal = cspData.current_investments.filter(i => i.owner === 'partner').reduce((s, i) => s + i.current_balance, 0);
          const myCash = cspData.cash_savings;
          const pCash = cspData.partner_cash_savings ?? 0;
          // Debts don't have owner, split evenly for display
          const myDebt = Math.round(totalDebt / 2);
          const pDebt = totalDebt - myDebt;
          const myRetirement = cspData.current_investments.filter(i => i.owner === 'individual' && isRetirementAccount(i.account_type)).reduce((s, i) => s + i.current_balance, 0);
          const pRetirement = cspData.current_investments.filter(i => i.owner === 'partner' && isRetirementAccount(i.account_type)).reduce((s, i) => s + i.current_balance, 0);
          const myNonRet = myInvBal - myRetirement;
          const pNonRet = pInvBal - pRetirement;
          const myNW = myAssets + myInvBal + myCash - myDebt;
          const pNW = pAssets + pInvBal + pCash - pDebt;
          const hasP = cspData.has_partner;

          if (!hasP) {
            return (
              <div className="results__csp-grid">
                <div className="results__bucket-card">
                  <div className="results__bucket-label">Total Assets</div>
                  <div className="results__bucket-amount" style={{ color: '#2E7D32' }}>{formatCurrency(totalAssets + totalNonRetirement + totalRetirement + totalSavings)}</div>
                  <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '4px' }}>
                    {totalAssets > 0 && <div>Assets: {formatCurrency(totalAssets)}</div>}
                    {totalNonRetirement > 0 && <div>Investments: {formatCurrency(totalNonRetirement)}</div>}
                    {totalRetirement > 0 && <div>Retirement: {formatCurrency(totalRetirement)}</div>}
                    {totalSavings > 0 && <div>Savings: {formatCurrency(totalSavings)}</div>}
                  </div>
                </div>
                <div className="results__bucket-card">
                  <div className="results__bucket-label">Net Worth</div>
                  <div className="results__bucket-amount" style={{ color: netWorth >= 0 ? '#2E7D32' : '#C62828' }}>
                    {netWorth < 0 ? '-' : ''}{formatCurrency(Math.abs(netWorth))}
                  </div>
                  {totalDebt > 0 && <div style={{ fontSize: '0.75rem', color: '#C62828', marginTop: '4px' }}>Debt: -{formatCurrency(totalDebt)}</div>}
                </div>
              </div>
            );
          }

          // Couple: show per-person + combined
          function NWCard({ label, assets, nonRet, retirement, cash, debt, nw }: { label: string; assets: number; nonRet: number; retirement: number; cash: number; debt: number; nw: number }) {
            return (
              <div className="results__bucket-card">
                <div className="results__bucket-label">{label}</div>
                <div className="results__bucket-amount" style={{ color: nw >= 0 ? '#2E7D32' : '#C62828' }}>
                  {nw < 0 ? '-' : ''}{formatCurrency(Math.abs(nw))}
                </div>
                <div style={{ fontSize: '0.7rem', color: '#666', marginTop: '4px', lineHeight: '1.5' }}>
                  {assets > 0 && <div>Assets: {formatCurrency(assets)}</div>}
                  {nonRet > 0 && <div>Investments: {formatCurrency(nonRet)}</div>}
                  {retirement > 0 && <div>Retirement: {formatCurrency(retirement)}</div>}
                  {cash > 0 && <div>Savings: {formatCurrency(cash)}</div>}
                  {debt > 0 && <div style={{ color: '#C62828' }}>Debt: -{formatCurrency(debt)}</div>}
                </div>
              </div>
            );
          }

          return (
            <div className="results__csp-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
              <NWCard label={userName} assets={myAssets} nonRet={myNonRet} retirement={myRetirement} cash={myCash} debt={myDebt} nw={myNW} />
              <NWCard label={partnerName} assets={pAssets} nonRet={pNonRet} retirement={pRetirement} cash={pCash} debt={pDebt} nw={pNW} />
              <NWCard label="Combined" assets={totalAssets} nonRet={totalNonRetirement} retirement={totalRetirement} cash={totalSavings} debt={totalDebt} nw={netWorth} />
            </div>
          );
        })()}
      </div>

      {/* CSP Breakdown: Chart + Bucket Cards + Itemized Table */}
      <div className="results__section">
        <h2 className="results__section-title">CSP Breakdown</h2>
        <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '16px' }}>
          {formatCurrency(net)}/mo take-home{cspData.has_partner ? ' (combined)' : ''}
        </p>

        <div className="results__chart-container">
          <Doughnut data={doughnutData} options={doughnutOptions} />
        </div>

        {/* Bucket summary cards */}
        <div className="results__csp-grid" style={{ marginBottom: '8px' }}>
          {bucketList.map(b => {
            const health = evaluateBucket(b.key, b.pct);
            return (
              <div key={b.key} className="results__bucket-card">
                <div className="results__bucket-label">{b.label}</div>
                <div className="results__bucket-amount" style={{ color: healthColor(health.health) }}>
                  {formatCurrency(b.amount)}<span style={{ fontSize: '0.8rem', fontWeight: 400 }}>/mo</span>
                </div>
                <div className="results__bucket-pct" style={{ color: healthColor(health.health) }}>{formatPct(b.pct)}</div>
                <div className="results__bucket-target">Target: {b.target}</div>
                <div className="results__bucket-message" style={{ color: healthColor(health.health) }}>{health.message}</div>
              </div>
            );
          })}
        </div>

        {/* ── Itemized CSP Table (split by partner) ────────── */}
        <CSPTable
          cspData={cspData}
          dashState={dashState}
          onUpdateCSP={onUpdateCSP}
        />

        {/* ── Financial Order of Operations ──────────── */}
        {dashState.investmentResult && (() => {
          const employerOffersMatch = dashState.investmentResult.employer_plan_type !== 'none';
          const hasMatch = dashState.investmentResult.employer_match;
          const hasHighDebt = cspData.debts.some(d => d.apr >= 0.06 && d.balance > 0);
          const hasEmergencyFund = totalSavings >= (net * 3);
          const hasRothOrHSA = cspData.current_investments.some(i => i.account_type === 'roth_ira' || i.account_type === 'hsa');
          const investPct = net > 0 ? cspData.current_investments.reduce((s, i) => s + i.monthly_contribution, 0) / net : 0;
          const hasMaxedPlans = investPct >= 0.20;
          const noHighDebt = !hasHighDebt;
          const noLowDebt = cspData.debts.every(d => d.balance <= 0);

          // skipped = not applicable (grayed out, not counted for current step)
          const steps = [
            { label: 'Deductibles Covered', done: true, skipped: false, desc: 'Insurance deductibles are liquid and accessible' },
            { label: 'Employer Match', done: hasMatch, skipped: !employerOffersMatch, desc: employerOffersMatch ? 'Contribute enough to get your full employer match (free money)' : 'Your employer does not offer a match' },
            { label: 'High-Interest Debt', done: noHighDebt, skipped: false, desc: 'Pay off all debt above 6% APR' },
            { label: 'Emergency Fund', done: hasEmergencyFund, skipped: false, desc: '3-6 months of expenses in a savings account' },
            { label: 'Roth IRA / HSA', done: hasRothOrHSA, skipped: false, desc: 'Max out Roth IRA and HSA (triple tax advantage)' },
            { label: 'Max-Out Employer Plans', done: hasMaxedPlans, skipped: false, desc: 'Max 401(k)/403(b) to the annual limit' },
            { label: 'Hyperaccumulation', done: false, skipped: false, desc: 'Invest 25%+ of gross income in taxable brokerage' },
            { label: 'Prepay Future Expenses', done: false, skipped: false, desc: 'Pay ahead on mortgage, fund 529s, etc.' },
            { label: 'Prepay Low-Interest Debt', done: noLowDebt, skipped: false, desc: 'Pay off remaining low-interest debt (mortgage, student loans)' },
          ];

          // Current step = first that is not done AND not skipped
          const currentIdx = steps.findIndex(s => !s.done && !s.skipped);

          return (
            <div style={{ marginTop: '20px' }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '12px', color: '#666' }}>
                <a href="https://moneyguy.com/guide/foo/" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'none', borderBottom: '1px dashed #999' }}>
                  Financial Order of Operations
                </a>
              </h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {steps.map((step, idx) => {
                  const isCurrent = idx === currentIdx;
                  const isDone = step.done && !step.skipped;
                  const isSkipped = step.skipped;
                  return (
                    <div
                      key={step.label}
                      className="csp-table__tooltip-wrapper"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '6px 12px',
                        background: isSkipped ? '#f0f0f0' : isDone ? '#E8F5E9' : isCurrent ? '#FDE8E4' : '#FAF6F0',
                        border: `1px solid ${isSkipped ? '#ddd' : isDone ? '#4CAF50' : isCurrent ? '#FB4D30' : '#EDE6DA'}`,
                        borderRadius: '20px',
                        fontSize: '0.78rem',
                        opacity: isSkipped ? 0.4 : (!isDone && !isCurrent) ? 0.5 : 1,
                        textDecoration: isSkipped ? 'line-through' : 'none',
                      }}
                    >
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        width: '18px', height: '18px', borderRadius: '50%', fontSize: '0.6rem', fontWeight: 700,
                        background: isSkipped ? '#ddd' : isDone ? '#4CAF50' : isCurrent ? '#FB4D30' : '#ccc', color: 'white',
                      }}>
                        {isSkipped ? '--' : isDone ? '\u2713' : idx + 1}
                      </span>
                      <span style={{ fontWeight: isCurrent ? 700 : 500 }}>{step.label}</span>
                      <span className="csp-table__tooltip-content">{step.desc}</span>
                    </div>
                  );
                })}
              </div>
              {currentIdx >= 0 && (
                <p style={{ fontSize: '0.75rem', color: '#FB4D30', fontWeight: 500, marginTop: '8px' }}>
                  You are on step {currentIdx + 1}: {steps[currentIdx].label}
                </p>
              )}
            </div>
          );
        })()}

        {/* ── Other workflow summaries ─────────────────── */}
        {dashState.retirementResult && (
          <div className="form__callout" style={{ marginTop: '16px', borderLeftColor: '#FB4D30' }}>
            <p>
              <strong>Retirement:</strong> At age {dashState.retirementResult.target_retirement_age}, projected{' '}
              <strong>{formatCurrency(dashState.retirementResult.projected_balance_at_retirement)}</strong> providing{' '}
              ~{formatCurrency(dashState.retirementResult.monthly_retirement_income)}/mo (4% safe withdrawal)
            </p>
          </div>
        )}

        {dashState.childrenResult && dashState.childrenResult.children.length > 0 && (
          <div className="form__callout" style={{ marginTop: '8px', borderLeftColor: '#FFB74D' }}>
            <p>
              <strong>Children:</strong> {dashState.childrenResult.children.map(c => c.name || 'Child').join(', ')} --
              529 plans, {dashState.childrenResult.children.some(c => c.birth_year >= 2025 && c.birth_year <= 2028) ? 'Trump Accounts, ' : ''}
              account recommendations saved
            </p>
          </div>
        )}

        {dashState.automationResult && (
          <div className="form__callout" style={{ marginTop: '8px', borderLeftColor: '#2E7D32' }}>
            <p>
              <strong>Automation:</strong> {dashState.automationResult.transfers.length} automatic transfers set up
              ({dashState.automationResult.payday_schedule} payday)
            </p>
          </div>
        )}
      </div>

      {/* Workflow Cards */}
      <div className="results__section">
        <h2 className="results__section-title">Optimize Your Plan</h2>
        <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '16px' }}>
          Deep-dive into each area. Completed workflows update the CSP table above.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {workflows.map(wf => (
            <div
              key={wf.id}
              className="results__flow-step"
              style={{
                borderLeftColor: wf.locked ? '#ccc' : wf.hasData ? '#2E7D32' : '#FB4D30',
                opacity: wf.locked ? 0.5 : 1,
                cursor: wf.locked ? 'not-allowed' : 'pointer',
              }}
              onClick={() => { if (!wf.locked) setDashState(s => ({ ...s, activeWorkflow: wf.id })); }}
            >
              <div style={{ flex: 1 }}>
                <div className="results__flow-label">
                  {wf.locked ? '🔒 ' : wf.hasData ? '✓ ' : ''}{wf.title}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#666' }}>
                  {wf.locked ? wf.lockMessage : wf.description}
                </div>
              </div>
              {!wf.locked && !wf.hasData && (
                <span style={{ color: '#FB4D30', fontWeight: 600, fontSize: '0.85rem' }}>Start</span>
              )}
              {wf.hasData && (
                <span style={{ color: '#2E7D32', fontWeight: 600, fontSize: '0.85rem' }}>Redo</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Active Workflow Modal */}
      {dashState.activeWorkflow && (
        <div
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
          }}
          onClick={(e) => { if (e.target === e.currentTarget) closeWorkflow(); }}
          onKeyDown={(e) => { if (e.key === 'Escape') closeWorkflow(); }}
          tabIndex={-1}
          ref={(el) => el?.focus()}
        >
          <div style={{ background: 'white', borderRadius: '12px', padding: '32px', maxWidth: '720px', width: '90%', maxHeight: '85vh', overflow: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontFamily: 'var(--font-serif)', margin: 0 }}>
                {workflows.find(w => w.id === dashState.activeWorkflow)?.title}
              </h2>
            </div>

            {dashState.activeWorkflow === 'debt_payoff' && (
              <DebtPayoffWorkflow cspData={cspData} onClose={closeWorkflow}
                onComplete={(r) => { setDashState(s => ({ ...s, debtResult: r, activeWorkflow: null })); }} />
            )}
            {dashState.activeWorkflow === 'investment_ladder' && (
              <InvestmentLadderWorkflow cspData={cspData} onClose={closeWorkflow}
                onComplete={(r) => { setDashState(s => ({ ...s, investmentResult: r, activeWorkflow: null })); }} />
            )}
            {dashState.activeWorkflow === 'retirement' && (
              <RetirementWorkflow cspData={cspData} onClose={closeWorkflow}
                onComplete={(r) => { setDashState(s => ({ ...s, retirementResult: r, activeWorkflow: null })); }} />
            )}
            {dashState.activeWorkflow === 'children' && (
              <ChildrenWorkflow cspData={cspData} onClose={closeWorkflow}
                onComplete={(r) => { setDashState(s => ({ ...s, childrenResult: r, activeWorkflow: null })); }} />
            )}
            {dashState.activeWorkflow === 'automation' && (
              <AutomationWorkflow cspData={cspData} onClose={closeWorkflow}
                onComplete={(r) => { setDashState(s => ({ ...s, automationResult: r, activeWorkflow: null })); }} />
            )}
            {dashState.activeWorkflow === 'rich_life' && (
              <RichLifeWorkflow onClose={closeWorkflow}
                onComplete={(r) => { setDashState(s => ({ ...s, richLifeResult: r, activeWorkflow: null })); }} />
            )}
          </div>
        </div>
      )}

      {/* Disclaimer */}
      <div className="results__disclaimer">
        <p>
          <strong>Disclaimer:</strong> This tool is for informational and educational purposes only.
          It does not constitute investment, financial, tax, or legal advice. Tax laws and contribution
          limits change annually. Consult a qualified financial advisor before making investment decisions.
          {taxConfig.tax_year} limits shown.
        </p>
      </div>
    </div>
  );
}
