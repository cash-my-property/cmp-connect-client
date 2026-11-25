import React, { useEffect, useMemo, useRef, useState } from 'react';
import { NavLink, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  Pencil, ShieldCheck, Upload, Star, Trash2, FileText, AlertTriangle, ArrowLeft, Image as ImageIcon,
  LayoutGrid, TrendingUp, Eye, Users, Loader2
} from 'lucide-react';
import {
  useDeveloper, useLoad, unitTotals, planTotal, projectIssues, formatAed, formatDate, timeAgo, newId, MIN_PHOTOS, ENQUIRY_STATUS
} from '../../context/DeveloperContext';
import { ProjectStatusBadge, StatTile, BuildRing, InfoNote, LoadState, Notice, fieldStyle } from './DeveloperUi';
import { Avatar, Badge } from '../../components/ui';
import ProjectDocumentsEditor, { DocumentsSummaryBar } from './ProjectDocuments';
import { documentsSummary, daysUntil } from '../../utils/projectDocuments';
import { errorMessage } from '../../utils/developerMappers';
import { FreeAllowanceNote, useFreeQuota } from '../../components/common/FreeAllowance';
import { isQuotaOut } from '../../utils/freeAllowance';

const TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'units', label: 'Units' },
  { key: 'plan', label: 'Payment plan' },
  { key: 'photos', label: 'Photos' },
  { key: 'documents', label: 'Documents' },
  { key: 'enquiries', label: 'Enquiries' }
];

const brochureName = (b) => (typeof b === 'string' ? b : b?.fileName || '');

export default function ProjectDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const {
    isLive, getProject, loadProject, updateProject, markSoldOut, deleteProject,
    enquiries, loadEnquiries, team, companyName, uploadFile
  } = useDeveloper();
  const { loading, error, reload } = useLoad(() => loadProject(id), [id]);
  const project = getProject(id);
  const tab = TABS.some((t) => t.key === params.get('tab')) ? params.get('tab') : 'overview';
  const setTab = (key) => setParams(key === 'overview' ? {} : { tab: key }, { replace: true });
  const [notice, setNotice] = useState({ tone: 'danger', text: '' });
  const [busy, setBusy] = useState('');
  const projectQuota = useFreeQuota('PROJECT');

  // Enquiries tab: live mein is project ke enquiries
  const [enqLoaded, setEnqLoaded] = useState(false);
  useEffect(() => {
    if (tab !== 'enquiries' || !isLive) return;
    loadEnquiries({ projectId: id }).then(() => setEnqLoaded(true)).catch(() => setEnqLoaded(true));
  }, [tab, isLive, id, loadEnquiries]);
  const projectEnquiries = useMemo(() => enquiries.filter((e) => e.projectId === id), [enquiries, id]);

  if (!project || (isLive && !project._detail)) {
    return (
      <LoadState loading={loading} error={error} onRetry={reload}>
        <section className="card" style={{ padding: 32, textAlign: 'center' }}>
          <h2 style={{ fontSize: 17, margin: '0 0 8px' }}>Project not found</h2>
          <NavLink to="/developer/projects" className="btn btn-outline btn-sm">Back to projects</NavLink>
        </section>
      </LoadState>
    );
  }

  const t = unitTotals(project);
  const issues = ['HANDED_OVER', 'SOLD_OUT'].includes(project.status) ? [] : projectIssues(project);
  const sellers = project.sellers || team.filter((m) => m.projectIds.includes(project.id));
  const docSummary = documentsSummary(project.documents);
  const counts = {
    units: project.unitTypes.length,
    photos: project.photos.length,
    enquiries: isLive && !enqLoaded ? undefined : projectEnquiries.length,
    documents: `${docSummary.inHand}/${docSummary.total}`
  };

  const run = async (key, fn, okText) => {
    setBusy(key);
    setNotice({ tone: 'danger', text: '' });
    try {
      await fn();
      if (okText) setNotice({ tone: 'success', text: okText });
    } catch (err) {
      setNotice({ tone: 'danger', text: errorMessage(err) });
    } finally {
      setBusy('');
    }
  };

  const onSoldOut = () => {
    if (!window.confirm(`Mark ${project.name} as sold out? Buyers will no longer be able to enquire about it.`)) return;
    run('soldout', () => markSoldOut(project.id), `${project.name} is marked sold out.`);
  };
  const onDelete = () => {
    if (!window.confirm(`Delete the draft “${project.name}”? This cannot be undone.`)) return;
    run('delete', async () => { await deleteProject(project.id); navigate('/developer/projects'); });
  };

  return (
    <div>
      <NavLink to="/developer/projects" className="btn btn-ghost btn-sm" style={{ marginBottom: 10 }}>
        <ArrowLeft size={15} /> All projects
      </NavLink>

      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap', marginBottom: 12 }}>
        <div style={{ minWidth: 0 }}>
          <h1 style={{ fontSize: 26, letterSpacing: '-0.02em', margin: 0 }}>{project.name}</h1>
          <p className="muted" style={{ margin: '4px 0 0', fontSize: 14 }}>
            {[`${project.community}, ${project.emirate}`, project.stage, project.handoverDate ? `handover ${formatDate(project.handoverDate)}` : null].filter(Boolean).join(' · ')}
          </p>
        </div>
        <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
          <NavLink to={`/developer/projects/${project.id}/edit`} className="btn btn-primary btn-sm">
            <Pencil size={15} /> Edit project
          </NavLink>
          {project.status === 'LIVE' && (
            <button type="button" className="btn btn-outline btn-sm" onClick={onSoldOut} disabled={busy === 'soldout'}>
              {busy === 'soldout' ? 'Saving…' : 'Mark sold out'}
            </button>
          )}
          {project.status === 'DRAFT' && (
            <button type="button" className="btn btn-ghost btn-sm" onClick={onDelete} disabled={busy === 'delete'} style={{ color: 'var(--cmp-danger)' }}>
              <Trash2 size={15} /> {busy === 'delete' ? 'Deleting…' : 'Delete draft'}
            </button>
          )}
        </div>
      </div>

      <div className="row" style={{ gap: 8, flexWrap: 'wrap', marginBottom: 18 }}>
        <ProjectStatusBadge status={project.status} />
        {project.status === 'LIVE' && <Badge variant="success"><ShieldCheck size={13} /> Checked by Cash My Property</Badge>}
        {project.projectRef && <Badge>{project.projectRef}</Badge>}
        {project.rera && <Badge>{project.rera}</Badge>}
        {project.escrowAccount && <Badge>Escrow {project.escrowAccount}</Badge>}
        <Badge>Listed under {companyName || 'your company'}</Badge>
      </div>

      <Notice tone={notice.tone} onClose={() => setNotice({ tone: 'danger', text: '' })}>{notice.text}</Notice>

      {project.status === 'REJECTED' && (
        <InfoNote tone="warning">
          <strong>Sent back by Cash My Property.</strong>{' '}
          {project.rejectionReason || 'Fix the points below and save the project to send it for review again.'}
        </InfoNote>
      )}
      {project.status === 'DRAFT' && isQuotaOut(projectQuota) && (
        <FreeAllowanceNote
          kind="PROJECT"
          lead={issues.length === 0 ? 'The checklist is complete, but this project is still a draft and has not gone for review.' : undefined}
        />
      )}
      {project.status === 'IN_REVIEW' && (
        <InfoNote>
          <strong>In review.</strong> Cash My Property is checking the project and its documents. It goes live once approved.
        </InfoNote>
      )}

      {(docSummary.expired.length > 0 || docSummary.expiringSoon.length > 0) && (
        <InfoNote tone="warning">
          {[...docSummary.expired, ...docSummary.expiringSoon].map((d) => {
            const days = daysUntil(project.documents[d.key].expiresOn);
            return (
              <span key={d.key} style={{ display: 'block' }}>
                <strong>{d.label}</strong> {days < 0 ? `ran out ${Math.abs(days)} days ago — adverts under it have to stop.` : `runs out in ${days} days.`}{' '}
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setTab('documents')}>Upload the renewed permit</button>
              </span>
            );
          })}
        </InfoNote>
      )}

      {issues.length > 0 && (
        <InfoNote tone="warning">
          <strong style={{ display: 'flex', alignItems: 'center', gap: 6 }}><AlertTriangle size={15} /> Before this project can go live</strong>
          <ul style={{ margin: '6px 0 0', paddingInlineStart: 20 }}>
            {issues.map((i) => <li key={i} style={{ textTransform: 'capitalize' }}>{i}</li>)}
          </ul>
        </InfoNote>
      )}

      <div className="segmented" role="tablist" style={{ marginBottom: 18 }}>
        {TABS.map((tb) => (
          <button key={tb.key} type="button" role="tab" aria-selected={tab === tb.key} onClick={() => setTab(tb.key)}>
            {tb.label}{counts[tb.key] != null ? ` (${counts[tb.key]})` : ''}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <>
          <div className="kpi-grid">
            <StatTile icon={LayoutGrid} label="Units" value={t.total} hint={`${t.available} available · ${t.reserved} reserved`} />
            <StatTile icon={TrendingUp} label="Sold" value={`${t.total ? Math.round((t.sold / t.total) * 100) : 0}%`} hint={`${formatAed(t.soldValue)} at launch prices`} />
            <StatTile icon={Eye} label="Views, 30 days" value={(project.views30d || 0).toLocaleString('en-AE')} hint={`${(project.saves || 0).toLocaleString('en-AE')} buyers saved it`} />
            <StatTile icon={Users} label="Enquiries, 30 days" value={project.enquiries30d || 0} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 18, alignItems: 'start' }}>
            <section className="card" style={{ padding: 20 }}>
              <h2 style={{ fontSize: 16, margin: '0 0 8px' }}>About the project</h2>
              <p style={{ margin: '0 0 12px', fontSize: 14, lineHeight: 1.6 }}>{project.description || <span className="faint">No description yet.</span>}</p>
              <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
                {project.amenities.map((a) => <span key={a} className="chip">{a}</span>)}
              </div>
            </section>

            <section className="card" style={{ padding: 20 }}>
              <h2 style={{ fontSize: 16, margin: '0 0 8px' }}>The facts</h2>
              <dl style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '8px 16px', margin: 0, fontSize: 14 }}>
                <dt className="muted">Construction</dt>
                <dd style={{ margin: 0 }} className="row"><BuildRing pct={project.buildPct} size={30} /> <span style={{ marginInlineStart: 8 }}>{project.buildPct}% complete</span></dd>
                <dt className="muted">Handover</dt><dd style={{ margin: 0 }}>{formatDate(project.handoverDate)}</dd>
                <dt className="muted">Launched</dt><dd style={{ margin: 0 }}>{formatDate(project.launchDate)}</dd>
                <dt className="muted">DLD project no.</dt><dd style={{ margin: 0 }}>{project.documents?.dldRegistration?.number || project.rera || '—'}</dd>
                <dt className="muted">Trakheesi permit</dt>
                <dd style={{ margin: 0 }}>
                  {project.documents?.trakheesiProject?.number
                    ? `${project.documents.trakheesiProject.number}${project.documents.trakheesiProject.expiresOn ? ` · runs out ${formatDate(project.documents.trakheesiProject.expiresOn)}` : ''}`
                    : '—'}
                </dd>
                <dt className="muted">Escrow account</dt><dd style={{ margin: 0 }}>{project.escrowAccount ? `${project.escrowAccount}${project.escrowBank ? ` · ${project.escrowBank}` : ''}` : '—'}</dd>
                <dt className="muted">Service charge</dt><dd style={{ margin: 0 }}>{project.serviceCharge ? `AED ${project.serviceCharge} per sqft` : '—'}</dd>
                <dt className="muted">DLD fee waiver</dt><dd style={{ margin: 0 }}>{project.dldWaiver ? `${project.dldWaiver}%` : '—'}</dd>
                <dt className="muted">Government fee</dt><dd style={{ margin: 0 }}>{project.governmentFeePct != null && project.governmentFeePct !== '' ? `${project.governmentFeePct}%` : '—'}</dd>
                <dt className="muted">Ownership</dt><dd style={{ margin: 0 }}>{project.ownershipType || '—'}</dd>
                <dt className="muted">Buildings</dt><dd style={{ margin: 0 }}>{project.buildingsCount !== '' && project.buildingsCount != null ? project.buildingsCount : '—'}</dd>
                <dt className="muted">On the map</dt><dd style={{ margin: 0 }}>{project.geo ? 'Pinned' : <NavLink to={`/developer/projects/${project.id}/edit`}>Add the location</NavLink>}</dd>
                <dt className="muted">Media</dt><dd style={{ margin: 0 }}>{project.photos.length} photos{project.video?.url ? ' · video tour' : ''}{brochureName(project.brochure) ? ' · brochure' : ''}</dd>
                <dt className="muted">Enquiries go to</dt><dd style={{ margin: 0 }}>Your sales team inbox</dd>
              </dl>
            </section>

            <section className="card" style={{ padding: 20 }}>
              <h2 style={{ fontSize: 16, margin: '0 0 10px' }}>Selling this project</h2>
              {sellers.length === 0 ? (
                <p className="muted" style={{ margin: 0, fontSize: 14 }}>Nobody is assigned yet. <NavLink to="/developer/team">Assign people</NavLink></p>
              ) : (
                <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 10 }}>
                  {sellers.map((m) => (
                    <li key={m.id} className="row" style={{ gap: 10 }}>
                      <Avatar name={m.name} size={32} />
                      <span style={{ flex: 1, minWidth: 0 }}>
                        <strong style={{ display: 'block', fontSize: 14 }}>{m.name}</strong>
                        <span className="faint" style={{ fontSize: 12 }}>{m.position}{m.shownToBuyers && m.brn ? ` · ${m.brn}` : ''}</span>
                      </span>
                      <Badge variant={m.shownToBuyers ? 'success' : 'neutral'}>{m.shownToBuyers ? 'On the project page' : 'Internal'}</Badge>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </>
      )}

      {tab === 'units' && <UnitsTab project={project} />}
      {tab === 'plan' && <PlanTab project={project} />}
      {tab === 'photos' && <PhotosTab project={project} updateProject={updateProject} uploadFile={uploadFile} />}
      {tab === 'documents' && <DocumentsTab project={project} updateProject={updateProject} uploadFile={uploadFile} />}
      {tab === 'enquiries' && (
        isLive && !enqLoaded
          ? <LoadState loading />
          : <EnquiriesTab rows={projectEnquiries} team={team} />
      )}
    </div>
  );
}

function UnitsTab({ project }) {
  const { isLive, loadMovements } = useDeveloper();
  const [moves, setMoves] = useState(null);
  useEffect(() => {
    if (!isLive) return;
    loadMovements(project.id).then(setMoves).catch(() => setMoves([]));
  }, [isLive, project.id, loadMovements]);
  const unitLabel = (uid) => project.unitTypes.find((u) => u.id === String(uid))?.label || '';

  if (!project.unitTypes.length) {
    return (
      <section className="card" style={{ padding: 24 }}>
        <p className="muted" style={{ margin: '0 0 12px' }}>No unit types yet. A project needs at least one before it can go live.</p>
        <NavLink to={`/developer/projects/${project.id}/edit`} className="btn btn-outline btn-sm">Add unit types</NavLink>
      </section>
    );
  }
  return (
    <div style={{ display: 'grid', gap: 18 }}>
      <div className="card table-scroll">
        <table className="data">
          <thead><tr><th>Unit type</th><th>Size</th><th>From</th><th>Total</th><th>Available</th><th>Reserved</th><th>Sold</th></tr></thead>
          <tbody>
            {project.unitTypes.map((u) => (
              <tr key={u.id}>
                <td><strong>{u.label}</strong><span className="faint" style={{ display: 'block', fontSize: 12 }}>{u.type}</span></td>
                <td>{u.sizeFrom ? `${Number(u.sizeFrom).toLocaleString('en-AE')}–${Number(u.sizeTo || u.sizeFrom).toLocaleString('en-AE')} sqft` : '—'}</td>
                <td>{formatAed(u.priceFrom)}</td>
                <td>{u.total}</td>
                <td style={{ fontWeight: 700 }}>{u.available}</td>
                <td>{u.reserved}</td>
                <td>{u.sold}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="faint" style={{ margin: 0, padding: '10px 16px', fontSize: 12.5 }}>
          Reserve or sell units on <NavLink to="/developer/availability">Availability</NavLink>.
        </p>
      </div>

      {isLive && (
        <section className="card" style={{ padding: 0 }}>
          <div className="section-head"><h2>Recent unit moves</h2></div>
          {moves == null ? (
            <p className="muted" style={{ padding: '0 20px 18px', margin: 0, fontSize: 13.5 }}>Loading…</p>
          ) : moves.length === 0 ? (
            <p className="muted" style={{ padding: '0 20px 18px', margin: 0, fontSize: 13.5 }}>No units reserved or sold yet.</p>
          ) : (
            <div className="table-scroll">
              <table className="data">
                <thead><tr><th>Action</th><th>Unit type</th><th>From</th><th>By</th><th>When</th></tr></thead>
                <tbody>
                  {moves.slice(0, 20).map((m, i) => (
                    <tr key={m.id || i}>
                      <td style={{ textTransform: 'capitalize', fontWeight: 600 }}>{m.action === 'sell' ? 'Sold' : m.action === 'reserve' ? 'Reserved' : m.action === 'release' ? 'Released' : m.action}</td>
                      <td>{m.unitTypeLabel || unitLabel(m.unitTypeId) || '—'}</td>
                      <td style={{ textTransform: 'capitalize' }}>{m.from || '—'}</td>
                      <td>{m.by?.name || m.by || '—'}</td>
                      <td>{timeAgo(m.at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </div>
  );
}

function PlanTab({ project }) {
  const total = planTotal(project);
  return (
    <section className="card" style={{ padding: 0 }}>
      <div className="section-head">
        <h2>Payment plan</h2>
        <Badge variant={total === 100 ? 'success' : 'warning'}>{total}% of 100%</Badge>
      </div>
      {project.paymentPlan.length === 0 ? (
        <p className="muted" style={{ padding: '0 20px 20px', margin: 0 }}>No milestones yet. <NavLink to={`/developer/projects/${project.id}/edit`}>Add a payment plan</NavLink></p>
      ) : (
        <div className="table-scroll">
          <table className="data">
            <thead><tr><th>Milestone</th><th>Share</th><th>When it falls due</th></tr></thead>
            <tbody>
              {project.paymentPlan.map((m) => (
                <tr key={m.id}><td><strong>{m.milestone}</strong></td><td>{m.share}%</td><td>{m.due}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

// Photos + brochure editor. upload(file, kind) → { url, public_id, fileName }
export function PhotoManager({ photos, onChange, brochure, onBrochure, upload }) {
  const inputRef = useRef(null);
  const pdfRef = useRef(null);
  const [drag, setDrag] = useState(false);
  const [uploading, setUploading] = useState(0);
  const [err, setErr] = useState('');
  const photosRef = useRef(photos);
  photosRef.current = photos;

  const addFiles = async (files) => {
    const all = Array.from(files || []);
    const accepted = all.filter((f) => /image\/(jpeg|png|webp)/.test(f.type) && f.size <= 12 * 1024 * 1024);
    setErr(accepted.length < all.length ? 'Some files were skipped: only JPG, PNG or WebP up to 12 MB.' : '');
    if (!accepted.length) return;
    setUploading((n) => n + accepted.length);
    const added = [];
    for (const f of accepted) {
      try {
        const up = upload ? await upload(f, 'photo') : { url: URL.createObjectURL(f), public_id: '', fileName: f.name };
        added.push({ id: newId('ph'), name: up.fileName || f.name, caption: '', kind: 'photo', url: up.url, public_id: up.public_id, cover: false });
      } catch (e) {
        setErr(errorMessage(e, `Could not upload ${f.name}.`));
      } finally {
        setUploading((n) => n - 1);
      }
    }
    if (!added.length) return;
    const next = [...photosRef.current, ...added];
    if (!next.some((p) => p.cover)) next[0] = { ...next[0], cover: true };
    onChange(next);
  };

  const setCover = (id) => onChange(photos.map((p) => ({ ...p, cover: p.id === id })));
  const remove = (id) => {
    const next = photos.filter((p) => p.id !== id);
    if (next.length && !next.some((p) => p.cover)) next[0] = { ...next[0], cover: true };
    onChange(next);
  };
  const setCaption = (id, caption) => onChange(photos.map((p) => (p.id === id ? { ...p, caption } : p)));

  const onPdf = async (f) => {
    if (!f) return;
    if (f.type !== 'application/pdf') { setErr('The brochure has to be a PDF.'); return; }
    setUploading((n) => n + 1);
    setErr('');
    try {
      const up = upload ? await upload(f, 'brochure') : { url: URL.createObjectURL(f), public_id: '', fileName: f.name };
      onBrochure(up);
    } catch (e) {
      setErr(errorMessage(e, 'Could not upload the brochure.'));
    } finally {
      setUploading((n) => n - 1);
    }
  };

  const bName = brochureName(brochure);

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); addFiles(e.dataTransfer.files); }}
        style={{
          border: `2px dashed ${drag ? 'var(--cmp-brand)' : 'var(--cmp-border)'}`,
          borderRadius: 'var(--cmp-radius-lg)',
          padding: 24,
          textAlign: 'center',
          background: drag ? 'var(--cmp-brand-subtle)' : 'var(--cmp-surface-sunken)'
        }}
      >
        <Upload size={22} style={{ color: 'var(--cmp-brand)' }} />
        <p style={{ margin: '6px 0 2px', fontWeight: 700 }}>Drag photos and renders here</p>
        <p className="faint" style={{ margin: '0 0 12px', fontSize: 12.5 }}>JPG, PNG or WebP, up to 12 MB each. Mark one as the cover — that is the picture buyers see first.</p>
        <button type="button" className="btn btn-outline btn-sm" onClick={() => inputRef.current?.click()}>Choose pictures</button>
        <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" multiple hidden onChange={(e) => { addFiles(e.target.files); e.target.value = ''; }} />
      </div>

      {uploading > 0 && (
        <p className="muted row" style={{ margin: 0, fontSize: 13, gap: 6 }}><Loader2 size={14} className="spin" /> Uploading {uploading} {uploading === 1 ? 'file' : 'files'}…</p>
      )}
      {err && <p className="pf-error" style={{ margin: 0 }}>{err}</p>}

      <p className="muted" style={{ margin: 0, fontSize: 13 }}>
        {photos.length} {photos.length === 1 ? 'photo' : 'photos'} and renders
        {photos.length < MIN_PHOTOS && <span style={{ color: 'var(--cmp-warning)', fontWeight: 600 }}> · {MIN_PHOTOS - photos.length} more needed to go live</span>}
      </p>

      {photos.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: 12 }}>
          {photos.map((p) => (
            <figure key={p.id} className="card" style={{ margin: 0, padding: 8, display: 'grid', gap: 6 }}>
              <div style={{ position: 'relative', aspectRatio: '4 / 3', borderRadius: 8, overflow: 'hidden', background: 'var(--cmp-surface-sunken)', display: 'grid', placeItems: 'center' }}>
                {p.url ? <img src={p.url} alt={p.caption || p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <ImageIcon size={26} className="faint" />}
                {p.cover && <span className="badge badge-brand" style={{ position: 'absolute', top: 6, left: 6 }}>Cover</span>}
              </div>
              <input
                aria-label={`Caption for ${p.name}`}
                placeholder="What it shows"
                value={p.caption}
                onChange={(e) => setCaption(p.id, e.target.value)}
                style={{ ...fieldStyle, padding: '6px 8px', fontSize: 12.5, height: 34 }}
              />
              <figcaption className="faint" style={{ fontSize: 11.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</figcaption>
              <div className="row" style={{ gap: 6 }}>
                {!p.cover && (
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => setCover(p.id)} style={{ flex: 1 }}>
                    <Star size={13} /> Make cover
                  </button>
                )}
                <button type="button" className="icon-button" aria-label={`Remove ${p.name}`} onClick={() => remove(p.id)} style={{ marginInlineStart: 'auto' }}>
                  <Trash2 size={15} />
                </button>
              </div>
            </figure>
          ))}
        </div>
      )}

      {onBrochure && (
        <div className="card" style={{ padding: 16 }}>
          <strong style={{ fontSize: 14 }}>Project brochure</strong>
          <p className="faint" style={{ margin: '2px 0 10px', fontSize: 12.5 }}>A PDF buyers can download from the project page.</p>
          <div className="row" style={{ gap: 10, flexWrap: 'wrap' }}>
            {bName && <span className="chip"><FileText size={13} /> {bName}</span>}
            <button type="button" className="btn btn-outline btn-sm" onClick={() => pdfRef.current?.click()}>{bName ? 'Replace PDF' : 'Choose a PDF'}</button>
            {bName && <button type="button" className="btn btn-ghost btn-sm" onClick={() => onBrochure('')}>Remove</button>}
            <input ref={pdfRef} type="file" accept="application/pdf" hidden onChange={(e) => { onPdf(e.target.files?.[0]); e.target.value = ''; }} />
          </div>
        </div>
      )}
    </div>
  );
}

// Draft edit + Save (har keystroke pe PATCH nahi)
function useDraft(value) {
  const [draft, setDraft] = useState(value);
  const [dirty, setDirty] = useState(false);
  const serialized = JSON.stringify(value);
  useEffect(() => {
    setDraft(JSON.parse(serialized));
    setDirty(false);
  }, [serialized]);
  return [draft, (v) => { setDraft(v); setDirty(true); }, dirty, () => { setDraft(JSON.parse(serialized)); setDirty(false); }];
}

function SaveRow({ dirty, saving, onSave, onReset, message }) {
  if (!dirty && !message) return null;
  return (
    <div className="pf-savebar" style={{ marginTop: 16 }}>
      <span style={{ fontSize: 13 }} className={message?.tone === 'danger' ? '' : 'muted'}>
        {message ? <span style={{ color: message.tone === 'danger' ? 'var(--cmp-danger)' : 'var(--cmp-success)', fontWeight: 600 }}>{message.text}</span> : 'You have unsaved changes.'}
      </span>
      {dirty && (
        <span className="row" style={{ gap: 8 }}>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onReset} disabled={saving}>Undo</button>
          <button type="button" className="btn btn-primary btn-sm" onClick={onSave} disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</button>
        </span>
      )}
    </div>
  );
}

function PhotosTab({ project, updateProject, uploadFile }) {
  const [media, setMedia, dirty, reset] = useDraft({ photos: project.photos, brochure: project.brochure });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const save = async () => {
    setSaving(true);
    setMessage(null);
    try {
      await updateProject(project.id, { photos: media.photos, brochure: media.brochure });
      setMessage({ tone: 'success', text: 'Photos saved.' });
    } catch (err) {
      setMessage({ tone: 'danger', text: errorMessage(err, 'Could not save the photos.') });
    } finally {
      setSaving(false);
    }
  };
  return (
    <section className="card" style={{ padding: 20 }}>
      <h2 style={{ fontSize: 16, margin: '0 0 4px' }}>Photos, renders and plans</h2>
      <p className="muted" style={{ margin: '0 0 16px', fontSize: 13.5 }}>Six pictures is the minimum before a project can go live.</p>
      <PhotoManager
        photos={media.photos}
        onChange={(photos) => { setMessage(null); setMedia({ ...media, photos }); }}
        brochure={media.brochure}
        onBrochure={(brochure) => { setMessage(null); setMedia({ ...media, brochure }); }}
        upload={uploadFile}
      />
      <SaveRow dirty={dirty} saving={saving} onSave={save} onReset={reset} message={message} />
    </section>
  );
}

function DocumentsTab({ project, updateProject, uploadFile }) {
  const [docs, setDocs, dirty, reset] = useDraft(project.documents);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const save = async () => {
    setSaving(true);
    setMessage(null);
    try {
      await updateProject(project.id, { documents: docs });
      setMessage({ tone: 'success', text: 'Documents saved. Cash My Property will check the new files.' });
    } catch (err) {
      setMessage({ tone: 'danger', text: errorMessage(err, 'Could not save the documents.') });
    } finally {
      setSaving(false);
    }
  };
  return (
    <section className="card" style={{ padding: 22 }}>
      <h2 style={{ fontSize: 16, margin: '0 0 4px' }}>Documents</h2>
      <p className="muted" style={{ margin: '0 0 16px', fontSize: 13.5 }}>
        What has to sit behind the project before it can be advertised. Cash My Property checks each file and the number on it.
      </p>
      <DocumentsSummaryBar documents={docs} />
      <ProjectDocumentsEditor
        documents={docs}
        upload={uploadFile}
        onChange={(key, patch) => { setMessage(null); setDocs({ ...docs, [key]: { ...docs[key], ...patch } }); }}
      />
      <SaveRow dirty={dirty} saving={saving} onSave={save} onReset={reset} message={message} />
    </section>
  );
}

function EnquiriesTab({ rows, team }) {
  const nameOf = (e) => e.pickedUpByName || team.find((m) => m.id === e.pickedUpBy)?.name || '';
  if (!rows.length) return <section className="card" style={{ padding: 24 }}><p className="muted" style={{ margin: 0 }}>No enquiries on this project yet.</p></section>;
  return (
    <section className="card" style={{ padding: 0 }}>
      <ul className="priority-list">
        {rows.map((e) => (
          <li key={e.id} style={{ alignItems: 'flex-start' }}>
            <Avatar name={e.buyer} size={32} />
            <span style={{ flex: 1, minWidth: 0 }}>
              <strong style={{ fontSize: 14 }}>{e.buyer}</strong>{' '}
              <span className="faint" style={{ fontSize: 12 }}>· {[e.unit, e.channel, timeAgo(e.createdAt)].filter(Boolean).join(' · ')}</span>
              {e.message && <span style={{ display: 'block', fontSize: 13.5, marginTop: 4 }}>{e.message}</span>}
              <span className="faint" style={{ display: 'block', fontSize: 12, marginTop: 4 }}>
                {e.pickedUpBy ? `Picked up by ${nameOf(e)}` : 'Not picked up yet'}
              </span>
            </span>
            <Badge variant={e.status === 'NEW' ? 'accent' : e.status === 'LOST' ? 'danger' : 'neutral'}>{ENQUIRY_STATUS[e.status] || e.status}</Badge>
          </li>
        ))}
      </ul>
      <p className="faint" style={{ margin: 0, padding: '10px 20px 14px', fontSize: 12.5 }}>
        Pick up and update enquiries in the <NavLink to="/developer/enquiries">Enquiries inbox</NavLink>.
      </p>
    </section>
  );
}

