import React, { useEffect, useRef, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Gift, AlertTriangle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { KIND_TEXT, allowanceList, isQuotaOut, quotaLine } from '../../utils/freeAllowance';
import './freeAllowance.css';

// Jis kism ka counter chahiye (workspace ki kism ho to hi)
export function useFreeQuota(kind) {
  const { freeAllowance } = useApp();
  return freeAllowance?.[kind] || null;
}

// Button + popover (sab counters). Header pill aur Add-button chip dono isi se.
function AllowancePopover({ className, wrap, title, children }) {
  const { freeAllowance, workspace } = useApp();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const list = allowanceList(freeAllowance, workspace);

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (!list.length) return null;
  const anyOut = list.some(isQuotaOut);
  return (
    <div className={`fa-pop-wrap ${wrap}`} ref={ref}>
      <button
        type="button"
        className={className}
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((v) => !v)}
        title={title}
      >
        {children}
      </button>
      {open && (
        <div className="fa-pop" role="dialog" aria-label="Free allowance">
          <p className="fa-pop-title">Free allowance</p>
          <p className="fa-pop-sub">Every account gets some free. Each count is separate and never resets.</p>
          {list.map((q) => <AllowanceRow key={q.kind} q={q} />)}
          {anyOut && (
            <p className="fa-pop-foot">
              Need more? <NavLink to="/help" onClick={() => setOpen(false)}>Contact CMP</NavLink> to add more.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/* ───────── Header pill: "3 listings · 1 RTO free" (sirf chauri screens par — CSS) ───────── */
export function FreeAllowancePill() {
  const { freeAllowance, workspace } = useApp();
  const list = allowanceList(freeAllowance, workspace);
  if (!list.length) return null;
  const anyOut = list.some(isQuotaOut);
  const summary = list.map((q) => `${q.remaining} ${KIND_TEXT[q.kind]?.short || q.label}`).join(' · ');
  return (
    <AllowancePopover wrap="fa-pill-wrap" className={`fa-pill${anyOut ? ' out' : ''}`} title={list.map(quotaLine).join('\n')}>
      {anyOut ? <AlertTriangle size={15} /> : <Gift size={15} />}
      <span className="fa-pill-text">{summary}</span>
      <span className="fa-pill-free">free</span>
    </AllowancePopover>
  );
}

function AllowanceRow({ q }) {
  const t = KIND_TEXT[q.kind] || {};
  const out = isQuotaOut(q);
  const pct = q.allowance ? Math.min(100, Math.round((q.used / q.allowance) * 100)) : 100;
  return (
    <div className="fa-row">
      <div className="fa-row-head">
        <strong>{t.many ? t.many.charAt(0).toUpperCase() + t.many.slice(1) : q.label}</strong>
        <span className={out ? 'fa-out' : 'fa-left'}>
          {q.allowance ? `${q.remaining} of ${q.allowance} left` : 'None free'}
        </span>
      </div>
      <div className="fa-bar" aria-hidden="true">
        <span style={{ width: `${pct}%` }} className={out ? 'out' : pct >= 80 ? 'low' : ''} />
      </div>
      <p className="fa-row-note">{q.enforced ? t.spends : 'No limit right now — nothing will be blocked.'}</p>
    </div>
  );
}

/* ───────── Small chip beside an Add button (click = poora counter) ───────── */
export function FreeAllowanceChip({ kind }) {
  const q = useFreeQuota(kind);
  if (!q || !q.enforced) return null;
  const t = KIND_TEXT[kind] || {};
  const out = isQuotaOut(q);
  return (
    <AllowancePopover
      wrap="fa-chip-wrap"
      className={`fa-chip${out ? ' out' : q.remaining <= 1 ? ' low' : ''}`}
      title={out ? t.out : t.spends}
    >
      {out ? <AlertTriangle size={13} /> : <Gift size={13} />}
      {out ? `No free ${t.short || q.label} left` : `${q.remaining} of ${q.allowance} free left`}
    </AllowancePopover>
  );
}

/* ───────── Note at the top of an Add screen ───────── */
// `lead` — out hone par pehli bold line ke aage (e.g. "Checklist complete, but this stays a draft.")
// `onlyWhenOut` — sirf khatam hone par dikhao (edit screens)
export function FreeAllowanceNote({ kind, style, lead, onlyWhenOut = false }) {
  const q = useFreeQuota(kind);
  if (!q || !q.enforced) return null;
  const t = KIND_TEXT[kind] || {};
  const out = isQuotaOut(q);
  if (onlyWhenOut && !out) return null;
  if (out) {
    return (
      <div className="fa-note out" role="status" style={style}>
        <AlertTriangle size={17} className="fa-note-icon" />
        <div>
          {lead && <><strong>{lead}</strong>{' '}</>}
          <strong>All {q.allowance} free {q.allowance === 1 ? t.one : t.many} are used.</strong>{' '}
          {t.out} <NavLink to="/help">Contact CMP</NavLink> to add more.
        </div>
      </div>
    );
  }
  return (
    <div className={`fa-note${q.remaining <= 1 ? ' low' : ''}`} role="status" style={style}>
      <Gift size={17} className="fa-note-icon" />
      <div>
        <strong>{quotaLine(q)}.</strong> {t.spends}
      </div>
    </div>
  );
}
