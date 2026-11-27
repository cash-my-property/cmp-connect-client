// "Pehli 5 muft" — free allowance helpers (GET /api/cmpConnect/free-allowance)
// Backend: har kism ki apni ginti, zindagi bhar ki. 5 hard-code mat karo — hamesha counter se parho.

// Portal mein jo kismein dikhti hain (developer ke paas listings ka section nahi)
export const WORKSPACE_KINDS = {
  agency: ['LISTING', 'RTO'],
  developer: ['PROJECT']
};

export const KIND_TEXT = {
  LISTING: {
    one: 'listing',
    many: 'listings',
    short: 'listings',
    spends: 'A free slot is used the first time a listing goes live. Republishing a listing is always free.',
    out: 'You can still create and save drafts, but a new listing can’t go live. Listings that were live before can be republished for free.'
  },
  RTO: {
    one: 'Real Time Offer property',
    many: 'Real Time Offer properties',
    short: 'RTO',
    spends: 'A free slot is used the first time a property is submitted. Resubmitting a sent-back property is free.',
    out: 'You can still fill in and save a draft, but a new property can’t be submitted. Resubmitting a sent-back property is free.'
  },
  PROJECT: {
    one: 'project',
    many: 'projects',
    short: 'projects',
    spends: 'A free slot is used the first time a project leaves draft for review. Sending it for review again is free.',
    out: 'You can still fill in and save a project, but a new one will stay a draft instead of going for review. Projects already sent for review are not affected.'
  }
};

const num = (v, d = 0) => (Number.isFinite(Number(v)) ? Number(v) : d);

export function normalizeQuota(q, kind) {
  if (!q || typeof q !== 'object') return null;
  const allowance = num(q.allowance);
  const countedEver = num(q.countedEver, num(q.used));
  const remaining = q.remaining != null ? Math.max(0, num(q.remaining)) : Math.max(0, allowance - countedEver);
  return {
    kind: q.kind || kind,
    label: q.label || KIND_TEXT[q.kind || kind]?.many || '',
    allowance,
    used: q.used != null ? num(q.used) : Math.min(countedEver, allowance),
    remaining,
    nextIsFree: q.nextIsFree != null ? Boolean(q.nextIsFree) : remaining > 0,
    countedEver,
    // Field na aaye to "rokta hai" maan lo (warning dikhana zyada mehfooz)
    enforced: q.enforced == null ? true : Boolean(q.enforced)
  };
}

// { LISTING: {...}, RTO: {...} } → normalized, ya null
export function normalizeAllowance(data) {
  if (!data || typeof data !== 'object') return null;
  const out = {};
  Object.entries(data).forEach(([kind, q]) => {
    const n = normalizeQuota(q, kind);
    if (n) out[kind] = n;
  });
  return Object.keys(out).length ? out : null;
}

// Backend har kism par plan bhi bhejta hai: chalu plan → enforced:false + plan,
// overdue (PAST_DUE/UNPAID) → overdue:true + plan. Company-level hai, pehli kism se le lo.
export function allowanceMeta(data) {
  if (!data || typeof data !== 'object') return { plan: null, overdue: false, grace: null };
  const list = Object.values(data).filter((q) => q && typeof q === 'object');
  return {
    plan: list.find((q) => q.plan)?.plan || null,
    overdue: list.some((q) => q.overdue === true),
    // { graceDays, since, until, daysLeft, inGrace } — payment fail ke baad kitne din publish chalega
    grace: list.find((q) => q.grace)?.grace || null
  };
}

// Limit lagi hai aur khatam ho chuki
export const isQuotaOut = (q) => Boolean(q && q.enforced && q.remaining <= 0);

// Header / Add screens ke liye — is workspace ki kismein, jo counter mein aayi hain
export function allowanceList(freeAllowance, workspace) {
  if (!freeAllowance) return [];
  return (WORKSPACE_KINDS[workspace] || []).map((k) => freeAllowance[k]).filter(Boolean);
}

export function quotaLine(q) {
  const t = KIND_TEXT[q.kind] || { one: 'item', many: q.label || 'items' };
  if (!q.allowance) return `No free ${t.many}`;
  return `${q.remaining} of ${q.allowance} free ${q.allowance === 1 ? t.one : t.many} left`;
}

// Mock mode — stable objects (har render pe naya object nahi)
const MOCK = {
  agency: normalizeAllowance({
    LISTING: { kind: 'LISTING', allowance: 5, used: 2, remaining: 3, countedEver: 2, enforced: true },
    RTO: { kind: 'RTO', allowance: 5, used: 4, remaining: 1, countedEver: 4, enforced: true }
  }),
  developer: normalizeAllowance({
    LISTING: { kind: 'LISTING', allowance: 5, used: 0, remaining: 5, countedEver: 0, enforced: true },
    PROJECT: { kind: 'PROJECT', allowance: 5, used: 3, remaining: 2, countedEver: 3, enforced: true }
  })
};
export const mockFreeAllowance = (workspace) => MOCK[workspace] || MOCK.agency;
