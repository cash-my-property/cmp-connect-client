// Developer project ke documents — kya chahiye, kaunsa number uspe se aata hai, kab expire hota hai.
// Go-live rule: saare "required" documents haath mein (file + number + valid expiry) hon tabhi review ke liye ja sakta hai.

export const EXPIRY_WARNING_DAYS = 45;

export const DOC_STATUS = {
  NOT_SENT: { label: 'Not sent yet', variant: 'neutral' },
  SENT: { label: 'Sent · being checked', variant: 'accent' },
  CHECKED: { label: 'Checked', variant: 'success' },
  REJECTED: { label: 'Sent back', variant: 'danger' }
};

export const DOC_GROUPS = [
  { key: 'registration', title: 'Registration and permits' },
  { key: 'sales', title: 'Sales documents' }
];

export const PROJECT_DOCUMENTS = [
  {
    key: 'dldRegistration',
    group: 'registration',
    label: 'DLD project registration',
    required: true,
    description: 'The project has to be registered with the Dubai Land Department before a single unit is marketed or sold.',
    numberLabel: 'Project number',
    numberPlaceholder: 'e.g. 2187'
  },
  {
    key: 'escrowLetter',
    group: 'registration',
    label: 'Escrow account letter',
    required: true,
    description: 'Bank letter confirming the project escrow account the buyers’ money goes into.',
    numberLabel: 'Account number',
    numberPlaceholder: 'e.g. 0193-7711-204'
  },
  {
    key: 'trakheesiProject',
    group: 'registration',
    label: 'Trakheesi project permit',
    required: true,
    description: 'The permit the project is advertised under. It has to be current, and the location on it has to match the listing.',
    numberLabel: 'Permit number',
    numberPlaceholder: 'e.g. 7140623841',
    expires: true
  },
  {
    key: 'trakheesiUnit',
    group: 'registration',
    label: 'Trakheesi unit permit',
    required: false,
    description: 'Project and unit permits are issued separately. A unit advertised on its own needs its own permit; units advertised as part of the project do not.',
    numberLabel: 'Permit number',
    numberPlaceholder: 'e.g. 7140623902',
    expires: true
  },
  {
    key: 'oqood',
    group: 'registration',
    label: 'Oqood unit registration',
    required: true,
    description: 'Units with no Oqood registration cannot be advertised under the project permit.',
    numberLabel: 'Oqood number',
    numberPlaceholder: 'e.g. OQ-2026-118204'
  },
  {
    key: 'titleDeed',
    group: 'registration',
    label: 'Land title deed',
    required: true,
    description: 'Proof the developer owns the plot and has the right to sell what is built on it.',
    numberLabel: 'Title deed number',
    numberPlaceholder: 'e.g. 341-2019-00872'
  },
  {
    key: 'floorPlans',
    group: 'sales',
    label: 'Floor plans for every unit type',
    required: true,
    description: 'One plan per unit type. Buyers ask for these before anything else.'
  },
  {
    key: 'priceList',
    group: 'sales',
    label: 'Price list and availability sheet',
    required: true,
    description: 'Unit number, type, size, floor, view and price. This is what keeps a listing honest as units sell.'
  },
  {
    key: 'masterPlan',
    group: 'sales',
    label: 'Master plan and location map',
    required: false,
    description: 'Where the project sits and what is around it.'
  },
  {
    key: 'marketingNoc',
    group: 'sales',
    label: 'Marketing agreement or NOC',
    required: false,
    description: 'Only needed when another company markets this project for you, so we can show it is allowed to.'
  }
];

export const REQUIRED_DOCUMENTS = PROJECT_DOCUMENTS.filter((d) => d.required);

export const emptyDocument = () => ({ fileName: '', url: '', number: '', expiresOn: '', status: 'NOT_SENT', sentAt: '' });

export const emptyDocuments = () =>
  Object.fromEntries(PROJECT_DOCUMENTS.map((d) => [d.key, emptyDocument()]));

// Purane fields (rera, escrowAccount, escrowLetter) se documents bharo — backward compatible
export function normalizeDocuments(project) {
  const docs = { ...emptyDocuments(), ...(project?.documents || {}) };
  Object.keys(docs).forEach((k) => { docs[k] = { ...emptyDocument(), ...docs[k] }; });
  // Backfill sirf tab jab documents record pehli baar ban raha ho
  if (project?.documents) return docs;
  if (!docs.dldRegistration.number && project?.rera) docs.dldRegistration.number = String(project.rera).replace(/^RERA-/i, '');
  if (!docs.escrowLetter.number && project?.escrowAccount) docs.escrowLetter.number = project.escrowAccount;
  if (!docs.escrowLetter.fileName && project?.escrowLetter === true) {
    docs.escrowLetter.fileName = project.escrowLetterName || 'escrow-letter.pdf';
    docs.escrowLetter.status = 'CHECKED';
  }
  return docs;
}

export const daysUntil = (iso) => {
  if (!iso) return null;
  const end = new Date(`${iso}T23:59:59`);
  if (Number.isNaN(end.getTime())) return null;
  return Math.ceil((end.getTime() - Date.now()) / 86400000);
};

// Expiry state: null (no expiry) | 'missing' | 'expired' | 'soon' | 'ok'
export function expiryState(def, doc) {
  if (!def.expires) return null;
  if (!doc?.expiresOn) return 'missing';
  const d = daysUntil(doc.expiresOn);
  if (d == null) return 'missing';
  if (d < 0) return 'expired';
  if (d <= EXPIRY_WARNING_DAYS) return 'soon';
  return 'ok';
}

// "Haath mein" = file + (number agar chahiye) + (expiry agar chahiye aur abhi valid) + sent back nahi
export function isDocumentInHand(def, doc) {
  if (!doc?.fileName) return false;
  if (doc.status === 'REJECTED') return false;
  if (def.numberLabel && !String(doc.number || '').trim()) return false;
  if (def.expires && ['missing', 'expired'].includes(expiryState(def, doc))) return false;
  return true;
}

// Kya missing hai, readable list
export function documentGaps(def, doc) {
  const gaps = [];
  if (!doc?.fileName) gaps.push('the file');
  if (doc?.status === 'REJECTED') gaps.push('a new file (the last one was sent back)');
  if (def.numberLabel && !String(doc?.number || '').trim()) gaps.push(def.numberLabel.toLowerCase());
  const ex = expiryState(def, doc);
  if (ex === 'missing') gaps.push('the date it runs out');
  if (ex === 'expired') gaps.push('a permit that has not run out');
  return gaps;
}

export function documentsSummary(documents) {
  const docs = documents || {};
  const inHand = REQUIRED_DOCUMENTS.filter((d) => isDocumentInHand(d, docs[d.key]));
  const missing = REQUIRED_DOCUMENTS.filter((d) => !isDocumentInHand(d, docs[d.key]));
  const expiringSoon = PROJECT_DOCUMENTS.filter((d) => docs[d.key]?.fileName && expiryState(d, docs[d.key]) === 'soon');
  const expired = PROJECT_DOCUMENTS.filter((d) => docs[d.key]?.fileName && expiryState(d, docs[d.key]) === 'expired');
  return { inHand: inHand.length, total: REQUIRED_DOCUMENTS.length, missing, expiringSoon, expired };
}
