import React, { useState } from 'react';
import { FileText, Upload, X, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';
import { Badge } from '../../components/ui';
import {
  PROJECT_DOCUMENTS, DOC_GROUPS, DOC_STATUS, EXPIRY_WARNING_DAYS,
  emptyDocument, expiryState, daysUntil, isDocumentInHand, documentGaps, documentsSummary
} from '../../utils/projectDocuments';
import { useProjectOptions } from '../../context/DeveloperContext';
import './projectForm.css';

export function DocumentsSummaryBar({ documents }) {
  const s = documentsSummary(documents);
  const done = s.inHand === s.total;
  return (
    <div style={{ marginBottom: 18 }}>
      <div className="row" style={{ justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', fontSize: 13.5, marginBottom: 6 }}>
        <span>
          <strong style={{ color: done ? 'var(--cmp-success)' : 'var(--cmp-text)' }}>{s.inHand} of {s.total}</strong>{' '}
          of the documents this project needs are in hand.
        </span>
        {(s.expired.length > 0 || s.expiringSoon.length > 0) && (
          <span style={{ color: s.expired.length ? 'var(--cmp-danger)' : 'var(--cmp-warning)', fontWeight: 600, fontSize: 12.5 }}>
            <AlertTriangle size={13} style={{ verticalAlign: '-2px' }} />{' '}
            {s.expired.length ? `${s.expired.length} permit has run out` : `${s.expiringSoon.length} permit runs out soon`}
          </span>
        )}
      </div>
      <div className="pf-progress"><span style={{ width: `${(s.inHand / s.total) * 100}%`, background: done ? 'var(--cmp-success)' : 'var(--cmp-brand)' }} /></div>
      <p className="muted" style={{ margin: '10px 0 0', fontSize: 12.5 }}>
        You can save without them, but the project cannot be sent for review until they all are: every advert runs under the permit below and has to match it. We keep the record — the number, the date it runs out and what you sent — along with the file.
      </p>
    </div>
  );
}

function StatusBadges({ def, doc }) {
  const ex = doc.fileName ? expiryState(def, doc) : null;
  const d = daysUntil(doc.expiresOn);
  const status = doc.fileName ? (DOC_STATUS[doc.status] || DOC_STATUS.SENT) : DOC_STATUS.NOT_SENT;
  return (
    <span className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
      <Badge variant={def.required ? 'brand' : 'neutral'}>{def.required ? 'Required' : 'If it applies'}</Badge>
      <Badge variant={status.variant}>{status.label}</Badge>
      {ex === 'expired' && <Badge variant="danger">Ran out {Math.abs(d)} {Math.abs(d) === 1 ? 'day' : 'days'} ago</Badge>}
      {ex === 'soon' && <Badge variant="warning">Runs out in {d} {d === 1 ? 'day' : 'days'}</Badge>}
    </span>
  );
}

function DocumentRow({ def, doc, onChange, upload, readOnlyNumbers = false }) {
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState('');
  const inHand = isDocumentInHand(def, doc);
  const gaps = doc.fileName ? documentGaps(def, doc) : [];
  const fileId = `doc-${def.key}-file`;

  const onFile = async (e) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    if (f.size > 15 * 1024 * 1024) { setErr('Files can be up to 15 MB.'); return; }
    setErr('');
    setUploading(true);
    try {
      const up = upload ? await upload(f, 'document') : { url: URL.createObjectURL(f), public_id: '', fileName: f.name };
      onChange({ fileName: up.fileName || f.name, url: up.url, public_id: up.public_id || '', status: 'SENT', sentAt: new Date().toISOString() });
    } catch (ex) {
      setErr(ex?.data?.message || ex?.message || 'Could not upload the file.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="pf-row" style={inHand ? { borderColor: 'var(--cmp-brand-border)' } : undefined}>
      <div className="pf-row-head" style={{ alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <span style={{ minWidth: 0, flex: '1 1 240px' }}>
          <span className="pf-row-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {inHand && <CheckCircle2 size={15} style={{ color: 'var(--cmp-success)' }} />}
            {def.label}
          </span>
          <span className="muted" style={{ display: 'block', fontSize: 12.5, marginTop: 3 }}>{def.description}</span>
        </span>
        <StatusBadges def={def} doc={doc} />
      </div>

      <div className="pf-doc-grid" data-cols={1 + (def.numberLabel ? 1 : 0) + (def.expires ? 1 : 0)}>
        <div className="pf-field">
          <label htmlFor={fileId}>File</label>
          <div className="pf-upload" style={{ padding: '6px 6px 6px 12px', minHeight: 44 }}>
            <FileText size={17} style={{ color: doc.fileName ? 'var(--cmp-brand)' : 'var(--cmp-text-faint)', flexShrink: 0 }} />
            <span style={{ flex: 1, minWidth: 0, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={doc.fileName}>
              {doc.fileName ? (doc.url ? <a href={doc.url} target="_blank" rel="noopener noreferrer">{doc.fileName}</a> : doc.fileName) : <span className="faint">No file chosen</span>}
            </span>
            <label className="btn btn-outline btn-sm" style={{ margin: 0, cursor: 'pointer', flexShrink: 0 }}>
              {uploading ? <Loader2 size={14} className="spin" /> : <Upload size={14} />} {uploading ? 'Uploading…' : doc.fileName ? 'Replace' : 'Upload'}
              <input id={fileId} disabled={uploading} type="file" accept="application/pdf,image/*,.xlsx,.xls,.csv" hidden onChange={onFile} aria-label={`Choose the file for ${def.label}`} />
            </label>
            {doc.fileName && (
              <button type="button" className="icon-button" aria-label={`Remove ${def.label}`} onClick={() => onChange({ ...emptyDocument(), number: doc.number, expiresOn: doc.expiresOn })}>
                <X size={15} />
              </button>
            )}
          </div>
        </div>

        {def.numberLabel && (
          <div className="pf-field">
            <label htmlFor={`doc-${def.key}-number`}>{def.numberLabel}{def.required && <span className="req" aria-hidden="true">*</span>}</label>
            <input
              id={`doc-${def.key}-number`}
              value={doc.number}
              placeholder={def.numberPlaceholder}
              readOnly={readOnlyNumbers}
              onChange={(e) => onChange({ number: e.target.value })}
            />
          </div>
        )}

        {def.expires && (
          <div className="pf-field">
            <label htmlFor={`doc-${def.key}-exp`}>Runs out on{def.required && <span className="req" aria-hidden="true">*</span>}</label>
            <input id={`doc-${def.key}-exp`} type="date" value={doc.expiresOn} onChange={(e) => onChange({ expiresOn: e.target.value })} />
            <span className="pf-hint">We will tell you {EXPIRY_WARNING_DAYS} days before.</span>
          </div>
        )}
      </div>

      {err && <p className="pf-error" style={{ margin: '10px 0 0' }}>{err}</p>}
      {doc.status === 'REJECTED' && doc.rejectionReason && (
        <p className="pf-error" style={{ margin: '10px 0 0' }}>Sent back: {doc.rejectionReason}</p>
      )}
      {def.required && gaps.length > 0 && (
        <p style={{ margin: '10px 0 0', fontSize: 12.5, color: 'var(--cmp-warning)', fontWeight: 600 }}>
          Still needs {gaps.join(', ')}.
        </p>
      )}
    </div>
  );
}

// Poora documents editor — groups ke hisaab se
export default function ProjectDocumentsEditor({ documents, onChange, upload }) {
  // Document ke naam backend options se (live)
  const { documentLabels } = useProjectOptions();
  return (
    <div style={{ display: 'grid', gap: 22 }}>
      {DOC_GROUPS.map((g) => {
        const defs = PROJECT_DOCUMENTS.filter((d) => d.group === g.key).map((d) => ({ ...d, label: documentLabels[d.key] || d.label }));
        return (
          <div key={g.key}>
            <h3 style={{ fontSize: 14, margin: '0 0 10px' }}>{g.title}</h3>
            <div className="pf-rows">
              {defs.map((def) => (
                <DocumentRow
                  key={def.key}
                  def={def}
                  doc={documents[def.key] || emptyDocument()}
                  onChange={(patch) => onChange(def.key, patch)}
                  upload={upload}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
