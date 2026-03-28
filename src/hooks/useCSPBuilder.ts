import { useMachine } from '@xstate/react';
import { useCallback, useMemo, useRef } from 'react';
import { cspBuilderMachine, SECTION_LABELS, type StepMeta } from '../machines/cspBuilderMachine';
import { getTaxYearConfig } from '../config';
import { calculateCSPBuckets, evaluateBucket } from '../utils/csp';
import { useHashSync } from './useHashSync';
import type { CSPData } from '../types';

export function useCSPBuilder() {
  const [state, send] = useMachine(cspBuilderMachine);

  const cspData = state.context.cspData;
  const currentState = state.value as string;
  const stateRef = useRef(currentState);
  stateRef.current = currentState;

  // Step metadata
  const meta = useMemo(() => {
    const entries = Object.entries(state.getMeta());
    const entry = entries.find(([k]) => k.startsWith('cspBuilder.'));
    return entry ? (entry[1] as StepMeta) : null;
  }, [state]);

  // Tax year config
  const taxConfig = useMemo(
    () => getTaxYearConfig(cspData.tax_year),
    [cspData.tax_year],
  );

  // CSP buckets (uses actual user data)
  const cspBuckets = useMemo(
    () => calculateCSPBuckets(cspData),
    [cspData],
  );

  // CSP health evaluations
  const cspHealth = useMemo(() => {
    if (!cspBuckets) return null;
    return {
      fixed_costs: evaluateBucket('fixed_costs', cspBuckets.fixed_costs.pct),
      investments: evaluateBucket('investments', cspBuckets.investments.pct),
      savings: evaluateBucket('savings', cspBuckets.savings.pct),
      guilt_free: evaluateBucket('guilt_free', cspBuckets.guilt_free.pct),
    };
  }, [cspBuckets]);

  // Progress
  const totalSteps = 6;
  const currentStep = meta?.stepNumber ?? 0;
  const progressPct = Math.round((currentStep / totalSteps) * 100);

  // Section info
  const currentSection = meta?.section ?? 'setup';
  const sectionLabel = SECTION_LABELS[currentSection] ?? '';

  // Navigation
  const next = useCallback(() => send({ type: 'NEXT' }), [send]);
  const back = useCallback(() => send({ type: 'BACK' }), [send]);
  const updateData = useCallback(
    (data: Partial<CSPData>) => send({ type: 'UPDATE_DATA', data }),
    [send],
  );
  const setTaxYear = useCallback(
    (year: number) => send({ type: 'SET_TAX_YEAR', year }),
    [send],
  );

  // Hash sync
  useHashSync(currentState, back, next);

  const canGoBack = currentState !== 'welcome';
  const isComplete = state.status === 'done';

  return {
    state: currentState,
    meta,
    cspData,
    taxConfig,
    cspBuckets,
    cspHealth,
    currentStep,
    totalSteps,
    progressPct,
    currentSection,
    sectionLabel,
    canGoBack,
    isComplete,
    next,
    back,
    updateData,
    setTaxYear,
  };
}
