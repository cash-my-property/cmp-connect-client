import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { NavLink } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { cmpConnectApi } from '../../services/cmpConnectApi';
import { RefreshCw } from 'lucide-react';
import { formatAED } from '../../utils/formatters';

const initialMergedOffers = [
  {
    id: 'of-1',
    name: 'Hala Mansour',
    buyerTag: 'Buyer 12',
    email: 'hala@example.ae',
    phone: '+971 50 311 2280',
    propertyId: 'CMP-L-004120',
    propertyTitle: 'Duplex penthouse on the Palm',
    propertyRef: 'CMP-L-004120',
    propertyOpening: '10% of AED 9.5M opening offer',
    propertyStatus: 'Offers open',
    propertyStatusColor: 'var(--cmp-success)',
    latestOffer: 'AED 9,750,000',
    offersCount: 2,
    identityStatus: 'verified', // 'verified' | 'checking' | 'failed'
    chequeStatus: 'received',   // 'received' | 'awaiting' | 'returned' | 'cashed' | 'bounced'
    chequeAmountNum: 950000,
    chequeAmount: 'AED 950,000',
    chequeNo: 'No. 118830',
    bank: 'ADCB',
    receivedDate: '2026-09-14',
    requestedTime: '11m ago',
    status: 'pending',          // 'pending' | 'approved' | 'declined'
    isReadyToReturn: false,
    isWinningBidder: false
  },
  {
    id: 'of-2',
    name: 'Ravi Menon',
    buyerTag: 'Buyer 13',
    email: 'ravi@example.com',
    phone: '+971 55 902 1144',
    propertyId: 'CMP-L-004121',
    propertyTitle: 'Two bed on a high floor of Marina Gate',
    propertyRef: 'CMP-L-004121',
    propertyOpening: '10% of AED 2.1M opening offer',
    propertyStatus: 'Closing now',
    propertyStatusColor: 'var(--cmp-danger)',
    latestOffer: 'AED 2,425,000',
    offersCount: 3,
    identityStatus: 'verified',
    chequeStatus: 'received',
    chequeAmountNum: 210000,
    chequeAmount: 'AED 210,000',
    chequeNo: 'No. 331904',
    bank: 'HSBC UAE',
    receivedDate: '2026-09-14',
    requestedTime: '34m ago',
    status: 'pending',
    isReadyToReturn: false,
    isWinningBidder: false
  },
  {
    id: 'of-3',
    name: 'Faisal Qureshi',
    buyerTag: 'Buyer 9',
    email: 'faisal@example.ae',
    phone: '+971 52 118 7730',
    propertyId: 'CMP-L-004122',
    propertyTitle: 'Four bedroom family villa',
    propertyRef: 'CMP-L-004122',
    propertyOpening: '10% of AED 4.8M opening offer',
    propertyStatus: 'Offers open',
    propertyStatusColor: 'var(--cmp-success)',
    latestOffer: '—',
    offersCount: 0,
    identityStatus: 'checking',
    chequeStatus: 'awaiting',
    chequeAmountNum: 480000,
    chequeAmount: 'AED 480,000',
    chequeNo: null,
    bank: 'Not yet received',
    receivedDate: '—',
    requestedTime: '52m ago',
    status: 'pending',
    isReadyToReturn: false,
    isWinningBidder: false
  },
  {
    id: 'of-4',
    name: 'Lukas Berger',
    buyerTag: 'Buyer 14',
    email: 'lukas@example.de',
    phone: '+971 58 440 6612',
    propertyId: 'CMP-L-004120',
    propertyTitle: 'Duplex penthouse on the Palm',
    propertyRef: 'CMP-L-004120',
    propertyOpening: '10% of AED 9.5M opening offer',
    propertyStatus: 'Offers open',
    propertyStatusColor: 'var(--cmp-success)',
    latestOffer: '—',
    offersCount: 0,
    identityStatus: 'failed',
    chequeStatus: 'received',
    chequeAmountNum: 950000,
    chequeAmount: 'AED 950,000',
    chequeNo: 'No. 220417',
    bank: 'Mashreq',
    receivedDate: '2026-09-14',
    requestedTime: '2h ago',
    status: 'pending',
    isReadyToReturn: false,
    isWinningBidder: false
  },
  {
    id: 'of-5',
    name: 'Yousef Al Marri',
    buyerTag: 'Buyer 7',
    email: 'yousef@example.ae',
    phone: '+971 50 712 8890',
    propertyId: 'CMP-L-004120',
    propertyTitle: 'Duplex penthouse on the Palm',
    propertyRef: 'CMP-L-004120',
    propertyOpening: '10% of AED 9.5M opening offer',
    propertyStatus: 'Offers open',
    propertyStatusColor: 'var(--cmp-success)',
    latestOffer: 'AED 9,950,000',
    offersCount: 4,
    identityStatus: 'verified',
    chequeStatus: 'received',
    chequeAmountNum: 950000,
    chequeAmount: 'AED 950,000',
    chequeNo: 'No. 004812',
    bank: 'Emirates NBD',
    receivedDate: '2026-09-11',
    requestedTime: '3d ago',
    status: 'approved',
    isReadyToReturn: false,
    isWinningBidder: false
  },
  {
    id: 'of-6',
    name: 'Mei Tanaka',
    buyerTag: 'Buyer 3',
    email: 'mei@example.jp',
    phone: '+971 50 882 1099',
    propertyId: 'CMP-L-004121',
    propertyTitle: 'Two bed on a high floor of Marina Gate',
    propertyRef: 'CMP-L-004121',
    propertyOpening: '10% of AED 2.1M opening offer',
    propertyStatus: 'Closing now',
    propertyStatusColor: 'var(--cmp-danger)',
    latestOffer: 'AED 2,475,000',
    offersCount: 5,
    identityStatus: 'verified',
    chequeStatus: 'received',
    chequeAmountNum: 210000,
    chequeAmount: 'AED 210,000',
    chequeNo: 'No. 090221',
    bank: 'First Abu Dhabi Bank',
    receivedDate: '2026-09-12',
    requestedTime: '1d ago',
    status: 'approved',
    isReadyToReturn: false,
    isWinningBidder: false
  },
  {
    id: 'of-7',
    name: 'Sophie Lambert',
    buyerTag: 'Buyer 4',
    email: 'sophie@example.fr',
    phone: '+971 56 410 3321',
    propertyId: 'CMP-L-004123',
    propertyTitle: 'Three bed townhouse near the park',
    propertyRef: 'CMP-L-004123',
    propertyOpening: '10% of AED 3.6M opening offer',
    propertyStatus: 'Opens soon',
    propertyStatusColor: 'var(--cmp-info)',
    latestOffer: '—',
    offersCount: 0,
    identityStatus: 'verified',
    chequeStatus: 'received',
    chequeAmountNum: 360000,
    chequeAmount: 'AED 360,000',
    chequeNo: 'No. 562210',
    bank: 'RAKBANK',
    receivedDate: '2026-09-14',
    requestedTime: '1d ago',
    status: 'approved',
    isReadyToReturn: false,
    isWinningBidder: false
  },
  {
    id: 'of-8',
    name: 'Daniel Brooks',
    buyerTag: 'Buyer 5 · winning buyer',
    email: 'daniel@example.co.uk',
    phone: '+971 55 120 4455',
    propertyId: 'CMP-L-004098',
    propertyTitle: 'One bed in The Address Residences',
    propertyRef: 'CMP-L-004098',
    propertyOpening: '10% of AED 1.9M opening offer',
    propertyStatus: 'Sold',
    propertyStatusColor: 'var(--cmp-brand)',
    latestOffer: 'AED 2,340,000',
    offersCount: 6,
    identityStatus: 'verified',
    chequeStatus: 'received',
    chequeAmountNum: 190000,
    chequeAmount: 'AED 190,000',
    chequeNo: 'No. 400118',
    bank: 'Emirates NBD',
    receivedDate: '2026-09-03',
    requestedTime: '2w ago',
    status: 'approved',
    isReadyToReturn: false,
    isWinningBidder: true
  },
  {
    id: 'of-9',
    name: 'Noura Saeed',
    buyerTag: 'Buyer 8',
    email: 'noura@example.ae',
    phone: '+971 54 300 9988',
    propertyId: 'CMP-L-004098',
    propertyTitle: 'One bed in The Address Residences',
    propertyRef: 'CMP-L-004098',
    propertyOpening: '10% of AED 1.9M opening offer',
    propertyStatus: 'Sold',
    propertyStatusColor: 'var(--cmp-brand)',
    latestOffer: 'AED 2,290,000',
    offersCount: 4,
    identityStatus: 'verified',
    chequeStatus: 'received',
    chequeAmountNum: 190000,
    chequeAmount: 'AED 190,000',
    chequeNo: 'No. 400931',
    bank: 'Dubai Islamic Bank',
    receivedDate: '2026-09-04',
    requestedTime: '2w ago',
    status: 'approved',
    isReadyToReturn: true,
    isWinningBidder: false
  },
  {
    id: 'of-10',
    name: 'Hassan Rafiq',
    buyerTag: 'Buyer 3',
    email: 'hassan@example.ae',
    phone: '+971 50 998 1120',
    propertyId: 'CMP-L-004076',
    propertyTitle: 'Furnished studio with pool view',
    propertyRef: 'CMP-L-004076',
    propertyOpening: '10% of AED 560K opening offer',
    propertyStatus: 'Not sold',
    propertyStatusColor: 'var(--cmp-text-faint)',
    latestOffer: '—',
    offersCount: 0,
    identityStatus: 'verified',
    chequeStatus: 'received',
    chequeAmountNum: 56000,
    chequeAmount: 'AED 56,000',
    chequeNo: 'No. 120087',
    bank: 'ADIB',
    receivedDate: '2026-08-30',
    requestedTime: '3w ago',
    status: 'approved',
    isReadyToReturn: true,
    isWinningBidder: false
  },
  {
    id: 'of-11',
    name: 'Chloe Martin',
    buyerTag: 'Buyer 2 · winning buyer',
    email: 'chloe@example.uk',
    phone: '+971 52 601 8840',
    propertyId: 'CMP-L-004051',
    propertyTitle: 'Canal view three bed with study',
    propertyRef: 'CMP-L-004051',
    propertyOpening: '10% of AED 2.9M opening offer',
    propertyStatus: 'Sold',
    propertyStatusColor: 'var(--cmp-brand)',
    latestOffer: 'AED 3,610,000',
    offersCount: 7,
    identityStatus: 'verified',
    chequeStatus: 'returned',
    chequeSubText: 'on 2026-09-10',
    chequeAmountNum: 290000,
    chequeAmount: 'AED 290,000',
    chequeNo: 'No. 613302',
    bank: 'First Abu Dhabi Bank',
    receivedDate: '2026-08-22',
    requestedTime: '1m ago',
    status: 'approved',
    isReadyToReturn: false,
    isWinningBidder: true
  },
  {
    id: 'of-12',
    name: 'Imran Sheikh',
    buyerTag: 'Buyer 6',
    email: 'imran@example.ae',
    phone: '+971 55 811 2900',
    propertyId: 'CMP-L-004051',
    propertyTitle: 'Canal view three bed with study',
    propertyRef: 'CMP-L-004051',
    propertyOpening: '10% of AED 2.9M opening offer',
    propertyStatus: 'Sold',
    propertyStatusColor: 'var(--cmp-brand)',
    latestOffer: 'AED 3,520,000',
    offersCount: 3,
    identityStatus: 'verified',
    chequeStatus: 'returned',
    chequeSubText: 'on 2026-08-26',
    chequeAmountNum: 290000,
    chequeAmount: 'AED 290,000',
    chequeNo: 'No. 613877',
    bank: 'Mashreq',
    receivedDate: '2026-08-21',
    requestedTime: '1m ago',
    status: 'approved',
    isReadyToReturn: false,
    isWinningBidder: false
  },
  {
    id: 'of-13',
    name: 'Tariq Al Nuaimi',
    buyerTag: 'Buyer 11',
    email: 'tariq@example.ae',
    phone: '+971 50 449 0112',
    propertyId: 'CMP-L-004122',
    propertyTitle: 'Four bedroom family villa',
    propertyRef: 'CMP-L-004122',
    propertyOpening: '10% of AED 4.8M opening offer',
    propertyStatus: 'Offers open',
    propertyStatusColor: 'var(--cmp-success)',
    latestOffer: '—',
    offersCount: 0,
    identityStatus: 'failed',
    chequeStatus: 'bounced',
    chequeSubText: 'on 2026-09-13',
    chequeAmountNum: 480000,
    chequeAmount: 'AED 480,000',
    chequeNo: 'No. 771045',
    bank: 'Commercial Bank of Dubai',
    receivedDate: '2026-09-12',
    requestedTime: '3d ago',
    status: 'declined',
    isReadyToReturn: false,
    isWinningBidder: false
  }
];

// Live API ke enums → page ke local status keys
const REG_STATUS_MAP = { PENDING: 'pending', APPROVED: 'approved', REJECTED: 'declined' };
const CHEQUE_STATUS_MAP = {
  NOT_RECEIVED: 'awaiting',
  RECEIVED: 'received',
  RETURN_READY: 'ready',
  RETURNED: 'returned',
  CASHED: 'cashed',
  BOUNCED: 'bounced'
};

// Backend ke allowed transitions — sirf yehi buttons dikhane hain
const LIVE_CHEQUE_ACTIONS = {
  NOT_RECEIVED: [{ action: 'RECEIVED', label: 'Mark cheque received', primary: true }],
  RECEIVED: [
    { action: 'RETURN_READY', label: 'Ready to return' },
    { action: 'RETURNED', label: 'Return cheque' },
    { action: 'CASHED', label: 'Cash cheque', confirm: 'Cash this security cheque?' },
    { action: 'BOUNCED', label: 'Mark bounced', confirm: 'Mark this cheque as bounced?' }
  ],
  RETURN_READY: [
    { action: 'RETURNED', label: 'Return cheque', primary: true },
    { action: 'RECEIVED', label: 'Keep holding' }
  ],
  RETURNED: [],
  CASHED: [{ action: 'BOUNCED', label: 'Mark bounced', confirm: 'Mark this cashed cheque as bounced?' }],
  BOUNCED: [{ action: 'RECEIVED', label: 'Mark received again' }]
};

const CHEQUE_ACTION_DONE = {
  RECEIVED: 'marked as received',
  RETURN_READY: 'marked ready to return',
  RETURNED: 'marked as returned',
  CASHED: 'marked as cashed',
  BOUNCED: 'marked as bounced'
};

// Filter chip → API query params (live mode me server-side filter)
const LIVE_FILTER_PARAMS = {
  pending: { status: 'PENDING' },
  approved: { status: 'APPROVED' },
  declined: { status: 'REJECTED' },
  cheque_received: { chequeStatus: 'RECEIVED' },
  cheque_awaiting: { chequeStatus: 'NOT_RECEIVED' },
  cheque_returned: { chequeStatus: 'RETURNED' }
};

const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

const fmtDate = (d) => {
  if (!d) return null;
  const dt = new Date(d);
  return Number.isNaN(dt.getTime()) ? null : dt.toISOString().slice(0, 10);
};

// Registration API row ko table ke row shape me map karo — koi fake value nahi
const mapRegistration = (reg) => {
  const rawCheque = reg.cheque?.status || 'NOT_RECEIVED';
  const chequeStatus = CHEQUE_STATUS_MAP[rawCheque] || 'awaiting';
  const chequeDate = fmtDate(reg.cheque?.updatedAt);
  const buyer = reg.buyer || {};
  return {
    id: reg.id,
    isLive: true,
    name: buyer.name || buyer.email || 'Buyer',
    buyerTag: reg.contractId || 'Registration',
    email: buyer.email || '',
    phone: '',
    propertyId: reg.property?.id || null,
    propertyTitle: reg.property?.title || '—',
    propertyRef: reg.property?.ref || '',
    propertyOpening: '',
    propertyStatus: '',
    latestOffer: '—',
    offersCount: 0,
    identityStatus: null,
    rawChequeStatus: rawCheque,
    chequeStatus,
    chequeSubText: chequeDate && ['returned', 'cashed', 'bounced', 'ready'].includes(chequeStatus) ? `on ${chequeDate}` : null,
    chequeNote: reg.cheque?.note || null,
    chequeUpdated: chequeDate,
    chequeAmount: '—',
    chequeAmountNum: 0,
    chequeNo: null,
    bank: null,
    documents: reg.documents || {},
    requestedTime: fmtDate(reg.signedAt || reg.createdAt),
    status: REG_STATUS_MAP[reg.status] || 'pending',
    rejectionReason: reg.rejectionReason || null,
    isReadyToReturn: rawCheque === 'RETURN_READY',
    isWinningBidder: false
  };
};

const LIVE_DOC_LINKS = [
  ['signedContract', 'Contract'],
  ['passport', 'Passport'],
  ['cheque', 'Cheque'],
  ['undertakingLetter', 'Undertaking']
];

export default function BiddersPage() {
  const { isLiveData, authToken, can } = useApp();
  const token = authToken || (typeof localStorage !== 'undefined' ? localStorage.getItem('cmp_connect_auth_token') : null);
  const [rows, setRows] = useState(() => (isLiveData ? [] : initialMergedOffers));
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all');
  const [notice, setNotice] = useState(null);
  const [liveCounts, setLiveCounts] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [declineFor, setDeclineFor] = useState(null);
  const [declineReason, setDeclineReason] = useState('');
  const reqSeq = useRef(0);

  const canReview = typeof can === 'function' ? can('listings.approve') : true;
  const canManageCheques = typeof can === 'function' ? can('contracts.manage') : true;

  const fetchLiveOffers = useCallback(async () => {
    if (!isLiveData) return;
    const seq = ++reqSeq.current;
    setLoading(true);
    setLoadError(null);
    try {
      const res = await cmpConnectApi.listRtoRegistrations({ limit: 100, page: 1, ...(LIVE_FILTER_PARAMS[filter] || {}) }, token);
      if (seq !== reqSeq.current) return; // purana response, ignore
      const list = Array.isArray(res?.data) ? res.data : [];
      setRows(list.map(mapRegistration));
      setLiveCounts(res?.counts || null);
    } catch (err) {
      if (seq !== reqSeq.current) return;
      setRows([]);
      setLiveCounts(null);
      setLoadError(err?.message || 'Could not load registrations.');
    } finally {
      if (seq === reqSeq.current) setLoading(false);
    }
  }, [isLiveData, token, filter]);

  // Mode switch pe rows reset — mock me mock data, live me khali (fetch bharega)
  useEffect(() => {
    setRows(isLiveData ? [] : initialMergedOffers);
  }, [isLiveData]);

  useEffect(() => {
    if (isLiveData) fetchLiveOffers();
  }, [isLiveData, fetchLiveOffers]);

  const showNotice = (msg, tone = 'info') => {
    setNotice({ msg, tone });
    setTimeout(() => setNotice(null), tone === 'error' ? 5000 : 3000);
  };

  // Live action ka common wrapper — busy state, feedback, refresh
  const runLiveAction = async (rowId, fn, successMsg) => {
    setBusyId(rowId);
    try {
      await fn();
      showNotice(successMsg);
      await fetchLiveOffers();
    } catch (err) {
      showNotice(err?.message || 'Action failed. Please try again.', 'error');
    } finally {
      setBusyId(null);
    }
  };

  const handleLiveApprove = (row) =>
    runLiveAction(row.id, () => cmpConnectApi.approveRtoRegistration(row.id, token), `Registration for ${row.name} approved.`);

  const handleLiveDeclineSubmit = (row) => {
    const reason = declineReason.trim();
    if (reason.length < 3) {
      showNotice('Please enter a decline reason (at least 3 characters).', 'error');
      return;
    }
    setDeclineFor(null);
    setDeclineReason('');
    runLiveAction(row.id, () => cmpConnectApi.declineRtoRegistration(row.id, reason, token), `Registration for ${row.name} declined.`);
  };

  const handleLiveCheque = (row, opt) => {
    if (opt.confirm && !window.confirm(`${opt.confirm} (${row.name})`)) return;
    runLiveAction(
      row.id,
      () => cmpConnectApi.rtoChequeAction(row.id, opt.action, undefined, token),
      `Cheque for ${row.name} ${CHEQUE_ACTION_DONE[opt.action] || 'updated'}.`
    );
  };

  // Winner info API me nahi hai — saare RECEIVED cheques ko ready-to-return karo (confirm ke baad)
  const handleLiveBulkReady = async () => {
    setBulkBusy(true);
    try {
      const res = await cmpConnectApi.listRtoRegistrations({ chequeStatus: 'RECEIVED', limit: 100, page: 1 }, token);
      const ids = (Array.isArray(res?.data) ? res.data : []).map((r) => r.id).filter(Boolean);
      if (ids.length === 0) {
        showNotice('No held cheques to mark ready for return.');
        return;
      }
      if (!window.confirm(`Mark ${ids.length} held cheque${ids.length === 1 ? '' : 's'} as ready to return?`)) return;
      const out = await cmpConnectApi.rtoChequeBulkReturnReady(ids, token);
      const updated = out?.data?.updated ?? 0;
      const skipped = out?.data?.skipped ?? 0;
      showNotice(`${updated} updated, ${skipped} skipped.`);
      await fetchLiveOffers();
    } catch (err) {
      showNotice(err?.message || 'Bulk update failed.', 'error');
    } finally {
      setBulkBusy(false);
    }
  };

  const handleApprove = (id, name) => {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: 'approved' } : r))
    );
    showNotice(`Buyer ${name} has been approved to make offers.`);
  };

  const handleDecline = (id, name) => {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: 'declined' } : r))
    );
    showNotice(`Registration for ${name} has been declined.`);
  };

  const handleReturnAllReady = () => {
    const readyCount = rows.filter((r) => r.isReadyToReturn && r.chequeStatus === 'received').length;
    if (readyCount === 0) {
      showNotice('No cheques are currently marked ready for return.');
      return;
    }
    setRows((prev) =>
      prev.map((r) =>
        r.isReadyToReturn && r.chequeStatus === 'received'
          ? {
              ...r,
              chequeStatus: 'returned',
              isReadyToReturn: false,
              chequeSubText: `on ${new Date().toISOString().slice(0, 10)}`
            }
          : r
      )
    );
    showNotice(`Returned ${readyCount} security cheques to non-winning bidders.`);
  };

  const handleReturnSingle = (id, name) => {
    setRows((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              chequeStatus: 'returned',
              isReadyToReturn: false,
              chequeSubText: `on ${new Date().toISOString().slice(0, 10)}`
            }
          : r
      )
    );
    showNotice(`Cheque returned to ${name}.`);
  };

  const handleMarkReceived = (id, name) => {
    setRows((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              chequeStatus: 'received',
              chequeNo: 'No. ' + Math.floor(100000 + Math.random() * 900000),
              bank: 'Emirates NBD',
              receivedDate: new Date().toISOString().slice(0, 10)
            }
          : r
      )
    );
    showNotice(`Security cheque received and held in vault for ${name}.`);
  };

  const handleCashCheque = (id, name) => {
    setRows((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              chequeStatus: 'cashed',
              chequeSubText: `cashed on ${new Date().toISOString().slice(0, 10)}`
            }
          : r
      )
    );
    showNotice(`Cheque for ${name} dispatched for banking.`);
  };

  const filteredRows = useMemo(() => {
    if (isLiveData) return rows; // live me server-side filter already laga hai
    if (filter === 'all') return rows;
    if (filter === 'pending' || filter === 'approved' || filter === 'declined') {
      return rows.filter((r) => r.status === filter);
    }
    if (filter === 'cheque_awaiting') return rows.filter((r) => r.chequeStatus === 'awaiting');
    if (filter === 'cheque_received') return rows.filter((r) => r.chequeStatus === 'received');
    if (filter === 'cheque_returned') return rows.filter((r) => r.chequeStatus === 'returned');
    if (filter === 'cheque_bounced') return rows.filter((r) => r.chequeStatus === 'bounced' || r.chequeStatus === 'cashed');
    return rows;
  }, [rows, filter, isLiveData]);

  // Live counts API se (filter se independent), mock me rows se
  const ls = liveCounts?.statuses || {};
  const lc = liveCounts?.cheques || {};
  const counts = isLiveData ? {
    all: (ls.PENDING || 0) + (ls.APPROVED || 0) + (ls.REJECTED || 0),
    pending: ls.PENDING || 0,
    approved: ls.APPROVED || 0,
    declined: ls.REJECTED || 0,
    chequeAwaiting: lc.NOT_RECEIVED || 0,
    chequeReceived: lc.RECEIVED || 0,
    chequeReady: lc.RETURN_READY || 0,
    chequeReturned: lc.RETURNED || 0,
    chequeBounced: (lc.BOUNCED || 0) + (lc.CASHED || 0)
  } : {
    all: rows.length,
    pending: rows.filter((r) => r.status === 'pending').length,
    approved: rows.filter((r) => r.status === 'approved').length,
    declined: rows.filter((r) => r.status === 'declined').length,
    chequeAwaiting: rows.filter((r) => r.chequeStatus === 'awaiting').length,
    chequeReceived: rows.filter((r) => r.chequeStatus === 'received').length,
    chequeReturned: rows.filter((r) => r.chequeStatus === 'returned').length,
    chequeBounced: rows.filter((r) => r.chequeStatus === 'bounced' || r.chequeStatus === 'cashed').length
  };

  const heldTotal = rows
    .filter((r) => r.chequeStatus === 'received')
    .reduce((acc, curr) => acc + (curr.chequeAmountNum || 0), 0);

  const readyToReturnCount = rows.filter(
    (r) => r.isReadyToReturn && r.chequeStatus === 'received'
  ).length;

  const readyToReturnTotal = rows
    .filter((r) => r.isReadyToReturn && r.chequeStatus === 'received')
    .reduce((acc, curr) => acc + (curr.chequeAmountNum || 0), 0);

  const awaitingTotal = rows
    .filter((r) => r.chequeStatus === 'awaiting')
    .reduce((acc, curr) => acc + (curr.chequeAmountNum || 0), 0);

  const renderIdentity = (status) => {
    if (!status) return <span className="faint">—</span>; // live API identity nahi deta
    if (status === 'verified') {
      return (
        <span style={{ whiteSpace: 'nowrap', fontSize: '13px', fontWeight: 600, color: 'var(--cmp-success)' }}>
          ✓ Verified
        </span>
      );
    }
    if (status === 'checking') {
      return (
        <span style={{ whiteSpace: 'nowrap', fontSize: '13px', fontWeight: 600, color: 'var(--cmp-text-muted)' }}>
          … Checking
        </span>
      );
    }
    return (
      <span style={{ whiteSpace: 'nowrap', fontSize: '13px', fontWeight: 600, color: 'var(--cmp-danger)' }}>
        ✕ Failed
      </span>
    );
  };

  const renderChequeBadge = (row) => {
    const st = row.chequeStatus;
    if (st === 'received') {
      return <span className="badge badge-brand">Cheque received</span>;
    }
    if (st === 'awaiting') {
      return <span className="badge badge-accent">Awaiting cheque</span>;
    }
    if (st === 'ready') {
      return (
        <div>
          <span className="badge badge-accent">Ready to return</span>
          {row.chequeSubText && (
            <span className="faint" style={{ display: 'block', fontSize: '11.5px', marginTop: '3px' }}>
              {row.chequeSubText}
            </span>
          )}
        </div>
      );
    }
    if (st === 'returned') {
      return (
        <div>
          <span className="badge badge-neutral">Cheque returned</span>
          {row.chequeSubText && (
            <span className="faint" style={{ display: 'block', fontSize: '11.5px', marginTop: '3px' }}>
              {row.chequeSubText}
            </span>
          )}
        </div>
      );
    }
    if (st === 'cashed') {
      return (
        <div>
          <span className="badge badge-accent">Cashed</span>
          {row.chequeSubText && (
            <span className="faint" style={{ display: 'block', fontSize: '11.5px', marginTop: '3px' }}>
              {row.chequeSubText}
            </span>
          )}
        </div>
      );
    }
    return (
      <div>
        <span className="badge badge-neutral">Bounced</span>
        {row.chequeSubText && (
          <span className="faint" style={{ display: 'block', fontSize: '11.5px', marginTop: '3px' }}>
            {row.chequeSubText}
          </span>
        )}
      </div>
    );
  };

  // Live row ke actions — permission + backend transitions ke hisaab se
  const renderLiveActions = (row) => {
    const busy = busyId === row.id;
    const chequeOpts = canManageCheques ? (LIVE_CHEQUE_ACTIONS[row.rawChequeStatus] || []) : [];
    const showReview = canReview && row.status === 'pending';

    if (declineFor === row.id) {
      return (
        <div className="row" style={{ gap: '6px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Reason for declining"
            value={declineReason}
            onChange={(e) => setDeclineReason(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleLiveDeclineSubmit(row); }}
            style={{ fontSize: '12.5px', padding: '5px 8px', minWidth: '170px' }}
            autoFocus
          />
          <button
            type="button"
            className="btn btn-primary btn-sm"
            disabled={busy || declineReason.trim().length < 3}
            onClick={() => handleLiveDeclineSubmit(row)}
          >
            Confirm decline
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => { setDeclineFor(null); setDeclineReason(''); }}
          >
            Cancel
          </button>
        </div>
      );
    }

    return (
      <div className="row" style={{ gap: '6px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
        {busy && <span className="faint" style={{ fontSize: '12px' }}>Saving…</span>}

        {showReview && (
          <>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              disabled={busy}
              onClick={() => handleLiveApprove(row)}
            >
              Approve
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              disabled={busy}
              onClick={() => { setDeclineFor(row.id); setDeclineReason(''); }}
            >
              Decline
            </button>
          </>
        )}

        {chequeOpts.map((opt) => (
          <button
            key={opt.action}
            type="button"
            className={`btn ${opt.primary ? 'btn-outline' : 'btn-ghost'} btn-sm`}
            disabled={busy}
            onClick={() => handleLiveCheque(row, opt)}
          >
            {opt.label}
          </button>
        ))}

        {!busy && !showReview && chequeOpts.length === 0 && (
          <span className="faint" style={{ fontSize: '12px' }}>
            {row.status === 'declined' ? 'Access blocked' : '—'}
          </span>
        )}
      </div>
    );
  };

  return (
    <div>
      {/* Title */}
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '26px' }}>Offers</h1>
          <p className="muted" style={{ margin: '6px 0 0', fontSize: '14px', maxWidth: '820px' }}>
            Registered buyers, live offer activity, identity verification, and 10% security deposit cheques in one unified view.
          </p>
        </div>

        {isLiveData && (
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={fetchLiveOffers}
            disabled={loading}
          >
            <RefreshCw size={14} />
            <span>{loading ? 'Refreshing…' : 'Refresh'}</span>
          </button>
        )}
      </div>

      {notice && (
        <div
          className="card"
          style={{
            padding: '12px 16px',
            marginBottom: '16px',
            background: notice.tone === 'error' ? 'var(--cmp-danger-subtle, var(--cmp-brand-subtle))' : 'var(--cmp-brand-subtle)',
            borderColor: notice.tone === 'error' ? 'var(--cmp-danger)' : 'var(--cmp-brand-border)',
            color: notice.tone === 'error' ? 'var(--cmp-danger)' : 'var(--cmp-brand)',
            fontSize: '13.5px',
            fontWeight: 600
          }}
        >
          {notice.msg}
        </div>
      )}

      {isLiveData && loadError && (
        <div className="card" style={{ padding: '12px 16px', marginBottom: '16px', borderColor: 'var(--cmp-danger)', color: 'var(--cmp-danger)', fontSize: '13.5px', fontWeight: 600 }}>
          Could not load registrations: {loadError}
        </div>
      )}

      {/* 4 Merged Stat Cards (Registrations + Security Cheques) */}
      <div className="stat-grid" style={{ marginBottom: '24px' }}>
        <div className="card" style={{ padding: '18px' }}>
          <p className="faint" style={{ margin: 0, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>
            Registered buyers
          </p>
          <p style={{ margin: '8px 0 0', fontSize: '26px', fontWeight: 700, color: 'var(--cmp-brand)' }}>
            {/* Live: bada number = kul registrations (pehle approved dikhta tha, "0 … 1 total" confusing tha) */}
            {isLiveData ? counts.all : counts.approved}
          </p>
          <p className="faint" style={{ margin: '4px 0 0', fontSize: '12px' }}>
            {isLiveData
              ? `${counts.approved} approved · ${counts.pending} pending review`
              : `${counts.pending} pending review · ${counts.all} total`}
          </p>
        </div>

        <div className="card" style={{ padding: '18px' }}>
          <p className="faint" style={{ margin: 0, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>
            Cheques held now
          </p>
          <p style={{ margin: '8px 0 0', fontSize: '26px', fontWeight: 700, color: 'var(--cmp-brand)' }}>
            {isLiveData ? plural(counts.chequeReceived, 'cheque') : formatAED(heldTotal, true)}
          </p>
          <p className="faint" style={{ margin: '4px 0 0', fontSize: '12px' }}>
            {isLiveData ? 'security cheques in vault' : `${counts.chequeReceived} security cheques in vault`}
          </p>
        </div>

        <div className="card" style={{ padding: '18px' }}>
          <p className="faint" style={{ margin: 0, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>
            Ready to return
          </p>
          <p style={{ margin: '8px 0 0', fontSize: '26px', fontWeight: 700, color: 'var(--cmp-brand)' }}>
            {isLiveData ? plural(counts.chequeReady, 'cheque') : formatAED(readyToReturnTotal, true)}
          </p>
          <p className="faint" style={{ margin: '4px 0 0', fontSize: '12px' }}>
            {isLiveData ? 'marked ready to return' : `${readyToReturnCount} non-winning bidders`}
          </p>
        </div>

        <div className="card" style={{ padding: '18px' }}>
          <p className="faint" style={{ margin: 0, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>
            Awaiting cheque
          </p>
          <p style={{ margin: '8px 0 0', fontSize: '26px', fontWeight: 700, color: 'var(--cmp-brand)' }}>
            {isLiveData ? plural(counts.chequeAwaiting, 'cheque') : formatAED(awaitingTotal, true)}
          </p>
          <p className="faint" style={{ margin: '4px 0 0', fontSize: '12px' }}>
            {isLiveData ? 'buyers yet to lodge' : `${counts.chequeAwaiting} bidder yet to lodge`}
          </p>
        </div>
      </div>

      {/* Unified Filter Chips & Batch Action */}
      <div className="row" style={{ gap: '8px', flexWrap: 'wrap', marginBottom: '14px', alignItems: 'center' }}>
        <button
          type="button"
          className="chip"
          aria-pressed={filter === 'all'}
          onClick={() => setFilter('all')}
        >
          All ({counts.all})
        </button>
        <button
          type="button"
          className="chip"
          aria-pressed={filter === 'pending'}
          onClick={() => setFilter('pending')}
        >
          Pending review ({counts.pending})
        </button>
        <button
          type="button"
          className="chip"
          aria-pressed={filter === 'approved'}
          onClick={() => setFilter('approved')}
        >
          Approved ({counts.approved})
        </button>
        <button
          type="button"
          className="chip"
          aria-pressed={filter === 'cheque_received'}
          onClick={() => setFilter('cheque_received')}
        >
          Cheque received ({counts.chequeReceived})
        </button>
        <button
          type="button"
          className="chip"
          aria-pressed={filter === 'cheque_awaiting'}
          onClick={() => setFilter('cheque_awaiting')}
        >
          Awaiting cheque ({counts.chequeAwaiting})
        </button>
        <button
          type="button"
          className="chip"
          aria-pressed={filter === 'cheque_returned'}
          onClick={() => setFilter('cheque_returned')}
        >
          Returned ({counts.chequeReturned})
        </button>
        <button
          type="button"
          className="chip"
          aria-pressed={filter === 'declined'}
          onClick={() => setFilter('declined')}
        >
          Declined ({counts.declined})
        </button>

        {isLiveData && canManageCheques && counts.chequeReceived > 0 && (
          <button
            type="button"
            className="btn btn-primary btn-sm"
            style={{ marginInlineStart: 'auto' }}
            onClick={handleLiveBulkReady}
            disabled={bulkBusy || loading}
          >
            {bulkBusy ? 'Updating…' : `Mark all held ready to return (${counts.chequeReceived})`}
          </button>
        )}

        {!isLiveData && readyToReturnCount > 0 && (
          <button
            type="button"
            className="btn btn-primary btn-sm"
            style={{ marginInlineStart: 'auto' }}
            onClick={handleReturnAllReady}
          >
            Return all ready ({readyToReturnCount})
          </button>
        )}
      </div>

      {/* Merged Bidders + Cheques + Offers Table */}
      <div className="card table-scroll">
        <table className="data">
          <thead>
            <tr>
              <th>Buyer</th>
              <th>Property</th>
              <th>Latest offer</th>
              <th>Identity</th>
              <th>10% Security cheque</th>
              <th>Cheque details</th>
              <th>Status</th>
              <th style={{ textAlign: 'end' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '36px' }} className="muted">
                  No buyer offers or security cheques found for this filter.
                </td>
              </tr>
            ) : (
              filteredRows.map((row) => {
                const canApprove =
                  row.status === 'pending' &&
                  row.identityStatus === 'verified' &&
                  row.chequeStatus === 'received';

                return (
                  <tr key={row.id}>
                    {/* Buyer / Bidder */}
                    <td style={{ minWidth: '190px' }}>
                      <span style={{ fontWeight: 600 }}>{row.name}</span>{' '}
                      <span className="faint" style={{ fontSize: '12px' }}>· {row.buyerTag}</span>
                      <span className="faint" style={{ display: 'block', fontSize: '12px' }}>
                        {row.email}{row.phone ? ` · ${row.phone}` : ''}
                      </span>
                      {row.requestedTime && (
                        <span className="faint" style={{ display: 'block', fontSize: '11px', marginTop: '2px' }}>
                          {row.isLive ? 'Submitted' : 'Requested'} {row.requestedTime}
                        </span>
                      )}
                      {row.isLive && LIVE_DOC_LINKS.some(([k]) => row.documents?.[k]) && (
                        <span className="row" style={{ gap: '8px', flexWrap: 'wrap', fontSize: '11.5px', marginTop: '3px' }}>
                          {LIVE_DOC_LINKS.filter(([k]) => row.documents?.[k]).map(([k, label]) => (
                            <a
                              key={k}
                              href={row.documents[k]}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ color: 'var(--cmp-brand)', fontWeight: 600 }}
                            >
                              View {label}
                            </a>
                          ))}
                        </span>
                      )}
                    </td>

                    {/* Property */}
                    <td style={{ minWidth: '200px' }}>
                      {row.propertyId || row.propertyRef ? (
                        <NavLink
                          to={`/rto/${row.propertyId || row.propertyRef}`}
                          style={{ fontSize: '13px', fontWeight: 600, color: 'var(--cmp-brand)', textDecoration: 'none' }}
                        >
                          {row.propertyTitle}
                        </NavLink>
                      ) : (
                        <span className="faint">{row.propertyTitle}</span>
                      )}
                      {(row.propertyRef || row.propertyOpening) && (
                        <span className="faint" style={{ display: 'block', fontSize: '12px' }}>
                          {[row.propertyRef, row.propertyOpening].filter(Boolean).join(' · ')}
                        </span>
                      )}
                      {row.propertyStatus && (
                      <span className="row" style={{ gap: '6px', fontSize: '12.5px', whiteSpace: 'nowrap', marginTop: '2px' }}>
                        <span
                          aria-hidden="true"
                          style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            background: row.propertyStatusColor,
                            flexShrink: 0
                          }}
                        />
                        {row.propertyStatus}
                      </span>
                      )}
                    </td>

                    {/* Latest Offer */}
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <span style={{ fontWeight: 700, fontSize: '13.5px', color: row.latestOffer !== '—' ? 'var(--cmp-brand)' : 'inherit' }}>
                        {row.latestOffer || '—'}
                      </span>
                      {row.offersCount > 0 && (
                        <span className="faint" style={{ display: 'block', fontSize: '11.5px' }}>
                          {row.offersCount} {row.offersCount === 1 ? 'offer' : 'offers'} placed
                        </span>
                      )}
                    </td>

                    {/* Identity */}
                    <td>{renderIdentity(row.identityStatus)}</td>

                    {/* 10% Security Cheque Amount & Status */}
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <div style={{ fontWeight: 700, fontSize: '13.5px', fontVariantNumeric: 'tabular-nums' }}>
                        {row.chequeAmount}
                      </div>
                      <div style={{ marginTop: '4px' }}>
                        {renderChequeBadge(row)}
                      </div>
                    </td>

                    {/* Cheque No / Bank / Received Date */}
                    <td style={{ whiteSpace: 'nowrap', fontSize: '12.5px' }}>
                      {row.isLive ? (
                        // Live API me cheque no/bank nahi hai — sirf note + last update
                        <>
                          <span className="faint">—</span>
                          {row.chequeNote && (
                            <span className="faint" style={{ display: 'block', fontSize: '12px', whiteSpace: 'normal', maxWidth: '200px' }}>
                              {row.chequeNote}
                            </span>
                          )}
                          {row.chequeUpdated && (
                            <span className="faint" style={{ display: 'block', fontSize: '11px' }}>
                              Updated: {row.chequeUpdated}
                            </span>
                          )}
                        </>
                      ) : row.chequeNo ? (
                        <>
                          <span style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{row.chequeNo}</span>
                          <span className="faint" style={{ display: 'block', fontSize: '12px' }}>
                            {row.bank}
                          </span>
                          <span className="faint" style={{ display: 'block', fontSize: '11px' }}>
                            Received: {row.receivedDate}
                          </span>
                        </>
                      ) : (
                        <span className="faint">Not yet received</span>
                      )}
                    </td>

                    {/* Registration Status */}
                    <td style={{ fontSize: '13px', whiteSpace: 'nowrap' }}>
                      {row.status === 'pending' && <span className="badge badge-accent">Pending</span>}
                      {row.status === 'approved' && <span className="badge badge-brand">Approved</span>}
                      {row.status === 'declined' && <span className="badge badge-neutral">Declined</span>}
                      {row.isLive && row.status === 'declined' && row.rejectionReason && (
                        <span className="faint" style={{ display: 'block', fontSize: '11.5px', marginTop: '3px', whiteSpace: 'normal', maxWidth: '180px' }}>
                          {row.rejectionReason}
                        </span>
                      )}
                    </td>

                    {/* Combined Actions */}
                    <td style={{ minWidth: '230px' }}>
                      {row.isLive ? renderLiveActions(row) : (
                      <div className="row" style={{ gap: '6px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                        {row.chequeStatus === 'awaiting' && (
                          <button
                            type="button"
                            className="btn btn-outline btn-sm"
                            onClick={() => handleMarkReceived(row.id, row.name)}
                          >
                            Mark cheque received
                          </button>
                        )}

                        {row.status === 'pending' && (
                          <>
                            {canApprove ? (
                              <button
                                type="button"
                                className="btn btn-primary btn-sm"
                                onClick={() => handleApprove(row.id, row.name)}
                              >
                                Approve
                              </button>
                            ) : row.identityStatus === 'checking' ? (
                              <span className="faint" style={{ fontSize: '12px' }}>
                                Waiting for identity
                              </span>
                            ) : row.identityStatus === 'failed' ? (
                              <span className="faint" style={{ fontSize: '12px' }}>
                                Identity failed
                              </span>
                            ) : null}
                            <button
                              type="button"
                              className="btn btn-ghost btn-sm"
                              onClick={() => handleDecline(row.id, row.name)}
                            >
                              Decline
                            </button>
                          </>
                        )}

                        {row.status === 'approved' && row.chequeStatus === 'received' && row.isWinningBidder && (
                          <>
                            <button
                              type="button"
                              className="btn btn-outline btn-sm"
                              onClick={() => handleReturnSingle(row.id, row.name)}
                            >
                              Return on completion
                            </button>
                            <button
                              type="button"
                              className="btn btn-ghost btn-sm"
                              onClick={() => handleCashCheque(row.id, row.name)}
                            >
                              Cash cheque
                            </button>
                          </>
                        )}

                        {row.status === 'approved' && row.chequeStatus === 'received' && row.isReadyToReturn && !row.isWinningBidder && (
                          <button
                            type="button"
                            className="btn btn-outline btn-sm"
                            onClick={() => handleReturnSingle(row.id, row.name)}
                          >
                            Return cheque
                          </button>
                        )}

                        {row.status === 'approved' && row.chequeStatus === 'received' && !row.isReadyToReturn && !row.isWinningBidder && (
                          <span className="faint" style={{ fontSize: '12px', color: 'var(--cmp-brand)', fontWeight: 600 }}>
                            ✓ Active · Held until close
                          </span>
                        )}

                        {row.status === 'declined' && (
                          <span className="faint" style={{ fontSize: '12px' }}>
                            Access blocked
                          </span>
                        )}
                      </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
