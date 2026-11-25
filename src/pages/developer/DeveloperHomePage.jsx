import React from 'react';
import { NavLink } from 'react-router-dom';
import { Plus, Building2, LayoutGrid, Users, CalendarDays, AlertTriangle, CheckCircle2, ChevronRight, FileWarning } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useDeveloper, useLoad, unitTotals, fromPrice, formatAed, formatDate, timeAgo } from '../../context/DeveloperContext';
import { ProjectStatusBadge, BuildRing, StatTile, LoadState } from './DeveloperUi';
import { FreeAllowanceChip } from '../../components/common/FreeAllowance';

// needsYou item → { icon, tone, text, to, cta }
function needItem(n) {
  switch (n.type) {
    case 'ENQUIRIES_WAITING':
      return {
        tone: 'accent', Icon: Users,
        text: <><strong>{n.count} {n.count === 1 ? 'enquiry' : 'enquiries'}</strong> nobody has picked up yet.</>,
        to: '/developer/enquiries', cta: 'Open inbox'
      };
    case 'PROJECT_BLOCKED': {
      const issues = n.issues || [];
      return {
        tone: 'warning', Icon: AlertTriangle,
        text: issues.length
          ? <><strong>{n.projectName || String(n.title || '').replace(/ (needs|can['’]t).*$/, '') || 'A project'}</strong> needs {issues.length} {issues.length === 1 ? 'thing' : 'things'} before it can go live: {issues.join(', ')}.</>
          : <>{n.title}</>,
        to: n.projectId ? `/developer/projects/${n.projectId}` : '/developer/projects', cta: 'Fix'
      };
    }
    case 'PERMIT_EXPIRING':
      return {
        tone: 'warning', Icon: FileWarning,
        text: <><strong>{n.projectName}</strong>: the {String(n.docLabel).toLowerCase()} {n.days < 0 ? `ran out ${Math.abs(n.days)} days ago` : `runs out in ${n.days} days`}. Upload the renewed one.</>,
        to: `/developer/projects/${n.projectId}?tab=documents`, cta: 'Documents'
      };
    case 'RESERVATION_PENDING':
      return {
        tone: 'success', Icon: CheckCircle2,
        text: <><strong>{n.count} {n.count === 1 ? 'reservation' : 'reservations'}</strong> waiting on paperwork. Mark the unit sold once the agreement is signed.</>,
        to: '/developer/availability', cta: 'Availability'
      };
    default:
      return { tone: 'accent', Icon: AlertTriangle, text: <>{n.title}</>, to: n.projectId ? `/developer/projects/${n.projectId}` : '/developer', cta: 'Open' };
  }
}

export default function DeveloperHomePage() {
  const { account } = useApp();
  const { home, loadHome, companyName } = useDeveloper();
  const { loading, error, reload } = useLoad(loadHome);

  const s = home?.stats;
  const needs = home?.needsYou || [];
  const name = companyName || account?.firstName || '';

  return (
    <div>
      <div className="row" style={{ justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 26, letterSpacing: '-0.02em', margin: 0 }}>{name ? `Good day, ${name}` : 'Good day'}</h1>
          <p className="muted" style={{ margin: '4px 0 0', fontSize: 13.5 }}>
            Your projects, what buyers are asking about them and what is holding a project back from going live.
          </p>
        </div>
        <div className="row" style={{ gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <FreeAllowanceChip kind="PROJECT" />
          <NavLink to="/developer/projects/new" className="btn btn-primary btn-sm">
            <Plus size={16} />
            <span>Add a project</span>
          </NavLink>
        </div>
      </div>

      <LoadState loading={loading && !home} error={!home ? error : ''} onRetry={reload}>
        {home && (
          <>
            <div className="kpi-grid">
              <StatTile icon={Building2} label="Live projects" value={s.liveProjects} hint={s.totalProjects != null ? `${s.totalProjects} in your portfolio` : undefined} />
              <StatTile icon={LayoutGrid} label="Units available" value={s.unitsAvailable.toLocaleString('en-AE')} hint={`${s.unitsReserved} reserved · ${s.unitsSold} sold`} />
              <StatTile icon={Users} label="Enquiries not picked up" value={s.enquiriesWaiting} hint={s.oldestWaitingSince ? `Oldest waiting ${timeAgo(s.oldestWaitingSince)}` : 'All picked up'} />
              <StatTile icon={CalendarDays} label="Next handover" value={s.nextHandover ? formatDate(s.nextHandover.handoverDate) : '—'} hint={s.nextHandover?.name || 'No date set'} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(330px, 1fr))', gap: 18, alignItems: 'start', marginBottom: 24 }}>
              <section className="card" style={{ padding: 0 }}>
                <div className="section-head">
                  <h2>What needs you</h2>
                  <span className="count-badge">{needs.length}</span>
                </div>
                {needs.length === 0 ? (
                  <p className="muted" style={{ padding: '0 20px 20px', margin: 0 }}>You’re all caught up.</p>
                ) : (
                  <ul className="priority-list">
                    {needs.map((n, i) => {
                      const it = needItem(n);
                      const color = it.tone === 'success' ? 'var(--cmp-success)' : it.tone === 'warning' ? 'var(--cmp-warning)' : 'var(--cmp-accent)';
                      return (
                        <li key={`${n.type}-${n.projectId || ''}-${i}`}>
                          <span className="priority-icon" style={{ color, background: 'var(--cmp-surface-sunken)' }}>
                            <it.Icon size={17} />
                          </span>
                          <span style={{ flex: 1, minWidth: 0, fontSize: 14 }}>{it.text}</span>
                          <NavLink to={it.to} className="btn btn-outline btn-sm">{it.cta}</NavLink>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>

              <section className="card" style={{ padding: 20 }}>
                <h2 style={{ fontSize: 16, margin: '0 0 6px' }}>How your account works</h2>
                <p className="muted" style={{ fontSize: 13.5, margin: '0 0 12px' }}>
                  You are on a developer account, so CMP Connect is set up around projects rather than around agents.
                </p>
                <ul className="muted" style={{ margin: 0, paddingInlineStart: 20, fontSize: 13.5, display: 'grid', gap: 7 }}>
                  <li>Your records are <strong>projects</strong>, each with its unit types, payment plan and handover date.</li>
                  <li>A project is published under <strong>{name || 'your company'}</strong>. There is no agent and no BRN on it unless you choose to show one.</li>
                  <li>Buyer enquiries arrive in <NavLink to="/developer/enquiries">one inbox</NavLink> for your sales team, rather than going to a named agent.</li>
                  <li>The people on your account have <strong>access</strong>, not public profiles, unless you turn on “Shown to buyers”.</li>
                </ul>
                <NavLink to="/developer/profile" className="btn btn-outline btn-sm" style={{ marginTop: 14 }}>See what buyers see</NavLink>
              </section>
            </div>

            <div className="row" style={{ justifyContent: 'space-between', marginBottom: 12 }}>
              <h2 style={{ fontSize: 18, margin: 0 }}>Your projects</h2>
              <NavLink to="/developer/projects" className="btn btn-ghost btn-sm">
                All projects <ChevronRight size={15} />
              </NavLink>
            </div>
            {home.projects.length === 0 ? (
              <section className="card" style={{ padding: 24, textAlign: 'center' }}>
                <p className="muted" style={{ margin: '0 0 12px' }}>No projects yet. Add your first one to start getting enquiries.</p>
                <NavLink to="/developer/projects/new" className="btn btn-primary btn-sm"><Plus size={15} /> Add a project</NavLink>
              </section>
            ) : (
              <div className="card table-scroll">
                <table className="data">
                  <thead>
                    <tr><th>Project</th><th>Status</th><th>Sold</th><th>Available</th><th>From</th><th>Handover</th><th>Build</th></tr>
                  </thead>
                  <tbody>
                    {home.projects.map((p) => {
                      const t = unitTotals(p);
                      const pct = t.total ? Math.round((t.sold / t.total) * 100) : 0;
                      return (
                        <tr key={p.id}>
                          <td>
                            <NavLink to={`/developer/projects/${p.id}`} style={{ fontWeight: 700 }}>{p.name}</NavLink>
                            <span className="faint" style={{ display: 'block', fontSize: 12 }}>{[p.community, p.stage].filter(Boolean).join(' · ')}</span>
                          </td>
                          <td><ProjectStatusBadge status={p.status} /></td>
                          <td style={{ fontVariantNumeric: 'tabular-nums' }}>
                            {pct}%<span className="faint" style={{ display: 'block', fontSize: 12 }}>{t.sold} of {t.total}</span>
                          </td>
                          <td style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 700 }}>{t.available}</td>
                          <td style={{ fontVariantNumeric: 'tabular-nums' }}>{formatAed(fromPrice(p))}</td>
                          <td>{formatDate(p.handoverDate)}</td>
                          <td><BuildRing pct={p.buildPct} /></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </LoadState>
    </div>
  );
}
