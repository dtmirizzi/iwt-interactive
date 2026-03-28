import { useEffect, useRef } from 'react';

/**
 * Syncs XState state name to the URL hash and handles browser back/forward.
 *
 * On state change: pushes #state-name to history
 * On popstate (browser back/forward): calls back() or next() to match
 */
export function useHashSync(
  currentState: string,
  back: () => void,
  _next: () => void,
) {
  const isPopstateRef = useRef(false);
  const historyStack = useRef<string[]>([]);

  // Push state to hash when machine state changes (but not from popstate)
  useEffect(() => {
    if (isPopstateRef.current) {
      isPopstateRef.current = false;
      return;
    }

    const hash = `#${currentState}`;
    if (window.location.hash !== hash) {
      // Track our own history stack for back detection
      historyStack.current.push(currentState);
      window.history.pushState({ step: currentState }, '', hash);
    }
  }, [currentState]);

  // Listen for browser back/forward
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      const targetStep = event.state?.step || getStepFromHash();

      if (!targetStep) return;

      // Determine direction: if the target is earlier in our stack, go back
      const stackIdx = historyStack.current.lastIndexOf(targetStep);
      if (stackIdx >= 0 && stackIdx < historyStack.current.length - 1) {
        // Going back — trim the stack
        historyStack.current = historyStack.current.slice(0, stackIdx + 1);
        isPopstateRef.current = true;
        back();
      }
      // Forward navigation via browser is harder to support reliably
      // since we need valid data for each step — just update the hash
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [back]);

  // On initial load, set hash to current state if not already set
  useEffect(() => {
    const hashStep = getStepFromHash();
    if (!hashStep) {
      window.history.replaceState({ step: currentState }, '', `#${currentState}`);
    }
    historyStack.current = [currentState];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

function getStepFromHash(): string | null {
  const hash = window.location.hash.slice(1); // remove #
  return hash || null;
}
