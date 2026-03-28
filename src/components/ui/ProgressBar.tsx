interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
  sectionLabel: string;
  progressPct: number;
}

export function ProgressBar({ currentStep, totalSteps, sectionLabel, progressPct }: ProgressBarProps) {
  return (
    <div className="progress-bar">
      <div className="progress-bar__header">
        <span className="progress-bar__section">{sectionLabel}</span>
        <span className="progress-bar__count">
          Step {currentStep} of {totalSteps}
        </span>
      </div>
      <div className="progress-bar__track">
        <div
          className="progress-bar__fill"
          style={{ width: `${progressPct}%` }}
        />
      </div>
    </div>
  );
}
