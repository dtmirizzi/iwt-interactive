import { useMachine } from '@xstate/react';
import { richLifeMachine } from '../../machines/richLifeMachine';
import type { RichLifeResult } from '../../types';
import { MONEY_DIALS, type MoneyDial } from '../../types';

interface RichLifeWorkflowProps {
  onComplete: (result: RichLifeResult) => void;
  onClose: () => void;
}

const DIAL_DESCRIPTIONS: Record<MoneyDial, string> = {
  'Eating Out / Food': 'Restaurants, cooking, fine dining, food delivery',
  'Travel': 'Vacations, flights, luxury hotels, experiences abroad',
  'Health / Wellness': 'Gym, trainers, massage, wellness retreats',
  'Convenience': 'Rideshares, delivery, cleaning services, time-savers',
  'Experiences': 'Concerts, sports events, festivals, museums',
  'Relationships': 'Dates, family activities, hosting, quality time',
  'Generosity': 'Gifts, charity, treating friends, tipping well',
  'Luxury': 'Designer goods, premium products, first class',
  'Social Status': 'Items or experiences that signal success',
  'Self-Improvement': 'Courses, books, coaching, certifications',
};

const VISION_PROMPTS = [
  { key: 'perfect_tuesday', question: 'In 5 years, what does a perfect Tuesday look like?', placeholder: 'Where are you? What are you doing? Who are you with?' },
  { key: 'no_limits', question: 'What would you do differently if money were no object?', placeholder: 'Think big. No constraints.' },
  { key: 'non_negotiable', question: 'What is one thing you are NOT willing to sacrifice?', placeholder: 'The non-negotiable your financial plan must protect.' },
  { key: 'made_it', question: 'What milestone would make you feel "I made it"?', placeholder: 'A number, an achievement, a feeling...' },
];

export function RichLifeWorkflow({ onComplete, onClose }: RichLifeWorkflowProps) {
  const [state, send] = useMachine(richLifeMachine);
  const ctx = state.context;
  const step = state.value as string;

  const toggleDial = (dial: string) => {
    const current = ctx.money_dials;
    if (current.includes(dial)) {
      send({ type: 'SET_DIALS', dials: current.filter(d => d !== dial) });
    } else if (current.length < 3) {
      send({ type: 'SET_DIALS', dials: [...current, dial] });
    }
  };

  return (
    <div>
      {step === 'money_dials' && (
        <div>
          <p style={{ fontSize: '0.9rem', marginBottom: '8px' }}>Select up to <strong>3 dials</strong> to turn up.</p>
          <p style={{ fontSize: '0.8rem', color: '#FB4D30', fontWeight: 600, marginBottom: '16px' }}>{ctx.money_dials.length}/3 selected</p>
          <div className="dials__grid" style={{ marginBottom: '20px' }}>
            {MONEY_DIALS.map(dial => {
              const isSelected = ctx.money_dials.includes(dial);
              const isDisabled = !isSelected && ctx.money_dials.length >= 3;
              return (
                <button key={dial} type="button" className={`dial-card ${isSelected ? 'dial-card--selected' : ''} ${isDisabled ? 'dial-card--disabled' : ''}`} onClick={() => !isDisabled && toggleDial(dial)} disabled={isDisabled}>
                  <span className="dial-card__name">{dial}</span>
                  <span className="dial-card__desc">{DIAL_DESCRIPTIONS[dial]}</span>
                  {isSelected && <span className="dial-card__check">{'\u2713'}</span>}
                </button>
              );
            })}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <button type="button" className="btn btn--secondary" onClick={onClose}>Cancel</button>
            <button type="button" className="btn btn--primary" onClick={() => send({ type: 'NEXT' })} disabled={ctx.money_dials.length === 0}>Next</button>
          </div>
        </div>
      )}

      {step === 'vision' && (
        <div>
          <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: '20px' }}>
            These do not affect calculations. They exist because the best financial plan serves the life you want.
          </p>
          {VISION_PROMPTS.map(prompt => (
            <div key={prompt.key} className="vision__prompt">
              <label>{prompt.question}</label>
              <textarea
                value={ctx.vision_answers[prompt.key] ?? ''}
                onChange={(e) => send({ type: 'SET_VISION', key: prompt.key, value: e.target.value })}
                placeholder={prompt.placeholder}
              />
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
            <button type="button" className="btn btn--secondary" onClick={() => send({ type: 'BACK' })}>Back</button>
            <button type="button" className="btn btn--primary" onClick={() => send({ type: 'NEXT' })}>See Summary</button>
          </div>
        </div>
      )}

      {step === 'summary' && (
        <div>
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '12px' }}>Your Money Dials</h3>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '16px' }}>
              {ctx.money_dials.map(dial => (
                <span key={dial} style={{ background: '#FDE8E4', color: '#FB4D30', padding: '8px 16px', borderRadius: '20px', fontWeight: 600, fontSize: '0.85rem' }}>{dial}</span>
              ))}
            </div>
            <p style={{ fontSize: '0.85rem', color: '#666' }}>
              Spend extravagantly on these. Cut mercilessly on everything else.
            </p>
          </div>

          {Object.keys(ctx.vision_answers).length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '12px' }}>Your Rich Life Vision</h3>
              {VISION_PROMPTS.filter(p => ctx.vision_answers[p.key]).map(prompt => (
                <div key={prompt.key} style={{ marginBottom: '12px' }}>
                  <p style={{ fontSize: '0.8rem', color: '#666', fontWeight: 600 }}>{prompt.question}</p>
                  <p style={{ fontSize: '0.9rem', fontStyle: 'italic' }}>{ctx.vision_answers[prompt.key]}</p>
                </div>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <button type="button" className="btn btn--secondary" onClick={onClose}>Close</button>
            <button type="button" className="btn btn--primary" onClick={() => onComplete({ money_dials: ctx.money_dials, vision_answers: ctx.vision_answers })}>Save Rich Life</button>
          </div>
        </div>
      )}
    </div>
  );
}
