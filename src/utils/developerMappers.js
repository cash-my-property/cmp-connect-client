// Developer workspace: API shape ⇄ UI shape.
// Backend field names ek hi jagah — kuch alag nikle to sirf yahan theek karo.
import { PROJECT_DOCUMENTS, emptyDocument } from './projectDocuments';

const str = (v) => (v == null ? '' : String(v));
const numOrBlank = (v) => (v == null || v === '' ? '' : Number(v));
const numOrNull = (v) => (v === '' || v == null || Number.isNaN(Number(v)) ? null : Number(v));
const dateOnly = (v) => (v ? String(v).slice(0, 10) : '');
const isServerId = (v) => /^[a-f0-9]{24}$/i.test(String(v || ''));
const lastSegment = (url) => (url ? decodeURIComponent(String(url).split('?')[0].split('/').pop() || '') : '');

export const INTENT_LABELS = { LIVE_IN: 'Buying to live in', INVESTOR: 'Investor' };
export const CHANNEL_LABELS = { WEB: 'Website form', FORM: 'Website form', WEBSITE: 'Website form', CALL: 'Call', WHATSAPP: 'WhatsApp', EMAIL: 'Email', CHAT: 'Chat' };

const formatMoneyShort = (n) => {
  const v = Number(n);
  if (!v) return '';
  if (v >= 1000000) return `${(v / 1000000).toFixed(v % 1000000 ? 1 : 0)}m`;
  if (v >= 1000) return `${Math.round(v / 1000)}k`;
  return String(v);
};
export const budgetLabel = (b) => {
  if (!b) return '—';
  if (typeof b === 'string') return b;
  const min = formatMoneyShort(b.min);
  const max = formatMoneyShort(b.max);
  if (min && max) return `AED ${min} – ${max}`;
  if (min) return `AED ${min}+`;
  if (max) return `Up to AED ${max}`;
  return '—';
};

// ── Project ─────────────────────────────────────────────────
export function mapDocuments(docs) {
  const src = docs || {};
  return Object.fromEntries(
    PROJECT_DOCUMENTS.map(({ key }) => {
      const d = src[key] || {};
      const hasFile = Boolean(d.url || d.fileName);
      return [key, {
        ...emptyDocument(),
        url: str(d.url),
        public_id: str(d.public_id),
        fileName: str(d.fileName || (d.url ? lastSegment(d.url) : '')),
        number: str(d.number),
        expiresOn: dateOnly(d.expiry ?? d.expiresOn),
        status: d.status || (hasFile ? 'SENT' : 'NOT_SENT'),
        rejectionReason: str(d.rejectionReason),
        sentAt: str(d.sentAt || d.uploadedAt)
      }];
    })
  );
}

export const mapUnit = (u) => ({
  id: str(u.id || u._id),
  label: str(u.label),
  type: u.type || 'Apartment',
  beds: u.beds == null ? '' : u.beds,
  sizeFrom: numOrBlank(u.sizeFrom),
  sizeTo: numOrBlank(u.sizeTo),
  priceFrom: numOrBlank(u.priceFrom),
  total: Number(u.total) || 0,
  available: Number(u.available) || 0,
  reserved: Number(u.reserved) || 0,
  sold: Number(u.sold) || 0,
  soldPct: u.soldPct,
  soldValue: u.soldValue
});

export function mapProject(p) {
  if (!p) return null;
  const stats = p.stats || {};
  const brochure = p.brochure && (p.brochure.url || p.brochure.fileName)
    ? { url: str(p.brochure.url), public_id: str(p.brochure.public_id), fileName: str(p.brochure.fileName || lastSegment(p.brochure.url)) }
    : '';
  return {
    id: str(p.id || p._id),
    projectRef: str(p.projectRef),
    name: str(p.name),
    community: str(p.community),
    emirate: p.emirate || 'Dubai',
    stage: p.stage || 'Off-plan',
    status: p.status || 'DRAFT',
    rejectionReason: str(p.rejectionReason),
    handoverDate: dateOnly(p.handoverDate),
    launchDate: dateOnly(p.launchDate),
    buildPct: Number(p.buildPct) || 0,
    rera: str(p.rera),
    escrowAccount: str(p.escrowAccount),
    escrowBank: str(p.escrowBank),
    serviceCharge: numOrBlank(p.serviceCharge),
    dldWaiver: numOrBlank(p.dldWaiver),
    description: str(p.description),
    amenities: Array.isArray(p.amenities) ? p.amenities : [],
    unitTypes: Array.isArray(p.unitTypes) ? p.unitTypes.map(mapUnit) : [],
    paymentPlan: Array.isArray(p.paymentPlan)
      ? p.paymentPlan.map((m, i) => ({ id: str(m.id || m._id || `pp${i}`), milestone: str(m.milestone), share: Number(m.share) || 0, due: str(m.due) }))
      : [],
    photos: Array.isArray(p.photos)
      ? [...p.photos]
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
        .map((ph, i) => ({
          id: str(ph.id || ph._id || ph.public_id || `ph${i}`),
          url: str(ph.url),
          public_id: str(ph.public_id),
          name: str(ph.fileName || lastSegment(ph.url)),
          caption: str(ph.caption),
          cover: Boolean(ph.cover),
          kind: 'photo'
        }))
      : [],
    coverPhoto: p.coverPhoto || null,
    brochure,
    documents: mapDocuments(p.documents),
    // Server ka checklist — hamesha isi ko dikhana
    issues: Array.isArray(p.issues) ? p.issues : undefined,
    // List rows pe server se derived totals aate hain
    unitTotals: p.unitTotals || undefined,
    fromPrice: p.fromPrice ?? undefined,
    views30d: Number(stats.views30d ?? p.views30d) || 0,
    saves: Number(stats.saves ?? p.saves) || 0,
    enquiries30d: Number(stats.enquiries30d ?? p.enquiries30d) || 0,
    sellers: Array.isArray(p.sellers) ? p.sellers.map(mapSeller) : undefined,
    _detail: Array.isArray(p.unitTypes) || Boolean(p.documents)
  };
}

const mapSeller = (s) => ({
  id: str(s.id || s._id),
  name: str(s.name || s.fullName || [s.firstName, s.lastName].filter(Boolean).join(' ')),
  position: str(s.position || s.jobTitle || s.role?.name),
  brn: str(s.brn || s.compliance?.brn),
  shownToBuyers: Boolean(s.shownToBuyers)
});

// UI form → API payload (POST / PATCH)
export function toProjectPayload(f) {
  const docs = f.documents || {};
  const documents = Object.fromEntries(
    PROJECT_DOCUMENTS.map(({ key }) => {
      const d = docs[key] || {};
      return [key, {
        url: d.url && !String(d.url).startsWith('blob:') ? d.url : null,
        public_id: d.public_id || null,
        fileName: d.fileName || null,
        number: str(d.number).trim() || null,
        expiry: d.expiresOn || null
      }];
    })
  );
  const brochure = f.brochure && typeof f.brochure === 'object' && f.brochure.url ? f.brochure : null;
  return {
    name: str(f.name).trim(),
    community: str(f.community).trim(),
    emirate: f.emirate,
    stage: f.stage,
    handoverDate: f.handoverDate || null,
    buildPct: Math.max(0, Math.min(100, Number(f.buildPct) || 0)),
    rera: str(docs.dldRegistration?.number || f.rera).trim() || null,
    escrowAccount: str(docs.escrowLetter?.number || f.escrowAccount).trim() || null,
    escrowBank: str(f.escrowBank).trim() || null,
    serviceCharge: numOrNull(f.serviceCharge),
    dldWaiver: numOrNull(f.dldWaiver),
    description: str(f.description),
    amenities: f.amenities || [],
    unitTypes: (f.unitTypes || []).map((u) => ({
      ...(isServerId(u.id) ? { id: u.id } : {}),
      label: str(u.label).trim(),
      type: u.type,
      beds: u.beds === '' || u.beds == null ? null : Number(u.beds),
      sizeFrom: numOrNull(u.sizeFrom),
      sizeTo: numOrNull(u.sizeTo),
      priceFrom: numOrNull(u.priceFrom),
      total: Number(u.total) || 0
    })),
    paymentPlan: (f.paymentPlan || []).map((m) => ({ milestone: str(m.milestone).trim(), share: Number(m.share) || 0, due: str(m.due).trim() })),
    photos: (f.photos || [])
      .filter((p) => p.url && !String(p.url).startsWith('blob:'))
      .map((p, i) => ({ url: p.url, public_id: p.public_id || null, caption: str(p.caption), cover: Boolean(p.cover), order: i })),
    brochure,
    documents
  };
}

// PATCH ke liye sirf badle hue UI keys ka payload
const PATCH_KEYS = {
  photos: ['photos'],
  brochure: ['brochure'],
  documents: ['documents', 'rera', 'escrowAccount'],
  status: []
};
export function toPartialPayload(merged, changedKeys) {
  const full = toProjectPayload(merged);
  const out = {};
  changedKeys.forEach((k) => (PATCH_KEYS[k] || [k]).forEach((pk) => { if (pk in full) out[pk] = full[pk]; }));
  return out;
}

// ── Availability ────────────────────────────────────────────
export function mapAvailability(data) {
  const d = data?.data ?? data ?? {};
  const list = Array.isArray(d) ? d : d.projects || d.rows || [];
  return {
    projects: list.map((p) => ({
      id: str(p.id || p._id || p.projectId),
      name: str(p.name),
      community: str(p.community),
      status: p.status || 'LIVE',
      soldPct: p.soldPct,
      soldValue: p.soldValue,
      movesAllowed: p.movesAllowed !== false && p.status !== 'DRAFT',
      unitTypes: (p.units || p.unitTypes || []).map(mapUnit)
    })),
    totals: d.totals || null
  };
}

// ── Enquiries ───────────────────────────────────────────────
export function mapEnquiry(e) {
  const b = e.buyer || {};
  return {
    id: str(e.id || e._id),
    buyer: str(b.name) || 'Unknown buyer',
    phone: str(b.phone),
    email: str(b.email),
    nationality: str(b.nationality),
    intent: INTENT_LABELS[b.intent] || str(b.intent),
    projectId: str(e.project?.id),
    projectName: str(e.project?.name),
    projectRef: str(e.project?.projectRef),
    unit: str(e.unitTypeLabel),
    channel: CHANNEL_LABELS[String(e.channel || '').toUpperCase()] || str(e.channel),
    budget: budgetLabel(e.budget),
    message: str(e.message),
    status: e.stage || 'NEW',
    pickedUpBy: str(e.pickedUpBy?.id),
    pickedUpByName: str(e.pickedUpBy?.name),
    pickedUpAt: e.pickedUpAt || null,
    createdAt: e.createdAt
  };
}

// ── Team ────────────────────────────────────────────────────
const MEMBER_STATUS = { ACTIVE: 'Active', INVITED: 'Invited', INACTIVE: 'Inactive' };
export function mapMember(m) {
  const name = str(m.fullName || [m.firstName, m.lastName].filter(Boolean).join(' '));
  return {
    id: str(m.id || m._id),
    name,
    firstName: str(m.firstName),
    lastName: str(m.lastName),
    position: str(m.jobTitle || m.position || m.designation || m.profile?.jobTitle),
    email: str(m.email),
    mobile: str(m.mobile),
    access: str(m.role?.name || m.access),
    roleId: str(m.role?.id),
    isOwner: Boolean(m.isOwner || m.role?.key === 'OWNER'),
    isSelf: Boolean(m.isSelf),
    brn: str(m.brn ?? m.compliance?.brn),
    projectIds: Array.isArray(m.projectIds) ? m.projectIds.map(String) : [],
    shownToBuyers: Boolean(m.shownToBuyers),
    languages: Array.isArray(m.languages) ? m.languages : [],
    status: MEMBER_STATUS[m.status] || str(m.status)
  };
}

// ── Profile ─────────────────────────────────────────────────
export function mapProfile(d) {
  const c = d?.company || {};
  const e = d?.enquiryContacts || {};
  const r = d?.registration || {};
  return {
    name: str(c.companyName || c.name),
    nameAr: str(c.companyNameAr),
    developerType: str(c.developerType),
    emirate: str(c.emirate),
    founded: str(c.founded),
    website: str(c.website),
    about: str(c.about),
    address: str(c.officeAddress),
    logo: c.logo || null,
    salesEmail: str(e.salesEmail || e.email),
    salesPhone: str(e.salesPhone || e.phone),
    whatsapp: str(e.whatsapp),
    tradeLicence: str(r.tradeLicenceNumber),
    dldNumber: str(r.dldDeveloperNumber),
    trn: str(r.trnNumber),
    verified: Boolean(r.verified ?? r.verificationStatus === 'VERIFIED'),
    verificationStatus: str(r.verificationStatus),
    memberSince: d?.memberSince || '',
    accountManager: d?.accountManager || null,
    publicPreview: {
      projects: (d?.publicPreview?.projects || []).map(mapProject),
      members: (d?.publicPreview?.members || []).map(mapSeller)
    }
  };
}

const PROFILE_FIELDS = {
  nameAr: 'companyNameAr',
  about: 'about',
  founded: 'founded',
  salesEmail: 'salesEmail',
  salesPhone: 'salesPhone',
  whatsapp: 'whatsapp',
  website: 'website',
  address: 'officeAddress',
  tradeLicence: 'tradeLicenceNumber',
  dldNumber: 'dldDeveloperNumber',
  trn: 'trnNumber'
};
export const REGISTRATION_FIELDS = ['tradeLicence', 'dldNumber', 'trn'];

// Sirf badli hui fields bhejo (registration bina wajah re-verify na ho)
export function toProfilePayload(form, original) {
  const out = {};
  Object.entries(PROFILE_FIELDS).forEach(([ui, api]) => {
    if (str(form[ui]) !== str(original?.[ui])) out[api] = str(form[ui]).trim();
  });
  if (form.logo && form.logo?.url !== original?.logo?.url) out.logo = { url: form.logo.url, public_id: form.logo.public_id };
  return out;
}

// ── Home ────────────────────────────────────────────────────
export function mapHome(d) {
  const x = d?.data ?? d ?? {};
  const s = x.stats || {};
  return {
    stats: {
      liveProjects: Number(s.liveProjects) || 0,
      totalProjects: s.totalProjects ?? (Array.isArray(x.projects) ? x.projects.length : null),
      unitsAvailable: Number(s.unitsAvailable) || 0,
      unitsReserved: Number(s.unitsReserved) || 0,
      unitsSold: Number(s.unitsSold) || 0,
      enquiriesWaiting: Number(s.enquiriesWaiting) || 0,
      oldestWaitingSince: s.oldestWaitingSince || null,
      nextHandover: s.nextHandover || null
    },
    needsYou: Array.isArray(x.needsYou) ? x.needsYou : [],
    projects: (x.projects || []).map(mapProject)
  };
}

// API error → user message (+ code)
export const errorMessage = (err, fallback = 'Something went wrong. Please try again.') =>
  err?.data?.message || err?.message || fallback;
export const errorCode = (err) => err?.data?.code || err?.data?.errorCode || null;
