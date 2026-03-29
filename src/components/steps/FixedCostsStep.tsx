import { useEffect } from 'react';
import { StepLayout } from '../ui/StepLayout';
import type { StepMeta } from '../../machines/cspBuilderMachine';
import type { CSPData, FixedCostItem } from '../../types';
import { formatCurrency } from '../../utils/csp';

interface FixedCostsStepProps {
  meta: StepMeta | null;
  cspData: CSPData;
  onUpdate: (data: Partial<CSPData>) => void;
  onNext: () => void;
  onBack: () => void;
}

const DEFAULT_CATEGORIES = [
  { category: 'housing', label: 'Rent / Mortgage' },
  { category: 'utilities', label: 'Utilities (gas, water, electric, internet)' },
  { category: 'insurance', label: 'Insurance (medical, auto, home/renters)' },
  { category: 'transportation', label: 'Transportation / Gas' },
  { category: 'debt', label: 'Debt Payments (minimum)' },
  { category: 'groceries', label: 'Groceries' },
  { category: 'personal', label: 'Clothes / Personal Fun' },
  { category: 'phone', label: 'Phone' },
  { category: 'subscriptions', label: 'Subscriptions (Netflix, gym, etc.)' },
];

function createItem(category: string, label: string, owner: 'individual' | 'partner' | 'shared'): FixedCostItem {
  return { id: `fc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, category, label, amount: 0, owner };
}

function PersonFixedCosts({
  label,
  items,
  onUpdateItem,
  onRemoveItem,
  onAddItem,
}: {
  label: string;
  items: FixedCostItem[];
  onUpdateItem: (id: string, field: keyof FixedCostItem, value: unknown) => void;
  onRemoveItem: (id: string) => void;
  onAddItem: () => void;
}) {
  const subtotal = items.reduce((s, i) => s + i.amount, 0);

  return (
    <div style={{ padding: '16px', background: 'var(--color-surface-warm)', borderRadius: '8px' }}>
      <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '12px' }}>{label}</h3>
      <div className="fixed-costs__list">
        {items.map((item) => (
          <div key={item.id} className="fixed-costs__item">
            <input
              type="text"
              value={item.label}
              onChange={(e) => onUpdateItem(item.id, 'label', e.target.value)}
              placeholder="Expense name"
            />
            <div className="form__input-group">
              <span className="form__prefix">$</span>
              <input
                type="number" min="0"
                value={item.amount || ''}
                onChange={(e) => onUpdateItem(item.id, 'amount', Number(e.target.value))}
                placeholder="0"
              />
            </div>
            <button type="button" className="fixed-costs__remove" onClick={() => onRemoveItem(item.id)}>&times;</button>
          </div>
        ))}
      </div>
      <button type="button" className="fixed-costs__add" onClick={onAddItem}>+ Add expense</button>
      {subtotal > 0 && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px', fontSize: '0.85rem', fontWeight: 600 }}>
          Subtotal: {formatCurrency(subtotal)}
        </div>
      )}
    </div>
  );
}

export function FixedCostsStep({ meta, cspData, onUpdate, onNext, onBack }: FixedCostsStepProps) {
  const items = cspData.fixed_costs;
  const userName = cspData.user_name || 'You';
  const partnerName = cspData.partner_name || 'Partner';

  // Initialize with defaults per person if empty (in useEffect, not during render)
  useEffect(() => {
    if (items.length > 0) return;
    if (cspData.has_partner) {
      const myDefaults = DEFAULT_CATEGORIES.map(c => createItem(c.category, c.label, 'individual'));
      const partnerDefaults = DEFAULT_CATEGORIES.map(c => createItem(c.category, c.label, 'partner'));
      onUpdate({ fixed_costs: [...myDefaults, ...partnerDefaults] });
    } else {
      const defaults = DEFAULT_CATEGORIES.map(c => createItem(c.category, c.label, 'individual'));
      onUpdate({ fixed_costs: defaults });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateItem = (id: string, field: keyof FixedCostItem, value: unknown) =>
    onUpdate({ fixed_costs: items.map(i => i.id === id ? { ...i, [field]: value } : i) });

  const removeItem = (id: string) =>
    onUpdate({ fixed_costs: items.filter(i => i.id !== id) });

  const addItem = (owner: 'individual' | 'partner' | 'shared') =>
    onUpdate({ fixed_costs: [...items, createItem('custom', '', owner)] });

  // Split items
  const myItems = items.filter(i => i.owner === 'individual');
  const partnerItems = items.filter(i => i.owner === 'partner');

  const subtotal = items.reduce((s, i) => s + i.amount, 0);
  const buffer = subtotal * cspData.miscellaneous_buffer_pct;
  const total = subtotal + buffer;
  const netMonthly = cspData.net_monthly_income + (cspData.partner_net_monthly ?? 0);
  const pct = netMonthly > 0 ? total / netMonthly : 0;

  return (
    <StepLayout meta={meta} onNext={onNext} onBack={onBack} canGoBack>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {/* Solo: one list. Couple: separate lists per person */}
        {!cspData.has_partner ? (
          <PersonFixedCosts
            label={`${userName}'s Fixed Costs`}
            items={items}
            onUpdateItem={updateItem}
            onRemoveItem={removeItem}
            onAddItem={() => addItem('individual')}
          />
        ) : (
          <>
            <PersonFixedCosts
              label={`${userName}'s Fixed Costs`}
              items={myItems}
              onUpdateItem={updateItem}
              onRemoveItem={removeItem}
              onAddItem={() => addItem('individual')}
            />
            <PersonFixedCosts
              label={`${partnerName}'s Fixed Costs`}
              items={partnerItems}
              onUpdateItem={updateItem}
              onRemoveItem={removeItem}
              onAddItem={() => addItem('partner')}
            />
          </>
        )}

        {/* Total */}
        <div className="fixed-costs__total">
          <div>
            <span>Total Fixed Costs</span>
            <div className="fixed-costs__buffer">
              Includes {Math.round(cspData.miscellaneous_buffer_pct * 100)}% misc buffer ({formatCurrency(buffer)})
            </div>
          </div>
          <span className="fixed-costs__total-amount">{formatCurrency(total)}/mo</span>
        </div>

        {netMonthly > 0 && (
          <div className="form__callout" style={{
            borderLeftColor: pct <= 0.6 ? '#2E7D32' : pct <= 0.7 ? '#E65100' : '#C62828',
          }}>
            <p>
              <strong>{Math.round(pct * 100)}%</strong> of take-home pay.{' '}
              {pct <= 0.5 && 'Excellent cost control. Well below the 50-60% target.'}
              {pct > 0.5 && pct <= 0.6 && 'Right in the sweet spot of 50-60%.'}
              {pct > 0.6 && pct <= 0.7 && 'Above the 60% target. Look at your top 3 expenses for possible savings.'}
              {pct > 0.7 && 'Over 70% is a red flag. Consider reducing housing or car costs.'}
            </p>
          </div>
        )}
      </div>
    </StepLayout>
  );
}
