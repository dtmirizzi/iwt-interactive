import { StepLayout } from '../ui/StepLayout';
import type { StepMeta } from '../../machines/cspBuilderMachine';
import type { CSPData, CurrentInvestment, InvestmentAccountType } from '../../types';
import { INVESTMENT_ACCOUNT_TYPES, isRetirementAccount } from '../../types';
import { formatCurrency } from '../../utils/csp';

interface CurrentInvestmentsStepProps {
  meta: StepMeta | null;
  cspData: CSPData;
  onUpdate: (data: Partial<CSPData>) => void;
  onNext: () => void;
  onBack: () => void;
}

function uid() { return `inv-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`; }

export function CurrentInvestmentsStep({ meta, cspData, onUpdate, onNext, onBack }: CurrentInvestmentsStepProps) {
  const investments = cspData.current_investments;
  const userName = cspData.user_name || 'You';
  const partnerName = cspData.partner_name || 'Partner';

  const update = (id: string, field: keyof CurrentInvestment, value: unknown) =>
    onUpdate({ current_investments: investments.map(inv => inv.id === id ? { ...inv, [field]: value } : inv) });

  const add = (owner: 'individual' | 'partner') =>
    onUpdate({ current_investments: [...investments, { id: uid(), account_type: '401k_traditional' as InvestmentAccountType, label: '', monthly_contribution: 0, current_balance: 0, owner }] });

  const remove = (id: string) =>
    onUpdate({ current_investments: investments.filter(inv => inv.id !== id) });

  const myInv = investments.filter(i => i.owner === 'individual');
  const partnerInv = investments.filter(i => i.owner === 'partner');
  const totalMonthly = investments.reduce((s, i) => s + i.monthly_contribution, 0);
  const netMonthly = cspData.net_monthly_income + (cspData.partner_net_monthly ?? 0);
  const pct = netMonthly > 0 ? totalMonthly / netMonthly : 0;

  const hasAccountsFromNetWorth = investments.length > 0;

  const stepMeta = meta ? {
    ...meta,
    subtitle: hasAccountsFromNetWorth
      ? 'You added these accounts in the previous step. Now tell us how much you contribute to each per month.'
      : 'What investment accounts are you currently contributing to each month?',
  } : meta;

  function InvestmentRow({ inv, showFull }: { inv: CurrentInvestment; showFull: boolean }) {
    const typeLabel = INVESTMENT_ACCOUNT_TYPES.find(t => t.value === inv.account_type)?.label ?? inv.account_type;
    const isRetirement = isRetirementAccount(inv.account_type);

    return (
      <div className="child-card" style={{ marginBottom: '10px' }}>
        <div className="child-card__header">
          {showFull ? (
            <input type="text" value={inv.label} onChange={(e) => update(inv.id, 'label', e.target.value)} placeholder="e.g., Fidelity 401(k)" style={{ border: 'none', background: 'transparent', fontWeight: 600, fontSize: '0.9rem', width: '100%' }} />
          ) : (
            <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>
              {inv.label || typeLabel}
              <span style={{ fontSize: '0.75rem', color: '#666', marginLeft: '8px' }}>
                {isRetirement ? 'Retirement' : 'Non-Retirement'} | Balance: {formatCurrency(inv.current_balance)}
              </span>
            </span>
          )}
          {showFull && (
            <button type="button" className="fixed-costs__remove" onClick={() => remove(inv.id)}>&times;</button>
          )}
        </div>
        <div className="child-card__fields">
          {showFull && (
            <>
              <div className="form__field">
                <label>Account Type</label>
                <select value={inv.account_type} onChange={(e) => update(inv.id, 'account_type', e.target.value as InvestmentAccountType)}>
                  {INVESTMENT_ACCOUNT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div className="form__field">
                <label>Current Balance</label>
                <div className="form__input-group">
                  <span className="form__prefix">$</span>
                  <input type="number" min="0" value={inv.current_balance || ''} onChange={(e) => update(inv.id, 'current_balance', Number(e.target.value))} placeholder="0" />
                </div>
              </div>
            </>
          )}
          <div className="form__field">
            <label>Monthly Contribution</label>
            <div className="form__input-group">
              <span className="form__prefix">$</span>
              <input type="number" min="0" value={inv.monthly_contribution || ''} onChange={(e) => update(inv.id, 'monthly_contribution', Number(e.target.value))} placeholder="0" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <StepLayout meta={stepMeta} onNext={onNext} onBack={onBack} canGoBack>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '12px' }}>{userName}'s Accounts</h3>
          {myInv.length > 0
            ? myInv.map(inv => <InvestmentRow key={inv.id} inv={inv} showFull={!hasAccountsFromNetWorth} />)
            : <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: '8px' }}>No accounts added yet.</p>
          }
          <button type="button" className="fixed-costs__add" onClick={() => add('individual')}>+ Add {userName}'s account</button>
        </div>

        {cspData.has_partner && (
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '12px' }}>{partnerName}'s Accounts</h3>
            {partnerInv.length > 0
              ? partnerInv.map(inv => <InvestmentRow key={inv.id} inv={inv} showFull={!hasAccountsFromNetWorth} />)
              : <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: '8px' }}>No accounts added yet.</p>
            }
            <button type="button" className="fixed-costs__add" onClick={() => add('partner')}>+ Add {partnerName}'s account</button>
          </div>
        )}

        {investments.length > 0 && (
          <div className="fixed-costs__total">
            <div>
              <span>Total Monthly Investing</span>
              <div className="fixed-costs__buffer">
                {investments.length} account{investments.length !== 1 ? 's' : ''}
              </div>
              {netMonthly > 0 && <div className="fixed-costs__buffer">{Math.round(pct * 100)}% of take-home (target: 10%+)</div>}
            </div>
            <span className="fixed-costs__total-amount">{formatCurrency(totalMonthly)}/mo</span>
          </div>
        )}

        {investments.length === 0 && (
          <div className="form__callout">
            <p>Not investing yet? That is okay. Add any accounts you contribute to, or continue and we will factor that into your dashboard.</p>
          </div>
        )}
      </div>
    </StepLayout>
  );
}
