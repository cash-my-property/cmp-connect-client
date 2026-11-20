import React, { useRef, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Plus, Users, Eye, Building2, UserPlus } from 'lucide-react';
import { useDeveloper, useLoad, newId } from '../../context/DeveloperContext';
import { PageHead, InfoNote, StatTile, Field, fieldStyle, LoadState, Notice } from './DeveloperUi';
import { Avatar, Badge } from '../../components/ui';
import { errorMessage, errorCode } from '../../utils/developerMappers';

const MOCK_ACCESS = ['Owner', 'Admin', 'Sales', 'Marketing', 'Viewer'];
const BRN_RE = /^(BRN-?)?\d{3,}$/i;

const blankMember = () => ({
  id: newId('dm'), isNew: true, name: '', firstName: '', lastName: '', position: '', email: '', mobile: '',
  access: 'Sales', roleId: '', brn: '', projectIds: [], shownToBuyers: false, status: 'Invited', languages: ['English']
});

function Switch({ checked, onChange, disabled, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      style={{
        width: 40, height: 22, borderRadius: 999, border: 0, padding: 2,
        cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.45 : 1,
        background: checked ? 'var(--cmp-brand)' : 'var(--cmp-border)', transition: 'background 0.2s'
      }}
    >
      <span style={{ display: 'block', width: 18, height: 18, borderRadius: '50%', background: '#fff', transform: checked ? 'translateX(18px)' : 'none', transition: 'transform 0.2s' }} />
    </button>
  );
}

export default function DeveloperTeamPage() {
  const {
    isLive, team, teamSummary, assignableProjects, projectName, loadTeam, loadRoles, roles,
    updateMember, addMember, removeMember, companyName
  } = useDeveloper();
  const { loading, error, reload } = useLoad(async () => { await loadTeam(); await loadRoles(); });
  const [editing, setEditing] = useState(null);
  const [formError, setFormError] = useState('');
  const [brnError, setBrnError] = useState('');
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState('');
  const [notice, setNotice] = useState({ tone: 'danger', text: '' });
  const brnRef = useRef(null);

  const isOwner = (m) => m.isOwner || m.access === 'Owner';
  const projectSummary = (ids) => {
    if (!ids.length) return <span className="faint">None yet</span>;
    const names = ids.map((id) => projectName(id) || 'Project');
    return names.length > 2 ? `${names.slice(0, 2).join(', ')} +${names.length - 2}` : names.join(', ');
  };
  const shownNames = team.filter((m) => m.shownToBuyers).map((m) => m.name.split(' ')[0]).join(', ');
  const inviteRoles = roles.filter((r) => r.key !== 'OWNER');
  // CMP ki lagayi hui seat limit (limit null = unlimited)
  const seats = teamSummary.seats || null;
  const seatsFull = seats ? seats.canInviteMore === false : false;

  const openEdit = (m, { needBrn = false } = {}) => {
    setEditing(JSON.parse(JSON.stringify(m)));
    setFormError('');
    setBrnError(needBrn ? 'A BRN is required before someone can be shown to buyers.' : '');
    if (needBrn) setTimeout(() => brnRef.current?.focus(), 50);
  };

  // Switch seedha table se — BRN_REQUIRED pe dialog khol ke BRN maango
  const toggleShown = async (m, value) => {
    setBusy(m.id);
    setNotice({ tone: 'danger', text: '' });
    try {
      await updateMember(m.id, { shownToBuyers: value });
    } catch (err) {
      if (errorCode(err) === 'BRN_REQUIRED') openEdit({ ...m, shownToBuyers: true }, { needBrn: true });
      else setNotice({ tone: 'danger', text: errorMessage(err) });
    } finally {
      setBusy('');
    }
  };

  const saveEditing = async () => {
    const d = editing;
    setFormError('');
    setBrnError('');
    const brn = String(d.brn || '').trim();
    if (d.isNew) {
      const first = isLive ? d.firstName.trim() : d.name.trim();
      if (!first || !/^\S+@\S+\.\S+$/.test(d.email.trim())) { setFormError('Add a name and a valid email.'); return; }
      if (isLive && (!d.mobile.trim() || !d.roleId)) { setFormError('Add a mobile number and choose what they can do.'); return; }
    }
    if (brn && !BRN_RE.test(brn)) { setBrnError('A BRN looks like 61904 or BRN-61904.'); return; }
    if (d.shownToBuyers && !brn) { setBrnError('A BRN is required before someone can be shown to buyers.'); brnRef.current?.focus(); return; }

    setSaving(true);
    try {
      if (d.isNew) {
        await addMember(isLive
          ? { firstName: d.firstName.trim(), lastName: d.lastName.trim(), email: d.email.trim(), mobile: d.mobile.trim(), roleId: d.roleId, brn: brn || undefined, projectIds: d.projectIds, shownToBuyers: d.shownToBuyers }
          : { ...d, isNew: undefined, name: d.name.trim(), email: d.email.trim(), brn: brn.toUpperCase() });
        setNotice({ tone: 'success', text: `Invite sent to ${d.email.trim()}.` });
      } else {
        await updateMember(d.id, isLive
          ? { brn: brn || null, projectIds: d.projectIds, shownToBuyers: d.shownToBuyers, languages: d.languages }
          : { ...d, brn: brn.toUpperCase() });
        setNotice({ tone: 'success', text: `${d.name} updated.` });
      }
      setEditing(null);
    } catch (err) {
      if (errorCode(err) === 'BRN_REQUIRED') { setBrnError(errorMessage(err, 'A BRN is required before someone can be shown to buyers.')); brnRef.current?.focus(); }
      else if (errorCode(err) === 'MEMBER_LIMIT_REACHED') { setFormError(errorMessage(err, 'All your seats are in use. Ask Cash My Property for more.')); loadTeam().catch(() => {}); }
      else setFormError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const onRemove = async (m) => {
    const verb = isLive ? 'Deactivate' : 'Remove';
    if (!window.confirm(`${verb} ${m.name}? They will lose access to CMP Connect.`)) return;
    setBusy(m.id);
    try {
      await removeMember(m.id);
      setNotice({ tone: 'success', text: `${m.name} ${isLive ? 'deactivated' : 'removed'}.` });
    } catch (err) {
      setNotice({ tone: 'danger', text: errorMessage(err) });
    } finally {
      setBusy('');
    }
  };

  const isExistingLive = isLive && editing && !editing.isNew;

  return (
    <div>
      <PageHead
        title="Members"
        count={teamSummary.total}
        blurb="Who can get into CMP Connect for your account, what they can do, and which of them buyers see on a project page."
        actions={
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => openEdit(blankMember())}
            disabled={seatsFull}
            title={seatsFull ? 'All your seats are in use. Ask Cash My Property for more.' : undefined}
          >
            <Plus size={16} /> Add a person
          </button>
        }
      />

      <Notice tone={notice.tone} onClose={() => setNotice({ tone: 'danger', text: '' })}>{notice.text}</Notice>

      <div className="kpi-grid">
        <StatTile icon={Users} label="People on the account" value={teamSummary.total} hint={teamSummary.pendingInvites ? `${teamSummary.pendingInvites} still to accept` : 'Everyone has joined'} />
        <StatTile icon={Eye} label="Shown to buyers" value={teamSummary.shownToBuyers} hint={shownNames || 'Nobody'} />
        <StatTile icon={Building2} label="Projects covered" value={teamSummary.projectsCovered} hint={`of ${assignableProjects.length} in your portfolio`} />
        {seats && (
          <StatTile
            icon={UserPlus}
            label="Seats"
            value={seats.limit == null ? seats.used : `${seats.used} of ${seats.limit}`}
            hint={seats.limit == null ? 'No limit on your plan' : seatsFull ? 'All seats in use' : `${Math.max(0, seats.limit - seats.used)} left`}
          />
        )}
      </div>

      {seatsFull && (
        <InfoNote tone="warning">
          <strong>All {seats.limit} seats are in use.</strong> Deactivate someone or ask Cash My Property for more seats before inviting another person.
        </InfoNote>
      )}

      <InfoNote>
        By default a developer project shows no people at all: buyers see the project and {companyName || 'your company'}, and the enquiry goes to your shared inbox. Turn <strong>Shown to buyers</strong> on for a sales agent and they appear on the projects they are assigned to, with their BRN.{' '}
        <NavLink to="/developer/profile" style={{ fontWeight: 600 }}>See what buyers see</NavLink>
      </InfoNote>

      {editing && (
        <section className="card" style={{ padding: 20, marginBottom: 18 }} aria-label={editing.isNew ? 'Add a person' : `Edit ${editing.name}`}>
          <h2 style={{ fontSize: 16, margin: '0 0 14px' }}>{editing.isNew ? 'Add a person' : `Edit ${editing.name}`}</h2>
          {formError && <p role="alert" style={{ color: 'var(--cmp-danger)', fontSize: 13, margin: '0 0 10px', fontWeight: 600 }}>{formError}</p>}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
            {editing.isNew && isLive ? (
              <>
                <Field label="First name *"><input style={fieldStyle} value={editing.firstName} onChange={(e) => setEditing({ ...editing, firstName: e.target.value })} /></Field>
                <Field label="Last name"><input style={fieldStyle} value={editing.lastName} onChange={(e) => setEditing({ ...editing, lastName: e.target.value })} /></Field>
                <Field label="Email *"><input type="email" style={fieldStyle} value={editing.email} onChange={(e) => setEditing({ ...editing, email: e.target.value })} /></Field>
                <Field label="Mobile *"><input type="tel" style={fieldStyle} value={editing.mobile} placeholder="+971 50 123 4567" onChange={(e) => setEditing({ ...editing, mobile: e.target.value })} /></Field>
                <Field label="What they can do *">
                  <select style={fieldStyle} value={editing.roleId} onChange={(e) => setEditing({ ...editing, roleId: e.target.value })}>
                    <option value="">Choose a role</option>
                    {inviteRoles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                </Field>
              </>
            ) : isExistingLive ? (
              <>
                <Field label="Name"><input style={fieldStyle} value={editing.name} readOnly /></Field>
                <Field label="Email"><input style={fieldStyle} value={editing.email} readOnly /></Field>
                <Field label="Access"><input style={fieldStyle} value={editing.access} readOnly /></Field>
              </>
            ) : (
              <>
                <Field label="Full name *"><input style={fieldStyle} value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></Field>
                <Field label="Email *"><input type="email" style={fieldStyle} value={editing.email} onChange={(e) => setEditing({ ...editing, email: e.target.value })} /></Field>
                <Field label="Position"><input style={fieldStyle} value={editing.position} onChange={(e) => setEditing({ ...editing, position: e.target.value })} /></Field>
                <Field label="Access">
                  <select style={fieldStyle} value={editing.access} onChange={(e) => setEditing({ ...editing, access: e.target.value })}>
                    {MOCK_ACCESS.map((a) => <option key={a}>{a}</option>)}
                  </select>
                </Field>
              </>
            )}
            <div style={{ display: 'grid', gap: 5, fontSize: 13, fontWeight: 600 }}>
              <label htmlFor="dm-brn" style={{ margin: 0 }}>BRN</label>
              <input
                id="dm-brn"
                ref={brnRef}
                style={{ ...fieldStyle, ...(brnError ? { borderColor: 'var(--cmp-danger)' } : {}) }}
                value={editing.brn}
                placeholder="61904"
                onChange={(e) => { setBrnError(''); setEditing({ ...editing, brn: e.target.value }); }}
              />
              {brnError
                ? <span role="alert" style={{ color: 'var(--cmp-danger)', fontSize: 12, fontWeight: 600 }}>{brnError}</span>
                : <span className="faint" style={{ fontWeight: 400, fontSize: 12 }}>Needed to be shown to buyers.</span>}
            </div>
          </div>
          <div style={{ marginTop: 14 }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>Projects</span>
            {assignableProjects.length === 0 ? (
              <p className="faint" style={{ fontSize: 12.5, margin: '6px 0 0' }}>No projects yet.</p>
            ) : (
              <div className="row" style={{ gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                {assignableProjects.map((p) => (
                  <label key={p.id} className="chip" style={{ cursor: 'pointer', margin: 0 }}>
                    <input
                      type="checkbox"
                      checked={editing.projectIds.includes(p.id)}
                      onChange={() => setEditing({
                        ...editing,
                        projectIds: editing.projectIds.includes(p.id) ? editing.projectIds.filter((x) => x !== p.id) : [...editing.projectIds, p.id]
                      })}
                    /> {p.name}
                  </label>
                ))}
              </div>
            )}
          </div>
          <div className="row" style={{ gap: 10, marginTop: 14, fontSize: 13.5 }}>
            <Switch checked={editing.shownToBuyers} onChange={(v) => { setBrnError(''); setEditing({ ...editing, shownToBuyers: v }); }} label="Shown to buyers" />
            Shown to buyers on the projects above
          </div>
          <div className="row" style={{ gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setEditing(null); setFormError(''); setBrnError(''); }} disabled={saving}>Cancel</button>
            <button type="button" className="btn btn-primary btn-sm" onClick={saveEditing} disabled={saving}>
              {saving ? 'Saving…' : editing.isNew ? 'Send invite' : 'Save changes'}
            </button>
          </div>
        </section>
      )}

      <LoadState loading={loading && !team.length} error={!team.length ? error : ''} onRetry={reload}>
        <div className="card table-scroll">
          <table className="data">
            <thead>
              <tr><th>Name</th><th>Access</th><th>BRN</th><th>Projects</th><th>Shown to buyers</th><th>Status</th><th aria-label="Actions" /></tr>
            </thead>
            <tbody>
              {team.map((m) => (
                <tr key={m.id}>
                  <td>
                    <span className="row" style={{ gap: 10 }}>
                      <Avatar name={m.name} size={32} />
                      <span style={{ minWidth: 0 }}>
                        <strong style={{ display: 'block' }}>{m.name}</strong>
                        <span className="faint" style={{ fontSize: 12 }}>{m.position}{m.position ? ' · ' : ''}{m.email}</span>
                      </span>
                    </span>
                  </td>
                  <td>{m.access || '—'}</td>
                  <td>{m.brn || '—'}</td>
                  <td style={{ fontSize: 13 }}>{projectSummary(m.projectIds)}</td>
                  <td>
                    <Switch
                      checked={m.shownToBuyers}
                      disabled={busy === m.id}
                      onChange={(v) => (v && !m.brn ? openEdit({ ...m, shownToBuyers: true }, { needBrn: true }) : toggleShown(m, v))}
                      label={`Shown to buyers: ${m.name}`}
                    />
                    {!m.brn && <span className="faint" style={{ display: 'block', fontSize: 11.5 }}>Needs a BRN</span>}
                  </td>
                  <td><Badge variant={m.status === 'Active' ? 'success' : m.status === 'Invited' ? 'warning' : 'neutral'}>{m.status}</Badge></td>
                  <td>
                    <div className="row" style={{ gap: 6 }}>
                      <button type="button" className="btn btn-outline btn-sm" onClick={() => openEdit(m)}>Edit</button>
                      {!isOwner(m) && m.status !== 'Inactive' && (
                        <button type="button" className="btn btn-ghost btn-sm" disabled={busy === m.id} onClick={() => onRemove(m)}>
                          {isLive ? 'Deactivate' : 'Remove'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </LoadState>
    </div>
  );
}
