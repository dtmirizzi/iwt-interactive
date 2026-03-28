import { StepLayout } from '../ui/StepLayout';
import type { StepMeta } from '../../machines/cspBuilderMachine';
import type { CSPData } from '../../types';
import { getAvailableTaxYears } from '../../config';

interface WelcomeStepProps {
  meta: StepMeta | null;
  cspData: CSPData;
  onUpdate: (data: Partial<CSPData>) => void;
  onNext: () => void;
  onSetTaxYear: (year: number) => void;
}

export function WelcomeStep({ meta, cspData, onUpdate, onNext, onSetTaxYear }: WelcomeStepProps) {
  const availableYears = getAvailableTaxYears();

  return (
    <StepLayout meta={meta} onNext={onNext} canGoBack={false} nextLabel="Let's Go">
      <div className="welcome">
        <div className="welcome__intro">
          <p>
            This tool builds your <strong>Conscious Spending Plan</strong> — an automated
            system for your money based on Ramit Sethi's methodology from{' '}
            <em>I Will Teach You to Be Rich</em>.
          </p>
          <p>We will walk through 6 quick steps:</p>
          <ul>
            <li><strong>Net Worth</strong> — what you own and what you owe</li>
            <li><strong>Income</strong> — what you earn</li>
            <li><strong>Fixed Costs</strong> — your non-negotiable monthly expenses</li>
            <li><strong>Investments</strong> — what you are currently investing</li>
            <li><strong>Savings Goals</strong> — what you are saving toward</li>
            <li><strong>Your Dashboard</strong> — your complete CSP with optimization tools</li>
          </ul>
        </div>

        {/* Names + Partner */}
        <div className="form" style={{ marginBottom: '24px' }}>
          <div className="form__field">
            <label htmlFor="user-name">Your First Name</label>
            <input
              id="user-name"
              type="text"
              placeholder="e.g., Alex"
              value={cspData.user_name}
              onChange={(e) => onUpdate({ user_name: e.target.value })}
            />
          </div>

          <div className="form__field">
            <label>Are you building this plan solo or with a partner?</label>
            <div className="choice-cards">
              <button
                type="button"
                className={`choice-card choice-card--compact ${!cspData.has_partner ? 'choice-card--selected' : ''}`}
                onClick={() => onUpdate({ has_partner: false })}
              >
                Solo
              </button>
              <button
                type="button"
                className={`choice-card choice-card--compact ${cspData.has_partner ? 'choice-card--selected' : ''}`}
                onClick={() => onUpdate({ has_partner: true })}
              >
                With a Partner
              </button>
            </div>
          </div>

          {cspData.has_partner && (
            <div className="form__field">
              <label htmlFor="partner-name">Partner's First Name</label>
              <input
                id="partner-name"
                type="text"
                placeholder="e.g., Jordan"
                value={cspData.partner_name}
                onChange={(e) => onUpdate({ partner_name: e.target.value })}
              />
            </div>
          )}

          <div className="form__field">
            <label htmlFor="age">Your Age</label>
            <input
              id="age"
              type="number"
              min="18"
              max="100"
              value={cspData.age}
              onChange={(e) => onUpdate({ age: Number(e.target.value) })}
            />
          </div>

          {cspData.has_partner && (
            <div className="form__field">
              <label htmlFor="partner-age">Partner's Age</label>
              <input
                id="partner-age"
                type="number"
                min="18"
                max="100"
                value={cspData.partner_age ?? ''}
                onChange={(e) => onUpdate({ partner_age: Number(e.target.value) })}
              />
            </div>
          )}

          <div className="form__field">
            <label htmlFor="filing-status">Filing Status</label>
            <select
              id="filing-status"
              value={cspData.filing_status}
              onChange={(e) => onUpdate({ filing_status: e.target.value as CSPData['filing_status'] })}
            >
              <option value="single">Single</option>
              <option value="married_joint">Married Filing Jointly</option>
              <option value="married_separate">Married Filing Separately</option>
              <option value="head_of_household">Head of Household</option>
            </select>
          </div>
        </div>

        <div className="welcome__tax-year">
          <label htmlFor="tax-year">Tax Year</label>
          <select
            id="tax-year"
            value={cspData.tax_year}
            onChange={(e) => onSetTaxYear(Number(e.target.value))}
          >
            {availableYears.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <p className="welcome__tax-year-note">
            Contribution limits and thresholds are specific to the selected tax year.
          </p>
        </div>

        <div className="welcome__disclaimer">
          <p>
            <strong>Disclaimer:</strong> This tool is for informational and educational
            purposes only. It does not constitute investment, financial, tax, or legal advice.
            Consult a qualified professional before making financial decisions.
          </p>
        </div>
      </div>
    </StepLayout>
  );
}
