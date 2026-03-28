import { useCallback, useState } from 'react';
import { CSPBuilder } from './components/CSPBuilder';
import { Dashboard } from './components/Dashboard';
import type { CSPData } from './types';
import { SAMPLE_CSP_DATA, SAMPLE_CSP_DATA_SOLO, SAMPLE_CSP_DATA_OVERBUDGET } from './testData';
import './App.css';

type Phase = 'builder' | 'dashboard';

// Dev mode: add ?dev to the URL to skip builder and load test data
// ?dev           — couple (healthy CSP)
// ?dev=solo      — solo user
// ?dev=overbudget — couple with fixed costs over 70%
const params = new URLSearchParams(window.location.search);
const DEV_MODE = params.has('dev');
const DEV_VARIANT = params.get('dev') || 'couple';

function getDevData(): CSPData {
  switch (DEV_VARIANT) {
    case 'solo': return SAMPLE_CSP_DATA_SOLO;
    case 'overbudget': return SAMPLE_CSP_DATA_OVERBUDGET;
    default: return SAMPLE_CSP_DATA;
  }
}

function App() {
  const [phase, setPhase] = useState<Phase>(DEV_MODE ? 'dashboard' : 'builder');
  const [cspData, setCSPData] = useState<CSPData | null>(DEV_MODE ? getDevData() : null);

  const handleComplete = useCallback((data: CSPData) => {
    setCSPData(data);
    setPhase('dashboard');
    window.location.hash = '#dashboard';
  }, []);

  const handleEditCSP = useCallback(() => {
    setPhase('builder');
    window.location.hash = '#welcome';
  }, []);

  return (
    <div className="app">
      <header className="app__header">
        <img
          src="https://www.iwillteachyoutoberich.com/wp-content/uploads/2025/03/iwt-logo.svg"
          alt="I Will Teach You To Be Rich"
          className="app__logo-img"
        />
        <span className="app__tagline">Conscious Spending Plan</span>
        {DEV_MODE && (
          <span style={{ fontSize: '0.7rem', background: '#FB4D30', color: 'white', padding: '2px 8px', borderRadius: '3px', fontWeight: 600 }}>
            DEV: {DEV_VARIANT}
          </span>
        )}
      </header>

      {phase === 'builder' && (
        <CSPBuilder onComplete={handleComplete} />
      )}

      {phase === 'dashboard' && cspData && (
        <Dashboard cspData={cspData} onEditCSP={handleEditCSP} onUpdateCSP={setCSPData} />
      )}

      <footer className="app__footer">
        <p>
          Based on the methodology from <em>I Will Teach You to Be Rich</em> by Ramit Sethi.
          This tool is for educational purposes only and does not constitute financial advice.
        </p>
        <p className="app__footer-disclaimer">
          This project is <strong>not affiliated with, endorsed by, or associated with
          Ramit Sethi or IWT Media</strong> in any way. This is an independent, free,
          open-source tool. The complete{' '}
          <a href="https://github.com/dtmirizzi/iwt-interactive" target="_blank" rel="noopener noreferrer">
            source code is available on GitHub
          </a>{' '}
          for anyone to use, modify, or contribute to.
        </p>
      </footer>
    </div>
  );
}

export default App;
