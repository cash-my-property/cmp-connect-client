import React, { useMemo, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Plus, Download, Building2, LayoutGrid, Users, Eye } from 'lucide-react';
import { useDeveloper, useLoad, unitTotals, fromPrice, projectIssues, formatAed, formatDate } from '../../context/DeveloperContext';
import { ProjectStatusBadge, BuildRing, StatTile, PageHead, InfoNote, LoadState, Notice } from './DeveloperUi';
import { SearchInput } from '../../components/ui';
import { useDebounce } from '../../hooks';
import { errorMessage } from '../../utils/developerMappers';

const FILTERS = ['ALL', 'LIVE', 'IN_REVIEW', 'DRAFT', 'REJECTED', 'HANDED_OVER', 'SOLD_OUT'];

export default function ProjectsPage() {
  const { isLive, projects, projectCounts, projectTotals, notPickedUp, loadProjects, exportCsv, companyName, projectOptions } = useDeveloper();
  const { statusLabels } = projectOptions;
  const [filter, setFilter] = useState('ALL');
  const [query, setQuery] = useState('');
  const [actionError, setActionError] = useState('');
  const debounced = useDebounce(query, 350);

  // Live: filter + search server pe
  const { loading, error, reload } = useLoad(
    () => loadProjects({ status: filter === 'ALL' ? undefined : filter, q: debounced.trim() || undefined }),
    [filter, debounced]
  );

  const rows = useMemo(() => {
    if (isLive) return projects;
    const q = query.trim().toLowerCase();
    return projects.filter((p) => {
      if (filter !== 'ALL' && p.status !== filter) return false;
      if (!q) return true;
      return [p.name, p.community, p.rera].some((v) => (v || '').toLowerCase().includes(q));
    });
  }, [isLive, projects, filter, query]);

  const visibleFilters = FILTERS.filter((f) => f === 'ALL' || f === 'LIVE' || f === 'IN_REVIEW' || f === 'DRAFT' || (projectCounts[f] || 0) > 0 || filter === f);

  const onExport = async () => {
    setActionError('');
    try {
      await exportCsv('projects', () => {
        const header = ['Project', 'Community', 'Stage', 'Status', 'RERA', 'Units', 'Available', 'From (AED)', 'Handover', 'Build %'];
        const lines = projects.map((p) => {
          const t = unitTotals(p);
          return [p.name, p.community, p.stage, statusLabels[p.status] || p.status, p.rera, t.total, t.available, fromPrice(p) || '', p.handoverDate, p.buildPct]
            .map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',');
        });
        return [header.join(','), ...lines].join('\n');
      });
    } catch (err) {
      setActionError(errorMessage(err, 'Could not export projects.'));
    }
  };

  const totalAll = projectCounts.ALL ?? projects.length;

  return (
    <div>
      <PageHead
        title="Projects"
        count={totalAll}
        blurb="Every project you sell on Cash My Property, how much of it is left and what it still needs before it can go live."
        actions={
          <>
            {totalAll > 0 && (
              <button type="button" className="btn btn-outline btn-sm" onClick={onExport}>
                <Download size={15} /> Export
              </button>
            )}
            <NavLink to="/developer/projects/new" className="btn btn-primary btn-sm">
              <Plus size={16} /> Add a project
            </NavLink>
          </>
        }
      />

      <Notice onClose={() => setActionError('')}>{actionError}</Notice>

      <InfoNote>
        Every project is published under <strong>{companyName || 'your company'}</strong>. A developer project shows no agent and no BRN by default, so buyers see your project and your company, and their enquiry arrives in one inbox for your sales team to pick up.{' '}
        <NavLink to="/developer/profile" style={{ fontWeight: 600 }}>See what buyers see</NavLink>
      </InfoNote>

      <div className="kpi-grid">
        <StatTile icon={Building2} label="Live projects" value={projectTotals.liveProjects ?? projectCounts.LIVE ?? 0} hint={`${totalAll} in your portfolio`} />
        <StatTile icon={LayoutGrid} label="Units available" value={(projectTotals.unitsAvailable || 0).toLocaleString('en-AE')} hint={`${projectTotals.unitsReserved || 0} reserved`} />
        <StatTile icon={Users} label="Enquiries, 30 days" value={(projectTotals.enquiries30d || 0).toLocaleString('en-AE')} hint={!isLive ? `${notPickedUp} not picked up yet` : undefined} />
        <StatTile icon={Eye} label="Views, 30 days" value={(projectTotals.views30d || 0).toLocaleString('en-AE')} />
      </div>

      <div className="row" style={{ gap: 12, flexWrap: 'wrap', marginBottom: 14 }}>
        <div style={{ flex: '1 1 260px', maxWidth: 380 }}>
          <SearchInput value={query} onChange={(v) => setQuery(v?.target ? v.target.value : v)} placeholder="Search a project, community or RERA number" />
        </div>
        <div className="segmented" role="tablist">
          {visibleFilters.map((f) => (
            <button key={f} type="button" role="tab" aria-selected={filter === f} onClick={() => setFilter(f)}>
              {f === 'ALL' ? 'All' : statusLabels[f] || f} ({projectCounts[f] || 0})
            </button>
          ))}
        </div>
      </div>

      <LoadState loading={loading && !rows.length} error={!rows.length ? error : ''} onRetry={reload}>
        <div className="card table-scroll" style={{ opacity: loading ? 0.6 : 1 }}>
          <table className="data">
            <thead>
              <tr><th>Project</th><th>Status</th><th>Units</th><th>From</th><th>Handover</th><th>Build</th><th>Enquiries 30d</th><th aria-label="Actions" /></tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="muted" style={{ textAlign: 'center', padding: 28 }}>
                    {totalAll === 0 && filter === 'ALL' && !query ? (
                      <>No projects yet. <NavLink to="/developer/projects/new" style={{ fontWeight: 600 }}>Add your first project</NavLink></>
                    ) : 'No projects match.'}
                  </td>
                </tr>
              ) : rows.map((p) => {
                const t = unitTotals(p);
                const issues = p.status === 'HANDED_OVER' ? [] : projectIssues(p);
                return (
                  <tr key={p.id}>
                    <td>
                      <NavLink to={`/developer/projects/${p.id}`} style={{ fontWeight: 700 }}>{p.name}</NavLink>
                      <span className="faint" style={{ display: 'block', fontSize: 12 }}>
                        {[p.community, p.stage, p.rera].filter(Boolean).join(' · ')}
                      </span>
                    </td>
                    <td>
                      <ProjectStatusBadge status={p.status} />
                      {issues.length > 0 && (
                        <span style={{ display: 'block', fontSize: 12, marginTop: 4, color: 'var(--cmp-warning)', fontWeight: 600 }}>
                          {issues.length} {issues.length === 1 ? 'thing' : 'things'} missing
                        </span>
                      )}
                    </td>
                    <td style={{ fontVariantNumeric: 'tabular-nums' }}>
                      {t.total ? `${t.available} of ${t.total} left` : <span className="faint">No unit types yet</span>}
                    </td>
                    <td style={{ fontVariantNumeric: 'tabular-nums' }}>{formatAed(fromPrice(p))}</td>
                    <td>{formatDate(p.handoverDate)}</td>
                    <td><BuildRing pct={p.buildPct} /></td>
                    <td style={{ fontVariantNumeric: 'tabular-nums' }}>{p.enquiries30d || 0}</td>
                    <td><NavLink to={`/developer/projects/${p.id}`} className="btn btn-outline btn-sm">Open</NavLink></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </LoadState>
    </div>
  );
}
