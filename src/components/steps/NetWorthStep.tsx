import { StepLayout } from '../ui/StepLayout';
import type { StepMeta } from '../../machines/cspBuilderMachine';
import type { AssetCategory, AssetItem, CSPData, CurrentInvestment, DebtCategory, DebtItem, InvestmentAccountType } from '../../types';
import { ASSET_CATEGORIES, DEBT_CATEGORIES, INVESTMENT_ACCOUNT_TYPES, isRetirementAccount } from '../../types';
import { formatCurrency } from '../../utils/csp';

interface NetWorthStepProps {
  meta: StepMeta | null;
  cspData: CSPData;
  onUpdate: (data: Partial<CSPData>) => void;
  onNext: () => void;
  onBack: () => void;
}

function uid() { return `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`; }

function CurrencyField({ label, hint, value, onChange }: { label: string; hint?: string; value: number | undefined; onChange: (v: number) => void }) {
  return (
    <div className="form__field" style={{ marginBottom: '10px' }}>
      <label>{label}</label>
      {hint && <p className="form__hint">{hint}</p>}
      <div className="form__input-group">
        <span className="form__prefix">$</span>
        <input type="number" min="0" value={value || ''} onChange={(e) => onChange(Number(e.target.value))} placeholder="0" />
      </div>
    </div>
  );
}

export function NetWorthStep({ meta, cspData, onUpdate, onNext, onBack }: NetWorthStepProps) {
  const u = cspData.user_name || 'You';
  const p = cspData.partner_name || 'Partner';
  const hasP = cspData.has_partner;

  // ── Assets ────────────────────────────────────────────
  const addAsset = () => onUpdate({ assets: [...cspData.assets, { id: `asset-${uid()}`, category: 'real_estate' as AssetCategory, label: '', value: 0, owner: 'individual' }] });
  const updateAsset = (id: string, field: keyof AssetItem, value: unknown) => onUpdate({ assets: cspData.assets.map(a => a.id === id ? { ...a, [field]: value } : a) });
  const removeAsset = (id: string) => onUpdate({ assets: cspData.assets.filter(a => a.id !== id) });

  // ── Investment Accounts ───────────────────────────────
  const addInvestment = (owner: 'individual' | 'partner') => onUpdate({
    current_investments: [...cspData.current_investments, { id: `inv-${uid()}`, account_type: '401k_traditional' as InvestmentAccountType, label: '', monthly_contribution: 0, current_balance: 0, owner }],
  });
  const updateInvestment = (id: string, field: keyof CurrentInvestment, value: unknown) => onUpdate({
    current_investments: cspData.current_investments.map(i => i.id === id ? { ...i, [field]: value } : i),
  });
  const removeInvestment = (id: string) => onUpdate({
    current_investments: cspData.current_investments.filter(i => i.id !== id),
  });

  // ── Debts ─────────────────────────────────────────────
  const addDebt = () => onUpdate({ debts: [...cspData.debts, { id: `debt-${uid()}`, name: '', category: 'credit_card' as DebtCategory, balance: 0, apr: 0, minimum_payment: 0 }] });
  const updateDebt = (id: string, field: keyof DebtItem, value: unknown) => onUpdate({ debts: cspData.debts.map(d => d.id === id ? { ...d, [field]: value } : d) });
  const removeDebt = (id: string) => onUpdate({ debts: cspData.debts.filter(d => d.id !== id) });

  // ── Totals ────────────────────────────────────────────
  const totalAssets = cspData.assets.reduce((s, a) => s + a.value, 0);
  const totalSavings = cspData.cash_savings + (cspData.partner_cash_savings ?? 0);
  const retirementAccounts = cspData.current_investments.filter(i => isRetirementAccount(i.account_type));
  const nonRetirementAccounts = cspData.current_investments.filter(i => !isRetirementAccount(i.account_type));
  const totalRetirement = retirementAccounts.reduce((s, i) => s + i.current_balance, 0);
  const totalNonRetirement = nonRetirementAccounts.reduce((s, i) => s + i.current_balance, 0);
  const totalDebt = cspData.debts.reduce((s, d) => s + d.balance, 0);
  const netWorth = totalAssets + totalNonRetirement + totalRetirement + totalSavings - totalDebt;

  const myInvestments = cspData.current_investments.filter(i => i.owner === 'individual');
  const partnerInvestments = cspData.current_investments.filter(i => i.owner === 'partner');

  return (
    <StepLayout meta={meta} onNext={onNext} onBack={onBack} canGoBack>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>

        {/* ── 1. Assets ──────────────────────────────── */}
        <section>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '6px' }}>Assets</h3>
          <p className="form__hint" style={{ marginBottom: '12px' }}>
            Current value of car, home, property, business equity.
          </p>
          {cspData.assets.map((asset) => (
            <div key={asset.id} className="child-card" style={{ marginBottom: '10px' }}>
              <div className="child-card__header">
                <input type="text" value={asset.label} onChange={(e) => updateAsset(asset.id, 'label', e.target.value)} placeholder={ASSET_CATEGORIES.find(c => c.value === asset.category)?.hint ?? 'Description'} style={{ border: 'none', background: 'transparent', fontWeight: 600, fontSize: '0.9rem', width: '100%' }} />
                <button type="button" className="fixed-costs__remove" onClick={() => removeAsset(asset.id)}>&times;</button>
              </div>
              <div className="child-card__fields">
                <div className="form__field">
                  <label>Category</label>
                  <select value={asset.category} onChange={(e) => updateAsset(asset.id, 'category', e.target.value as AssetCategory)}>
                    {ASSET_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
                <div className="form__field">
                  <label>Current Value</label>
                  <div className="form__input-group">
                    <span className="form__prefix">$</span>
                    <input type="number" min="0" value={asset.value || ''} onChange={(e) => updateAsset(asset.id, 'value', Number(e.target.value))} placeholder="0" />
                  </div>
                </div>
                {hasP && (
                  <div className="form__field">
                    <label>Owner</label>
                    <select value={asset.owner} onChange={(e) => updateAsset(asset.id, 'owner', e.target.value)}>
                      <option value="individual">{u}</option><option value="partner">{p}</option><option value="shared">Shared</option>
                    </select>
                  </div>
                )}
              </div>
            </div>
          ))}
          <button type="button" className="fixed-costs__add" onClick={addAsset}>+ Add an asset</button>
        </section>

        {/* ── 2. Investment Accounts (Balances) ──────── */}
        <section>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '6px' }}>Investment & Retirement Accounts</h3>
          <p className="form__hint" style={{ marginBottom: '12px' }}>
            Add each account with its current balance. We will ask about monthly contributions in the next step.
          </p>

          <div style={{ marginBottom: '12px' }}>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '8px' }}>{u}'s Accounts</h4>
            {myInvestments.map((inv) => (
              <div key={inv.id} className="child-card" style={{ marginBottom: '8px' }}>
                <div className="child-card__header">
                  <input type="text" value={inv.label} onChange={(e) => updateInvestment(inv.id, 'label', e.target.value)} placeholder="e.g., Fidelity 401(k), Vanguard Roth IRA" style={{ border: 'none', background: 'transparent', fontWeight: 600, fontSize: '0.9rem', width: '100%' }} />
                  <button type="button" className="fixed-costs__remove" onClick={() => removeInvestment(inv.id)}>&times;</button>
                </div>
                <div className="child-card__fields">
                  <div className="form__field">
                    <label>Account Type</label>
                    <select value={inv.account_type} onChange={(e) => updateInvestment(inv.id, 'account_type', e.target.value as InvestmentAccountType)}>
                      {INVESTMENT_ACCOUNT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </div>
                  <div className="form__field">
                    <label>Current Balance</label>
                    <div className="form__input-group">
                      <span className="form__prefix">$</span>
                      <input type="number" min="0" value={inv.current_balance || ''} onChange={(e) => updateInvestment(inv.id, 'current_balance', Number(e.target.value))} placeholder="0" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
            <button type="button" className="fixed-costs__add" onClick={() => addInvestment('individual')}>+ Add {u}'s account</button>
          </div>

          {hasP && (
            <div>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '8px' }}>{p}'s Accounts</h4>
              {partnerInvestments.map((inv) => (
                <div key={inv.id} className="child-card" style={{ marginBottom: '8px' }}>
                  <div className="child-card__header">
                    <input type="text" value={inv.label} onChange={(e) => updateInvestment(inv.id, 'label', e.target.value)} placeholder="e.g., Schwab Brokerage" style={{ border: 'none', background: 'transparent', fontWeight: 600, fontSize: '0.9rem', width: '100%' }} />
                    <button type="button" className="fixed-costs__remove" onClick={() => removeInvestment(inv.id)}>&times;</button>
                  </div>
                  <div className="child-card__fields">
                    <div className="form__field">
                      <label>Account Type</label>
                      <select value={inv.account_type} onChange={(e) => updateInvestment(inv.id, 'account_type', e.target.value as InvestmentAccountType)}>
                        {INVESTMENT_ACCOUNT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                      </select>
                    </div>
                    <div className="form__field">
                      <label>Current Balance</label>
                      <div className="form__input-group">
                        <span className="form__prefix">$</span>
                        <input type="number" min="0" value={inv.current_balance || ''} onChange={(e) => updateInvestment(inv.id, 'current_balance', Number(e.target.value))} placeholder="0" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              <button type="button" className="fixed-costs__add" onClick={() => addInvestment('partner')}>+ Add {p}'s account</button>
            </div>
          )}
        </section>

        {/* ── 3. Savings (Cash & Checking) ────────── */}
        <section>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '6px' }}>Savings</h3>
          <p className="form__hint" style={{ marginBottom: '12px' }}>
            Total across all checking, savings, and money market accounts.
          </p>
          <CurrencyField label={`${u}'s Cash & Checking`} value={cspData.cash_savings} onChange={(v) => onUpdate({ cash_savings: v })} />
          {hasP && <CurrencyField label={`${p}'s Cash & Checking`} value={cspData.partner_cash_savings} onChange={(v) => onUpdate({ partner_cash_savings: v })} />}
        </section>

        {/* ── 4. Debt ────────────────────────────── */}
        <section>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '6px' }}>Debt</h3>
          <p className="form__hint" style={{ marginBottom: '12px' }}>
            Student loans, credit card debt, mortgage, auto loans, medical, BNPL.
          </p>
          {cspData.debts.map((debt, idx) => (
            <div key={debt.id} className="child-card" style={{ marginBottom: '10px' }}>
              <div className="child-card__header">
                <span className="child-card__name">Debt #{idx + 1}</span>
                <button type="button" className="fixed-costs__remove" onClick={() => removeDebt(debt.id)}>&times;</button>
              </div>
              <div className="child-card__fields">
                <div className="form__field">
                  <label>Type</label>
                  <select value={debt.category} onChange={(e) => { updateDebt(debt.id, 'category', e.target.value as DebtCategory); if (!debt.name) updateDebt(debt.id, 'name', DEBT_CATEGORIES.find(c => c.value === e.target.value)?.label ?? ''); }}>
                    {DEBT_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label} ({c.typical_apr} APR)</option>)}
                  </select>
                </div>
                <div className="form__field">
                  <label>Name</label>
                  <input type="text" value={debt.name} onChange={(e) => updateDebt(debt.id, 'name', e.target.value)} placeholder="e.g., Chase Sapphire" />
                </div>
                <div className="form__field">
                  <label>Balance</label>
                  <div className="form__input-group">
                    <span className="form__prefix">$</span>
                    <input type="number" min="0" value={debt.balance || ''} onChange={(e) => updateDebt(debt.id, 'balance', Number(e.target.value))} placeholder="0" />
                  </div>
                </div>
                <div className="form__field">
                  <label>APR (%)</label>
                  <div className="form__input-group">
                    <input type="number" step="0.01" min="0" max="100" value={debt.apr ? (debt.apr * 100).toFixed(2) : ''} onChange={(e) => updateDebt(debt.id, 'apr', Number(e.target.value) / 100)} placeholder="0.00" />
                    <span className="form__prefix">%</span>
                  </div>
                  {debt.apr >= 0.06 && debt.balance > 0 && <p style={{ fontSize: '0.75rem', color: '#E65100', fontWeight: 500, marginTop: '4px' }}>Above 6% APR</p>}
                </div>
                <div className="form__field">
                  <label>Minimum Monthly Payment</label>
                  <div className="form__input-group">
                    <span className="form__prefix">$</span>
                    <input type="number" min="0" value={debt.minimum_payment || ''} onChange={(e) => updateDebt(debt.id, 'minimum_payment', Number(e.target.value))} placeholder="0" />
                  </div>
                </div>
              </div>
            </div>
          ))}
          <button type="button" className="fixed-costs__add" onClick={addDebt}>+ Add a debt</button>
        </section>

        {/* ── Net Worth Summary ───────────────────── */}
        <div style={{ background: '#FAF6F0', padding: '20px', borderRadius: '8px', border: '1px solid #EDE6DA' }}>
          <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', color: '#666', fontWeight: 600, marginBottom: '12px' }}>
            Net Worth
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.9rem' }}>
            {totalAssets > 0 && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Assets</span><span style={{ fontWeight: 600 }}>{formatCurrency(totalAssets)}</span></div>}
            {totalNonRetirement > 0 && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Investments (Non-Retirement)</span><span style={{ fontWeight: 600 }}>{formatCurrency(totalNonRetirement)}</span></div>}
            {totalRetirement > 0 && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Retirement</span><span style={{ fontWeight: 600 }}>{formatCurrency(totalRetirement)}</span></div>}
            {totalSavings > 0 && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Savings</span><span style={{ fontWeight: 600 }}>{formatCurrency(totalSavings)}</span></div>}
            {totalDebt > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', color: '#C62828' }}><span>Debt</span><span style={{ fontWeight: 600 }}>-{formatCurrency(totalDebt)}</span></div>}
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px solid #EDE6DA', paddingTop: '8px', marginTop: '4px' }}>
              <span style={{ fontWeight: 700 }}>Total Net Worth</span>
              <span style={{ fontWeight: 700, fontSize: '1.2rem', color: netWorth >= 0 ? '#2E7D32' : '#C62828', fontFamily: 'var(--font-mono)' }}>
                {netWorth < 0 ? '-' : ''}{formatCurrency(Math.abs(netWorth))}
              </span>
            </div>
          </div>
        </div>
      </div>
    </StepLayout>
  );
}
