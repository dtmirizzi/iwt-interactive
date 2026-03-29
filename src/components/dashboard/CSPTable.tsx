import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  type CellContext,
} from '@tanstack/react-table';
import type { CSPData, DashboardState } from '../../types';
import { isRetirementAccount } from '../../types';
import { evaluateBucket, formatCurrency, formatPct, healthColor } from '../../utils/csp';
import { formatMonths } from '../../utils/debt';

// ─── Row model ──────────────────────────────────────────────────────
type RowKind = 'section' | 'item' | 'subtotal' | 'total' | 'warning';

interface EditMapping {
  source: 'fixed_cost' | 'investment' | 'savings_goal' | 'income';
  itemId?: string;
  field: string;
}

interface TableRow {
  id: string;
  kind: RowKind;
  label: string;
  detail?: string;
  myAmount: number;
  partnerAmount: number;
  combinedAmount: number;
  myPct?: number;
  partnerPct?: number;
  combinedPct?: number;
  color?: string;
  warningText?: string;
  // Per-column edit mappings (for merged rows where each column edits a different item)
  editField?: EditMapping;          // used for solo or combined-column edits
  myEditField?: EditMapping;        // Alex's column edit target
  partnerEditField?: EditMapping;   // Jordan's column edit target
}

// ─── Editable cell ──────────────────────────────────────────────────
function EditableAmountCell({ getValue, row, column, table }: CellContext<TableRow, number>) {
  const val = getValue();
  const rowData = row.original;
  const [editing, setEditing] = useState(false);
  const [localVal, setLocalVal] = useState(val);

  useEffect(() => { setLocalVal(val); }, [val]);

  // Determine which edit mapping applies for this column
  const cellEditField = column.id === 'myAmount' ? (rowData.myEditField ?? rowData.editField)
    : column.id === 'partnerAmount' ? (rowData.partnerEditField ?? rowData.editField)
    : rowData.editField;

  if (rowData.kind !== 'item' || !cellEditField) {
    // Non-editable: section headers, subtotals, warnings
    if (rowData.kind === 'section' || rowData.kind === 'warning') return null;
    if (val === 0 && rowData.kind !== 'total') return null;
    return (
      <span className="csp-table__amount" style={rowData.color ? { color: rowData.color } : undefined}>
        {formatCurrency(val)}
        {rowData.kind === 'subtotal' && rowData.myPct !== undefined && column.id === 'myAmount' && (
          <div className="csp-table__pct">{formatPct(rowData.myPct)}</div>
        )}
        {rowData.kind === 'subtotal' && rowData.partnerPct !== undefined && column.id === 'partnerAmount' && (
          <div className="csp-table__pct">{formatPct(rowData.partnerPct)}</div>
        )}
        {rowData.kind === 'subtotal' && rowData.combinedPct !== undefined && column.id === 'combinedAmount' && (
          <div className="csp-table__pct">{formatPct(rowData.combinedPct)}</div>
        )}
      </span>
    );
  }

  // Editable cell
  if (editing) {
    return (
      <input
        type="number"
        min="0"
        value={localVal || ''}
        onChange={(e) => setLocalVal(Number(e.target.value))}
        onBlur={() => {
          setEditing(false);
          if (localVal !== val && cellEditField) {
            (table.options.meta as { updateCell: (edit: EditMapping, value: number) => void })
              .updateCell(cellEditField, localVal);
          }
        }}
        onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
        autoFocus
        style={{ width: '90px', textAlign: 'right', padding: '4px 6px', fontSize: '0.85rem', border: '2px solid #FB4D30', borderRadius: '4px', fontFamily: 'var(--font-mono)' }}
      />
    );
  }

  if (val === 0) {
    return (
      <span
        className="csp-table__amount"
        style={{ color: '#ccc', cursor: 'pointer' }}
        onClick={() => setEditing(true)}
      >
        --
      </span>
    );
  }

  return (
    <span
      className="csp-table__amount"
      style={{ cursor: 'pointer' }}
      onClick={() => setEditing(true)}
      title="Click to edit"
    >
      {formatCurrency(val)}
    </span>
  );
}

// ─── Build rows from CSPData ────────────────────────────────────────
function buildRows(cspData: CSPData, dashState: DashboardState): TableRow[] {
  const hasP = cspData.has_partner;
  const u = cspData.user_name || 'You';
  const p = cspData.partner_name || 'Partner';
  const myNet = cspData.net_monthly_income;
  const pNet = cspData.partner_net_monthly ?? 0;
  const net = myNet + pNet;

  const rows: TableRow[] = [];

  // ── INCOME ────────────────────────────────────
  rows.push({ id: 'sec-income', kind: 'section', label: 'Income', myAmount: 0, partnerAmount: 0, combinedAmount: 0 });
  rows.push({ id: 'income-gross', kind: 'item', label: 'Gross Monthly Income', myAmount: cspData.gross_monthly_income, partnerAmount: cspData.partner_gross_monthly ?? 0, combinedAmount: cspData.gross_monthly_income + (cspData.partner_gross_monthly ?? 0) });
  rows.push({ id: 'income-net', kind: 'subtotal', label: 'Net Monthly Income (take-home)', myAmount: myNet, partnerAmount: pNet, combinedAmount: net });

  // ── FIXED COSTS ───────────────────────────────
  // Fixed costs: user told us who pays what via owner field.
  // individual = Alex pays it. partner = Jordan pays it. shared = household (no person split).
  // Per-person columns show only items assigned to them. Combined = sum of all.
  const fixedItems = cspData.fixed_costs.filter(c => c.amount > 0);

  const myFixedSum = fixedItems.filter(c => c.owner === 'individual').reduce((s, c) => s + c.amount, 0);
  const pFixedSum = fixedItems.filter(c => c.owner === 'partner').reduce((s, c) => s + c.amount, 0);
  const fixedSubtotal = fixedItems.reduce((s, c) => s + c.amount, 0);
  const buffer = fixedSubtotal * cspData.miscellaneous_buffer_pct;
  const fixedTotal = fixedSubtotal + buffer;

  const myFixedPct = myNet > 0 ? myFixedSum / myNet : 0;
  const pFixedPct = pNet > 0 ? pFixedSum / pNet : 0;
  const fixedPct = net > 0 ? fixedTotal / net : 0;
  const fixedHealth = evaluateBucket('fixed_costs', fixedPct);

  rows.push({ id: 'sec-fixed', kind: 'section', label: `Fixed Costs (${formatPct(fixedPct)} of take-home)`, myAmount: 0, partnerAmount: 0, combinedAmount: 0 });

  // Group fixed costs by label to merge rows (e.g., two "Phone" items → one row)
  const fcByLabel = new Map<string, { my: typeof fixedItems; partner: typeof fixedItems; shared: typeof fixedItems }>();
  fixedItems.forEach(c => {
    const key = (c.label || c.category).toLowerCase().trim();
    if (!fcByLabel.has(key)) fcByLabel.set(key, { my: [], partner: [], shared: [] });
    const group = fcByLabel.get(key)!;
    if (c.owner === 'individual') group.my.push(c);
    else if (c.owner === 'partner') group.partner.push(c);
    else group.shared.push(c);
  });

  fcByLabel.forEach((group) => {
    const allItems = [...group.my, ...group.partner, ...group.shared];
    const displayLabel = allItems[0].label || allItems[0].category;
    const myAmt = group.my.reduce((s, c) => s + c.amount, 0);
    const pAmt = group.partner.reduce((s, c) => s + c.amount, 0);
    const combined = allItems.reduce((s, c) => s + c.amount, 0);

    // For edits: if there's exactly one item per column, point to it directly
    const myEdit = group.my.length === 1 ? { source: 'fixed_cost' as const, itemId: group.my[0].id, field: 'amount' } : undefined;
    const pEdit = group.partner.length === 1 ? { source: 'fixed_cost' as const, itemId: group.partner[0].id, field: 'amount' } : undefined;
    const sharedEdit = group.shared.length === 1 ? { source: 'fixed_cost' as const, itemId: group.shared[0].id, field: 'amount' } : undefined;

    rows.push({
      id: `fc-${allItems[0].id}`, kind: 'item', label: displayLabel,
      myAmount: myAmt, partnerAmount: pAmt, combinedAmount: combined,
      editField: allItems.length === 1 ? { source: 'fixed_cost', itemId: allItems[0].id, field: 'amount' } : sharedEdit,
      myEditField: myEdit,
      partnerEditField: pEdit,
    });
  });

  if (buffer > 0) {
    rows.push({ id: 'fc-buffer', kind: 'item', label: `Miscellaneous (${Math.round(cspData.miscellaneous_buffer_pct * 100)}% buffer)`, myAmount: 0, partnerAmount: 0, combinedAmount: buffer });
  }

  rows.push({
    id: 'fc-total', kind: 'subtotal', label: 'Fixed Costs Total',
    myAmount: myFixedSum, partnerAmount: pFixedSum, combinedAmount: fixedTotal,
    color: healthColor(fixedHealth.health),
    myPct: myFixedPct, partnerPct: pFixedPct, combinedPct: fixedPct,
  });

  if (hasP && Math.abs(myFixedPct - pFixedPct) > 0.10) {
    const higher = myFixedPct > pFixedPct ? u : p;
    rows.push({ id: 'fc-warn', kind: 'warning', label: '', myAmount: 0, partnerAmount: 0, combinedAmount: 0, warningText: `${higher} is carrying ${Math.round(Math.abs(myFixedPct - pFixedPct) * 100)}% more of fixed costs relative to their income. Consider rebalancing.` });
  }

  // ── ADDITIONAL DEBT PAYMENTS (if workflow completed) ──
  // Minimums are already in fixed costs. This only shows the extra above minimums.
  if (dashState.debtResult && dashState.debtResult.extra_monthly > 0) {
    const dr = dashState.debtResult;
    rows.push({ id: 'sec-debt', kind: 'section', label: `Additional Debt Payments (${dr.strategy})`, myAmount: 0, partnerAmount: 0, combinedAmount: 0 });
    rows.push({
      id: 'debt-extra', kind: 'item',
      label: 'Extra payment above minimums',
      detail: `Debt-free by ${dr.plan.debt_free_date} | ${formatMonths(dr.plan.total_months)} | saves ${formatCurrency(dr.plan.total_interest)} in interest`,
      myAmount: dr.extra_monthly, partnerAmount: 0, combinedAmount: dr.extra_monthly,
    });
    rows.push({ id: 'debt-total', kind: 'subtotal', label: 'Additional Debt Payments Total', myAmount: dr.extra_monthly, partnerAmount: 0, combinedAmount: dr.extra_monthly, color: '#C62828' });
  }

  // ── INVESTMENTS ───────────────────────────────
  const invActive = cspData.current_investments.filter(i => i.monthly_contribution > 0);
  const myInv = invActive.filter(i => i.owner === 'individual');
  const pInv = invActive.filter(i => i.owner === 'partner');
  const myInvTotal = myInv.reduce((s, i) => s + i.monthly_contribution, 0);
  const pInvTotal = pInv.reduce((s, i) => s + i.monthly_contribution, 0);
  const invTotal = myInvTotal + pInvTotal;
  const invPct = net > 0 ? invTotal / net : 0;
  const myInvPct = myNet > 0 ? myInvTotal / myNet : 0;
  const pInvPct = pNet > 0 ? pInvTotal / pNet : 0;
  const invHealth = evaluateBucket('investments', invPct);

  rows.push({ id: 'sec-inv', kind: 'section', label: `Investments (${formatPct(invPct)} of take-home)`, myAmount: 0, partnerAmount: 0, combinedAmount: 0 });
  myInv.forEach(inv => rows.push({
    id: `inv-${inv.id}`, kind: 'item', label: inv.label || inv.account_type, detail: isRetirementAccount(inv.account_type) ? 'Retirement' : 'Non-Ret',
    myAmount: inv.monthly_contribution, partnerAmount: 0, combinedAmount: inv.monthly_contribution,
    editField: { source: 'investment', itemId: inv.id, field: 'monthly_contribution' },
  }));
  pInv.forEach(inv => rows.push({
    id: `inv-${inv.id}`, kind: 'item', label: inv.label || inv.account_type, detail: isRetirementAccount(inv.account_type) ? 'Retirement' : 'Non-Ret',
    myAmount: 0, partnerAmount: inv.monthly_contribution, combinedAmount: inv.monthly_contribution,
    editField: { source: 'investment', itemId: inv.id, field: 'monthly_contribution' },
  }));
  if (invActive.length === 0) {
    rows.push({ id: 'inv-empty', kind: 'item', label: 'No investment contributions yet', myAmount: 0, partnerAmount: 0, combinedAmount: 0 });
  }
  rows.push({ id: 'inv-total', kind: 'subtotal', label: 'Investments Total', myAmount: myInvTotal, partnerAmount: pInvTotal, combinedAmount: invTotal, color: healthColor(invHealth.health), myPct: myInvPct, partnerPct: pInvPct, combinedPct: invPct });
  if (hasP && Math.abs(myInvPct - pInvPct) > 0.10) {
    const higher = myInvPct > pInvPct ? u : p;
    rows.push({ id: 'inv-warn', kind: 'warning', label: '', myAmount: 0, partnerAmount: 0, combinedAmount: 0, warningText: `${higher} is carrying ${Math.round(Math.abs(myInvPct - pInvPct) * 100)}% more of investments relative to their income.` });
  }

  // ── SAVINGS ───────────────────────────────────
  const activeGoals = cspData.savings_goals.filter(g => g.status === 'active');

  const mySavSum = activeGoals.filter(g => g.owner === 'individual').reduce((s, g) => s + g.monthly_contribution, 0);
  const pSavSum = activeGoals.filter(g => g.owner === 'partner').reduce((s, g) => s + g.monthly_contribution, 0);
  const savTotal = activeGoals.reduce((s, g) => s + g.monthly_contribution, 0);

  const mySavPct = myNet > 0 ? mySavSum / myNet : 0;
  const pSavPct = pNet > 0 ? pSavSum / pNet : 0;
  const savPct = net > 0 ? savTotal / net : 0;
  const savHealth = evaluateBucket('savings', savPct);

  rows.push({ id: 'sec-sav', kind: 'section', label: `Savings Goals (${formatPct(savPct)} of take-home)`, myAmount: 0, partnerAmount: 0, combinedAmount: 0 });

  // Group savings goals by name to merge partner contributions and calculate projections
  const goalsByName = new Map<string, { goals: typeof activeGoals; myTotal: number; pTotal: number; combinedTotal: number; target: number; saved: number; targetDate: string }>();
  activeGoals.forEach(g => {
    const key = g.name.toLowerCase().trim();
    if (!goalsByName.has(key)) {
      goalsByName.set(key, { goals: [], myTotal: 0, pTotal: 0, combinedTotal: 0, target: g.target_amount, saved: 0, targetDate: g.target_date });
    }
    const entry = goalsByName.get(key)!;
    entry.goals.push(g);
    entry.combinedTotal += g.monthly_contribution;
    entry.saved += g.current_amount; // accumulate saved from all contributors
    if (g.owner === 'individual') entry.myTotal += g.monthly_contribution;
    if (g.owner === 'partner') entry.pTotal += g.monthly_contribution;
    if (g.target_amount > entry.target) entry.target = g.target_amount;
    if (g.target_date && (!entry.targetDate || g.target_date < entry.targetDate)) entry.targetDate = g.target_date;
  });

  goalsByName.forEach((entry, _key) => {
    const displayName = entry.goals[0].name;
    const remaining = entry.target - entry.saved;
    const pctFunded = entry.target > 0 ? Math.round(entry.saved / entry.target * 100) : 0;

    // Projection: will they hit the target by the date?
    let projectionDetail = `${pctFunded}% funded`;
    let projectionWarning: string | undefined;

    if (entry.targetDate && entry.combinedTotal > 0 && remaining > 0) {
      const targetDate = new Date(entry.targetDate);
      const now = new Date();
      const monthsLeft = Math.max(0, (targetDate.getFullYear() - now.getFullYear()) * 12 + (targetDate.getMonth() - now.getMonth()));
      const willSave = entry.combinedTotal * monthsLeft;
      const projectedTotal = entry.saved + willSave;
      const onTrack = projectedTotal >= entry.target;

      projectionDetail += ` | by ${entry.targetDate}`;

      if (onTrack) {
        projectionDetail += ` | On track`;
      } else {
        const shortfall = entry.target - projectedTotal;
        const neededMonthly = monthsLeft > 0 ? Math.ceil(remaining / monthsLeft) : remaining;
        projectionWarning = `Short by ${formatCurrency(shortfall)} at current rate. Need ${formatCurrency(neededMonthly)}/mo to hit target (${monthsLeft} months left).`;
      }

    } else if (entry.combinedTotal > 0 && remaining > 0) {
      // No target date — just show months needed
      const monthsNeeded = Math.ceil(remaining / entry.combinedTotal);
      projectionDetail += ` | ${monthsNeeded} months to go`;
    } else if (remaining <= 0) {
      projectionDetail = 'Goal reached!';
    } else if (entry.combinedTotal === 0 && remaining > 0) {
      projectionWarning = 'No monthly contribution set. This goal will not be reached.';
    }

    // Per-column edit fields
    const myGoal = entry.goals.find(g => g.owner === 'individual');
    const pGoal = entry.goals.find(g => g.owner === 'partner');
    const soloGoal = entry.goals.length === 1 ? entry.goals[0] : undefined;

    rows.push({
      id: `sav-${entry.goals[0].id}`, kind: 'item', label: displayName,
      detail: projectionDetail,
      myAmount: entry.myTotal, partnerAmount: entry.pTotal, combinedAmount: entry.combinedTotal,
      editField: soloGoal ? { source: 'savings_goal', itemId: soloGoal.id, field: 'monthly_contribution' } : undefined,
      myEditField: myGoal ? { source: 'savings_goal', itemId: myGoal.id, field: 'monthly_contribution' } : undefined,
      partnerEditField: pGoal ? { source: 'savings_goal', itemId: pGoal.id, field: 'monthly_contribution' } : undefined,
    });

    if (projectionWarning) {
      rows.push({ id: `sav-warn-${entry.goals[0].id}`, kind: 'warning', label: '', myAmount: 0, partnerAmount: 0, combinedAmount: 0, warningText: `${displayName}: ${projectionWarning}` });
    }
  });

  if (activeGoals.length === 0) {
    rows.push({ id: 'sav-empty', kind: 'item', label: 'No active savings goals', myAmount: 0, partnerAmount: 0, combinedAmount: 0 });
  }
  rows.push({
    id: 'sav-total', kind: 'subtotal', label: 'Savings Total',
    myAmount: mySavSum, partnerAmount: pSavSum, combinedAmount: savTotal,
    color: healthColor(savHealth.health), myPct: mySavPct, partnerPct: pSavPct, combinedPct: savPct,
  });

  // ── GUILT-FREE ────────────────────────────────
  // Per-person: their income minus their allocated amounts (including their share of buffer)
  const myBufferShare = fixedSubtotal > 0 ? buffer * (myFixedSum / fixedSubtotal) : 0;
  const pBufferShare = fixedSubtotal > 0 ? buffer * (pFixedSum / fixedSubtotal) : 0;
  const myAllocated = myFixedSum + myBufferShare + myInvTotal + mySavSum;
  const pAllocated = pFixedSum + pBufferShare + pInvTotal + pSavSum;
  const myGuiltFree = Math.max(0, myNet - myAllocated);
  const pGuiltFree = Math.max(0, pNet - pAllocated);
  const guiltFree = Math.max(0, net - fixedTotal - invTotal - savTotal);
  const gfPct = net > 0 ? guiltFree / net : 0;
  const dialStr = dashState.richLifeResult?.money_dials.length ? `Dials: ${dashState.richLifeResult.money_dials.join(', ')}` : undefined;
  rows.push({ id: 'sec-gf', kind: 'section', label: `Guilt-Free Spending (${formatPct(gfPct)} of take-home)`, myAmount: 0, partnerAmount: 0, combinedAmount: 0 });
  rows.push({ id: 'gf-amount', kind: 'item', label: dialStr ? `Yours to spend -- ${dialStr}` : 'Everything left over -- no guilt', myAmount: myGuiltFree, partnerAmount: pGuiltFree, combinedAmount: guiltFree });

  // ── TOTAL ─────────────────────────────────────
  rows.push({ id: 'total-allocated', kind: 'total', label: 'Net Monthly Income', myAmount: myNet, partnerAmount: pNet, combinedAmount: net });

  return rows;
}

// ─── Main component ─────────────────────────────────────────────────
interface CSPTableProps {
  cspData: CSPData;
  dashState: DashboardState;
  onUpdateCSP: (data: CSPData) => void;
}

export function CSPTable({ cspData, dashState, onUpdateCSP }: CSPTableProps) {
  const hasP = cspData.has_partner;
  const userName = cspData.user_name || 'You';
  const partnerName = cspData.partner_name || 'Partner';

  const data = useMemo(() => buildRows(cspData, dashState), [cspData, dashState]);

  const handleCellUpdate = useCallback((edit: EditMapping, value: number) => {
    let updated = { ...cspData };

    if (edit.source === 'fixed_cost' && edit.itemId) {
      updated = { ...updated, fixed_costs: cspData.fixed_costs.map(c => c.id === edit.itemId ? { ...c, amount: value } : c) };
    } else if (edit.source === 'investment' && edit.itemId) {
      updated = { ...updated, current_investments: cspData.current_investments.map(i => i.id === edit.itemId ? { ...i, monthly_contribution: value } : i) };
    } else if (edit.source === 'savings_goal' && edit.itemId) {
      updated = { ...updated, savings_goals: cspData.savings_goals.map(g => g.id === edit.itemId ? { ...g, monthly_contribution: value } : g) };
    }

    onUpdateCSP(updated);
  }, [cspData, onUpdateCSP]);

  const columns = useMemo(() => {
    const ch = createColumnHelper<TableRow>();
    const labelCol = ch.accessor('label', {
      header: 'Item',
      cell: (info) => {
        const row = info.row.original;
        if (!row.detail) return <span>{row.label}</span>;
        return (
          <span className="csp-table__tooltip-wrapper">
            {row.label}
            <span className="csp-table__tooltip-icon">i</span>
            <span className="csp-table__tooltip-content">{row.detail}</span>
          </span>
        );
      },
    });

    if (hasP) {
      return [
        labelCol,
        ch.accessor('myAmount', { header: userName, cell: EditableAmountCell }),
        ch.accessor('partnerAmount', { header: partnerName, cell: EditableAmountCell }),
        ch.accessor('combinedAmount', { header: 'Combined', cell: EditableAmountCell }),
      ];
    }

    return [
      labelCol,
      ch.accessor('combinedAmount', { header: 'Amount/mo', cell: EditableAmountCell }),
    ];
  }, [hasP, userName, partnerName]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    meta: { updateCell: handleCellUpdate },
  });

  const colCount = hasP ? 4 : 2;

  return (
    <table className="csp-table">
      <thead>
        {table.getHeaderGroups().map(hg => (
          <tr key={hg.id}>
            {hg.headers.map(h => (
              <th key={h.id} style={h.index > 0 ? { textAlign: 'right' } : undefined}>
                {flexRender(h.column.columnDef.header, h.getContext())}
              </th>
            ))}
          </tr>
        ))}
      </thead>
      <tbody>
        {table.getRowModel().rows.map(row => {
          const r = row.original;

          if (r.kind === 'section') {
            return (
              <tr key={row.id} className="csp-table__section-header">
                <td colSpan={colCount}>{r.label}</td>
              </tr>
            );
          }

          if (r.kind === 'warning') {
            return (
              <tr key={row.id}>
                <td colSpan={colCount} style={{ background: '#FFF3E0', color: '#E65100', fontSize: '0.8rem', fontWeight: 500, padding: '8px 12px' }}>
                  {r.warningText}
                </td>
              </tr>
            );
          }

          const className = r.kind === 'subtotal' ? 'csp-table__subtotal' : r.kind === 'total' ? 'csp-table__total' : undefined;

          return (
            <tr key={row.id} className={className}>
              {row.getVisibleCells().map(cell => (
                <td key={cell.id} style={cell.column.getIndex() > 0 ? { textAlign: 'right' } : undefined}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
