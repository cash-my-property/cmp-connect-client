import React, { useMemo, useState } from 'react';
import { NavLink, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Check, Video, Upload, Loader2, X } from 'lucide-react';
import {
  useDeveloper, useLoad, planTotal, newId, formatAed, MIN_PHOTOS
} from '../../context/DeveloperContext';
import { InfoNote, LoadState, Notice } from './DeveloperUi';
import { errorMessage } from '../../utils/developerMappers';
import { FreeAllowanceChip, FreeAllowanceNote, useFreeQuota } from '../../components/common/FreeAllowance';
import { PhotoManager } from './ProjectDetailPage';
import DescriptionCounter from '../../components/common/DescriptionCounter';
import GooglePlacesLocationInput from '../../components/common/GooglePlacesLocationInput';
import ProjectDocumentsEditor, { DocumentsSummaryBar } from './ProjectDocuments';
import { emptyDocuments, normalizeDocuments, documentsSummary } from '../../utils/projectDocuments';
import './projectForm.css';

const blankProject = () => ({
  id: newId('p'),
  name: '',
  community: '',
  emirate: 'Dubai',
  stage: 'Off-plan',
  status: 'DRAFT',
  handoverDate: '',
  launchDate: '',
  buildPct: 0,
  ownershipType: 'Freehold',
  governmentFeePct: 4,
  buildingsCount: '',
  video: null,
  geo: null,
  locationLabel: '',
  rera: '',
  escrowAccount: '',
  escrowBank: '',
  escrowLetter: false,
  documents: emptyDocuments(),
  escrowLetterName: '',
  serviceCharge: '',
  dldWaiver: '',
  description: '',
  amenities: [],
  unitTypes: [],
  paymentPlan: [],
  photos: [],
  brochure: '',
  views30d: 0,
  saves: 0,
  enquiries30d: 0
});

const UNIT_PRESETS = [
  { label: 'Studio', type: 'Apartment', beds: '0' },
  { label: '1 bedroom', type: 'Apartment', beds: '1' },
  { label: '2 bedroom', type: 'Apartment', beds: '2' },
  { label: '3 bedroom', type: 'Apartment', beds: '3' },
  { label: '3 bedroom townhouse', type: 'Townhouse', beds: '3' },
  { label: '4 bedroom villa', type: 'Villa', beds: '4' }
];

const PLAN_PRESETS = [
  {
    label: '10 / 50 / 40',
    rows: [['On booking', 10, 'At reservation'], ['During construction', 50, 'In instalments until handover'], ['On handover', 40, 'At handover']]
  },
  {
    label: '20 / 40 / 40',
    rows: [['On booking', 20, 'At reservation'], ['During construction', 40, 'Quarterly until handover'], ['On handover', 40, 'At handover']]
  },
  { label: '20 / 80', rows: [['On booking', 20, 'At reservation'], ['On handover', 80, 'At handover']] }
];

const blankUnit = (preset = {}) => ({
  id: newId('u'), label: '', type: 'Apartment', beds: '', sizeFrom: '', sizeTo: '', priceFrom: '', total: '', available: 0, reserved: 0, sold: 0, ...preset
});
const blankMilestone = (milestone = '', share = '', due = '') => ({ id: newId('pp'), milestone, share, due });

const SECTIONS = [
  { id: 'pf-basics', title: 'The project' },
  { id: 'pf-documents', title: 'Documents' },
  { id: 'pf-costs', title: 'Costs for the buyer' },
  { id: 'pf-photos', title: 'Photos, video and brochure' },
  { id: 'pf-units', title: 'Unit types' },
  { id: 'pf-plan', title: 'Payment plan' }
];

const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

function FormField({ id, label, required, hint, error, className = '', children }) {
  return (
    <div className={`pf-field ${className}`} data-invalid={error ? 'true' : undefined}>
      <label htmlFor={id}>
        {label}
        {required && <span className="req" aria-hidden="true">*</span>}
      </label>
      {children}
      {error ? <span className="pf-error" role="alert">{error}</span> : hint ? <span className="pf-hint">{hint}</span> : null}
    </div>
  );
}

function Affix({ prefix, suffix, ...inputProps }) {
  return (
    <div className="pf-affix">
      {prefix && <span>{prefix}</span>}
      <input {...inputProps} />
      {suffix && <span>{suffix}</span>}
    </div>
  );
}

// Project video tour (ek video) — Cloudinary kind=video
function VideoField({ video, onChange, upload }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const onFile = async (file) => {
    if (!file) return;
    if (!String(file.type).startsWith('video/')) { setErr('Choose a video file (MP4, MOV or WebM).'); return; }
    if (file.size > 100 * 1024 * 1024) { setErr('The video can be up to 100 MB.'); return; }
    setErr('');
    setBusy(true);
    try {
      const up = await upload(file, 'video');
      onChange({ url: up.url, public_id: up.public_id || '', fileName: up.fileName || file.name });
    } catch (e) {
      setErr(e?.data?.message || e?.message || 'Could not upload the video.');
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="card" style={{ padding: 16, marginTop: 16 }}>
      <strong style={{ fontSize: 14 }}>Video tour</strong>
      <p className="faint" style={{ margin: '2px 0 10px', fontSize: 12.5 }}>Optional. A walkthrough or drone video buyers can play on the project page. MP4, MOV or WebM, up to 100 MB.</p>
      {video?.url && (
        <video src={video.url} controls preload="metadata" style={{ width: '100%', maxWidth: 420, borderRadius: 10, display: 'block', marginBottom: 10, background: '#000' }} />
      )}
      <div className="row" style={{ gap: 10, flexWrap: 'wrap' }}>
        {video?.url && <span className="chip"><Video size={13} /> {video.fileName || 'Video tour'}</span>}
        <label className="btn btn-outline btn-sm" style={{ margin: 0, cursor: busy ? 'wait' : 'pointer' }}>
          {busy ? <Loader2 size={14} className="spin" /> : <Upload size={14} />} {busy ? 'Uploading…' : video?.url ? 'Replace video' : 'Upload a video'}
          <input type="file" accept="video/mp4,video/quicktime,video/webm" hidden disabled={busy} onChange={(e) => { onFile(e.target.files?.[0]); e.target.value = ''; }} />
        </label>
        {video?.url && (
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => onChange(null)}><X size={14} /> Remove</button>
        )}
      </div>
      {err && <p className="pf-error" style={{ margin: '10px 0 0' }}>{err}</p>}
    </div>
  );
}

function SectionHead({ step, done, title, subtitle, action }) {
  return (
    <div className="pf-section-head">
      <span className="pf-step" data-done={done ? 'true' : undefined} aria-hidden="true">
        {done ? <Check size={15} /> : step}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <h2>{title}</h2>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

// Edit mode: live mein pehle poora project load karo, phir form
export default function ProjectFormPage() {
  const { id } = useParams();
  const { isLive, getProject, loadProject } = useDeveloper();
  const { loading, error, reload } = useLoad(() => (id ? loadProject(id) : Promise.resolve()), [id]);
  const existing = id ? getProject(id) : null;
  if (id && (!existing || (isLive && !existing._detail))) {
    return (
      <LoadState loading={loading} error={error} onRetry={reload}>
        <section className="card" style={{ padding: 32, textAlign: 'center' }}>
          <h2 style={{ fontSize: 17, margin: '0 0 8px' }}>Project not found</h2>
          <NavLink to="/developer/projects" className="btn btn-outline btn-sm">Back to projects</NavLink>
        </section>
      </LoadState>
    );
  }
  return <ProjectForm key={existing?.id || 'new'} existing={existing} />;
}

function ProjectForm({ existing }) {
  const navigate = useNavigate();
  const { saveProject, uploadFile, projectOptions } = useDeveloper();
  // Dropdowns / amenities backend ke options se (live); mock / fail pe local defaults
  const { stages: STAGES, emirates: EMIRATES, unitKinds: UNIT_KINDS, amenities: AMENITY_SUGGESTIONS } = projectOptions;
  const [customAmenity, setCustomAmenity] = useState('');
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState('');
  const [form, setForm] = useState(() => (existing ? (() => { const p = JSON.parse(JSON.stringify(existing)); return { ...p, documents: normalizeDocuments(p) }; })() : blankProject()));
  const [errors, setErrors] = useState({});

  const total = planTotal(form);
  const unitsCount = form.unitTypes.reduce((s, u) => s + (Number(u.total) || 0), 0);
  const prices = form.unitTypes.map((u) => Number(u.priceFrom)).filter((n) => n > 0);

  const docSummary = useMemo(() => documentsSummary(form.documents), [form.documents]);

  // Go-live checklist (side panel)
  const checklist = useMemo(() => [
    { key: 'name', label: 'Name and community', done: Boolean(form.name.trim() && form.community.trim()), section: 'pf-basics' },
    { key: 'handover', label: 'Handover date', done: Boolean(form.handoverDate), section: 'pf-basics' },
    { key: 'rera', label: 'RERA / DLD project number', done: Boolean(String(form.documents.dldRegistration?.number || '').trim()), section: 'pf-documents' },
    { key: 'escrow', label: 'Escrow account letter', done: Boolean(form.documents.escrowLetter?.fileName), section: 'pf-documents' },
    { key: 'photos', label: `${MIN_PHOTOS} photos or renders`, done: form.photos.length >= MIN_PHOTOS, section: 'pf-photos' },
    { key: 'units', label: 'At least one unit type', done: form.unitTypes.some((u) => u.label.trim() && Number(u.total) > 0), section: 'pf-units' },
    { key: 'plan', label: 'Payment plan adds up to 100%', done: total === 100, section: 'pf-plan' }
  ], [form, total]);
  const doneCount = checklist.filter((c) => c.done).length;
  const ready = doneCount === checklist.length;

  const sectionDone = {
    'pf-basics': checklist[0].done && checklist[1].done,
    'pf-documents': checklist[2].done && checklist[3].done && docSummary.inHand === docSummary.total,
    'pf-costs': Boolean((form.escrowBank || '').trim()),
    'pf-photos': checklist[4].done,
    'pf-units': checklist[5].done,
    'pf-plan': checklist[6].done
  };

  const clearError = (key) => setErrors((e) => {
    if (!e[key]) return e;
    const next = { ...e };
    delete next[key];
    return next;
  });
  const set = (key) => (e) => {
    const value = e?.target ? e.target.value : e;
    setForm((f) => ({ ...f, [key]: value }));
    clearError(key);
    setServerError('');
  };
  const setUnit = (uid, key, value) => {
    setForm((f) => ({ ...f, unitTypes: f.unitTypes.map((u) => (u.id === uid ? { ...u, [key]: value } : u)) }));
    clearError(`unit-${uid}`);
  };
  const setMilestone = (mid, key, value) => {
    setForm((f) => ({ ...f, paymentPlan: f.paymentPlan.map((m) => (m.id === mid ? { ...m, [key]: value } : m)) }));
    clearError('plan');
  };
  const addCustomAmenity = () => {
    const a = customAmenity.trim().slice(0, 60);
    if (!a) return;
    setForm((f) => (f.amenities.some((x) => x.toLowerCase() === a.toLowerCase()) ? f : { ...f, amenities: [...f.amenities, a] }));
    setCustomAmenity('');
  };
  const toggleAmenity = (a) => setForm((f) => ({ ...f, amenities: f.amenities.includes(a) ? f.amenities.filter((x) => x !== a) : [...f.amenities, a] }));
  const setDocument = (key, patch) => {
    setForm((f) => ({ ...f, documents: { ...f.documents, [key]: { ...f.documents[key], ...patch } } }));
    setServerError('');
  };
  const addUnit = (preset) => setForm((f) => ({ ...f, unitTypes: [...f.unitTypes, blankUnit(preset)] }));
  const applyPlan = (preset) => setForm((f) => ({ ...f, paymentPlan: preset.rows.map(([m, s, d]) => blankMilestone(m, s, d)) }));

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Give the project a name.';
    if (!form.community.trim()) errs.community = 'Add the community it is in.';
    const pct = Number(form.buildPct);
    if (form.buildPct !== '' && (pct < 0 || pct > 100)) errs.buildPct = 'Between 0 and 100.';
    const gov = Number(form.governmentFeePct);
    if (form.governmentFeePct !== '' && form.governmentFeePct != null && (gov < 0 || gov > 10)) errs.governmentFeePct = 'Between 0 and 10%.';
    form.unitTypes.forEach((u) => {
      const t = Number(u.total) || 0;
      if (!u.label.trim()) errs[`unit-${u.id}`] = 'Add a label, e.g. “2 bedroom”.';
      else if (t < 1) errs[`unit-${u.id}`] = 'Add how many units of this type there are.';
      else if (u.sizeFrom && u.sizeTo && Number(u.sizeTo) < Number(u.sizeFrom)) errs[`unit-${u.id}`] = '“Size to” cannot be smaller than “Size from”.';
      else if (t < (Number(u.reserved) || 0) + (Number(u.sold) || 0)) errs[`unit-${u.id}`] = `${(Number(u.reserved) || 0) + (Number(u.sold) || 0)} are already reserved or sold, so the total cannot be lower.`;
    });
    if (form.paymentPlan.length && total !== 100) errs.plan = `The milestones add up to ${total}%. They need to make exactly 100%.`;
    if (form.paymentPlan.some((m) => !m.milestone.trim())) errs.plan = errs.plan || 'Every milestone needs a name.';
    return errs;
  };

  const handleSave = async () => {
    const errs = validate();
    setErrors(errs);
    const firstKey = Object.keys(errs)[0];
    if (firstKey) {
      const section = firstKey.startsWith('unit-') ? 'pf-units' : firstKey === 'plan' ? 'pf-plan' : firstKey === 'governmentFeePct' ? 'pf-costs' : 'pf-basics';
      scrollTo(section);
      return;
    }

    const unitTypes = form.unitTypes.map((u) => {
      const totalUnits = Number(u.total) || 0;
      const reserved = Number(u.reserved) || 0;
      const sold = Number(u.sold) || 0;
      return {
        ...u,
        label: u.label.trim(),
        beds: u.beds === '' ? '' : Number(u.beds),
        sizeFrom: Number(u.sizeFrom) || '',
        sizeTo: Number(u.sizeTo) || '',
        priceFrom: Number(u.priceFrom) || '',
        total: totalUnits,
        reserved,
        sold,
        available: Math.max(0, totalUnits - reserved - sold)
      };
    });
    const paymentPlan = form.paymentPlan.map((m) => ({ ...m, milestone: m.milestone.trim(), share: Number(m.share) || 0 }));
    const saved = {
      ...form,
      name: form.name.trim(),
      community: form.community.trim(),
      unitTypes,
      paymentPlan,
      buildPct: Math.max(0, Math.min(100, Number(form.buildPct) || 0))
    };

    setSaving(true);
    setServerError('');
    try {
      const result = await saveProject(saved, { isNew: !existing });
      navigate(`/developer/projects/${result?.id || saved.id}`);
    } catch (err) {
      setServerError(errorMessage(err, 'Could not save the project. Please try again.'));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSaving(false);
    }
  };

  const cancelTo = existing ? `/developer/projects/${existing.id}` : '/developer/projects';
  const errorCount = Object.keys(errors).length;
  const planColor = total === 100 ? 'var(--cmp-success)' : total > 100 ? 'var(--cmp-danger)' : 'var(--cmp-warning)';

  return (
    <div>
      <NavLink to={cancelTo} className="btn btn-ghost btn-sm" style={{ marginBottom: 10 }}>
        <ArrowLeft size={15} /> {existing ? existing.name : 'All projects'}
      </NavLink>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 26, letterSpacing: '-0.02em', margin: 0 }}>{existing ? 'Edit project' : 'Add a project'}</h1>
        <p className="muted" style={{ margin: '4px 0 0', fontSize: 14, maxWidth: 760 }}>
          A building or community you are selling. Buyers see it under your developer name — there is no agent on a project. You can save at any point; it stays a draft until the checklist is complete.
        </p>
      </div>

      <Notice onClose={() => setServerError('')}>{serverError}</Notice>
      {/* Muft projects: naya ya draft hi apna slot lega (review mein ja chuka project nahi) */}
      {(!existing || existing.status === 'DRAFT') && <FreeAllowanceNote kind="PROJECT" />}
      {existing?.status === 'LIVE' && (
        <InfoNote>
          This project is live. Changing its registration or escrow details sends it back to Cash My Property for review.
        </InfoNote>
      )}
      {existing?.status === 'REJECTED' && existing.rejectionReason && (
        <InfoNote tone="warning"><strong>Sent back:</strong> {existing.rejectionReason}</InfoNote>
      )}

      <div className="pf-layout">
        <div className="pf-main">
          {/* 1. Basics */}
          <section id="pf-basics" className="card pf-section">
            <SectionHead step={1} done={sectionDone['pf-basics']} title="The project" subtitle="What buyers see first: the name, where it is and when it is ready." />
            <div className="pf-grid">
              <FormField id="pf-name" label="Project name" required hint="As buyers will see it." error={errors.name} className="span-all">
                <input id="pf-name" value={form.name} onChange={set('name')} placeholder="e.g. Saffar Rise" autoComplete="off" />
              </FormField>
              <FormField id="pf-community" label="Community" required error={errors.community}>
                <input id="pf-community" value={form.community} onChange={set('community')} placeholder="e.g. Business Bay" />
              </FormField>
              <FormField id="pf-emirate" label="Emirate">
                <select id="pf-emirate" value={form.emirate} onChange={set('emirate')}>
                  {EMIRATES.map((e) => <option key={e}>{e}</option>)}
                </select>
              </FormField>
              <FormField id="pf-location" label="Location on the map" hint={form.geo ? 'Pinned — buyers will see the project on the map.' : 'Search the building or community so buyers can find the project on the map.'} className="span-all">
                <GooglePlacesLocationInput
                  placeholder="e.g. Saffar Rise, Business Bay, Dubai"
                  value={form.locationLabel || ''}
                  onChange={(val) => setForm((f) => ({ ...f, locationLabel: val, geo: null }))}
                  onSelectLocation={({ address, lat, lng, community, subCommunity, emirate }) => setForm((f) => ({
                    ...f,
                    locationLabel: address,
                    // Coordinates backend ko jaate hain, UI pe nahi dikhte
                    geo: lat != null && lng != null ? { lat, lng } : null,
                    community: f.community || community || subCommunity || '',
                    emirate: EMIRATES.includes(emirate) ? emirate : f.emirate
                  }))}
                />
              </FormField>
              <FormField id="pf-stage" label="Stage">
                <div className="segmented pf-seg" role="radiogroup" id="pf-stage" aria-label="Stage">
                  {STAGES.map((s) => (
                    <button key={s} type="button" role="radio" aria-checked={form.stage === s} aria-selected={form.stage === s} onClick={() => set('stage')(s)}>
                      {s}
                    </button>
                  ))}
                </div>
              </FormField>
              <FormField id="pf-handover" label="Handover date" hint="Needed before the project can go live.">
                <input id="pf-handover" type="date" value={form.handoverDate} onChange={set('handoverDate')} />
              </FormField>
              <FormField id="pf-ownership" label="Ownership">
                <div className="segmented pf-seg" role="radiogroup" id="pf-ownership" aria-label="Ownership">
                  {['Freehold', 'Leasehold'].map((o) => (
                    <button key={o} type="button" role="radio" aria-checked={form.ownershipType === o} aria-selected={form.ownershipType === o} onClick={() => set('ownershipType')(o)}>{o}</button>
                  ))}
                </div>
              </FormField>
              <FormField id="pf-buildings" label="Number of buildings" hint="Leave empty if it does not apply.">
                <input id="pf-buildings" type="number" min="0" max="1000" step="1" value={form.buildingsCount} onChange={set('buildingsCount')} placeholder="e.g. 1" />
              </FormField>
              <FormField id="pf-build" label="Construction progress" error={errors.buildPct} className="span-all">
                <div className="pf-range-row">
                  <input
                    id="pf-build"
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    value={Number(form.buildPct) || 0}
                    onChange={set('buildPct')}
                    style={{ background: `linear-gradient(to right, var(--cmp-brand) ${Number(form.buildPct) || 0}%, var(--cmp-border) ${Number(form.buildPct) || 0}%)` }}
                  />
                  <span className="pf-range-val">{Number(form.buildPct) || 0}%</span>
                </div>
              </FormField>
              <FormField id="pf-desc" label="Description" className="span-all">
                <textarea id="pf-desc" rows={4} value={form.description} onChange={set('description')} maxLength={5000} placeholder="What it is, where it is and when it is ready. Two or three sentences." />
                <DescriptionCounter text={form.description} />
              </FormField>
              <div className="pf-field span-all">
                <span style={{ fontSize: 13, fontWeight: 600 }}>Amenities <span className="faint" style={{ fontWeight: 400 }}>· {form.amenities.length} selected</span></span>
                <div className="pf-chips">
                  {/* Suggestions + project pe pehle se jo custom amenities hain */}
                  {[...AMENITY_SUGGESTIONS, ...form.amenities.filter((a) => !AMENITY_SUGGESTIONS.includes(a))].map((a) => (
                    <button key={a} type="button" className="chip" aria-pressed={form.amenities.includes(a)} onClick={() => toggleAmenity(a)}>
                      {form.amenities.includes(a) && <Check size={13} />} {a}
                    </button>
                  ))}
                </div>
                <div className="row" style={{ gap: 8, maxWidth: 420 }}>
                  <input
                    aria-label="Add your own amenity"
                    placeholder="Add your own, e.g. Padel court"
                    value={customAmenity}
                    maxLength={60}
                    onChange={(e) => setCustomAmenity(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustomAmenity(); } }}
                  />
                  <button type="button" className="btn btn-outline btn-sm" onClick={addCustomAmenity} disabled={!customAmenity.trim()}><Plus size={14} /> Add</button>
                </div>
              </div>
            </div>
          </section>

          {/* 2. Documents */}
          <section id="pf-documents" className="card pf-section">
            <SectionHead
              step={2}
              done={sectionDone['pf-documents']}
              title="Documents"
              subtitle="What has to sit behind the project before it can be advertised, and the numbers that come off each paper. Fill in what you have now — the rest can follow, and the project waits as a draft until it is all here."
            />
            <DocumentsSummaryBar documents={form.documents} />
            <ProjectDocumentsEditor documents={form.documents} onChange={setDocument} upload={uploadFile} />
          </section>

          {/* 3. Costs for the buyer */}
          <section id="pf-costs" className="card pf-section">
            <SectionHead step={3} done={sectionDone['pf-costs']} title="Costs for the buyer" subtitle="Shown on the project page next to the price, so buyers know what they pay on top." />
            <div className="pf-grid cols-3">
              <FormField id="pf-bank" label="Escrow bank" hint="The bank holding the project escrow account.">
                <input id="pf-bank" value={form.escrowBank} onChange={set('escrowBank')} placeholder="e.g. Emirates NBD" />
              </FormField>
              <FormField id="pf-service" label="Service charge" hint="Leave empty if it is not set yet.">
                <Affix id="pf-service" type="number" min="0" step="0.01" prefix="AED" suffix="/ sqft" value={form.serviceCharge} onChange={set('serviceCharge')} />
              </FormField>
              <FormField id="pf-dld" label="DLD fee waiver" hint="As a percentage, if you are offering one.">
                <Affix id="pf-dld" type="number" min="0" max="100" suffix="%" value={form.dldWaiver} onChange={set('dldWaiver')} />
              </FormField>
              <FormField id="pf-govfee" label="Government fee" hint="Shown to buyers as the DLD fee, usually 4%." error={errors.governmentFeePct}>
                <Affix id="pf-govfee" type="number" min="0" max="10" step="0.5" suffix="%" value={form.governmentFeePct} onChange={set('governmentFeePct')} />
              </FormField>
            </div>
          </section>

          {/* 3. Photos */}
          <section id="pf-photos" className="card pf-section">
            <SectionHead step={4} done={sectionDone['pf-photos']} title="Photos, video and brochure" subtitle={`Buyers look at the pictures before they read anything. ${MIN_PHOTOS} is the minimum to go live; the cover shows in search results.`} />
            <PhotoManager
              upload={uploadFile}
              photos={form.photos}
              onChange={(photos) => setForm((f) => ({ ...f, photos }))}
              brochure={form.brochure}
              onBrochure={(brochure) => setForm((f) => ({ ...f, brochure }))}
            />
            <VideoField video={form.video} onChange={(video) => setForm((f) => ({ ...f, video }))} upload={uploadFile} />
          </section>

          {/* 4. Unit types */}
          <section id="pf-units" className="card pf-section">
            <SectionHead
              step={5}
              done={sectionDone['pf-units']}
              title="Unit types"
              subtitle={form.unitTypes.length
                ? `${form.unitTypes.length} ${form.unitTypes.length === 1 ? 'type' : 'types'} · ${unitsCount.toLocaleString('en-AE')} units${prices.length ? ` · from ${formatAed(Math.min(...prices))}` : ''}`
                : 'One for each layout you sell. Availability is tracked per unit type.'}
              action={form.unitTypes.length > 0 && (
                <button type="button" className="btn btn-outline btn-sm" onClick={() => addUnit()}><Plus size={15} /> Add</button>
              )}
            />

            {form.unitTypes.length > 0 && (
              <div className="pf-rows" style={{ marginBottom: 14 }}>
                {form.unitTypes.map((u, i) => {
                  const err = errors[`unit-${u.id}`];
                  const locked = (Number(u.reserved) || 0) + (Number(u.sold) || 0);
                  return (
                    <div key={u.id} className="pf-row" style={err ? { borderColor: 'var(--cmp-danger)' } : undefined}>
                      <div className="pf-row-head">
                        <span className="pf-row-title">{u.label.trim() || `Unit type ${i + 1}`}</span>
                        <button
                          type="button"
                          className="icon-button"
                          aria-label={`Remove ${u.label || `unit type ${i + 1}`}`}
                          disabled={locked > 0}
                          title={locked > 0 ? 'Units of this type are reserved or sold' : 'Remove'}
                          onClick={() => setForm((f) => ({ ...f, unitTypes: f.unitTypes.filter((x) => x.id !== u.id) }))}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                      <div className="pf-unit-grid">
                        <FormField id={`${u.id}-label`} label="Label" required>
                          <input id={`${u.id}-label`} value={u.label} placeholder="2 bedroom" onChange={(e) => setUnit(u.id, 'label', e.target.value)} />
                        </FormField>
                        <FormField id={`${u.id}-type`} label="Type">
                          <select id={`${u.id}-type`} value={u.type} onChange={(e) => setUnit(u.id, 'type', e.target.value)}>
                            {UNIT_KINDS.map((k) => <option key={k}>{k}</option>)}
                          </select>
                        </FormField>
                        <FormField id={`${u.id}-beds`} label="Bedrooms">
                          <select id={`${u.id}-beds`} value={u.beds} onChange={(e) => setUnit(u.id, 'beds', e.target.value)}>
                            <option value="">Select</option>
                            <option value="0">Studio</option>
                            {[1, 2, 3, 4, 5, 6, 7].map((n) => <option key={n} value={n}>{n}</option>)}
                          </select>
                        </FormField>
                      </div>
                      <div className="pf-unit-grid second">
                        <FormField id={`${u.id}-sf`} label="Size from">
                          <Affix id={`${u.id}-sf`} type="number" min="0" suffix="sqft" value={u.sizeFrom} onChange={(e) => setUnit(u.id, 'sizeFrom', e.target.value)} />
                        </FormField>
                        <FormField id={`${u.id}-st`} label="Size to">
                          <Affix id={`${u.id}-st`} type="number" min="0" suffix="sqft" value={u.sizeTo} onChange={(e) => setUnit(u.id, 'sizeTo', e.target.value)} />
                        </FormField>
                        <FormField id={`${u.id}-price`} label="Price from">
                          <Affix id={`${u.id}-price`} type="number" min="0" step="1000" prefix="AED" value={u.priceFrom} onChange={(e) => setUnit(u.id, 'priceFrom', e.target.value)} />
                        </FormField>
                        <FormField id={`${u.id}-total`} label="How many" required hint={locked ? `${locked} reserved or sold` : undefined}>
                          <Affix id={`${u.id}-total`} type="number" min={locked || 0} suffix="units" value={u.total} onChange={(e) => setUnit(u.id, 'total', e.target.value)} />
                        </FormField>
                      </div>
                      {err && <p className="pf-error" role="alert" style={{ margin: '10px 0 0' }}>{err}</p>}
                    </div>
                  );
                })}
              </div>
            )}

            <div className={form.unitTypes.length ? '' : 'pf-empty'}>
              {!form.unitTypes.length && <p style={{ margin: '0 0 12px' }}>No unit types yet. Start from a common layout:</p>}
              <div className="pf-chips" style={{ justifyContent: form.unitTypes.length ? 'flex-start' : 'center' }}>
                {form.unitTypes.length > 0 && <span className="faint" style={{ fontSize: 12.5, alignSelf: 'center' }}>Quick add:</span>}
                {UNIT_PRESETS.map((p) => (
                  <button key={p.label} type="button" className="chip" onClick={() => addUnit(p)}><Plus size={13} /> {p.label}</button>
                ))}
                {!form.unitTypes.length && (
                  <button type="button" className="chip" onClick={() => addUnit()}><Plus size={13} /> Custom</button>
                )}
              </div>
            </div>
          </section>

          {/* 5. Payment plan */}
          <section id="pf-plan" className="card pf-section">
            <SectionHead
              step={6}
              done={sectionDone['pf-plan']}
              title="Payment plan"
              subtitle="The milestones buyers pay against. They have to add up to exactly 100%."
              action={form.paymentPlan.length > 0 && (
                <button type="button" className="btn btn-outline btn-sm" onClick={() => setForm((f) => ({ ...f, paymentPlan: [...f.paymentPlan, blankMilestone()] }))}>
                  <Plus size={15} /> Add
                </button>
              )}
            />

            {form.paymentPlan.length === 0 ? (
              <div className="pf-empty">
                <p style={{ margin: '0 0 12px' }}>No milestones yet. Start from a common plan or build your own:</p>
                <div className="pf-chips" style={{ justifyContent: 'center' }}>
                  {PLAN_PRESETS.map((p) => (
                    <button key={p.label} type="button" className="chip" onClick={() => applyPlan(p)}>{p.label}</button>
                  ))}
                  <button type="button" className="chip" onClick={() => setForm((f) => ({ ...f, paymentPlan: [blankMilestone()] }))}><Plus size={13} /> Custom</button>
                </div>
              </div>
            ) : (
              <>
                <div style={{ marginBottom: 16 }}>
                  <div className="row" style={{ justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                    <span className="muted">Total</span>
                    <strong style={{ color: planColor }}>
                      {total}% {total === 100 ? '· complete' : total > 100 ? `· ${total - 100}% over` : `· ${100 - total}% to go`}
                    </strong>
                  </div>
                  <div className="pf-progress"><span style={{ width: `${Math.min(100, total)}%`, background: planColor }} /></div>
                </div>
                <div className="pf-rows">
                  {form.paymentPlan.map((m, i) => (
                    <div key={m.id} className="pf-plan-row">
                      <FormField id={`${m.id}-m`} label={i === 0 ? 'Milestone' : <span className="visually-hidden">Milestone</span>}>
                        <input id={`${m.id}-m`} value={m.milestone} placeholder="On booking" onChange={(e) => setMilestone(m.id, 'milestone', e.target.value)} />
                      </FormField>
                      <FormField id={`${m.id}-s`} label={i === 0 ? 'Share' : <span className="visually-hidden">Share</span>}>
                        <Affix id={`${m.id}-s`} type="number" min="0" max="100" suffix="%" value={m.share} onChange={(e) => setMilestone(m.id, 'share', e.target.value)} />
                      </FormField>
                      <FormField id={`${m.id}-d`} className="pf-plan-due" label={i === 0 ? 'When it falls due' : <span className="visually-hidden">When it falls due</span>}>
                        <input id={`${m.id}-d`} value={m.due} placeholder="At reservation" onChange={(e) => setMilestone(m.id, 'due', e.target.value)} />
                      </FormField>
                      <button
                        type="button"
                        className="icon-button"
                        aria-label={`Remove ${m.milestone || 'milestone'}`}
                        style={{ marginBottom: 2 }}
                        onClick={() => setForm((f) => ({ ...f, paymentPlan: f.paymentPlan.filter((x) => x.id !== m.id) }))}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))}
                </div>
                {errors.plan && <p className="pf-error" role="alert" style={{ margin: '12px 0 0' }}>{errors.plan}</p>}
              </>
            )}
          </section>

          {/* Sticky save bar */}
          <div className="pf-savebar">
            <span style={{ fontSize: 13 }}>
              {errorCount > 0 ? (
                <span style={{ color: 'var(--cmp-danger)', fontWeight: 600 }}>{errorCount} {errorCount === 1 ? 'field needs' : 'fields need'} attention</span>
              ) : ready ? (
                <span style={{ color: 'var(--cmp-success)', fontWeight: 600 }}>Ready — goes to Cash My Property for review</span>
              ) : (
                <span className="muted">Saves as a draft · {doneCount} of {checklist.length} done to go live</span>
              )}
            </span>
            <span className="row" style={{ gap: 8 }}>
              <NavLink to={cancelTo} className="btn btn-ghost btn-sm">Cancel</NavLink>
              <button type="button" className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving…' : existing ? 'Save changes' : ready ? 'Save and submit' : 'Save draft'}
              </button>
            </span>
          </div>
        </div>

        {/* Side: go-live checklist + section nav */}
        <aside className="pf-aside">
          <section className="card" style={{ padding: 18 }}>
            <div className="row" style={{ justifyContent: 'space-between', marginBottom: 8 }}>
              <h2 style={{ fontSize: 15, margin: 0 }}>Ready to go live</h2>
              <strong style={{ fontSize: 13, color: ready ? 'var(--cmp-success)' : 'var(--cmp-text-muted)' }}>{doneCount}/{checklist.length}</strong>
            </div>
            <div className="pf-progress" style={{ marginBottom: 10 }}>
              <span style={{ width: `${(doneCount / checklist.length) * 100}%`, background: 'var(--cmp-brand)' }} />
            </div>
            <ul className="pf-check">
              {checklist.map((c) => (
                <li key={c.key}>
                  <button type="button" onClick={() => scrollTo(c.section)}>
                    <span className="pf-dot" data-done={c.done ? 'true' : undefined}>{c.done && <Check size={12} />}</span>
                    <span style={{ color: c.done ? 'var(--cmp-text-muted)' : 'var(--cmp-text)', textDecoration: c.done ? 'line-through' : 'none' }}>{c.label}</span>
                  </button>
                </li>
              ))}
            </ul>
            <p className="faint" style={{ margin: '10px 0 0', fontSize: 12 }}>
              You can save before everything is done. The project stays a draft and buyers can’t see it yet.
            </p>
          </section>

          <nav className="card pf-nav" style={{ padding: 10 }} aria-label="Form sections">
            <ul className="pf-check">
              {SECTIONS.map((s, i) => (
                <li key={s.id}>
                  <button type="button" onClick={() => scrollTo(s.id)}>
                    <span className="pf-step" data-done={sectionDone[s.id] ? 'true' : undefined} style={{ width: 22, height: 22, fontSize: 11 }}>
                      {sectionDone[s.id] ? <Check size={12} /> : i + 1}
                    </span>
                    {s.title}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </aside>
      </div>
    </div>
  );
}
