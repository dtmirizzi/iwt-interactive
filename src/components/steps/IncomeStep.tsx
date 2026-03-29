import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { StepLayout } from '../ui/StepLayout';
import type { StepMeta } from '../../machines/cspBuilderMachine';
import type { CSPData } from '../../types';

interface IncomeStepProps {
  meta: StepMeta | null;
  cspData: CSPData;
  onUpdate: (data: Partial<CSPData>) => void;
  onNext: () => void;
  onBack: () => void;
}

type Period = 'monthly' | 'yearly';

interface PersonIncome {
  gross: number;
  net: number;
}

export function IncomeStep({ meta, cspData, onUpdate, onNext, onBack }: IncomeStepProps) {
  const [period, setPeriod] = useState<Period>('monthly');
  const userName = cspData.user_name || 'You';
  const partnerName = cspData.partner_name || 'Partner';
  const divisor = period === 'yearly' ? 12 : 1;

  const userForm = useForm<PersonIncome>({
    defaultValues: {
      gross: (cspData.gross_monthly_income * divisor) || undefined,
      net: (cspData.net_monthly_income * divisor) || undefined,
    },
  });

  const partnerForm = useForm<PersonIncome>({
    defaultValues: {
      gross: ((cspData.partner_gross_monthly ?? 0) * divisor) || undefined,
      net: ((cspData.partner_net_monthly ?? 0) * divisor) || undefined,
    },
  });

  // Reset form values when period toggles
  useEffect(() => {
    const mult = period === 'yearly' ? 12 : 1;
    userForm.reset({
      gross: (cspData.gross_monthly_income * mult) || undefined,
      net: (cspData.net_monthly_income * mult) || undefined,
    });
    partnerForm.reset({
      gross: ((cspData.partner_gross_monthly ?? 0) * mult) || undefined,
      net: ((cspData.partner_net_monthly ?? 0) * mult) || undefined,
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period]);

  const userGross = userForm.watch('gross');
  const userNet = userForm.watch('net');
  const partnerGross = partnerForm.watch('gross');
  const partnerNet = partnerForm.watch('net');

  const userTaxRate = userGross && userNet && userGross > 0 ? ((userGross - userNet) / userGross * 100).toFixed(1) : null;
  const partnerTaxRate = partnerGross && partnerNet && partnerGross > 0 ? ((partnerGross - partnerNet) / partnerGross * 100).toFixed(1) : null;

  const periodLabel = period === 'monthly' ? 'Monthly' : 'Annual';

  // Validate then proceed
  const handleNext = async () => {
    const userValid = await userForm.trigger();
    const partnerValid = cspData.has_partner ? await partnerForm.trigger() : true;
    if (!userValid || !partnerValid) return;

    const uGross = Number(userForm.getValues('gross') ?? 0) / divisor;
    const uNet = Number(userForm.getValues('net') ?? 0) / divisor;

    const update: Partial<CSPData> = {
      gross_monthly_income: uGross,
      net_monthly_income: uNet,
    };

    if (cspData.has_partner) {
      const pGross = Number(partnerForm.getValues('gross') ?? 0) / divisor;
      const pNet = Number(partnerForm.getValues('net') ?? 0) / divisor;
      update.partner_gross_monthly = pGross;
      update.partner_net_monthly = pNet;
    }

    onUpdate(update);
    onNext();
  };

  return (
    <StepLayout meta={meta} onNext={handleNext} onBack={onBack} canGoBack>
      <div className="form">
        {/* Period toggle */}
        <div className="form__field">
          <label>Enter income as:</label>
          <div className="choice-cards">
            <button type="button" className={`choice-card choice-card--compact ${period === 'monthly' ? 'choice-card--selected' : ''}`} onClick={() => setPeriod('monthly')}>Monthly</button>
            <button type="button" className={`choice-card choice-card--compact ${period === 'yearly' ? 'choice-card--selected' : ''}`} onClick={() => setPeriod('yearly')}>Yearly</button>
          </div>
        </div>

        {/* User Income */}
        <div style={{ padding: '16px', background: 'var(--color-surface-warm)', borderRadius: '8px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '12px' }}>{userName}'s Income</h3>
          <div className="form__field">
            <label>{periodLabel} Gross Income</label>
            <p className="form__hint">Total income before taxes.{period === 'yearly' ? ' Annual salary.' : ' Check your last pay stub.'}</p>
            <div className="form__input-group">
              <span className="form__prefix">$</span>
              <input type="number" step="1" min="0" {...userForm.register('gross', { required: 'Gross income is required', min: { value: 1, message: 'Must be greater than 0' } })} />
            </div>
            {userForm.formState.errors.gross && <p className="form__error">{userForm.formState.errors.gross.message}</p>}
          </div>
          <div className="form__field" style={{ marginTop: '10px' }}>
            <label>{periodLabel} Net Income (Take-Home)</label>
            <p className="form__hint">Amount that hits your bank account after taxes and deductions.</p>
            <div className="form__input-group">
              <span className="form__prefix">$</span>
              <input type="number" step="1" min="0" {...userForm.register('net', { required: 'Net income is required', min: { value: 1, message: 'Must be greater than 0' } })} />
            </div>
            {userForm.formState.errors.net && <p className="form__error">{userForm.formState.errors.net.message}</p>}
          </div>
          {userTaxRate && (
            <div className="form__callout" style={{ marginTop: '10px' }}>
              <p>Effective tax + deduction rate: <strong>{userTaxRate}%</strong></p>
              {Number(userTaxRate) > 40 && (
                <p className="form__callout-note">High rate. Make sure pre-tax 401k deductions are included -- those are working for you.</p>
              )}
            </div>
          )}
        </div>

        {/* Partner Income */}
        {cspData.has_partner && (
          <div style={{ padding: '16px', background: 'var(--color-surface-warm)', borderRadius: '8px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '12px' }}>{partnerName}'s Income</h3>
            <div className="form__field">
              <label>{periodLabel} Gross Income</label>
              <div className="form__input-group">
                <span className="form__prefix">$</span>
                <input type="number" step="1" min="0" {...partnerForm.register('gross', { required: `${partnerName}'s gross income is required`, min: { value: 1, message: 'Must be greater than 0' } })} />
              </div>
              {partnerForm.formState.errors.gross && <p className="form__error">{partnerForm.formState.errors.gross.message}</p>}
            </div>
            <div className="form__field" style={{ marginTop: '10px' }}>
              <label>{periodLabel} Net Income (Take-Home)</label>
              <div className="form__input-group">
                <span className="form__prefix">$</span>
                <input type="number" step="1" min="0" {...partnerForm.register('net', { required: `${partnerName}'s net income is required`, min: { value: 1, message: 'Must be greater than 0' } })} />
              </div>
              {partnerForm.formState.errors.net && <p className="form__error">{partnerForm.formState.errors.net.message}</p>}
            </div>
            {partnerTaxRate && (
              <div className="form__callout" style={{ marginTop: '10px' }}>
                <p>{partnerName}'s effective tax + deduction rate: <strong>{partnerTaxRate}%</strong></p>
              </div>
            )}
          </div>
        )}
      </div>
    </StepLayout>
  );
}
