import React, { useMemo, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Phone, MessageCircle, Download, Mail } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useDeveloper, useLoad, ENQUIRY_STATUS, timeAgo } from '../../context/DeveloperContext';
import { PageHead, LoadState, Notice, fieldStyle } from './DeveloperUi';
import { SearchInput } from '../../components/ui';
import { useDebounce } from '../../hooks';
import { errorMessage } from '../../utils/developerMappers';

const FILTERS = ['ALL', ...Object.keys(ENQUIRY_STATUS)];
const small = { ...fieldStyle, padding: '6px 8px', fontSize: 13, minWidth: 120, height: 36 };

export default function DeveloperEnquiriesPage() {
  const { account } = useApp();
  const {
    isLive, enquiries, enquiryCounts, notPickedUp, loadEnquiries, pickUpEnquiry, updateEnquiry,
    team, loadTeam, projectName, exportCsv
  } = useDeveloper();
  const [filter, setFilter] = useState('ALL');
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState('');
  const [notice, setNotice] = useState({ tone: 'danger', text: '' });
  const debounced = useDebounce(query, 350);

  const { loading, error, reload } = useLoad(
    () => loadEnquiries({ stage: filter === 'ALL' ? undefined : filter, q: debounced.trim() || undefined }),
    [filter, debounced]
  );
  // "Picked up by" dropdown ke liye team (live)
  useLoad(loadTeam);

  // Mock: "Pick up" owner ke naam pe; live: server logged-in user lagata hai
  const me = isLive ? { id: account?.id } : team.find((m) => m.access === 'Owner') || team[0];
  const activeTeam = team.filter((m) => m.status === 'Active');

  const rows = useMemo(() => {
    if (isLive) return enquiries;
    const q = query.trim().toLowerCase();
    return enquiries
      .filter((e) => filter === 'ALL' || e.status === filter)
      .filter((e) => !q || [e.buyer, e.phone, projectName(e.projectId)].some((v) => (v || '').toLowerCase().includes(q)))
      .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  }, [isLive, enquiries, filter, query, projectName]);

  const nameOf = (e) => e.pickedUpByName || team.find((m) => m.id === e.pickedUpBy)?.name || 'someone on your team';

  const act = async (key, fn, ok) => {
    setBusy(key);
    setNotice({ tone: 'danger', text: '' });
    try {
      const res = await fn();
      if (res?.taken) setNotice({ tone: 'warning', text: res.message });
      else if (ok) setNotice({ tone: 'success', text: ok });
    } catch (err) {
      setNotice({ tone: 'danger', text: errorMessage(err) });
    } finally {
      setBusy('');
    }
  };

  const onExport = () => act('export', () => exportCsv('enquiries', () => {
    const header = ['Buyer', 'Nationality', 'Phone', 'Project', 'Unit', 'Channel', 'Budget', 'Stage', 'Picked up by', 'Received'];
    const lines = enquiries.map((e) => [
      e.buyer, e.nationality, e.phone, projectName(e.projectId) || e.projectName, e.unit, e.channel, e.budget,
      ENQUIRY_STATUS[e.status], e.pickedUpBy ? nameOf(e) : '', e.createdAt
    ].map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','));
    return [header.join(','), ...lines].join('\n');
  }));

  const total = enquiryCounts.ALL ?? enquiries.length;

  return (
    <div>
      <PageHead
        title="Enquiries"
        count={total}
        blurb="Every buyer who asked about one of your projects, in one inbox. An enquiry is not routed to a named person — whoever on your team picks it up owns it."
        actions={total > 0 && (
          <button type="button" className="btn btn-outline btn-sm" onClick={onExport} disabled={busy === 'export'}><Download size={15} /> Export</button>
        )}
      />

      <Notice tone={notice.tone} onClose={() => setNotice({ tone: 'danger', text: '' })}>{notice.text}</Notice>

      {notPickedUp > 0 && (
        <p className="muted" style={{ margin: '0 0 12px', fontSize: 13.5 }}>
          <strong style={{ color: 'var(--cmp-accent)' }}>{notPickedUp} {notPickedUp === 1 ? 'enquiry has' : 'enquiries have'}</strong> not been picked up yet.
        </p>
      )}

      <div className="row" style={{ gap: 12, flexWrap: 'wrap', marginBottom: 14 }}>
        <div style={{ flex: '1 1 260px', maxWidth: 380 }}>
          <SearchInput value={query} onChange={(v) => setQuery(v?.target ? v.target.value : v)} placeholder="Search a buyer, number or project" />
        </div>
        <div className="segmented" role="tablist">
          {FILTERS.map((f) => (
            <button key={f} type="button" role="tab" aria-selected={filter === f} onClick={() => setFilter(f)}>
              {f === 'ALL' ? 'All' : ENQUIRY_STATUS[f]} ({enquiryCounts[f] || 0})
            </button>
          ))}
        </div>
      </div>

      <LoadState loading={loading && !rows.length} error={!rows.length ? error : ''} onRetry={reload}>
        <div className="card table-scroll" style={{ opacity: loading ? 0.6 : 1 }}>
          <table className="data">
            <thead>
              <tr><th>Buyer</th><th>Project</th><th>Channel</th><th>Budget</th><th>Stage</th><th>Picked up by</th><th>When</th><th aria-label="Actions" /></tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr><td colSpan={8} className="muted" style={{ textAlign: 'center', padding: 28 }}>
                  {total === 0 && filter === 'ALL' && !query ? 'No enquiries yet. They arrive here when buyers ask about a live project.' : 'No enquiries match.'}
                </td></tr>
              ) : rows.map((e) => {
                const pName = projectName(e.projectId) || e.projectName;
                const wa = e.phone ? `https://wa.me/${e.phone.replace(/\D/g, '')}` : null;
                const pickedBySelect = e.pickedUpBy && !activeTeam.some((m) => m.id === e.pickedUpBy);
                return (
                  <tr key={e.id}>
                    <td>
                      <strong>{e.buyer}</strong>
                      <span className="faint" style={{ display: 'block', fontSize: 12 }}>{[e.nationality, e.intent].filter(Boolean).join(' · ')}</span>
                      <span className="row" style={{ gap: 10, marginTop: 4, fontSize: 12.5 }}>
                        {e.phone && <a href={`tel:${e.phone}`} className="row" style={{ gap: 4 }}><Phone size={13} /> Call</a>}
                        {wa && <a href={wa} target="_blank" rel="noopener noreferrer" className="row" style={{ gap: 4 }}><MessageCircle size={13} /> WhatsApp</a>}
                        {e.email && <a href={`mailto:${e.email}`} className="row" style={{ gap: 4 }}><Mail size={13} /> Email</a>}
                      </span>
                    </td>
                    <td>
                      {e.projectId ? <NavLink to={`/developer/projects/${e.projectId}?tab=enquiries`} style={{ fontWeight: 600 }}>{pName || 'Project'}</NavLink> : '—'}
                      <span className="faint" style={{ display: 'block', fontSize: 12 }}>{e.unit}</span>
                    </td>
                    <td>{e.channel || '—'}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>{e.budget}</td>
                    <td>
                      <select
                        aria-label={`Stage for ${e.buyer}`}
                        style={small}
                        value={e.status}
                        disabled={busy === `s-${e.id}`}
                        onChange={(ev) => act(`s-${e.id}`, () => updateEnquiry(e.id, { status: ev.target.value }))}
                      >
                        {Object.entries(ENQUIRY_STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                      </select>
                    </td>
                    <td>
                      <select
                        aria-label={`Picked up by, for ${e.buyer}`}
                        style={small}
                        value={e.pickedUpBy}
                        disabled={busy === `p-${e.id}`}
                        onChange={(ev) => act(`p-${e.id}`, () => updateEnquiry(e.id, {
                          pickedUpBy: ev.target.value,
                          ...(!isLive ? { status: ev.target.value && e.status === 'NEW' ? 'CONTACTED' : e.status } : {})
                        }))}
                      >
                        <option value="">Nobody yet</option>
                        {pickedBySelect && <option value={e.pickedUpBy}>{nameOf(e)}</option>}
                        {activeTeam.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                      </select>
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>{timeAgo(e.createdAt)}</td>
                    <td>
                      {!e.pickedUpBy && (
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          disabled={busy === `u-${e.id}`}
                          onClick={() => act(`u-${e.id}`, () => pickUpEnquiry(e.id, me), `You picked up ${e.buyer}.`)}
                        >
                          {busy === `u-${e.id}` ? '…' : 'Pick up'}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </LoadState>
      <p className="faint" style={{ margin: '12px 0 0', fontSize: 12.5, maxWidth: 820 }}>
        The message each buyer left is on the project page under Enquiries. Phone numbers and emails here are the buyer’s own, shared with you because they asked about your project; use them for that enquiry and nothing else.
      </p>
    </div>
  );
}
