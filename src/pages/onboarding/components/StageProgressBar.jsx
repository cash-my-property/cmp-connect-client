import React from 'react';

export default function StageProgressBar({ currentStage, onStageClick, percentage = 72, onSignOut }) {
  const stages = [
    { id: 1, label: 'Account' },
    { id: 2, label: 'Details' },
    { id: 3, label: 'Documents' },
    { id: 4, label: 'Check and send' },
    { id: 5, label: 'CMP review' },
    { id: 6, label: 'Live' }
  ];

  // Circumference for r=19.5 is 2 * Math.PI * 19.5 = 122.522
  const r = 19.5;
  const circumference = 2 * Math.PI * r;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const getGaugeColor = () => {
    if (percentage >= 100) return 'var(--cmp-success)';
    if (percentage >= 50) return 'var(--cmp-warning)';
    return 'var(--cmp-brand)';
  };

  return (
    <div className="reg-head">
      <nav className="stage-bar" aria-label="Progress">
        {stages.map((st) => {
          let state = 'next';
          if (st.id < currentStage) state = 'done';
          else if (st.id === currentStage) state = 'now';

          const isClickable = state === 'done' && onStageClick;

          if (isClickable) {
            return (
              <button
                key={st.id}
                type="button"
                className="stage"
                data-state="done"
                onClick={() => onStageClick(st.id)}
              >
                <i>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0 }}>
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </i>
                {st.label}
              </button>
            );
          }

          return (
            <span key={st.id} className="stage" data-state={state}>
              <i>
                {state === 'done' ? (
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0 }}>
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  st.id
                )}
              </i>
              {st.label}
            </span>
          );
        })}
      </nav>

      <span className="row" style={{ gap: 10 }}>
        <span
          role="img"
          aria-label={`${percentage}%`}
          style={{ position: 'relative', display: 'inline-grid', placeItems: 'center', width: 44, height: 44 }}
        >
          <svg width="44" height="44" aria-hidden="true" style={{ transform: 'rotate(-90deg)' }}>
            <circle
              cx="22"
              cy="22"
              r={r}
              fill="none"
              stroke="var(--cmp-border)"
              strokeWidth="5"
            />
            <circle
              cx="22"
              cy="22"
              r={r}
              fill="none"
              stroke={getGaugeColor()}
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray={`${(percentage / 100) * circumference} ${circumference}`}
            />
          </svg>
          <span style={{ position: 'absolute', fontSize: '10.56px', fontWeight: 700 }}>
            {percentage}%
          </span>
        </span>

        <button type="button" className="btn btn-ghost btn-sm" onClick={onSignOut}>
          Sign out
        </button>
      </span>
    </div>
  );
}
