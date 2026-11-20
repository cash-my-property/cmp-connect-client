import React, { useRef, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { ShieldCheck, Phone, MessageCircle, Image as ImageIcon, Upload, Loader2 } from 'lucide-react';
import { useDeveloper, useLoad, unitTotals, fromPrice, formatAed, formatDate } from '../../context/DeveloperContext';
import { PageHead, Field, fieldStyle, ProjectStatusBadge, LoadState, Notice, InfoNote } from './DeveloperUi';
import { Avatar, Badge } from '../../components/ui';
import { errorMessage, REGISTRATION_FIELDS } from '../../utils/developerMappers';

const DEV_TYPES = ['Master developer', 'Sub developer', 'Sub-developer', 'Boutique developer', 'Government developer'];

export default function DeveloperProfilePage() {
  const { isLive, company, loadProfile, loadTeam } = useDeveloper();
  const { loading, error, reload } = useLoad(async () => { await loadProfile(); });
  // Mock preview ke liye team (live preview server deta hai)
  useLoad(loadTeam);

  return (
    <div>
      <LoadState loading={loading && !company} error={!company ? error : ''} onRetry={reload}>
        {company && <ProfileForm key={isLive ? 'live' : 'mock'} company={company} />}
      </LoadState>
    </div>
  );
}

function ProfileForm({ company }) {
  const { isLive, saveProfile, projects, team, uploadFile } = useDeveloper();
  const [form, setForm] = useState(company);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState({ tone: 'danger', text: '' });
  const [review, setReview] = useState(false);
  const [logoBusy, setLogoBusy] = useState(false);
  const logoRef = useRef(null);

  const set = (key) => (e) => { setNotice({ tone: 'danger', text: '' }); setForm((f) => ({ ...f, [key]: e.target.value })); };
  const registrationChanged = REGISTRATION_FIELDS.some((k) => String(form[k] || '') !== String(company[k] || ''));
  const dirty = JSON.stringify(form) !== JSON.stringify(company);

  const save = async () => {
    if (registrationChanged && !window.confirm('Changing registration details sends your account back to Cash My Property for a check. Continue?')) return;
    setSaving(true);
    setNotice({ tone: 'danger', text: '' });
    try {
      const res = await saveProfile(form);
      setReview(Boolean(res?.requiresReview));
      // Server ka saved version naya baseline (company prop update hota hai) — form wahi rehta hai
      if (res?.saved) setForm(res.saved);
      setNotice({ tone: 'success', text: 'Profile saved.' });
    } catch (err) {
      setNotice({ tone: 'danger', text: errorMessage(err, 'Could not save your profile.') });
    } finally {
      setSaving(false);
    }
  };

  const onLogo = async (file) => {
    if (!file) return;
    if (!/image\/(jpeg|png|webp|svg\+xml)/.test(file.type)) { setNotice({ tone: 'danger', text: 'The logo has to be a JPG, PNG, WebP or SVG.' }); return; }
    setLogoBusy(true);
    try {
      const up = await uploadFile(file, 'logo');
      setForm((f) => ({ ...f, logo: { url: up.url, public_id: up.public_id } }));
    } catch (err) {
      setNotice({ tone: 'danger', text: errorMessage(err, 'Could not upload the logo.') });
    } finally {
      setLogoBusy(false);
    }
  };

  // Public preview: live mein server ka, mock mein derive
  const previewProjects = isLive
    ? company.publicPreview?.projects || []
    : projects.filter((p) => ['LIVE', 'HANDED_OVER', 'SOLD_OUT'].includes(p.status));
  const shown = isLive ? company.publicPreview?.members || [] : team.filter((m) => m.shownToBuyers);
  const initials = (form.name || '').split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase();
  const projName = (id) => projects.find((p) => p.id === id)?.name;

  const actions = (
    <>
      {dirty && <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setForm(company); setNotice({ tone: 'danger', text: '' }); }} disabled={saving}>Undo changes</button>}
      <button type="button" className="btn btn-primary btn-sm" disabled={!dirty || saving} onClick={save}>{saving ? 'Saving…' : 'Save changes'}</button>
    </>
  );

  return (
    <>
      <PageHead
        title="Developer profile"
        blurb="What buyers see when they open your developer page on Cash My Property, and the registration details we check it against."
        actions={actions}
      />
      <Notice tone={notice.tone} onClose={() => setNotice({ tone: 'danger', text: '' })}>{notice.text}</Notice>
      {(review || (isLive && company.verificationStatus && !company.verified)) && (
        <InfoNote tone="warning">
          <strong>Being re-verified.</strong> You changed your registration details, so Cash My Property will check your company again. Your projects stay as they are while we do.
        </InfoNote>
      )}

      <section className="card" style={{ padding: 20, marginBottom: 18 }}>
        <div className="row" style={{ justifyContent: 'space-between', marginBottom: 14 }}>
          <h2 style={{ fontSize: 16, margin: 0 }}>What buyers see</h2>
          <span className="faint" style={{ fontSize: 12 }}>Public page preview</span>
        </div>
        <div style={{ border: '1px solid var(--cmp-border)', borderRadius: 'var(--cmp-radius-lg)', padding: 18, background: 'var(--cmp-surface-sunken)' }}>
          <div className="row" style={{ gap: 14, alignItems: 'flex-start', flexWrap: 'wrap' }}>
            {form.logo?.url
              ? <img src={form.logo.url} alt="" style={{ width: 52, height: 52, borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--cmp-border)' }} />
              : <Avatar initials={initials} size={52} />}
            <div style={{ flex: 1, minWidth: 220 }}>
              <h3 style={{ margin: 0, fontSize: 18 }}>{form.name}</h3>
              <div className="row" style={{ gap: 6, margin: '6px 0', flexWrap: 'wrap' }}>
                {company.verified && <Badge variant="success"><ShieldCheck size={13} /> Verified developer</Badge>}
                {form.developerType && <Badge>{form.developerType}</Badge>}
              </div>
              <p style={{ margin: '0 0 6px', fontSize: 14 }}>{form.about || <span className="faint">Add a few lines about your company below.</span>}</p>
              <p className="faint" style={{ margin: 0, fontSize: 12.5 }}>
                {[`${previewProjects.length} projects on Cash My Property`, form.founded ? `founded ${form.founded}` : null, form.emirate].filter(Boolean).join(' · ')}
              </p>
            </div>
          </div>

          <h4 style={{ margin: '18px 0 10px', fontSize: 14 }}>Projects on this page</h4>
          {previewProjects.length === 0 ? (
            <p className="faint" style={{ margin: 0, fontSize: 13 }}>No live projects yet. A project appears here once Cash My Property approves it.</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
              {previewProjects.map((p) => {
                const t = unitTotals(p);
                const coverUrl = p.coverPhoto?.url || p.coverPhoto || p.photos?.find((ph) => ph.cover)?.url;
                const hasCover = Boolean(coverUrl) || p.photos?.some((ph) => ph.cover);
                return (
                  <div key={p.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <div style={{ aspectRatio: '16 / 9', background: 'var(--cmp-surface)', display: 'grid', placeItems: 'center' }}>
                      {typeof coverUrl === 'string' && coverUrl
                        ? <img src={coverUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : hasCover ? <ImageIcon size={22} className="faint" /> : <NavLink to={`/developer/projects/${p.id}?tab=photos`} style={{ fontSize: 12.5 }}>Add a cover photo</NavLink>}
                    </div>
                    <div style={{ padding: 12, display: 'grid', gap: 3 }}>
                      <div className="row" style={{ justifyContent: 'space-between', gap: 6 }}>
                        <strong style={{ fontSize: 14 }}>{p.name}</strong>
                        <ProjectStatusBadge status={p.status} />
                      </div>
                      <span className="faint" style={{ fontSize: 12 }}>{p.community} · {p.stage}</span>
                      <span style={{ fontSize: 13, fontWeight: 700 }}>From {formatAed(fromPrice(p))}</span>
                      <span className="faint" style={{ fontSize: 12 }}>Handover {formatDate(p.handoverDate)} · {t.available} units available</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {shown.length > 0 && (
            <>
              <h4 style={{ margin: '18px 0 10px', fontSize: 14 }}>People buyers can contact</h4>
              <div style={{ display: 'grid', gap: 10 }}>
                {shown.map((m) => (
                  <div key={m.id} className="row" style={{ gap: 10 }}>
                    <Avatar name={m.name} size={34} />
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <strong style={{ display: 'block', fontSize: 14 }}>{m.name}</strong>
                      <span className="faint" style={{ fontSize: 12 }}>
                        {[m.position, m.brn, m.projectIds?.length ? `On ${m.projectIds.map(projName).filter(Boolean).join(', ')}` : null, m.languages?.length ? `speaks ${m.languages.join(', ')}` : null].filter(Boolean).join(' · ')}
                      </span>
                    </span>
                    <span className="row faint" style={{ gap: 8, fontSize: 12 }}><Phone size={14} /> <MessageCircle size={14} /></span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
        <p className="muted" style={{ margin: '14px 0 0', fontSize: 13 }}>
          {shown.length} of your people {shown.length === 1 ? 'is' : 'are'} shown to buyers. Otherwise Enquire goes to {form.salesEmail || 'your sales email'}{form.salesPhone ? ` and ${form.salesPhone}` : ''}, and the enquiry lands in your{' '}
          <NavLink to="/developer/enquiries">Enquiries inbox</NavLink> for whoever on your team picks it up.
        </p>
      </section>

      <div style={{ display: 'grid', gap: 18 }}>
        <section className="card" style={{ padding: 20 }}>
          <h2 style={{ fontSize: 16, margin: '0 0 14px' }}>Your details</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
            <Field label="Developer name" hint={isLive ? 'As it appears on the trade licence. Ask Cash My Property to change it.' : 'As it appears on the trade licence.'}>
              <input style={fieldStyle} value={form.name} onChange={set('name')} readOnly={isLive} />
            </Field>
            <Field label="Name in Arabic"><input dir="rtl" style={fieldStyle} value={form.nameAr} onChange={set('nameAr')} /></Field>
            <Field label="Developer type">
              {isLive
                ? <input style={fieldStyle} value={form.developerType} readOnly />
                : (
                  <select style={fieldStyle} value={form.developerType} onChange={set('developerType')}>
                    {DEV_TYPES.map((d) => <option key={d}>{d}</option>)}
                  </select>
                )}
            </Field>
            <Field label="Emirate"><input style={fieldStyle} value={form.emirate} onChange={set('emirate')} readOnly={isLive} /></Field>
            <Field label="Founded"><input style={fieldStyle} value={form.founded} onChange={set('founded')} inputMode="numeric" placeholder="e.g. 2016" /></Field>
            <Field label="Website"><input type="url" style={fieldStyle} value={form.website} onChange={set('website')} placeholder="https://" /></Field>
          </div>
          <Field label="About" hint="Buyers read this on your developer page. What you build, where, and what you have delivered." style={{ marginTop: 14 }}>
            <textarea rows={3} style={{ ...fieldStyle, resize: 'vertical' }} value={form.about} onChange={set('about')} maxLength={1000} />
          </Field>
          <Field label="Head office address" style={{ marginTop: 14 }}><input style={fieldStyle} value={form.address} onChange={set('address')} /></Field>
          <div className="row" style={{ gap: 12, marginTop: 14, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>Logo</span>
            <button type="button" className="btn btn-outline btn-sm" onClick={() => logoRef.current?.click()} disabled={logoBusy}>
              {logoBusy ? <Loader2 size={14} className="spin" /> : <Upload size={14} />} {form.logo?.url ? 'Replace logo' : 'Upload logo'}
            </button>
            <input ref={logoRef} type="file" accept="image/jpeg,image/png,image/webp,image/svg+xml" hidden onChange={(e) => { onLogo(e.target.files?.[0]); e.target.value = ''; }} />
          </div>
        </section>

        <section className="card" style={{ padding: 20 }}>
          <h2 style={{ fontSize: 16, margin: '0 0 4px' }}>Where enquiries go</h2>
          <p className="muted" style={{ margin: '0 0 14px', fontSize: 13.5 }}>These are the details on every project page, and the inbox an enquiry lands in.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
            <Field label="Sales email"><input type="email" style={fieldStyle} value={form.salesEmail} onChange={set('salesEmail')} /></Field>
            <Field label="Sales phone"><input type="tel" style={fieldStyle} value={form.salesPhone} onChange={set('salesPhone')} /></Field>
            <Field label="WhatsApp"><input type="tel" style={fieldStyle} value={form.whatsapp} onChange={set('whatsapp')} /></Field>
          </div>
        </section>

        <section className="card" style={{ padding: 20 }}>
          <h2 style={{ fontSize: 16, margin: '0 0 4px' }}>Registration</h2>
          <p className="muted" style={{ margin: '0 0 14px', fontSize: 13.5 }}>Changing any of these sends your account back to Cash My Property for a check.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
            <Field label="Trade licence number"><input style={fieldStyle} value={form.tradeLicence} onChange={set('tradeLicence')} /></Field>
            <Field label="DLD developer registration"><input style={fieldStyle} value={form.dldNumber} onChange={set('dldNumber')} /></Field>
            <Field label="TRN"><input style={fieldStyle} value={form.trn} onChange={set('trn')} /></Field>
          </div>
          <p className="faint" style={{ margin: '14px 0 0', fontSize: 12.5 }}>
            {company.memberSince ? `On Cash My Property since ${formatDate(company.memberSince)}` : ''}
            {company.accountManager ? ` · your account manager is ${company.accountManager?.name || company.accountManager}` : ''}
          </p>
        </section>

        <section className="card" style={{ padding: 0 }}>
          <div className="section-head">
            <h2>People on this account</h2>
            <NavLink to="/developer/team" className="btn btn-outline btn-sm">Manage members</NavLink>
          </div>
          <p className="muted" style={{ padding: '0 20px', margin: '0 0 8px', fontSize: 13.5 }}>Access to CMP Connect. Only the ones marked below appear on a project page.</p>
          <div className="table-scroll">
            <table className="data">
              <thead><tr><th>Name</th><th>Position</th><th>Access</th><th>Email</th><th>Shown to buyers</th></tr></thead>
              <tbody>
                {team.map((m) => (
                  <tr key={m.id}>
                    <td><span className="row" style={{ gap: 8 }}><Avatar name={m.name} size={28} /> {m.name}</span></td>
                    <td>{m.position || '—'}</td>
                    <td>{m.access || '—'}</td>
                    <td>{m.email}</td>
                    <td><Badge variant={m.shownToBuyers ? 'success' : 'neutral'}>{m.shownToBuyers ? 'On project pages' : 'Internal'}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <div className="row" style={{ gap: 8, justifyContent: 'flex-end' }}>{actions}</div>
      </div>
    </>
  );
}
