// Developer workspace — mock data (Mock Data mode only).
// Live mode mein ye kabhi use nahi hota; developer APIs aane tak pages placeholder hain.

const photos = (prefix, count, coverIdx = 0) =>
  Array.from({ length: count }, (_, i) => ({
    id: `${prefix}-ph${i + 1}`,
    name: `${prefix}-photo-${i + 1}.jpg`,
    caption: '',
    kind: 'photo',
    cover: i === coverIdx
  }));

export const developerCompany = {
  name: 'Saffar Developments',
  nameAr: 'صفار للتطوير',
  developerType: 'Master developer',
  emirate: 'Dubai',
  founded: '2016',
  website: 'https://saffardevelopments.ae',
  about:
    'Saffar Developments builds mid-market apartments and townhouses across Dubai, with four communities delivered since 2016 and three under construction. Every project is registered with RERA and sold through a project escrow account.',
  address: 'Office 1204, Bay Square Building 7, Business Bay, Dubai',
  salesEmail: 'sales@saffardevelopments.ae',
  salesPhone: '+971 4 555 0180',
  whatsapp: '+971 50 555 0180',
  tradeLicence: '784512',
  dldNumber: 'DLD-DEV-1187',
  trn: '100392847500003',
  memberSince: '2026-02-11',
  accountManager: 'Faisal Rahman',
  verified: true
};

export const developerTeam = [
  { id: 'dm1', name: 'Hanan Fakhoury', position: 'Sales Director', email: 'hanan@saffardevelopments.ae', access: 'Owner', brn: '', projectIds: ['p1', 'p2', 'p3', 'p4', 'p5'], shownToBuyers: false, status: 'Active', languages: ['English', 'Arabic'] },
  { id: 'dm2', name: 'Omar Siddiqui', position: 'Sales Manager', email: 'omar@saffardevelopments.ae', access: 'Sales', brn: 'BRN-61904', projectIds: ['p1', 'p2'], shownToBuyers: true, status: 'Active', languages: ['English', 'Urdu', 'Hindi'] },
  { id: 'dm3', name: 'Reem Al Suwaidi', position: 'Project Marketing', email: 'reem@saffardevelopments.ae', access: 'Marketing', brn: '', projectIds: ['p1', 'p3', 'p4'], shownToBuyers: false, status: 'Active', languages: ['English', 'Arabic'] },
  { id: 'dm4', name: 'Vikram Rao', position: 'CRM & Enquiries', email: 'vikram@saffardevelopments.ae', access: 'Sales', brn: 'BRN-62551', projectIds: ['p3', 'p5'], shownToBuyers: false, status: 'Active', languages: ['English', 'Hindi'] },
  { id: 'dm5', name: 'Aisha Noor', position: 'Senior Sales Consultant', email: 'aisha@saffardevelopments.ae', access: 'Sales', brn: 'BRN-63870', projectIds: [], shownToBuyers: false, status: 'Invited', languages: ['English'] }
];

const baseProjects = [
  {
    id: 'p1',
    name: 'Saffar Rise',
    community: 'Business Bay',
    emirate: 'Dubai',
    stage: 'Off-plan',
    status: 'LIVE',
    handoverDate: '2028-06-30',
    launchDate: '2026-09-14',
    buildPct: 18,
    rera: 'RERA-2187',
    escrowAccount: '0193-7711-204',
    escrowBank: 'Emirates NBD',
    escrowLetter: true,
    serviceCharge: '16.50',
    dldWaiver: '4',
    description:
      'A 34-storey tower on the canal edge of Business Bay: studios to three-bedroom apartments, a podium pool deck and retail at street level. Handover mid 2028.',
    amenities: ['Infinity pool', 'Gym and studio', 'Kids play area', 'Landscaped podium', 'Retail at ground level', 'Covered parking', '24-hour security', 'Concierge'],
    unitTypes: [
      { id: 'u1', label: 'Studio', type: 'Apartment', beds: 0, sizeFrom: 412, sizeTo: 468, priceFrom: 1450000, total: 48, available: 12, reserved: 6, sold: 30 },
      { id: 'u2', label: '1 bedroom', type: 'Apartment', beds: 1, sizeFrom: 640, sizeTo: 762, priceFrom: 1980000, total: 96, available: 31, reserved: 9, sold: 56 },
      { id: 'u3', label: '2 bedroom', type: 'Apartment', beds: 2, sizeFrom: 1080, sizeTo: 1244, priceFrom: 2860000, total: 64, available: 28, reserved: 6, sold: 30 },
      { id: 'u4', label: '3 bedroom', type: 'Apartment', beds: 3, sizeFrom: 1520, sizeTo: 1690, priceFrom: 4240000, total: 24, available: 14, reserved: 2, sold: 8 }
    ],
    paymentPlan: [
      { id: 'pp1', milestone: 'On booking', share: 10, due: 'At reservation' },
      { id: 'pp2', milestone: 'During construction', share: 50, due: 'Eight instalments to Q1 2028' },
      { id: 'pp3', milestone: 'On handover', share: 40, due: '30 Jun 2028' }
    ],
    photos: photos('saffar-rise', 24),
    brochure: 'saffar-rise-brochure.pdf',
    views30d: 14820,
    saves: 1104,
    enquiries30d: 268
  },
  {
    id: 'p2',
    name: 'Saffar Gardens',
    community: 'Dubai South',
    emirate: 'Dubai',
    stage: 'Under Construction',
    status: 'LIVE',
    handoverDate: '2027-09-30',
    launchDate: '2025-03-02',
    buildPct: 72,
    rera: 'RERA-1964',
    escrowAccount: '0193-5520-118',
    escrowBank: 'Emirates NBD',
    escrowLetter: true,
    serviceCharge: '4.75',
    dldWaiver: '',
    description:
      'A gated community of townhouses and corner villas around a central park in Dubai South, ten minutes from Al Maktoum airport.',
    amenities: ['Central park', 'Community pool', 'Cycling track', 'Clubhouse', 'Nursery', '24-hour security'],
    unitTypes: [
      { id: 'u1', label: '3 bedroom townhouse', type: 'Townhouse', beds: 3, sizeFrom: 2140, sizeTo: 2310, priceFrom: 2310000, total: 86, available: 9, reserved: 4, sold: 73 },
      { id: 'u2', label: '4 bedroom townhouse', type: 'Townhouse', beds: 4, sizeFrom: 2680, sizeTo: 2940, priceFrom: 3120000, total: 42, available: 6, reserved: 3, sold: 33 },
      { id: 'u3', label: '4 bedroom corner villa', type: 'Villa', beds: 4, sizeFrom: 3280, sizeTo: 3480, priceFrom: 3980000, total: 12, available: 2, reserved: 0, sold: 10 }
    ],
    paymentPlan: [
      { id: 'pp1', milestone: 'On booking', share: 20, due: 'At reservation' },
      { id: 'pp2', milestone: 'During construction', share: 40, due: 'Quarterly to Q3 2027' },
      { id: 'pp3', milestone: 'On handover', share: 40, due: '30 Sep 2027' }
    ],
    photos: photos('saffar-gardens', 18),
    brochure: 'saffar-gardens-brochure.pdf',
    views30d: 9640,
    saves: 702,
    enquiries30d: 141
  },
  {
    id: 'p3',
    name: 'Saffar Vista',
    community: 'Jumeirah Village Circle',
    emirate: 'Dubai',
    stage: 'Off-plan',
    status: 'LIVE',
    handoverDate: '2028-02-28',
    launchDate: '2026-06-20',
    buildPct: 6,
    rera: 'RERA-2203',
    escrowAccount: '0193-8812-331',
    escrowBank: 'Mashreq',
    escrowLetter: true,
    serviceCharge: '14.00',
    dldWaiver: '',
    description:
      'A mid-rise residence in JVC with studios to two-bedroom apartments, a rooftop pool and a landscaped courtyard.',
    amenities: ['Rooftop pool', 'Gym', 'Courtyard garden', 'Covered parking'],
    unitTypes: [
      { id: 'u1', label: 'Studio', type: 'Apartment', beds: 0, sizeFrom: 388, sizeTo: 430, priceFrom: 980000, total: 64, available: 40, reserved: 5, sold: 19 },
      { id: 'u2', label: '1 bedroom', type: 'Apartment', beds: 1, sizeFrom: 610, sizeTo: 704, priceFrom: 1320000, total: 88, available: 61, reserved: 7, sold: 20 },
      { id: 'u3', label: '2 bedroom', type: 'Apartment', beds: 2, sizeFrom: 980, sizeTo: 1120, priceFrom: 1890000, total: 44, available: 33, reserved: 3, sold: 8 }
    ],
    paymentPlan: [
      { id: 'pp1', milestone: 'On booking', share: 10, due: 'At reservation' },
      { id: 'pp2', milestone: 'During construction', share: 50, due: 'Monthly to Q4 2027' },
      { id: 'pp3', milestone: 'On handover', share: 40, due: '28 Feb 2028' }
    ],
    photos: [
      { id: 'p3-ph1', name: 'tower-render.png', caption: '', kind: 'photo', cover: true },
      { id: 'p3-ph2', name: 'pool-deck.png', caption: '', kind: 'photo', cover: false }
    ],
    brochure: '',
    views30d: 11210,
    saves: 864,
    enquiries30d: 204
  },
  {
    id: 'p4',
    name: 'Saffar Shoreline',
    community: 'Dubai Islands',
    emirate: 'Dubai',
    stage: 'Off-plan',
    status: 'IN_REVIEW',
    handoverDate: '2029-12-31',
    launchDate: '',
    buildPct: 0,
    rera: 'RERA-2290',
    escrowAccount: '0193-9904-412',
    escrowBank: 'Emirates NBD',
    escrowLetter: false,
    serviceCharge: '',
    dldWaiver: '',
    description:
      'Beachfront apartments and penthouses on Dubai Islands, with a private beach club and marina views.',
    amenities: ['Private beach', 'Beach club', 'Infinity pool', 'Spa'],
    unitTypes: [
      { id: 'u1', label: '2 bedroom', type: 'Apartment', beds: 2, sizeFrom: 1340, sizeTo: 1480, priceFrom: 3400000, total: 56, available: 56, reserved: 0, sold: 0 },
      { id: 'u2', label: '3 bedroom', type: 'Apartment', beds: 3, sizeFrom: 1820, sizeTo: 2040, priceFrom: 4900000, total: 38, available: 38, reserved: 0, sold: 0 },
      { id: 'u3', label: '4 bedroom penthouse', type: 'Penthouse', beds: 4, sizeFrom: 3600, sizeTo: 4120, priceFrom: 11500000, total: 6, available: 6, reserved: 0, sold: 0 }
    ],
    paymentPlan: [
      { id: 'pp1', milestone: 'On booking', share: 20, due: 'At reservation' },
      { id: 'pp2', milestone: 'During construction', share: 30, due: 'Quarterly to 2029' },
      { id: 'pp3', milestone: 'On handover', share: 50, due: '31 Dec 2029' }
    ],
    photos: photos('saffar-shoreline', 8),
    brochure: 'saffar-shoreline-brochure.pdf',
    views30d: 0,
    saves: 0,
    enquiries30d: 0
  },
  {
    id: 'p5',
    name: 'Saffar Courtyard',
    community: 'Al Furjan',
    emirate: 'Dubai',
    stage: 'Ready',
    status: 'HANDED_OVER',
    handoverDate: '2025-12-15',
    launchDate: '2023-04-10',
    buildPct: 100,
    rera: 'RERA-1588',
    escrowAccount: '0193-2210-077',
    escrowBank: 'Emirates NBD',
    escrowLetter: true,
    serviceCharge: '12.25',
    dldWaiver: '',
    description: 'Ready one- and two-bedroom apartments around a shaded courtyard in Al Furjan, next to the metro.',
    amenities: ['Courtyard garden', 'Pool', 'Gym', 'Metro access'],
    unitTypes: [
      { id: 'u1', label: '1 bedroom', type: 'Apartment', beds: 1, sizeFrom: 672, sizeTo: 744, priceFrom: 1120000, total: 60, available: 7, reserved: 1, sold: 52 },
      { id: 'u2', label: '2 bedroom', type: 'Apartment', beds: 2, sizeFrom: 1010, sizeTo: 1160, priceFrom: 1640000, total: 36, available: 4, reserved: 0, sold: 32 }
    ],
    paymentPlan: [
      { id: 'pp1', milestone: 'On booking', share: 20, due: 'At reservation' },
      { id: 'pp2', milestone: 'On transfer', share: 80, due: 'At DLD transfer' }
    ],
    photos: photos('saffar-courtyard', 12),
    brochure: 'saffar-courtyard-brochure.pdf',
    views30d: 4115,
    saves: 233,
    enquiries30d: 58
  },
  {
    id: 'p6',
    name: 'Saffar Rise Tower B',
    community: 'Business Bay',
    emirate: 'Dubai',
    stage: 'Off-plan',
    status: 'DRAFT',
    handoverDate: '',
    launchDate: '',
    buildPct: 0,
    rera: '',
    escrowAccount: '',
    escrowBank: '',
    escrowLetter: false,
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
  }
];

// Project documents (mock) — file + number + expiry + status
const daysFromNow = (d) => new Date(Date.now() + d * 86400000).toISOString().slice(0, 10);
const doc = (fileName, number = '', expiresOn = '', status = 'CHECKED') => ({ fileName, url: '', number, expiresOn, status, sentAt: '2026-09-01T09:00:00.000Z' });
const none = () => ({ fileName: '', url: '', number: '', expiresOn: '', status: 'NOT_SENT', sentAt: '' });
const projectDocs = (slug, nums, opts = {}) => ({
  dldRegistration: doc(`${slug}-dld-registration.pdf`, nums.dld, '', opts.status),
  escrowLetter: opts.noEscrow ? none() : doc(`${slug}-escrow-letter.pdf`, nums.escrow, '', opts.status),
  trakheesiProject: doc(`${slug}-trakheesi-permit.pdf`, nums.permit, opts.permitExpires || daysFromNow(240), opts.status),
  trakheesiUnit: none(),
  oqood: doc(`${slug}-oqood.pdf`, nums.oqood, '', opts.status),
  titleDeed: doc(`${slug}-title-deed.pdf`, nums.deed, '', opts.status),
  floorPlans: doc(`${slug}-floor-plans.pdf`, '', '', opts.status),
  priceList: doc(`${slug}-price-list.xlsx`, '', '', opts.status),
  masterPlan: opts.masterPlan ? doc(`${slug}-master-plan.pdf`, '', '', opts.status) : none(),
  marketingNoc: none()
});

const DOCS = {
  p1: projectDocs('saffar-rise', { dld: '2187', escrow: '0193-7711-204', permit: '7140623841', oqood: 'OQ-2026-118204', deed: '341-2019-00872' }, { masterPlan: true }),
  p2: projectDocs('saffar-gardens', { dld: '1964', escrow: '0193-5520-118', permit: '7140519027', oqood: 'OQ-2025-093311', deed: '512-2018-00419' }, { permitExpires: daysFromNow(30), masterPlan: true }),
  p3: projectDocs('saffar-vista', { dld: '2203', escrow: '0193-8812-331', permit: '7140631175', oqood: 'OQ-2026-120577', deed: '218-2020-01136' }),
  p4: projectDocs('saffar-shoreline', { dld: '2290', escrow: '', permit: '7140702260', oqood: 'OQ-2026-131980', deed: '603-2021-00058' }, { noEscrow: true, status: 'SENT', masterPlan: true }),
  p5: projectDocs('saffar-courtyard', { dld: '1588', escrow: '0193-2210-077', permit: '7140388410', oqood: 'OQ-2023-044120', deed: '377-2016-00731' }),
  p6: Object.fromEntries(['dldRegistration', 'escrowLetter', 'trakheesiProject', 'trakheesiUnit', 'oqood', 'titleDeed', 'floorPlans', 'priceList', 'masterPlan', 'marketingNoc'].map((k) => [k, none()]))
};

export const developerProjects = baseProjects.map((p) => ({ ...p, documents: DOCS[p.id] }));

const hoursAgo = (h) => new Date(Date.now() - h * 3600 * 1000).toISOString();

export const developerEnquiries = [
  { id: 'e1', buyer: 'Mariam Al Blooshi', nationality: 'Emirati', intent: 'Buying to live in', phone: '+971501234501', projectId: 'p1', unit: '2 bedroom', channel: 'Website form', budget: 'AED 2.8m – 3.2m', status: 'NEW', pickedUpBy: '', createdAt: hoursAgo(3), message: 'Is there a canal-facing 2 bedroom left on a high floor? We would like to visit the sales centre this weekend.' },
  { id: 'e2', buyer: 'Daniel Okafor', nationality: 'Nigerian', intent: 'Investor', phone: '+971501234502', projectId: 'p3', unit: '1 bedroom', channel: 'WhatsApp', budget: 'AED 1.2m – 1.4m', status: 'NEW', pickedUpBy: '', createdAt: hoursAgo(7), message: 'What rental yield do you expect on the 1 bedroom, and is the payment plan open to non-residents?' },
  { id: 'e3', buyer: 'Anastasia Volkova', nationality: 'Russian', intent: 'Buying to live in', phone: '+971501234503', projectId: 'p1', unit: '3 bedroom', channel: 'Call', budget: 'AED 4m+', status: 'CONTACTED', pickedUpBy: 'dm2', createdAt: hoursAgo(26), message: 'Called about the 3 bedroom layouts and the handover date.' },
  { id: 'e4', buyer: 'Rahul Menon', nationality: 'Indian', intent: 'Buying to live in', phone: '+971501234504', projectId: 'p2', unit: '3 bedroom townhouse', channel: 'Website form', budget: 'AED 2.2m – 2.5m', status: 'QUALIFIED', pickedUpBy: 'dm4', createdAt: hoursAgo(30), message: 'Looking for a townhouse near the park, ready by end of 2027.' },
  { id: 'e5', buyer: 'Sofia Haddad', nationality: 'Lebanese', intent: 'Buying to live in', phone: '+971501234505', projectId: 'p2', unit: '4 bedroom townhouse', channel: 'Call', budget: 'AED 3m – 3.4m', status: 'RESERVED', pickedUpBy: 'dm2', createdAt: hoursAgo(50), message: 'Paid the booking amount for a 4 bedroom townhouse; agreement to follow.' },
  { id: 'e6', buyer: 'James Whitfield', nationality: 'British', intent: 'Investor', phone: '+971501234506', projectId: 'p3', unit: 'Studio', channel: 'Email', budget: 'AED 900k – 1.1m', status: 'CONTACTED', pickedUpBy: 'dm4', createdAt: hoursAgo(74), message: 'Interested in two studios as an investment. Please send the brochure and floor plans.' },
  { id: 'e7', buyer: 'Khalid Al Mazrouei', nationality: 'Emirati', intent: 'Buying to live in', phone: '+971501234507', projectId: 'p5', unit: '2 bedroom', channel: 'WhatsApp', budget: 'AED 1.6m – 1.8m', status: 'QUALIFIED', pickedUpBy: 'dm1', createdAt: hoursAgo(98), message: 'Can I view a ready 2 bedroom this week?' },
  { id: 'e8', buyer: 'Grace Lim', nationality: 'Singaporean', intent: 'Investor', phone: '+971501234508', projectId: 'p1', unit: 'Studio', channel: 'Website form', budget: 'AED 1.4m – 1.6m', status: 'LOST', pickedUpBy: 'dm2', createdAt: hoursAgo(194), message: 'Bought elsewhere.' }
];
