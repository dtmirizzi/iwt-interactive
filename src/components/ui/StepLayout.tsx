import type { ReactNode } from 'react';
// StepMeta shape (compatible with both builder and workflow machines)
interface StepMeta {
  title: string;
  subtitle: string;
}

interface StepLayoutProps {
  meta: StepMeta | null;
  children: ReactNode;
  onNext: () => void;
  onBack?: () => void;
  canGoBack: boolean;
  nextLabel?: string;
  nextDisabled?: boolean;
}

export function StepLayout({
  meta,
  children,
  onNext,
  onBack,
  canGoBack,
  nextLabel = 'Continue',
  nextDisabled = false,
}: StepLayoutProps) {
  return (
    <div className="step">
      {meta && (
        <header className="step__header">
          <h1 className="step__title">{meta.title}</h1>
          <p className="step__subtitle">{meta.subtitle}</p>
        </header>
      )}

      <div className="step__content">{children}</div>

      <footer className="step__footer">
        {canGoBack && onBack && (
          <button
            type="button"
            className="btn btn--secondary"
            onClick={onBack}
          >
            Back
          </button>
        )}
        <button
          type="button"
          className="btn btn--primary"
          onClick={onNext}
          disabled={nextDisabled}
        >
          {nextLabel}
        </button>
      </footer>
    </div>
  );
}
