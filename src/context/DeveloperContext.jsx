import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useApp } from './AppContext';
import {
  developerCompany,
  developerProjects,
  developerEnquiries,
  developerTeam
} from '../data/developerMockData';
import { normalizeDocuments, documentsSummary, daysUntil } from '../utils/projectDocuments';
import developerApi, { saveBlob } from '../services/developerApi';
import {
  mapProject, mapAvailability, mapEnquiry, mapMember, mapProfile, mapHome,
  toProjectPayload, toPartialPayload, toProfilePayload, REGISTRATION_FIELDS, errorCode
} from '../utils/developerMappers';

// Developer workspace store — pages hamesha isi ke functions use karte hain.
// Live Data: /api/cmpConnect/developer/* (server hi source of truth — status, issues, counts).
// Mock Data: sample data, sab actions browser state mein, same shapes return karte hain.

const DeveloperContext = createContext(null);

export const PROJECT_STATUS = {
  LIVE: { label: 'Live', variant: 'success' },
  IN_REVIEW: { label: 'In review', variant: 'warning' },
  DRAFT: { label: 'Draft', variant: 'neutral' },
  HANDED_OVER: { label: 'Handed over', variant: 'accent' },
  SOLD_OUT: { label: 'Sold out', variant: 'brand' },
  REJECTED: { label: 'Sent back', variant: 'danger' }
};

export const ENQUIRY_STATUS = {
  NEW: 'New',
  CONTACTED: 'Contacted',
  QUALIFIED: 'Qualified',
  RESERVED: 'Reserved',
  LOST: 'Lost'
};

export const STAGES = ['Off-plan', 'Under Construction', 'Ready'];
export const EMIRATES = ['Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman', 'Ras Al Khaimah', 'Umm Al Quwain', 'Fujairah'];
export const UNIT_KINDS = ['Apartment', 'Townhouse', 'Villa', 'Penthouse', 'Duplex', 'Plot'];
export const AMENITIES = [
  'Infinity pool', 'Rooftop pool', 'Community pool', 'Gym', 'Gym and studio', 'Spa', 'Kids play area',
  'Landscaped podium', 'Courtyard garden', 'Central park', 'Clubhouse', 'Nursery', 'Retail at ground level',
  'Covered parking', '24-hour security', 'Concierge', 'Private beach', 'Beach club', 'Cycling track', 'Metro access'
];
export const MIN_PHOTOS = 6;

const clone = (v) => JSON.parse(JSON.stringify(v));

// documents ko hamesha poora shape do + purane fields (rera / escrow) documents se sync
export const withDocuments = (p) => {
  const documents = normalizeDocuments(p);
  const dld = documents.dldRegistration.number;
  return {
    ...p,
    documents,
    rera: dld ? (/^RERA-/i.test(dld) ? dld : `RERA-${dld}`) : '',
    escrowAccount: documents.escrowLetter.number || '',
    escrowLetter: Boolean(documents.escrowLetter.fileName)
  };
};
const loadMockProjects = () => clone(developerProjects).map(withDocuments);

export const unitTotals = (project) => {
  // List rows pe server totals deta hai
  if (project?.unitTotals && !project?.unitTypes?.length) {
    const t = project.unitTotals;
    return { total: t.total || 0, available: t.available || 0, reserved: t.reserved || 0, sold: t.sold || 0, soldValue: t.soldValue || 0 };
  }
  return (project?.unitTypes || []).reduce(
    (acc, u) => ({
      total: acc.total + (Number(u.total) || 0),
      available: acc.available + (Number(u.available) || 0),
      reserved: acc.reserved + (Number(u.reserved) || 0),
      sold: acc.sold + (Number(u.sold) || 0),
      soldValue: acc.soldValue + (Number(u.sold) || 0) * (Number(u.priceFrom) || 0)
    }),
    { total: 0, available: 0, reserved: 0, sold: 0, soldValue: 0 }
  );
};

export const fromPrice = (project) => {
  if (project?.fromPrice != null && !project?.unitTypes?.length) return project.fromPrice || null;
  const prices = (project?.unitTypes || []).map((u) => Number(u.priceFrom)).filter((n) => n > 0);
  return prices.length ? Math.min(...prices) : null;
};

export const planTotal = (project) =>
  (project?.paymentPlan || []).reduce((s, m) => s + (Number(m.share) || 0), 0);

// Go-live checklist. Server bheje to wahi (source of truth); warna wahi rule client pe
// (RERA number, escrow letter, ≥1 unit type, plan = 100%, handover date, ≥6 photos).
export function localProjectIssues(project) {
  if (!project) return [];
  const issues = [];
  const docs = project.documents || normalizeDocuments(project);
  if (!String(docs.dldRegistration?.number || project.rera || '').trim()) issues.push('RERA project registration number');
  if (!docs.escrowLetter?.fileName) issues.push('escrow account letter');
  if (!(project.unitTypes || []).length) issues.push('at least one unit type');
  if (planTotal(project) !== 100) issues.push('a payment plan that adds up to 100%');
  if (!project.handoverDate) issues.push('a handover date');
  if ((project.photos || []).length < MIN_PHOTOS) issues.push('six photos or renders');
  return issues;
}
export function projectIssues(project) {
  if (!project) return [];
  if (Array.isArray(project.issues)) return project.issues;
  return localProjectIssues(project);
}

export const formatAed = (n) => {
  const v = Number(n);
  if (!v) return '—';
  if (v >= 1000000) return `AED ${(v / 1000000).toFixed(2)}m`;
  return `AED ${v.toLocaleString('en-AE')}`;
};

export const formatDate = (iso) => {
  if (!iso) return 'Not set';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

export const timeAgo = (iso) => {
  if (!iso) return '—';
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3600000);
  if (h < 1) return 'Just now';
  if (h < 24) return `${h} hour${h === 1 ? '' : 's'} ago`;
  const d = Math.floor(h / 24);
  return `${d} day${d === 1 ? '' : 's'} ago`;
};

export const newId = (prefix) => `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

// ── Mock-mode derived data (live mein server deta hai) ──────
const countBy = (rows, key, keys) => {
  const c = { ALL: rows.length };
  keys.forEach((k) => { c[k] = 0; });
  rows.forEach((r) => { c[r[key]] = (c[r[key]] || 0) + 1; });
  return c;
};

function mockProjectTotals(projects, enquiries) {
  return projects.reduce((acc, p) => {
    const t = unitTotals(p);
    return {
      liveProjects: acc.liveProjects + (p.status === 'LIVE' ? 1 : 0),
      unitsAvailable: acc.unitsAvailable + t.available,
      unitsReserved: acc.unitsReserved + t.reserved,
      unitsSold: acc.unitsSold + t.sold,
      enquiries30d: acc.enquiries30d + (p.enquiries30d || 0),
      views30d: acc.views30d + (p.views30d || 0)
    };
  }, { liveProjects: 0, unitsAvailable: 0, unitsReserved: 0, unitsSold: 0, enquiries30d: 0, views30d: 0, notPickedUp: enquiries.filter((e) => !e.pickedUpBy && e.status === 'NEW').length });
}

function mockHome(projects, enquiries) {
  const totals = mockProjectTotals(projects, enquiries);
  const waiting = enquiries.filter((e) => !e.pickedUpBy && e.status === 'NEW');
  const oldest = waiting.reduce((o, e) => (!o || e.createdAt < o ? e.createdAt : o), null);
  const now = new Date().toISOString().slice(0, 10);
  const upcoming = projects.filter((p) => p.handoverDate && p.handoverDate > now).sort((a, b) => a.handoverDate.localeCompare(b.handoverDate))[0];
  const needsYou = [];
  if (waiting.length) needsYou.push({ type: 'ENQUIRIES_WAITING', count: waiting.length, title: `${waiting.length} enquiries nobody has picked up yet` });
  projects.filter((p) => p.status !== 'HANDED_OVER').forEach((p) => {
    const issues = projectIssues(p);
    if (issues.length) needsYou.push({ type: 'PROJECT_BLOCKED', projectId: p.id, projectName: p.name, issues, title: `${p.name} needs ${issues.length} things before it can go live` });
  });
  projects.forEach((p) => {
    const s = documentsSummary(p.documents);
    [...s.expired, ...s.expiringSoon].forEach((d) => {
      needsYou.push({ type: 'PERMIT_EXPIRING', projectId: p.id, projectName: p.name, docLabel: d.label, days: daysUntil(p.documents[d.key].expiresOn) });
    });
  });
  const reserved = enquiries.filter((e) => e.status === 'RESERVED').length;
  if (reserved) needsYou.push({ type: 'RESERVATION_PENDING', count: reserved, title: `${reserved} reservations waiting on paperwork` });
  return {
    stats: {
      liveProjects: totals.liveProjects,
      totalProjects: projects.length,
      unitsAvailable: totals.unitsAvailable,
      unitsReserved: totals.unitsReserved,
      unitsSold: totals.unitsSold,
      enquiriesWaiting: waiting.length,
      oldestWaitingSince: oldest,
      nextHandover: upcoming ? { projectId: upcoming.id, name: upcoming.name, handoverDate: upcoming.handoverDate } : null
    },
    needsYou,
    projects: projects.filter((p) => p.status !== 'DRAFT')
  };
}

// Server options (live) ya local defaults (mock / server fail) — ek hi shape
export function buildProjectOptions(o) {
  const list = (v, fallback) => (Array.isArray(v) && v.length ? v : fallback);
  const statusLabels = Object.fromEntries(Object.entries(PROJECT_STATUS).map(([k, v]) => [k, v.label]));
  (o?.statuses || []).forEach((st) => { if (st?.value) statusLabels[st.value] = st.label || statusLabels[st.value] || st.value; });
  const documentLabels = {};
  (o?.documents || []).forEach((d) => { if (d?.key && d.label) documentLabels[d.key] = d.label; });
  return {
    fromServer: Boolean(o),
    stages: list(o?.stages, STAGES),
    emirates: list(o?.emirates, EMIRATES),
    unitKinds: list(o?.unitKinds, UNIT_KINDS),
    amenities: list(o?.amenities, AMENITIES),
    statusOrder: (o?.statuses || []).map((st) => st.value).filter(Boolean),
    statusLabels,
    documentLabels
  };
}
const DEFAULT_OPTIONS = buildProjectOptions(null);

// Provider ke bahar bhi safe (badge / editor kahin bhi render ho)
export function useProjectOptions() {
  const ctx = useContext(DeveloperContext);
  return ctx?.projectOptions || DEFAULT_OPTIONS;
}

export function DeveloperProvider({ children }) {
  const { isMockData, isLiveData, account } = useApp();
  const live = isLiveData;

  // Mock state
  const [mockCompany, setMockCompany] = useState(() => clone(developerCompany));
  const [mockProjects, setMockProjects] = useState(loadMockProjects);
  const [mockEnquiries, setMockEnquiries] = useState(() => clone(developerEnquiries));
  const [mockTeam, setMockTeam] = useState(() => clone(developerTeam));

  // Live caches
  const [liveProjects, setLiveProjects] = useState([]);
  const [liveProjectMeta, setLiveProjectMeta] = useState({ counts: null, totals: null });
  const [liveDetails, setLiveDetails] = useState({});
  const [liveEnquiries, setLiveEnquiries] = useState([]);
  const [liveEnquiryMeta, setLiveEnquiryMeta] = useState({ counts: null, notPickedUp: 0 });
  const [liveTeam, setLiveTeam] = useState([]);
  const [liveTeamMeta, setLiveTeamMeta] = useState({ summary: null, projects: {} });
  const [liveProfile, setLiveProfile] = useState(null);
  const [liveHome, setLiveHome] = useState(null);
  const [liveAvailability, setLiveAvailability] = useState(null);
  const [roles, setRoles] = useState([]);
  const [options, setOptions] = useState(null);

  // Mode badle to sab reset
  useEffect(() => {
    setMockCompany(clone(developerCompany));
    setMockProjects(loadMockProjects());
    setMockEnquiries(clone(developerEnquiries));
    setMockTeam(clone(developerTeam));
    setLiveProjects([]);
    setLiveDetails({});
    setLiveEnquiries([]);
    setLiveTeam([]);
    setLiveProfile(null);
    setLiveHome(null);
    setLiveAvailability(null);
  }, [isMockData]);

  const liveRef = useRef(live);
  liveRef.current = live;
  const liveDetailsRef = useRef(liveDetails);
  liveDetailsRef.current = liveDetails;
  const mockProjectsRef = useRef(mockProjects);
  mockProjectsRef.current = mockProjects;
  const mockTeamRef = useRef(mockTeam);
  mockTeamRef.current = mockTeam;
  const liveProfileRef = useRef(liveProfile);
  liveProfileRef.current = liveProfile;

  const companyName = live
    ? account?.organization?.companyName || account?.organization?.name || liveProfile?.name || ''
    : mockCompany?.name;

  // ── Projects ──────────────────────────────────────────────
  const loadProjects = useCallback(async (params = {}) => {
    if (!liveRef.current) return;
    const res = await developerApi.listProjects({ limit: 100, ...params });
    setLiveProjects((res?.data || []).map(mapProject));
    setLiveProjectMeta({ counts: res?.counts || null, totals: res?.totals || null });
  }, []);

  const loadProject = useCallback(async (id) => {
    if (!liveRef.current) return null;
    const res = await developerApi.getProject(id);
    const p = mapProject(res?.data);
    setLiveDetails((prev) => ({ ...prev, [p.id]: p }));
    return p;
  }, []);

  const loadOptions = useCallback(async () => {
    if (!liveRef.current) return null;
    const res = await developerApi.projectOptions().catch(() => null);
    if (res?.data) setOptions(res.data);
    return res?.data || null;
  }, []);

  // Form options (stages, emirates, unit kinds, labels, amenities) — live mein server se, ek dafa
  useEffect(() => {
    if (live && !options) loadOptions();
  }, [live, options, loadOptions]);

  const storeDetail = (p) => {
    setLiveDetails((prev) => ({ ...prev, [p.id]: p }));
    setLiveProjects((prev) => {
      const exists = prev.some((x) => x.id === p.id);
      return exists ? prev.map((x) => (x.id === p.id ? { ...x, ...p } : x)) : [p, ...prev];
    });
  };

  // Save (create / edit). Returns saved project (status + issues server se)
  const saveProject = useCallback(async (form, { isNew } = {}) => {
    if (liveRef.current) {
      const payload = toProjectPayload(form);
      const res = isNew ? await developerApi.createProject(payload) : await developerApi.updateProject(form.id, payload);
      const p = mapProject(res?.data);
      storeDetail(p);
      return p;
    }
    const synced = withDocuments(form);
    const issues = localProjectIssues(synced);
    const next = { ...synced };
    if (isNew) next.status = issues.length ? 'DRAFT' : 'IN_REVIEW';
    else if (['DRAFT', 'REJECTED'].includes(next.status) && !issues.length) next.status = 'IN_REVIEW';
    setMockProjects((prev) => (isNew ? [next, ...prev] : prev.map((p) => (p.id === next.id ? next : p))));
    return next;
  }, []);

  // Partial update (photos / brochure / documents tab se)
  const updateProject = useCallback(async (id, patch) => {
    if (liveRef.current) {
      const current = liveDetailsRef.current[id];
      if (!current) throw new Error('Project is still loading. Please try again.');
      const merged = { ...current, ...patch };
      const res = await developerApi.updateProject(id, toPartialPayload(merged, Object.keys(patch)));
      const p = mapProject(res?.data);
      storeDetail(p);
      return p;
    }
    let out = null;
    setMockProjects((prev) => prev.map((p) => {
      if (p.id !== id) return p;
      out = withDocuments({ ...p, ...patch });
      return out;
    }));
    return out;
  }, []);

  const updateDocument = useCallback((projectId, key, patch) => {
    const current = liveRef.current ? liveDetailsRef.current[projectId] : mockProjectsRef.current.find((p) => p.id === projectId);
    if (!current) return Promise.resolve(null);
    return updateProject(projectId, { documents: { ...current.documents, [key]: { ...current.documents[key], ...patch } } });
  }, [updateProject]);

  const deleteProject = useCallback(async (id) => {
    if (liveRef.current) {
      await developerApi.deleteProject(id);
      setLiveProjects((prev) => prev.filter((p) => p.id !== id));
      setLiveDetails((prev) => { const n = { ...prev }; delete n[id]; return n; });
      return;
    }
    setMockProjects((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const markSoldOut = useCallback(async (id) => {
    if (liveRef.current) {
      const res = await developerApi.markSoldOut(id);
      if (res?.data) storeDetail(mapProject(res.data));
      else await loadProject(id);
      return;
    }
    setMockProjects((prev) => prev.map((p) => (p.id === id ? { ...p, status: 'SOLD_OUT' } : p)));
  }, [loadProject]);

  // ── Availability ─────────────────────────────────────────
  const loadAvailability = useCallback(async () => {
    if (!liveRef.current) return;
    const res = await developerApi.availability();
    setLiveAvailability(mapAvailability(res));
  }, []);

  const moveUnit = useCallback(async (projectId, unitId, action, enquiryId) => {
    if (liveRef.current) {
      await developerApi.moveUnit(projectId, unitId, action, enquiryId);
      await loadAvailability();
      if (liveDetailsRef.current[projectId]) loadProject(projectId).catch(() => {});
      return;
    }
    const unit = mockProjectsRef.current.find((p) => p.id === projectId)?.unitTypes.find((u) => u.id === unitId);
    if (unit && action === 'reserve' && unit.available < 1) throw Object.assign(new Error(`No ${unit.label} units are left to reserve.`), { status: 409 });
    setMockProjects((prev) => prev.map((p) => {
      if (p.id !== projectId) return p;
      return {
        ...p,
        unitTypes: p.unitTypes.map((u) => {
          if (u.id !== unitId) return u;
          const n = { ...u };
          if (action === 'reserve' && n.available > 0) { n.available -= 1; n.reserved += 1; }
          if (action === 'sell') {
            if (n.reserved > 0) { n.reserved -= 1; n.sold += 1; } else if (n.available > 0) { n.available -= 1; n.sold += 1; }
          }
          if (action === 'release' && n.reserved > 0) { n.reserved -= 1; n.available += 1; }
          return n;
        })
      };
    }));
  }, [loadAvailability, loadProject]);

  const loadMovements = useCallback(async (projectId) => {
    if (!liveRef.current) return [];
    const res = await developerApi.movements(projectId);
    const d = res?.data;
    return Array.isArray(d) ? d : Array.isArray(d?.data) ? d.data : d?.rows || [];
  }, []);

  // ── Enquiries ────────────────────────────────────────────
  const loadEnquiries = useCallback(async (params = {}) => {
    if (!liveRef.current) return;
    const res = await developerApi.listEnquiries({ limit: 100, ...params });
    setLiveEnquiries((res?.data || []).map(mapEnquiry));
    setLiveEnquiryMeta({ counts: res?.counts || null, notPickedUp: Number(res?.notPickedUp) || 0 });
  }, []);

  const pickUpEnquiry = useCallback(async (id, me) => {
    if (liveRef.current) {
      try {
        const res = await developerApi.pickUpEnquiry(id);
        if (res?.data) setLiveEnquiries((prev) => prev.map((e) => (e.id === id ? mapEnquiry(res.data) : e)));
        else await loadEnquiries();
        return { ok: true };
      } catch (err) {
        if (errorCode(err) === 'ALREADY_PICKED_UP' || err.status === 409) {
          await loadEnquiries().catch(() => {});
          return { ok: false, taken: true, message: err?.data?.message || 'Someone on your team picked this up first.' };
        }
        throw err;
      }
    }
    setMockEnquiries((prev) => prev.map((e) => (e.id === id ? { ...e, pickedUpBy: me?.id || '', status: e.status === 'NEW' ? 'CONTACTED' : e.status } : e)));
    return { ok: true };
  }, [loadEnquiries]);

  const updateEnquiry = useCallback(async (id, patch) => {
    if (liveRef.current) {
      const body = {};
      if (patch.status) body.stage = patch.status;
      if ('pickedUpBy' in patch) body.pickedUpBy = patch.pickedUpBy || null;
      const res = await developerApi.updateEnquiry(id, body);
      if (res?.data) setLiveEnquiries((prev) => prev.map((e) => (e.id === id ? mapEnquiry(res.data) : e)));
      else await loadEnquiries();
      return;
    }
    setMockEnquiries((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  }, [loadEnquiries]);

  // ── Team ─────────────────────────────────────────────────
  const loadTeam = useCallback(async () => {
    if (!liveRef.current) return;
    const res = await developerApi.listMembers();
    setLiveTeam((res?.data || []).map(mapMember));
    const projMap = res?.projects || {};
    setLiveTeamMeta({ summary: res?.summary || null, projects: projMap });
  }, []);

  const loadRoles = useCallback(async () => {
    if (!liveRef.current) return [];
    const res = await developerApi.listRoles().catch(() => null);
    const list = res?.data?.roles || [];
    setRoles(list);
    return list;
  }, []);

  // patch: { shownToBuyers?, projectIds?, brn?, languages? }
  const updateMember = useCallback(async (id, patch) => {
    if (liveRef.current) {
      const res = await developerApi.updateMember(id, patch);
      if (res?.data && (res.data.id || res.data._id)) setLiveTeam((prev) => prev.map((m) => (m.id === id ? mapMember(res.data) : m)));
      else await loadTeam();
      return;
    }
    if (patch.shownToBuyers) {
      const m = mockTeamRef.current.find((x) => x.id === id);
      const brn = patch.brn ?? m?.brn;
      if (!brn) throw Object.assign(new Error('Add a BRN before showing this person to buyers.'), { status: 400, data: { code: 'BRN_REQUIRED' } });
    }
    setMockTeam((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m)));
  }, [loadTeam]);

  // Live: invite (existing route) phir developer fields PATCH
  const addMember = useCallback(async (member) => {
    if (liveRef.current) {
      const res = await developerApi.inviteMember({
        firstName: member.firstName,
        lastName: member.lastName || undefined,
        email: member.email,
        mobile: member.mobile,
        roleId: member.roleId,
        ...(member.brn ? { brn: member.brn } : {})
      });
      const newId = res?.data?.id || res?.data?._id || res?.data?.member?.id;
      if (newId && (member.projectIds?.length || member.shownToBuyers)) {
        await developerApi.updateMember(newId, { projectIds: member.projectIds, shownToBuyers: member.shownToBuyers, ...(member.brn ? { brn: member.brn } : {}) });
      }
      await loadTeam();
      return;
    }
    setMockTeam((prev) => [...prev, member]);
  }, [loadTeam]);

  const removeMember = useCallback(async (id) => {
    if (liveRef.current) {
      await developerApi.setMemberStatus(id, 'INACTIVE');
      await loadTeam();
      return;
    }
    setMockTeam((prev) => prev.filter((m) => m.id !== id));
  }, [loadTeam]);

  // ── Profile ──────────────────────────────────────────────
  const loadProfile = useCallback(async () => {
    if (!liveRef.current) return;
    const res = await developerApi.getProfile();
    setLiveProfile(mapProfile(res?.data));
  }, []);

  const saveProfile = useCallback(async (form) => {
    if (liveRef.current) {
      const payload = toProfilePayload(form, liveProfileRef.current);
      if (!Object.keys(payload).length) return { requiresReview: false };
      const res = await developerApi.updateProfile(payload);
      let saved = null;
      if (res?.data && (res.data.company || res.data.registration)) { saved = mapProfile(res.data); setLiveProfile(saved); }
      else await loadProfile();
      return { requiresReview: Boolean(res?.requiresReview ?? res?.data?.requiresReview), saved };
    }
    const requiresReview = REGISTRATION_FIELDS.some((k) => form[k] !== mockCompany[k]);
    const saved = { ...form, verified: requiresReview ? false : form.verified };
    setMockCompany(saved);
    return { requiresReview, saved };
  }, [loadProfile, mockCompany]);

  // ── Home ─────────────────────────────────────────────────
  const loadHome = useCallback(async () => {
    if (!liveRef.current) return;
    const res = await developerApi.home();
    setLiveHome(mapHome(res));
  }, []);

  // ── Uploads + exports ────────────────────────────────────
  // kind: photo | brochure | document | video | logo | cover
  const uploadFile = useCallback(async (file, kind) => {
    if (liveRef.current) {
      return kind === 'logo' || kind === 'cover' ? developerApi.uploadLogo(file, kind) : developerApi.uploadProjectFile(file, kind);
    }
    return { url: URL.createObjectURL(file), public_id: '', fileName: file.name };
  }, []);

  const exportCsv = useCallback(async (what, mockBuilder) => {
    if (liveRef.current) {
      const blob = what === 'projects' ? await developerApi.exportProjects() : await developerApi.exportEnquiries();
      saveBlob(blob, `${what}.csv`);
      return;
    }
    saveBlob(new Blob([mockBuilder()], { type: 'text/csv' }), `${what}.csv`);
  }, []);

  // ── Exposed state (same shape both modes) ────────────────
  const projectOptions = useMemo(() => buildProjectOptions(live ? options : null), [live, options]);

  const value = useMemo(() => {
    const projects = live ? liveProjects : mockProjects;
    const enquiries = live ? liveEnquiries : mockEnquiries;
    const team = live ? liveTeam : mockTeam;

    const getProject = (id) => (live ? liveDetails[id] || liveProjects.find((p) => p.id === id) || null : mockProjects.find((p) => p.id === id) || null);

    const projectCounts = live && liveProjectMeta.counts
      ? { ALL: 0, ...liveProjectMeta.counts }
      : countBy(projects, 'status', Object.keys(PROJECT_STATUS));
    const projectTotals = live && liveProjectMeta.totals ? liveProjectMeta.totals : mockProjectTotals(projects, enquiries);

    const enquiryCounts = live && liveEnquiryMeta.counts
      ? { ALL: 0, ...liveEnquiryMeta.counts }
      : countBy(enquiries, 'status', Object.keys(ENQUIRY_STATUS));
    const notPickedUp = live ? liveEnquiryMeta.notPickedUp : enquiries.filter((e) => !e.pickedUpBy && e.status === 'NEW').length;

    const projectName = (id) =>
      projects.find((p) => p.id === id)?.name || liveTeamMeta.projects?.[id]?.name || '';

    const availability = live
      ? liveAvailability
      : {
        projects: mockProjects.filter((p) => p.unitTypes.length).map((p) => ({ ...p, movesAllowed: p.status !== 'DRAFT' })),
        totals: null
      };

    const teamSummary = live && liveTeamMeta.summary
      ? liveTeamMeta.summary
      : {
        total: team.length,
        pendingInvites: team.filter((m) => m.status === 'Invited').length,
        shownToBuyers: team.filter((m) => m.shownToBuyers).length,
        projectsCovered: new Set(team.flatMap((m) => m.projectIds)).size
      };

    // Assign karne layak projects (team page) — live mein team API ka map ya projects list
    const assignableProjects = live && liveTeamMeta.projects && Object.keys(liveTeamMeta.projects).length
      ? Object.entries(liveTeamMeta.projects).map(([id, p]) => ({ id, name: p.name }))
      : projects.map((p) => ({ id: p.id, name: p.name }));

    return {
      isLive: live,
      isConnected: true,
      companyName,
      company: live ? liveProfile : mockCompany,
      options,
      projectOptions,
      roles,

      projects,
      projectCounts,
      projectTotals,
      getProject,
      projectName,
      loadProjects,
      loadProject,
      loadOptions,
      saveProject,
      updateProject,
      updateDocument,
      deleteProject,
      markSoldOut,

      availability,
      loadAvailability,
      moveUnit,
      loadMovements,

      enquiries,
      enquiryCounts,
      notPickedUp,
      loadEnquiries,
      pickUpEnquiry,
      updateEnquiry,

      team,
      teamSummary,
      assignableProjects,
      loadTeam,
      loadRoles,
      updateMember,
      addMember,
      removeMember,

      loadProfile,
      saveProfile,

      home: live ? liveHome : mockHome(mockProjects, mockEnquiries),
      loadHome,

      uploadFile,
      exportCsv
    };
  }, [
    live, companyName, options, projectOptions, roles, liveProjects, mockProjects, liveProjectMeta, liveDetails,
    liveEnquiries, mockEnquiries, liveEnquiryMeta, liveTeam, mockTeam, liveTeamMeta, liveProfile, mockCompany,
    liveHome, liveAvailability, loadProjects, loadProject, loadOptions, saveProject, updateProject, updateDocument,
    deleteProject, markSoldOut, loadAvailability, moveUnit, loadMovements, loadEnquiries, pickUpEnquiry, updateEnquiry,
    loadTeam, loadRoles, updateMember, addMember, removeMember, loadProfile, saveProfile, loadHome, uploadFile, exportCsv
  ]);

  return <DeveloperContext.Provider value={value}>{children ?? <Outlet />}</DeveloperContext.Provider>;
}

export function useDeveloper() {
  const ctx = useContext(DeveloperContext);
  if (!ctx) throw new Error('useDeveloper must be used within a DeveloperProvider');
  return ctx;
}

// Page pe live data load karne ka chhota hook: { loading, error, reload }
export function useLoad(loader, deps = []) {
  const { isLive } = useDeveloper();
  const [state, setState] = useState({ loading: isLive, error: '' });
  const run = useCallback(async () => {
    if (!isLive) { setState({ loading: false, error: '' }); return; }
    setState((s) => ({ ...s, loading: true, error: '' }));
    try {
      await loader();
      setState({ loading: false, error: '' });
    } catch (err) {
      setState({ loading: false, error: err?.data?.message || err?.message || 'Could not load this page.' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLive, ...deps]);
  useEffect(() => { run(); }, [run]);
  return { ...state, reload: run };
}
