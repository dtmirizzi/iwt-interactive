import { useEffect } from 'react';
import { useCSPBuilder } from '../hooks/useCSPBuilder';
import { ProgressBar } from './ui/ProgressBar';
import { CSPSidebar } from './ui/CSPSidebar';

import { WelcomeStep } from './steps/WelcomeStep';
import { NetWorthStep } from './steps/NetWorthStep';
import { IncomeStep } from './steps/IncomeStep';
import { FixedCostsStep } from './steps/FixedCostsStep';
import { CurrentInvestmentsStep } from './steps/CurrentInvestmentsStep';
import { SavingsGoalsStep } from './steps/SavingsGoalsStep';
import type { CSPData } from '../types';

interface CSPBuilderProps {
  onComplete: (data: CSPData) => void;
}

export function CSPBuilder({ onComplete }: CSPBuilderProps) {
  const machine = useCSPBuilder();

  // When the machine reaches the final state, hand off to dashboard
  useEffect(() => {
    if (machine.isComplete) {
      onComplete(machine.cspData);
    }
  }, [machine.isComplete, machine.cspData, onComplete]);

  // Sidebar data
  const sidebarBuckets = machine.cspBuckets
    ? [
        { label: 'Fixed Costs', amount: machine.cspBuckets.fixed_costs.amount, pct: machine.cspBuckets.fixed_costs.pct, health: machine.cspHealth?.fixed_costs ?? null, target: '50-60%' },
        { label: 'Investments', amount: machine.cspBuckets.investments.amount, pct: machine.cspBuckets.investments.pct, health: machine.cspHealth?.investments ?? null, target: '10%+' },
        { label: 'Savings', amount: machine.cspBuckets.savings.amount, pct: machine.cspBuckets.savings.pct, health: machine.cspHealth?.savings ?? null, target: '5-10%' },
        { label: 'Guilt-Free', amount: machine.cspBuckets.guilt_free.amount, pct: machine.cspBuckets.guilt_free.pct, health: machine.cspHealth?.guilt_free ?? null, target: '20-35%' },
      ]
    : [];

  const showSidebar = machine.currentStep >= 3; // From fixed_costs onward

  function renderStep() {
    switch (machine.state) {
      case 'welcome':
        return (
          <WelcomeStep
            meta={machine.meta}
            cspData={machine.cspData}
            onUpdate={machine.updateData}
            onNext={machine.next}
            onSetTaxYear={machine.setTaxYear}
          />
        );

      case 'net_worth':
        return (
          <NetWorthStep
            meta={machine.meta}
            cspData={machine.cspData}
            onUpdate={machine.updateData}
            onNext={machine.next}
            onBack={machine.back}
          />
        );

      case 'income':
        return (
          <IncomeStep
            meta={machine.meta}
            cspData={machine.cspData}
            onUpdate={machine.updateData}
            onNext={machine.next}
            onBack={machine.back}
          />
        );

      case 'fixed_costs':
        return (
          <FixedCostsStep
            meta={machine.meta}
            cspData={machine.cspData}
            onUpdate={machine.updateData}
            onNext={machine.next}
            onBack={machine.back}
          />
        );

      case 'investments':
        return (
          <CurrentInvestmentsStep
            meta={machine.meta}
            cspData={machine.cspData}
            onUpdate={machine.updateData}
            onNext={machine.next}
            onBack={machine.back}
          />
        );

      case 'savings_goals':
        return (
          <SavingsGoalsStep
            meta={machine.meta}
            cspData={machine.cspData}
            onUpdate={machine.updateData}
            onNext={machine.next}
            onBack={machine.back}
          />
        );

      default:
        return null;
    }
  }

  // Don't render if complete (dashboard takes over)
  if (machine.isComplete) return null;

  return (
    <div className="wizard">
      <ProgressBar
        currentStep={machine.currentStep}
        totalSteps={machine.totalSteps}
        sectionLabel={machine.sectionLabel}
        progressPct={machine.progressPct}
      />
      <div className={`wizard__body ${showSidebar ? 'wizard__body--with-sidebar' : ''}`}>
        <main className="wizard__main">
          {renderStep()}
        </main>
        <CSPSidebar
          netMonthly={machine.cspBuckets?.net_monthly ?? 0}
          buckets={sidebarBuckets}
          visible={showSidebar}
        />
      </div>
    </div>
  );
}
