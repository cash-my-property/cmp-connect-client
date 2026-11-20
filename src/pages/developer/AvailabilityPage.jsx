import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useDeveloper, useLoad, unitTotals, formatAed } from '../../context/DeveloperContext';
import { ProjectStatusBadge, PageHead, LoadState, Notice } from './DeveloperUi';
import { errorMessage } from '../../utils/developerMappers';

const ACTION_DONE = { reserve: 'reserved', sell: 'marked sold', release: 'released' };

export default function AvailabilityPage() {
  const { availability, loadAvailability, moveUnit } = useDeveloper();
  const { loading, error, reload } = useLoad(loadAvailability);
  const [busy, setBusy] = useState('');
  const [notice, setNotice] = useState({ tone: 'danger', text: '' });
  const list = availability?.projects || [];

  const onMove = async (p, u, action) => {
    const key = `${p.id}:${u.id}:${action}`;
    setBusy(key);
    setNotice({ tone: 'danger', text: '' });
    try {
      await moveUnit(p.id, u.id, action);
      setNotice({ tone: 'success', text: `One ${u.label} unit in ${p.name} ${ACTION_DONE[action]}.` });
    } catch (err) {
      // 409: server ka plain-English message as-is
      setNotice({ tone: 'danger', text: errorMessage(err, 'Could not move the unit. Please try again.') });
    } finally {
      setBusy('');
    }
  };

  return (
    <div>
      <PageHead
        title="Availability"
        blurb="What is left in each project, unit type by unit type. Move a unit as the sale moves: reserve it when a buyer pays the booking amount, mark it sold on the sales and purchase agreement."
      />

      <Notice tone={notice.tone} onClose={() => setNotice({ tone: 'danger', text: '' })}>{notice.text}</Notice>

      <LoadState loading={loading && !availability} error={!availability ? error : ''} onRetry={reload}>
        {list.length === 0 ? (
          <section className="card" style={{ padding: 24 }}>
            <p className="muted" style={{ margin: '0 0 12px' }}>None of your projects has unit types yet.</p>
            <NavLink to="/developer/projects" className="btn btn-outline btn-sm">Go to projects</NavLink>
          </section>
        ) : (
          <div style={{ display: 'grid', gap: 18 }}>
            {list.map((p) => {
              const t = unitTotals(p);
              const pct = p.soldPct ?? (t.total ? Math.round((t.sold / t.total) * 100) : 0);
              const soldValue = p.soldValue ?? t.soldValue;
              const locked = p.movesAllowed === false;
              return (
                <section key={p.id} className="card" style={{ padding: 0 }}>
                  <div className="section-head" style={{ flexWrap: 'wrap', gap: 8 }}>
                    <div style={{ minWidth: 0 }}>
                      <h2 style={{ margin: 0 }}>
                        <NavLink to={`/developer/projects/${p.id}`}>{p.name}</NavLink>
                      </h2>
                      <span className="faint" style={{ fontSize: 12.5 }}>
                        {[p.community, `${Math.round(pct)}% sold`, `${formatAed(soldValue)} sold to date`].filter(Boolean).join(' · ')}
                      </span>
                    </div>
                    <ProjectStatusBadge status={p.status} />
                  </div>
                  {locked && (
                    <p className="faint" style={{ margin: 0, padding: '0 20px 10px', fontSize: 12.5 }}>Units can be moved once the project is out of draft.</p>
                  )}
                  <div className="table-scroll">
                    <table className="data">
                      <thead>
                        <tr><th>Unit type</th><th>Size</th><th>From</th><th>Available</th><th>Reserved</th><th>Sold</th><th aria-label="Actions" /></tr>
                      </thead>
                      <tbody>
                        {p.unitTypes.map((u) => {
                          const b = (a) => busy === `${p.id}:${u.id}:${a}`;
                          const anyBusy = busy.startsWith(`${p.id}:${u.id}:`);
                          return (
                            <tr key={u.id}>
                              <td>
                                <strong>{u.label}</strong>
                                <span className="faint" style={{ display: 'block', fontSize: 12 }}>{u.type} · {u.total} units</span>
                              </td>
                              <td>{u.sizeFrom ? `${Number(u.sizeFrom).toLocaleString('en-AE')}–${Number(u.sizeTo || u.sizeFrom).toLocaleString('en-AE')} sqft` : '—'}</td>
                              <td>{formatAed(u.priceFrom)}</td>
                              <td style={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{u.available}</td>
                              <td style={{ fontVariantNumeric: 'tabular-nums' }}>{u.reserved}</td>
                              <td style={{ fontVariantNumeric: 'tabular-nums' }}>{u.sold}</td>
                              <td>
                                <div className="row" style={{ gap: 6, flexWrap: 'nowrap' }}>
                                  <button type="button" className="btn btn-outline btn-sm" disabled={locked || anyBusy || u.available < 1} onClick={() => onMove(p, u, 'reserve')}>{b('reserve') ? '…' : 'Reserve'}</button>
                                  <button type="button" className="btn btn-outline btn-sm" disabled={locked || anyBusy || (u.reserved < 1 && u.available < 1)} onClick={() => onMove(p, u, 'sell')}>{b('sell') ? '…' : 'Mark sold'}</button>
                                  <button type="button" className="btn btn-ghost btn-sm" disabled={locked || anyBusy || u.reserved < 1} onClick={() => onMove(p, u, 'release')}>{b('release') ? '…' : 'Release'}</button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </section>
              );
            })}
            <p className="faint" style={{ margin: 0, fontSize: 12.5 }}>
              “Mark sold” takes a reserved unit first; if none is reserved it sells an available one. “Release” puts a reservation back on sale.
            </p>
          </div>
        )}
      </LoadState>
    </div>
  );
}
