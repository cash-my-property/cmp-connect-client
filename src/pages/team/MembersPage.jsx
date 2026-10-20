import React, { useState, useEffect, useMemo, useRef } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Plus,
  Search,
  MoreVertical,
  ShieldCheck,
  User,
  X,
  Check,
  Mail,
  RotateCcw,
  RotateCw,
  UserMinus,
  UserCheck,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Shield,
  Clock
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { cmpConnectApi } from '../../services/cmpConnectApi';
import { assignableRoles } from '../../utils/permissions';
import Avatar from '../../components/ui/Avatar';

const PHONE_CODES = ['+971', '+966', '+974', '+44', '+91', '+92'];
const splitPhone = (full) => {
  if (!full) return { code: '+971', number: '' };
  const str = String(full).trim();
  const code = PHONE_CODES.find((c) => str.startsWith(c)) || '+971';
  return { code, number: str.slice(code.length).replace(/\D/g, '') };
};

const formatDate = (isoString) => {
  if (!isoString) return '—';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return '—';
  }
};

const formatDateTime = (isoString) => {
  if (!isoString) return 'Never';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return 'Never';
    return d.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return 'Never';
  }
};

const toTitleCase = (str) => {
  if (!str) return '';
  return String(str)
    .toLowerCase()
    .split(' ')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
};

const mockFallbackRoles = [
  { id: 'r-owner', key: 'OWNER', name: 'Owner' },
  { id: 'r-dir', key: 'DIRECTOR', name: 'Director' },
  { id: 'r-admin', key: 'OFFICE_ADMIN', name: 'Office admin' },
  { id: 'r-coord', key: 'COORDINATOR', name: 'Coordinator' },
  { id: 'r-agent', key: 'AGENT', name: 'Agent' },
  { id: 'r-acc', key: 'ACCOUNTS', name: 'Accounts' },
  { id: 'r-view', key: 'VIEWER', name: 'Viewer' }
];

const initialMockMembers = [
  {
    id: 'm-mock-1',
    code: 'CCU-RCGBM1PW',
    firstName: 'Hassan',
    lastName: 'Ali',
    fullName: 'Hassan Ali',
    email: 'ihasanalyy@gmail.com',
    mobile: '+971501234567',
    role: { id: 'r-owner', key: 'OWNER', name: 'Owner' },
    isOwner: true,
    isSelf: true,
    status: 'ACTIVE',
    verificationStatus: 'VERIFIED',
    compliance: { brn: '58210', brnExpiry: '2027-10-30T00:00:00.000Z' },
    invite: null,
    lastLoginAt: '2026-10-13T10:56:49.163Z',
    createdAt: '2026-10-13T10:52:50.480Z'
  },
  {
    id: 'm-mock-2',
    code: 'CCU-TAL6XR2E',
    firstName: 'Karim',
    lastName: 'Saleh',
    fullName: 'Karim Saleh',
    email: 'karim@cmpprime.ae',
    mobile: '+971504479901',
    role: { id: 'r-agent', key: 'AGENT', name: 'Agent' },
    isOwner: false,
    isSelf: false,
    status: 'ACTIVE',
    verificationStatus: 'VERIFIED',
    compliance: { brn: '49120', brnExpiry: '2027-04-15T00:00:00.000Z' },
    invite: null,
    lastLoginAt: '2026-10-12T14:20:10.000Z',
    createdAt: '2026-10-10T08:15:00.000Z'
  },
  {
    id: 'm-mock-3',
    code: 'CCU-EC88912',
    firstName: 'Emma',
    lastName: 'Clarke',
    fullName: 'Emma Clarke',
    email: 'emma@cmpprime.ae',
    mobile: '+971521292303',
    role: { id: 'r-agent', key: 'AGENT', name: 'Agent' },
    isOwner: false,
    isSelf: false,
    status: 'ACTIVE',
    verificationStatus: 'PENDING',
    compliance: { brn: '20182', brnExpiry: '2026-12-01T00:00:00.000Z' },
    invite: null,
    lastLoginAt: '2026-10-11T09:10:00.000Z',
    createdAt: '2026-10-09T11:00:00.000Z'
  },
  {
    id: 'm-mock-4',
    code: 'CCU-AM33190',
    firstName: 'Arjun',
    lastName: 'Mehta',
    fullName: 'Arjun Mehta',
    email: 'arjun@cmpprime.ae',
    mobile: '+971563302288',
    role: { id: 'r-dir', key: 'DIRECTOR', name: 'Director' },
    isOwner: false,
    isSelf: false,
    status: 'ACTIVE',
    verificationStatus: 'VERIFIED',
    compliance: { brn: '31902', brnExpiry: '2027-08-20T00:00:00.000Z' },
    invite: null,
    lastLoginAt: '2026-10-14T08:00:00.000Z',
    createdAt: '2026-10-01T10:00:00.000Z'
  },
  {
    id: 'm-mock-5',
    code: 'CCU-SM99182',
    firstName: 'Sara',
    lastName: 'Al Mansoori',
    fullName: 'Sara Al Mansoori',
    email: 'sara@cmpprime.ae',
    mobile: '+971559814422',
    role: { id: 'r-coord', key: 'COORDINATOR', name: 'Coordinator' },
    isOwner: false,
    isSelf: false,
    status: 'INVITED',
    verificationStatus: 'NOT_REQUIRED',
    compliance: { brn: null, brnExpiry: null },
    invite: { expiresAt: '2026-10-21T10:00:00.000Z' },
    lastLoginAt: null,
    createdAt: '2026-10-14T09:00:00.000Z'
  },
  {
    id: 'm-mock-6',
    code: 'CCU-DM44910',
    firstName: 'David',
    lastName: 'Miller',
    fullName: 'David Miller',
    email: 'david@cmpprime.ae',
    mobile: '+971503341199',
    role: { id: 'r-admin', key: 'OFFICE_ADMIN', name: 'Office admin' },
    isOwner: false,
    isSelf: false,
    status: 'INACTIVE',
    verificationStatus: 'NOT_REQUIRED',
    compliance: { brn: null, brnExpiry: null },
    invite: null,
    lastLoginAt: '2026-09-20T12:00:00.000Z',
    createdAt: '2026-08-15T09:00:00.000Z'
  }
];

export default function MembersPage() {
  const { account, authToken, can, dataMode, isMockData } = useApp();
  const isAgency = account?.accountType !== 'DEVELOPER';

  const [mockMembers, setMockMembers] = useState(initialMockMembers);
  const [members, setMembers] = useState([]);
  const [counts, setCounts] = useState({ all: 0, ACTIVE: 0, INVITED: 0, INACTIVE: 0 });
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 1 });
  const [isLoading, setIsLoading] = useState(true);

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Available roles for filter and invite
  const [availableRoles, setAvailableRoles] = useState([]);

  // Modals & notices
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isChangeRoleModalOpen, setIsChangeRoleModalOpen] = useState(false);
  const [activeMemberForRole, setActiveMemberForRole] = useState(null);
  const [selectedNewRoleId, setSelectedNewRoleId] = useState('');
  const [activeActionMenuId, setActiveActionMenuId] = useState(null);
  const [notice, setNotice] = useState(null);

  // Transfer Listings Modal State
  const [transferModal, setTransferModal] = useState({
    isOpen: false,
    member: null,
    toAgentId: '',
    loading: false
  });

  // BRN Verification Modal State
  const [verifyModal, setVerifyModal] = useState({
    isOpen: false,
    member: null,
    brn: '',
    brnExpiry: '',
    loading: false
  });

  // Invite Form & BRN Check State
  const [inviteForm, setInviteForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    mobile: '',
    roleId: '',
    brn: ''
  });
  const [inviteError, setInviteError] = useState(null);
  const [isInviting, setIsInviting] = useState(false);

  const [brnCheckState, setBrnCheckState] = useState({
    checking: false,
    checked: false,
    allowed: true,
    message: null,
    whitelisted: false,
    isNew: false,
    inUse: false,
    inUseBy: null,
    broker: null,
    ornMatch: null,
    error: null
  });

  const [emailCheckState, setEmailCheckState] = useState({
    checking: false,
    checked: false,
    available: true,
    reason: null,
    message: null,
    memberId: null,
    resending: false,
    resent: false
  });

  const [mobileCheckState, setMobileCheckState] = useState({
    checking: false,
    checked: false,
    available: true,
    reason: null,
    message: null,
    memberId: null
  });

  const openInviteModal = () => {
    setInviteForm({
      firstName: '',
      lastName: '',
      email: '',
      mobile: '',
      roleId: '',
      brn: ''
    });
    setInviteError(null);
    setBrnCheckState({
      checking: false,
      checked: false,
      allowed: true,
      message: null,
      whitelisted: false,
      isNew: false,
      inUse: false,
      inUseBy: null,
      broker: null,
      ornMatch: null,
      error: null
    });
    setEmailCheckState({
      checking: false,
      checked: false,
      available: true,
      reason: null,
      message: null,
      memberId: null,
      resending: false,
      resent: false
    });
    setMobileCheckState({
      checking: false,
      checked: false,
      available: true,
      reason: null,
      message: null,
      memberId: null
    });
    setIsInviteModalOpen(true);
  };

  const handleResendFromModal = async (memberId, targetEmail) => {
    if (!memberId) return;
    try {
      setEmailCheckState((prev) => ({ ...prev, resending: true }));
      await cmpConnectApi.resendInvite(memberId, authToken);
      setEmailCheckState((prev) => ({ ...prev, resending: false, resent: true }));
      showNotice(`Invite resent successfully to ${targetEmail}.`);
    } catch (err) {
      setEmailCheckState((prev) => ({ ...prev, resending: false }));
      showNotice(err.message || 'Failed to resend invite.', true);
    }
  };

  const actionMenuRef = useRef(null);

  const showNotice = (msg, isError = false) => {
    setNotice({ text: msg, isError });
    setTimeout(() => setNotice(null), 4000);
  };

  // Close row action dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (actionMenuRef.current && !actionMenuRef.current.contains(e.target)) {
        setActiveActionMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const rolesFetchedRef = useRef(false);
  const isFetchingMembersRef = useRef(false);

  // Debounce search input by 300ms (only when value actually changes)
  useEffect(() => {
    if (searchQuery.trim() === debouncedSearch) return;
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, debouncedSearch]);

  // Load Roles for filter and modal
  useEffect(() => {
    if (isMockData) {
      setAvailableRoles(mockFallbackRoles);
      return;
    }

    if (!authToken) {
      setAvailableRoles([]);
      return;
    }

    cmpConnectApi.listRoles(authToken)
      .then((res) => {
        if (res?.data?.roles) {
          setAvailableRoles(res.data.roles);
        }
      })
      .catch((err) => {
        console.warn('[MembersPage] Could not fetch roles list:', err.message);
        setAvailableRoles([]);
      });
  }, [authToken, isMockData]);

  // Fetch / Sync Members List based on dataMode
  const fetchMembers = () => {
    if (isMockData) {
      setIsLoading(true);
      let filtered = [...mockMembers];
      if (debouncedSearch) {
        const q = debouncedSearch.toLowerCase();
        filtered = filtered.filter(
          (m) =>
            (m.fullName || '').toLowerCase().includes(q) ||
            (m.email || '').toLowerCase().includes(q) ||
            (m.mobile || '').toLowerCase().includes(q) ||
            (m.code || '').toLowerCase().includes(q)
        );
      }
      if (roleFilter) {
        filtered = filtered.filter((m) => m.role?.id === roleFilter || m.role?.key === roleFilter);
      }
      if (statusFilter !== 'all') {
        filtered = filtered.filter((m) => m.status === statusFilter);
      }
      setMembers(filtered);
      setCounts({
        all: mockMembers.length,
        ACTIVE: mockMembers.filter((m) => m.status === 'ACTIVE').length,
        INVITED: mockMembers.filter((m) => m.status === 'INVITED').length,
        INACTIVE: mockMembers.filter((m) => m.status === 'INACTIVE').length
      });
      setPagination({ page: 1, limit: 20, total: filtered.length, pages: 1 });
      setIsLoading(false);
      return;
    }

    // Live Data Mode: APIs strictly called, no mock fallback
    if (!authToken) {
      setMembers([]);
      setCounts({ all: 0, ACTIVE: 0, INVITED: 0, INACTIVE: 0 });
      setPagination({ page: 1, limit: 20, total: 0, pages: 1 });
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const params = {
      search: debouncedSearch,
      roleId: roleFilter,
      status: statusFilter,
      page: pagination.page,
      limit: pagination.limit
    };

    cmpConnectApi.listMembers(params, authToken)
      .then((res) => {
        if (res?.data) {
          setMembers(res.data);
          if (res.counts) setCounts(res.counts);
          if (res.pagination) setPagination(res.pagination);
        } else {
          setMembers([]);
        }
      })
      .catch((err) => {
        console.warn('[MembersPage] Live API fetch error:', err.message);
        setMembers([]);
        setCounts({ all: 0, ACTIVE: 0, INVITED: 0, INACTIVE: 0 });
        setPagination({ page: 1, limit: 20, total: 0, pages: 1 });
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  useEffect(() => {
    fetchMembers();
  }, [authToken, isMockData, mockMembers, debouncedSearch, roleFilter, statusFilter, pagination.page]);

  // 1. Debounced BRN existence check against DLD broker list onchange (~400ms)
  useEffect(() => {
    if (!isInviteModalOpen || !isAgency) return;

    const cleanBrn = inviteForm.brn?.trim();
    if (!cleanBrn) {
      setBrnCheckState({
        checking: false,
        checked: false,
        allowed: true,
        message: null,
        whitelisted: false,
        isNew: false,
        inUse: false,
        inUseBy: null,
        broker: null,
        ornMatch: null,
        error: null
      });
      return;
    }

    setBrnCheckState((prev) => ({ ...prev, checking: true, error: null }));

    const timer = setTimeout(async () => {
      if (isMockData) {
        const isDemoBlocked = cleanBrn === '999999';
        if (isDemoBlocked) {
          setBrnCheckState({
            checking: false,
            checked: true,
            allowed: false,
            message: 'This broker is registered under another office (ORN: 90996) and cannot be invited.',
            whitelisted: true,
            isNew: false,
            inUse: false,
            inUseBy: null,
            broker: { officeName: 'Other Real Estate LLC', orn: '90996' },
            ornMatch: false,
            error: null
          });
        } else {
          setBrnCheckState({
            checking: false,
            checked: true,
            allowed: true,
            message: null,
            whitelisted: true,
            isNew: false,
            inUse: false,
            inUseBy: null,
            broker: {
              name: 'Bilal Ansari',
              officeName: 'CMP Prime Real Estate',
              orn: 'ORN-28841',
              cardExpiryDate: '2027-10-30T00:00:00.000Z',
              cardExpired: false,
              firstName: 'Bilal',
              lastName: 'Ansari',
              email: 'bilal.ansari@cmpprime.ae',
              phone: '+971501239999'
            },
            ornMatch: true,
            error: null
          });
          setInviteForm((prev) => ({
            ...prev,
            firstName: prev.firstName || 'Bilal',
            lastName: prev.lastName || 'Ansari',
            email: prev.email || 'bilal.ansari@cmpprime.ae',
            mobile: prev.mobile || '+971501239999'
          }));
        }
        return;
      }

      try {
        const res = await cmpConnectApi.checkTeamExistence({ brn: cleanBrn }, authToken);
        const data = res?.data?.brn || res?.data;

        if (data) {
          const isWhitelisted = !!data.whitelisted;
          const isNewBroker = !!data.isNew;
          const isInUse = !!data.inUse;
          const brokerData = data.broker || null;
          const isOtherOffice = data.ornMatch === false;

          // Server sends allowed (boolean) and message.
          // Fallback: allowed is false if inUse or isOtherOffice.
          const isAllowed = data.allowed !== undefined
            ? !!data.allowed
            : (!isInUse && !isOtherOffice);

          let msg = data.message;
          if (!msg && !isAllowed) {
            if (isInUse) {
              msg = `Already linked to ${data.inUseBy || 'another user'}.`;
            } else if (isOtherOffice) {
              msg = `This broker is registered under another office (${brokerData?.officeName || 'ORN: ' + (brokerData?.orn || '')}) and cannot be invited.`;
            }
          }

          setBrnCheckState({
            checking: false,
            checked: true,
            allowed: isAllowed,
            message: msg,
            whitelisted: isWhitelisted,
            isNew: isNewBroker,
            inUse: isInUse,
            inUseBy: data.inUseBy || null,
            broker: brokerData,
            ornMatch: data.ornMatch,
            error: null
          });

          // Autofill First Name, Last Name, Email & Phone if whitelisted broker found on DLD list
          if (isWhitelisted && brokerData && isAllowed) {
            let fName = brokerData.firstName || '';
            let lName = brokerData.lastName || '';
            if (!fName && brokerData.name) {
              const parts = brokerData.name.trim().split(/\s+/);
              fName = parts[0] || '';
              lName = parts.slice(1).join(' ') || '';
            }

            const brokerEmail = brokerData.email ? String(brokerData.email).trim().toLowerCase() : '';
            const brokerPhone = (brokerData.phone || brokerData.mobile) ? String(brokerData.phone || brokerData.mobile).trim() : '';

            setInviteForm((prev) => ({
              ...prev,
              firstName: toTitleCase(fName) || prev.firstName,
              lastName: toTitleCase(lName) || prev.lastName,
              email: brokerEmail || prev.email,
              mobile: brokerPhone || prev.mobile
            }));
          }
        } else {
          setBrnCheckState({
            checking: false,
            checked: true,
            allowed: true,
            message: null,
            whitelisted: false,
            isNew: true,
            inUse: false,
            inUseBy: null,
            broker: null,
            ornMatch: null,
            error: null
          });
        }
      } catch (err) {
        console.warn('[MembersPage] BRN check error:', err);
        const isConflict = err.status === 409 || err.message?.toLowerCase().includes('already linked');
        const isOtherOffice = err.status === 403 || err.message?.toLowerCase().includes('another office');
        const notAllowed = isConflict || isOtherOffice;
        setBrnCheckState({
          checking: false,
          checked: true,
          allowed: !notAllowed,
          message: err.message,
          whitelisted: false,
          isNew: !notAllowed,
          inUse: isConflict,
          inUseBy: null,
          broker: null,
          ornMatch: isOtherOffice ? false : null,
          error: err.message
        });
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [inviteForm.brn, isInviteModalOpen, isAgency, authToken, isMockData]);

  // 2. Debounced Email existence check (~400ms)
  useEffect(() => {
    if (!isInviteModalOpen) return;

    const cleanEmail = inviteForm.email?.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@') || cleanEmail.length < 5) {
      setEmailCheckState({
        checking: false,
        checked: false,
        available: true,
        reason: null,
        message: null,
        memberId: null,
        resending: false,
        resent: false
      });
      return;
    }

    setEmailCheckState((prev) => ({ ...prev, checking: true, resent: false }));

    const timer = setTimeout(async () => {
      if (isMockData) {
        setEmailCheckState({
          checking: false,
          checked: true,
          available: true,
          reason: null,
          message: null,
          memberId: null,
          resending: false,
          resent: false
        });
        return;
      }

      try {
        const res = await cmpConnectApi.checkTeamExistence({ email: cleanEmail }, authToken);
        const data = res?.data?.email;
        if (data) {
          setEmailCheckState({
            checking: false,
            checked: true,
            available: data.available !== false,
            reason: data.reason || null,
            message: data.message || null,
            memberId: data.memberId || null,
            resending: false,
            resent: false
          });
        } else {
          setEmailCheckState({
            checking: false,
            checked: true,
            available: true,
            reason: null,
            message: null,
            memberId: null,
            resending: false,
            resent: false
          });
        }
      } catch (err) {
        console.warn('[MembersPage] Email existence check error:', err);
        setEmailCheckState((prev) => ({ ...prev, checking: false, checked: true }));
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [inviteForm.email, isInviteModalOpen, authToken, isMockData]);

  // 3. Debounced Mobile existence check (~400ms)
  useEffect(() => {
    if (!isInviteModalOpen) return;

    const cleanMobile = inviteForm.mobile?.trim();
    if (!cleanMobile || cleanMobile.length < 7) {
      setMobileCheckState({
        checking: false,
        checked: false,
        available: true,
        reason: null,
        message: null,
        memberId: null
      });
      return;
    }

    setMobileCheckState((prev) => ({ ...prev, checking: true }));

    const timer = setTimeout(async () => {
      if (isMockData) {
        setMobileCheckState({
          checking: false,
          checked: true,
          available: true,
          reason: null,
          message: null,
          memberId: null
        });
        return;
      }

      try {
        const res = await cmpConnectApi.checkTeamExistence({ mobile: cleanMobile }, authToken);
        const data = res?.data?.mobile;
        if (data) {
          setMobileCheckState({
            checking: false,
            checked: true,
            available: data.available !== false,
            reason: data.reason || null,
            message: data.message || null,
            memberId: data.memberId || null
          });
        } else {
          setMobileCheckState({
            checking: false,
            checked: true,
            available: true,
            reason: null,
            message: null,
            memberId: null
          });
        }
      } catch (err) {
        console.warn('[MembersPage] Mobile existence check error:', err);
        setMobileCheckState((prev) => ({ ...prev, checking: false, checked: true }));
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [inviteForm.mobile, isInviteModalOpen, authToken, isMockData]);

  // Handle Invite Submission
  const handleInviteSubmit = async (e) => {
    e.preventDefault();
    setInviteError(null);

    if (!inviteForm.firstName.trim() || !inviteForm.email.trim() || !inviteForm.mobile.trim() || !inviteForm.roleId) {
      setInviteError('Please fill in First name, Email, Mobile and Role.');
      return;
    }

    if (isAgency && !inviteForm.brn.trim()) {
      setInviteError('BRN (broker licence number) is required for agency team members.');
      return;
    }

    if (isAgency && (brnCheckState.allowed === false || brnCheckState.inUse || brnCheckState.ornMatch === false)) {
      setInviteError(brnCheckState.message || 'This broker cannot be invited because they are registered under another office or already linked.');
      return;
    }

    if (emailCheckState.checked && !emailCheckState.available) {
      setInviteError(emailCheckState.message || 'This email is already registered or invited.');
      return;
    }

    if (mobileCheckState.checked && !mobileCheckState.available) {
      setInviteError(mobileCheckState.message || 'This phone number is already registered.');
      return;
    }

    if (isMockData) {
      const foundRole = availableRoles.find((r) => r.id === inviteForm.roleId || r.key === inviteForm.roleId) || { name: 'Agent' };
      const newMember = {
        id: 'm-mock-' + Date.now(),
        code: 'CCU-' + Math.random().toString(36).substring(2, 10).toUpperCase(),
        firstName: inviteForm.firstName.trim(),
        lastName: inviteForm.lastName.trim(),
        fullName: `${inviteForm.firstName.trim()} ${inviteForm.lastName.trim()}`.trim(),
        email: inviteForm.email.trim(),
        mobile: inviteForm.mobile.trim(),
        role: foundRole,
        isOwner: false,
        isSelf: false,
        status: 'INVITED',
        verificationStatus: isAgency && inviteForm.brn ? 'VERIFIED' : 'NOT_REQUIRED',
        compliance: { brn: inviteForm.brn?.trim() || null },
        invite: { expiresAt: new Date(Date.now() + 7 * 86400000).toISOString() },
        createdAt: new Date().toISOString()
      };
      setMockMembers((prev) => [newMember, ...prev]);
      setIsInviteModalOpen(false);
      setInviteForm({ firstName: '', lastName: '', email: '', mobile: '', roleId: '', brn: '' });
      showNotice(`Invite sent successfully to ${inviteForm.email}.`);
      return;
    }

    try {
      setIsInviting(true);
      const res = await cmpConnectApi.inviteMember(
        {
          firstName: inviteForm.firstName.trim(),
          lastName: inviteForm.lastName.trim() || undefined,
          email: inviteForm.email.trim(),
          mobile: inviteForm.mobile.trim(),
          roleId: inviteForm.roleId,
          ...(isAgency && inviteForm.brn.trim() ? { brn: inviteForm.brn.trim() } : {})
        },
        authToken
      );

      setIsInviteModalOpen(false);
      setInviteForm({ firstName: '', lastName: '', email: '', mobile: '', roleId: '', brn: '' });
      setBrnCheckState({
        checking: false,
        checked: false,
        allowed: true,
        message: null,
        whitelisted: false,
        isNew: false,
        inUse: false,
        inUseBy: null,
        broker: null,
        ornMatch: null,
        error: null
      });
      setEmailCheckState({
        checking: false,
        checked: false,
        available: true,
        reason: null,
        message: null,
        memberId: null,
        resending: false,
        resent: false
      });
      setMobileCheckState({
        checking: false,
        checked: false,
        available: true,
        reason: null,
        message: null,
        memberId: null
      });

      if (res?.data) {
        setMembers((prev) => [res.data, ...prev]);
        setCounts((prev) => ({ ...prev, all: prev.all + 1, INVITED: prev.INVITED + 1 }));
      } else {
        fetchMembers();
      }

      if (res?.data?.inviteEmailStatus === 'FAILED') {
        showNotice('User created, but invite email could not be delivered. Use Resend invite.', true);
      } else {
        showNotice(`Invite sent successfully to ${inviteForm.email}.`);
      }
    } catch (err) {
      setInviteError(err.message || 'Failed to send invite.');
    } finally {
      setIsInviting(false);
    }
  };

  // Handle Resend Invite
  const handleResendInvite = async (member) => {
    setActiveActionMenuId(null);
    if (isMockData) {
      showNotice(`Invite resent to ${member.email}.`);
      return;
    }
    try {
      await cmpConnectApi.resendInvite(member.id, authToken);
      showNotice(`Invite resent to ${member.email}.`);
    } catch (err) {
      showNotice(err.message || 'Failed to resend invite.', true);
    }
  };

  // Handle Change Role
  const openChangeRoleModal = (member) => {
    setActiveActionMenuId(null);
    setActiveMemberForRole(member);
    setSelectedNewRoleId(member.role?.id || '');
    setIsChangeRoleModalOpen(true);
  };

  const handleChangeRoleSubmit = async (e) => {
    e.preventDefault();
    if (!activeMemberForRole || !selectedNewRoleId) return;

    if (isMockData) {
      const foundRole = availableRoles.find((r) => r.id === selectedNewRoleId || r.key === selectedNewRoleId);
      setMockMembers((prev) =>
        prev.map((m) => (m.id === activeMemberForRole.id ? { ...m, role: foundRole || m.role } : m))
      );
      setIsChangeRoleModalOpen(false);
      showNotice(`Role updated for ${activeMemberForRole.fullName || activeMemberForRole.name}.`);
      return;
    }

    try {
      const res = await cmpConnectApi.changeMemberRole(activeMemberForRole.id, selectedNewRoleId, authToken);
      const updated = res?.data;
      if (updated) {
        setMembers((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
      } else {
        fetchMembers();
      }
      setIsChangeRoleModalOpen(false);
      showNotice(`Role updated for ${activeMemberForRole.fullName || activeMemberForRole.name}.`);
    } catch (err) {
      showNotice(err.message || 'Failed to update role.', true);
    }
  };

  // Handle Status Toggle (Deactivate / Reactivate)
  const handleToggleStatus = async (member, targetStatus) => {
    setActiveActionMenuId(null);
    if (isMockData) {
      setMockMembers((prev) =>
        prev.map((m) => (m.id === member.id ? { ...m, status: targetStatus } : m))
      );
      showNotice(`${member.fullName || member.name} has been set to ${targetStatus.toLowerCase()}.`);
      return;
    }
    try {
      const res = await cmpConnectApi.setMemberStatus(member.id, targetStatus, authToken);
      const updated = res?.data;
      if (updated) {
        setMembers((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
      } else {
        fetchMembers();
      }
      showNotice(`${member.fullName || member.name} has been set to ${targetStatus.toLowerCase()}.`);
    } catch (err) {
      showNotice(err.message || 'Failed to update status.', true);
    }
  };

  // Handle Transfer Agent Listings
  const handleTransferSubmit = async (e) => {
    e.preventDefault();
    if (!transferModal.member || !transferModal.toAgentId) return;
    setTransferModal((prev) => ({ ...prev, loading: true }));
    try {
      const res = await cmpConnectApi.transferAgentListings(
        transferModal.member.id,
        transferModal.toAgentId,
        authToken
      );
      const targetMember = members.find((x) => x.id === transferModal.toAgentId);
      const moved = res?.data?.moved ?? res?.moved ?? 0;
      const live = res?.data?.live ?? res?.live ?? 0;
      showNotice(
        `Successfully transferred ${moved} listings (${live} live) to ${targetMember?.fullName || 'the new agent'}.`
      );
      setTransferModal({ isOpen: false, member: null, toAgentId: '', loading: false });
    } catch (err) {
      showNotice(err.message || 'Failed to move listings.', true);
      setTransferModal((prev) => ({ ...prev, loading: false }));
    }
  };

  // Handle BRN Verification Request
  const handleVerifySubmit = async (e) => {
    e.preventDefault();
    if (!verifyModal.member || !verifyModal.brn.trim()) return;
    setVerifyModal((prev) => ({ ...prev, loading: true }));
    try {
      await cmpConnectApi.requestMemberVerification(
        verifyModal.member.id,
        {
          brn: verifyModal.brn.trim(),
          brnExpiry: verifyModal.brnExpiry || undefined
        },
        authToken
      );
      showNotice(`Verification requested for BRN#${verifyModal.brn.trim()}. Status is now Pending review.`);
      setVerifyModal({ isOpen: false, member: null, brn: '', brnExpiry: '', loading: false });
      fetchMembers();
    } catch (err) {
      showNotice(err.message || 'Failed to request BRN verification.', true);
      setVerifyModal((prev) => ({ ...prev, loading: false }));
    }
  };

  // Assignable roles list (excluding Owner and roles with excessive permissions)
  const assignable = useMemo(() => {
    return assignableRoles(availableRoles, account);
  }, [availableRoles, account]);

  return (
    <div>
      {/* Title & Actions */}
      <div
        className="row"
        style={{
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: '16px',
          flexWrap: 'wrap',
          marginBottom: '18px'
        }}
      >
        <div>
          <h1 style={{ fontSize: '22px', display: 'flex', alignItems: 'baseline', gap: '10px', letterSpacing: '-0.02em', margin: 0 }}>
            Members <span className="count-badge">{isLoading ? '…' : (pagination.total || counts.all)}</span>
          </h1>
          <p className="muted" style={{ margin: '4px 0 0', fontSize: '14px' }}>
            Manage agency agents, brokers, admins and account operators.
          </p>
        </div>

        {can('team.create') && (
          <button
            type="button"
            className="btn btn-accent btn-sm"
            onClick={openInviteModal}
            style={{ gap: '6px' }}
          >
            <Plus size={16} />
            <span>Create a new user</span>
          </button>
        )}
      </div>

      {/* Global Banner Notice */}
      {notice && (
        <div
          className="card"
          style={{
            padding: '12px 16px',
            marginBottom: '16px',
            background: notice.isError ? 'rgba(179,38,30,0.1)' : 'var(--cmp-brand-subtle)',
            borderColor: notice.isError ? 'var(--cmp-danger)' : 'var(--cmp-brand-border)',
            color: notice.isError ? 'var(--cmp-danger)' : 'var(--cmp-brand)',
            fontSize: '13.5px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          {notice.isError ? <AlertTriangle size={16} /> : <Check size={16} />}
          <span>{notice.text}</span>
        </div>
      )}

      {/* Search & Role / Status Filter Bar */}
      <div className="row" style={{ gap: '10px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div className="row" style={{ flex: '1 1 320px', maxWidth: '420px', gap: 0 }}>
          <label htmlFor="users-search" className="visually-hidden">Search by name, email or mobile</label>
          <input
            id="users-search"
            placeholder="Search by name, email, mobile"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ height: '40px', borderRadius: '8px 0 0 8px', flex: 1, borderRight: 'none', fontSize: '13px' }}
          />
          <span
            className="btn btn-outline"
            aria-hidden="true"
            style={{
              height: '40px',
              borderRadius: '0 8px 8px 0',
              display: 'grid',
              placeItems: 'center',
              padding: '0 12px',
              color: 'var(--cmp-text-faint)',
              pointerEvents: 'none'
            }}
          >
            <Search size={16} />
          </span>
        </div>

        <span style={{ flex: 1 }} />

        <div style={{ width: '190px' }}>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            style={{ height: '40px', width: '100%', fontSize: '13px' }}
          >
            <option value="">Any role</option>
            {availableRoles.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>

        <div style={{ width: '190px' }}>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ height: '40px', width: '100%', fontSize: '13px' }}
          >
            <option value="all">Any status</option>
            <option value="ACTIVE">Active ({isLoading ? '…' : counts.ACTIVE})</option>
            <option value="INVITED">Invited ({isLoading ? '…' : counts.INVITED})</option>
            <option value="INACTIVE">Inactive ({isLoading ? '…' : counts.INACTIVE})</option>
          </select>
        </div>
      </div>

      {/* Members Table */}
      <div className="card table-scroll">
        <table className="data">
          <thead>
            <tr>
              <th>Users ({isLoading ? '…' : pagination.total || members.length})</th>
              <th>Role</th>
              <th>Verification</th>
              <th>Compliance</th>
              <th>Status</th>
              <th style={{ textAlign: 'end', width: '60px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--cmp-text-muted)' }}>
                  Loading team members...
                </td>
              </tr>
            ) : members.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '36px', color: 'var(--cmp-text-muted)' }}>
                  No members matched the filter criteria.
                </td>
              </tr>
            ) : (
              members.map((m) => {
                const displayName = m.fullName || m.name || `${m.firstName || ''} ${m.lastName || ''}`.trim() || 'User';
                const roleName = m.role?.name || (typeof m.role === 'string' ? m.role : 'Member');
                const isBlocked = Boolean(m.blockedByCmp);
                const isInvited = m.status === 'INVITED';
                const isInactive = m.status === 'INACTIVE';
                const isActive = m.status === 'ACTIVE';

                return (
                  <tr key={m.id || m._id}>
                    <td style={{ minWidth: '240px' }}>
                      <div className="row" style={{ gap: '12px', alignItems: 'center' }}>
                        <Avatar name={displayName} src={m.photo || m.avatar} size={42} />
                        <div>
                          <div className="row" style={{ gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                            <NavLink
                              to={`/team/members/${m.id || m._id}`}
                              style={{ color: 'var(--cmp-brand)', fontWeight: 700, fontSize: '14px', textDecoration: 'none' }}
                            >
                              {displayName}
                            </NavLink>
                            {m.isSelf && (
                              <span
                                className="badge"
                                style={{
                                  fontSize: '10.5px',
                                  padding: '1px 6px',
                                  background: 'var(--cmp-brand-subtle)',
                                  color: 'var(--cmp-brand)',
                                  border: '1px solid var(--cmp-brand-border)',
                                  fontWeight: 700
                                }}
                              >
                                You
                              </span>
                            )}
                          </div>

                          <span className="faint" style={{ display: 'block', fontSize: '12px', marginTop: '2px' }}>
                            {m.mobile || m.phone || '—'}
                          </span>
                          <span className="faint" style={{ display: 'block', fontSize: '12px' }}>
                            {m.email}
                          </span>
                          {m.lastLoginAt ? (
                            <span className="faint" style={{ display: 'block', fontSize: '11px', marginTop: '2px', opacity: 0.8 }}>
                              Last seen {formatDateTime(m.lastLoginAt)}
                            </span>
                          ) : isInvited ? (
                            <span className="faint" style={{ display: 'block', fontSize: '11px', marginTop: '2px', opacity: 0.8 }}>
                              Invited {formatDate(m.invite?.invitedAt || m.createdAt)}
                            </span>
                          ) : (
                            <span className="faint" style={{ display: 'block', fontSize: '11px', marginTop: '2px', opacity: 0.8 }}>
                              Joined {formatDate(m.createdAt)}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    <td>
                      <div style={{ display: 'grid', gap: '2px' }}>
                        <span style={{ fontWeight: 600, fontSize: '13.5px' }}>{roleName}</span>
                        {m.isOwner && (
                          <span style={{ fontSize: '11px', color: 'var(--cmp-accent)', fontWeight: 700 }}>
                            ★ Owner
                          </span>
                        )}
                      </div>
                    </td>

                    <td>
                      {!isAgency ? (
                        <span className="muted" style={{ fontSize: '13px' }}>Not required</span>
                      ) : m.verificationStatus === 'VERIFIED' ? (
                        <span className="row" style={{ gap: '4px', color: 'var(--cmp-success)', fontWeight: 600, fontSize: '13px' }}>
                          Verified <Check size={14} />
                        </span>
                      ) : m.verificationStatus === 'PENDING' ? (
                        <span style={{ color: 'var(--cmp-warning)', fontSize: '13px', fontWeight: 600 }}>
                          Pending
                        </span>
                      ) : m.verificationStatus === 'REJECTED' ? (
                        <span
                          style={{ color: 'var(--cmp-danger)', fontSize: '13px', fontWeight: 600 }}
                          title={m.verification?.note || 'Verification rejected'}
                        >
                          Rejected
                        </span>
                      ) : (
                        <span style={{ color: 'var(--cmp-warning)', fontSize: '13px', fontWeight: 500 }}>Unverified</span>
                      )}
                    </td>

                    <td>
                      {!isAgency ? (
                        <span className="muted" style={{ fontSize: '13px' }}>Not required</span>
                      ) : m.compliance?.brn ? (
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                            <span style={{ color: 'var(--cmp-brand)', fontWeight: 600, fontSize: '13px' }}>
                              BRN#{m.compliance.brn}
                            </span>
                            {m.compliance.whitelisted && (
                              <span
                                className="badge"
                                style={{ background: 'rgba(30,123,89,0.12)', color: 'var(--cmp-primary)', fontSize: '10.5px', padding: '1px 6px', fontWeight: 600 }}
                              >
                                On DLD list
                              </span>
                            )}
                            {m.compliance.isNew && (
                              <span
                                className="badge"
                                style={{ background: 'rgba(178,107,0,0.12)', color: '#b26b00', fontSize: '10.5px', padding: '1px 6px', fontWeight: 600 }}
                              >
                                New BRN
                              </span>
                            )}
                          </div>
                          {m.compliance.brnExpiry && (
                            <span className="faint" style={{ display: 'block', fontSize: '11px', marginTop: '2px' }}>
                              Exp: {formatDate(m.compliance.brnExpiry)}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="muted">—</span>
                      )}
                    </td>

                    <td>
                      {isBlocked ? (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '2px 10px',
                            borderRadius: '999px',
                            fontSize: '12px',
                            fontWeight: 600,
                            whiteSpace: 'nowrap',
                            color: 'var(--cmp-danger)',
                            border: '1px solid color-mix(in srgb, var(--cmp-danger) 55%, transparent)',
                            background: 'color-mix(in srgb, var(--cmp-danger) 10%, transparent)'
                          }}
                          title={m.blockedReason || 'Suspended by CMP administration'}
                        >
                          Suspended
                        </span>
                      ) : (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '2px 10px',
                            borderRadius: '999px',
                            fontSize: '12px',
                            fontWeight: 600,
                            whiteSpace: 'nowrap',
                            color: isInactive ? 'var(--cmp-text-muted)' : isInvited ? 'var(--cmp-warning)' : 'var(--cmp-success)',
                            border: `1px solid color-mix(in srgb, ${isInactive ? 'var(--cmp-text-muted)' : isInvited ? 'var(--cmp-warning)' : 'var(--cmp-success)'} 55%, transparent)`,
                            background: `color-mix(in srgb, ${isInactive ? 'var(--cmp-text-muted)' : isInvited ? 'var(--cmp-warning)' : 'var(--cmp-success)'} 10%, transparent)`
                          }}
                        >
                          {isInactive ? 'Inactive' : isInvited ? 'Invited' : 'Active'}
                        </span>
                      )}
                    </td>

                    {/* Actions ⋮ Column */}
                    <td style={{ textAlign: 'end', position: 'relative' }}>
                      {/* Hide action menu for Owner and self */}
                      {!m.isOwner && !m.isSelf && (
                        <div>
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            style={{ width: '32px', height: '32px', padding: 0 }}
                            onClick={() => setActiveActionMenuId(activeActionMenuId === m.id ? null : m.id)}
                            aria-label="Member actions"
                          >
                            <MoreVertical size={16} />
                          </button>

                          {activeActionMenuId === m.id && (
                            <div
                              ref={actionMenuRef}
                              style={{
                                position: 'absolute',
                                right: '6px',
                                top: '38px',
                                zIndex: 60,
                                minWidth: '190px',
                                padding: '6px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '2px',
                                background: 'var(--cmp-surface)',
                                border: '1px solid var(--cmp-border)',
                                borderRadius: '10px',
                                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.08)',
                                textAlign: 'start'
                              }}
                            >
                              {/* Resend invite */}
                              {isInvited && can('team.create') && (
                                <button
                                  type="button"
                                  className="menu-item"
                                  onClick={() => handleResendInvite(m)}
                                >
                                  <Mail size={15} style={{ color: 'var(--cmp-brand)' }} />
                                  <span>Resend invite</span>
                                </button>
                              )}

                              {/* Change role */}
                              {can('team.profile_manage') && (
                                <button
                                  type="button"
                                  className="menu-item"
                                  onClick={() => openChangeRoleModal(m)}
                                >
                                  <Shield size={15} style={{ color: 'var(--cmp-text-muted)' }} />
                                  <span>Change role</span>
                                </button>
                              )}

                              {/* Move listings (Transfer listings) */}
                              {can('team.transfer') && (
                                <button
                                  type="button"
                                  className="menu-item"
                                  onClick={() => {
                                    setActiveActionMenuId(null);
                                    setTransferModal({ isOpen: true, member: m, toAgentId: '', loading: false });
                                  }}
                                >
                                  <RotateCw size={15} style={{ color: 'var(--cmp-accent)' }} />
                                  <span>Move listings</span>
                                </button>
                              )}

                              {/* Request BRN verification */}
                              {isAgency && m.verificationStatus !== 'VERIFIED' && m.verificationStatus !== 'PENDING' && can('team.verification_request') && (
                                <button
                                  type="button"
                                  className="menu-item"
                                  onClick={() => {
                                    setActiveActionMenuId(null);
                                    setVerifyModal({
                                      isOpen: true,
                                      member: m,
                                      brn: m.compliance?.brn || '',
                                      brnExpiry: m.compliance?.brnExpiry ? m.compliance.brnExpiry.split('T')[0] : '',
                                      loading: false
                                    });
                                  }}
                                >
                                  <ShieldCheck size={15} style={{ color: 'var(--cmp-primary)' }} />
                                  <span>Request BRN verification</span>
                                </button>
                              )}

                              {/* Deactivate / Reactivate */}
                              {can('team.delete') && (
                                <>
                                  {!isInactive ? (
                                    <button
                                      type="button"
                                      className="menu-item menu-item-danger"
                                      onClick={() => handleToggleStatus(m, 'INACTIVE')}
                                    >
                                      <UserMinus size={15} />
                                      <span>Deactivate</span>
                                    </button>
                                  ) : !isBlocked ? (
                                    <button
                                      type="button"
                                      className="menu-item"
                                      style={{ color: 'var(--cmp-success)' }}
                                      onClick={() => handleToggleStatus(m, 'ACTIVE')}
                                    >
                                      <UserCheck size={15} />
                                      <span>Reactivate</span>
                                    </button>
                                  ) : null}
                                </>
                              )}

                              <div style={{ height: '1px', background: 'var(--cmp-border)', margin: '4px 2px' }} />

                              <NavLink
                                to={`/team/members/${m.id || m._id}`}
                                className="menu-item"
                                style={{ textDecoration: 'none' }}
                              >
                                <User size={15} style={{ color: 'var(--cmp-text-muted)' }} />
                                <span>View profile</span>
                              </NavLink>
                            </div>
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

        {/* Pagination Bar */}
        <div
          className="row"
          style={{
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px 18px',
            borderTop: '1px solid var(--cmp-border)',
            fontSize: '13px',
            flexWrap: 'wrap',
            gap: '12px'
          }}
        >
          <span className="muted">
            Showing {members.length === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1} to{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total || members.length)} of{' '}
            <strong>{pagination.total || members.length}</strong> members
          </span>

          <div className="row" style={{ gap: '8px', alignItems: 'center' }}>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              disabled={pagination.page <= 1 || isLoading}
              onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
              style={{ gap: '4px', padding: '4px 10px', height: '32px' }}
            >
              <ChevronLeft size={14} />
              <span>Previous</span>
            </button>
            <span className="faint" style={{ fontSize: '12px', padding: '0 4px' }}>
              Page {pagination.page} of {pagination.pages || 1}
            </span>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              disabled={pagination.page >= (pagination.pages || 1) || isLoading}
              onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
              style={{ gap: '4px', padding: '4px 10px', height: '32px' }}
            >
              <span>Next</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* CREATE NEW USER / INVITE MODAL */}
      {isInviteModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'var(--cmp-overlay)',
            zIndex: 100,
            display: 'grid',
            placeItems: 'center',
            padding: '16px'
          }}
          onClick={() => setIsInviteModalOpen(false)}
        >
          <div
            className="card"
            style={{
              maxWidth: '620px',
              width: '100%',
              padding: '24px',
              background: 'var(--cmp-surface-raised)',
              boxShadow: 'var(--cmp-shadow-lg)',
              borderRadius: 'var(--cmp-radius-xl, 14px)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '18px', margin: 0, fontWeight: 700 }}>Create a new user</h2>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setIsInviteModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            {inviteError && (
              <div
                className="card"
                style={{
                  padding: '10px 14px',
                  marginBottom: '14px',
                  background: 'rgba(179,38,30,0.1)',
                  color: 'var(--cmp-danger)',
                  fontSize: '13px',
                  fontWeight: 600
                }}
              >
                {inviteError}
              </div>
            )}

            <form onSubmit={handleInviteSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '14px' }}>
                <div>
                  <label htmlFor="nu-first" style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: 600 }}>First name*</label>
                  <input
                    id="nu-first"
                    type="text"
                    placeholder="e.g. Karim"
                    value={inviteForm.firstName}
                    onChange={(e) => setInviteForm({ ...inviteForm, firstName: e.target.value })}
                    required
                    style={{ height: '40px', width: '100%' }}
                  />
                </div>

                <div>
                  <label htmlFor="nu-last" style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: 600 }}>Last name</label>
                  <input
                    id="nu-last"
                    type="text"
                    placeholder="e.g. Saleh"
                    value={inviteForm.lastName}
                    onChange={(e) => setInviteForm({ ...inviteForm, lastName: e.target.value })}
                    style={{ height: '40px', width: '100%' }}
                  />
                </div>

                {/* Mobile phone with country code */}
                <div>
                  <label htmlFor="nu-mobile" style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: 600 }}>Mobile phone*</label>
                  <div className="row" style={{ gap: 0 }}>
                    <label htmlFor="nu-mobile-code" className="visually-hidden">Country code</label>
                    <select
                      id="nu-mobile-code"
                      value={splitPhone(inviteForm.mobile).code}
                      onChange={(e) => {
                        const { number } = splitPhone(inviteForm.mobile);
                        setInviteForm((prev) => ({ ...prev, mobile: `${e.target.value}${number}` }));
                      }}
                      style={{ width: '96px', borderRadius: '8px 0 0 8px', height: '40px', fontSize: '13px' }}
                    >
                      {PHONE_CODES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                    <input
                      id="nu-mobile"
                      inputMode="tel"
                      placeholder="50 123 4567"
                      value={splitPhone(inviteForm.mobile).number}
                      onChange={(e) => {
                        const { code } = splitPhone(inviteForm.mobile);
                        const raw = e.target.value.replace(/\D/g, '').slice(0, 10);
                        setInviteForm((prev) => ({ ...prev, mobile: `${code}${raw}` }));
                      }}
                      required
                      style={{
                        borderRadius: '0 8px 8px 0',
                        borderLeft: 'none',
                        flex: 1,
                        height: '40px',
                        fontSize: '13px',
                        borderColor: !mobileCheckState.available
                          ? 'var(--cmp-danger)'
                          : mobileCheckState.checked && inviteForm.mobile.trim().length >= 7
                          ? 'var(--cmp-primary)'
                          : undefined
                      }}
                    />
                  </div>

                  {mobileCheckState.checking && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px', fontSize: '12px', color: 'var(--cmp-text-muted)' }}>
                      <Clock size={12} />
                      <span>Checking mobile number...</span>
                    </div>
                  )}

                  {!mobileCheckState.checking && mobileCheckState.checked && inviteForm.mobile.trim().length >= 7 && (
                    <div style={{ marginTop: '4px' }}>
                      {!mobileCheckState.available ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--cmp-danger)', fontWeight: 500 }}>
                          <X size={13} style={{ flexShrink: 0 }} />
                          <span>{mobileCheckState.message || 'Mobile already in use.'}</span>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--cmp-primary)', fontWeight: 500 }}>
                          <Check size={12} />
                          <span>Mobile number available</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Login email */}
                <div>
                  <label htmlFor="nu-email" style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: 600 }}>Login email*</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      id="nu-email"
                      type="email"
                      placeholder="user@agency.ae"
                      value={inviteForm.email}
                      onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                      required
                      style={{
                        width: '100%',
                        height: '40px',
                        fontSize: '13px',
                        borderColor: !emailCheckState.available
                          ? emailCheckState.reason === 'ALREADY_INVITED' ? '#b26b00' : 'var(--cmp-danger)'
                          : emailCheckState.checked && inviteForm.email.includes('@')
                          ? 'var(--cmp-primary)'
                          : undefined
                      }}
                    />
                    {emailCheckState.checking && (
                      <div style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                        <Clock size={14} style={{ color: 'var(--cmp-text-muted)', animation: 'spin 1s linear infinite' }} />
                      </div>
                    )}
                  </div>

                  {emailCheckState.checking && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px', fontSize: '12px', color: 'var(--cmp-text-muted)' }}>
                      <Clock size={12} />
                      <span>Checking email...</span>
                    </div>
                  )}

                  {!emailCheckState.checking && emailCheckState.checked && inviteForm.email.trim() && (
                    <div style={{ marginTop: '4px' }}>
                      {emailCheckState.reason === 'ALREADY_INVITED' ? (
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '8px',
                            padding: '4px 8px',
                            background: 'rgba(178,107,0,0.08)',
                            borderRadius: '6px',
                            fontSize: '12px',
                            color: '#b26b00'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <AlertTriangle size={13} style={{ flexShrink: 0 }} />
                            <span>{emailCheckState.message || 'Already invited.'}</span>
                          </div>
                          {emailCheckState.memberId && (
                            <button
                              type="button"
                              className="btn btn-ghost btn-xs"
                              style={{
                                color: emailCheckState.resent ? 'var(--cmp-success)' : 'var(--cmp-brand)',
                                fontWeight: 700,
                                padding: '2px 6px',
                                textDecoration: emailCheckState.resent ? 'none' : 'underline',
                                flexShrink: 0
                              }}
                              disabled={emailCheckState.resending || emailCheckState.resent}
                              onClick={() => handleResendFromModal(emailCheckState.memberId, inviteForm.email)}
                            >
                              {emailCheckState.resending
                                ? 'Resending...'
                                : emailCheckState.resent
                                ? '✓ Resent'
                                : 'Resend invite'}
                            </button>
                          )}
                        </div>
                      ) : !emailCheckState.available ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--cmp-danger)', fontWeight: 500 }}>
                          <X size={13} style={{ flexShrink: 0 }} />
                          <span>{emailCheckState.message || 'Email already registered.'}</span>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--cmp-primary)', fontWeight: 500 }}>
                          <Check size={12} />
                          <span>Email is available</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Role select */}
                <div>
                  <label htmlFor="nu-role" style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: 600 }}>Role*</label>
                  <select
                    id="nu-role"
                    value={inviteForm.roleId}
                    onChange={(e) => setInviteForm({ ...inviteForm, roleId: e.target.value })}
                    required
                    style={{ height: '40px', width: '100%', fontSize: '13px' }}
                  >
                    <option value="">Select a role</option>
                    <optgroup label="Default roles">
                      {assignable.filter((r) => r.isSystem).map((r) => (
                        <option key={r.id} value={r.id} disabled={r.disabled}>
                          {r.name} {r.disabled ? '(No permission)' : ''}
                        </option>
                      ))}
                    </optgroup>
                    {assignable.some((r) => !r.isSystem) && (
                      <optgroup label="Custom roles">
                        {assignable.filter((r) => !r.isSystem).map((r) => (
                          <option key={r.id} value={r.id} disabled={r.disabled}>
                            {r.name} {r.disabled ? '(No permission)' : ''}
                          </option>
                        ))}
                      </optgroup>
                    )}
                  </select>
                </div>

                {/* Dubai Broker Licence (BRN) - Agencies Only */}
                {isAgency && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <label htmlFor="nu-brn" style={{ margin: 0, fontSize: '13px', fontWeight: 600 }}>Dubai broker licence (BRN)*</label>
                      <span style={{ fontSize: '11px', color: 'var(--cmp-text-muted)' }}>DLD check</span>
                    </div>
                    <div style={{ position: 'relative' }}>
                      <input
                        id="nu-brn"
                        type="text"
                        inputMode="numeric"
                        placeholder="e.g. 50318"
                        value={inviteForm.brn}
                        onChange={(e) => setInviteForm({ ...inviteForm, brn: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                        required={isAgency}
                        style={{
                          width: '100%',
                          height: '40px',
                          fontSize: '13px',
                          borderColor: (brnCheckState.allowed === false || brnCheckState.inUse)
                            ? 'var(--cmp-danger)'
                            : brnCheckState.whitelisted
                            ? 'var(--cmp-primary)'
                            : undefined
                        }}
                      />
                      {brnCheckState.checking && (
                        <div style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                          <Clock size={14} style={{ color: 'var(--cmp-text-muted)', animation: 'spin 1s linear infinite' }} />
                        </div>
                      )}
                    </div>

                    {/* BRN Status Feedback */}
                    {brnCheckState.checking && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px', fontSize: '12px', color: 'var(--cmp-text-muted)' }}>
                        <Clock size={12} />
                        <span>Checking broker licence on DLD...</span>
                      </div>
                    )}

                    {!brnCheckState.checking && brnCheckState.checked && inviteForm.brn.trim() && (
                      <div style={{ marginTop: '4px', display: 'grid', gap: '4px' }}>
                        {brnCheckState.allowed === false ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--cmp-danger)', fontWeight: 600 }}>
                            <X size={13} style={{ flexShrink: 0 }} />
                            <span>{brnCheckState.message || (brnCheckState.inUse ? `Already linked to ${brnCheckState.inUseBy || 'another user'}.` : 'Registered under another office.')}</span>
                          </div>
                        ) : (
                          <>
                            {brnCheckState.whitelisted && (
                              <>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--cmp-primary)', fontWeight: 600 }}>
                                  <Check size={13} style={{ flexShrink: 0 }} />
                                  <span>
                                    ✓ Found on DLD list: {brnCheckState.broker?.name}
                                  </span>
                                </div>
                                {brnCheckState.broker?.cardExpired && (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#b26b00' }}>
                                    <AlertTriangle size={12} style={{ flexShrink: 0 }} />
                                    <span>⚠ Broker card expired{brnCheckState.broker?.cardExpiryDate ? ` on ${formatDate(brnCheckState.broker.cardExpiryDate)}` : ''}</span>
                                  </div>
                                )}
                              </>
                            )}

                            {brnCheckState.isNew && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#b26b00' }}>
                                <AlertTriangle size={12} style={{ flexShrink: 0 }} />
                                <span>⚠ Not on the DLD list. CMP will check it manually.</span>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <p className="faint" style={{ margin: '14px 0 0', fontSize: '13px' }}>
                They receive an email to set a password, then complete their public profile.
              </p>

              <div className="row" style={{ justifyContent: 'flex-end', gap: '8px', marginTop: '20px' }}>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => setIsInviteModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  disabled={
                    isInviting ||
                    brnCheckState.checking ||
                    (isAgency && (brnCheckState.allowed === false || brnCheckState.inUse || brnCheckState.ornMatch === false)) ||
                    emailCheckState.checking ||
                    (!emailCheckState.available && emailCheckState.checked) ||
                    mobileCheckState.checking ||
                    (!mobileCheckState.available && mobileCheckState.checked)
                  }
                >
                  {isInviting ? 'Sending invitation...' : 'Send invitation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CHANGE ROLE MODAL */}
      {isChangeRoleModalOpen && activeMemberForRole && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'var(--cmp-overlay)',
            zIndex: 100,
            display: 'grid',
            placeItems: 'center',
            padding: '16px'
          }}
          onClick={() => setIsChangeRoleModalOpen(false)}
        >
          <div
            className="card"
            style={{
              maxWidth: '440px',
              width: '100%',
              padding: '24px',
              background: 'var(--cmp-surface-raised)',
              boxShadow: 'var(--cmp-shadow-lg)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h2 style={{ fontSize: '18px', margin: 0 }}>
                Change role for {activeMemberForRole.fullName || activeMemberForRole.name}
              </h2>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setIsChangeRoleModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleChangeRoleSubmit}>
              <div style={{ margin: '14px 0' }}>
                <label>Select new role</label>
                <select
                  value={selectedNewRoleId}
                  onChange={(e) => setSelectedNewRoleId(e.target.value)}
                  required
                >
                  <option value="">Select a role</option>
                  {assignable.map((r) => (
                    <option key={r.id} value={r.id} disabled={r.disabled}>
                      {r.name} {r.disabled ? '(No permission to assign)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="row" style={{ justifyContent: 'flex-end', gap: '8px', marginTop: '20px' }}>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => setIsChangeRoleModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary btn-sm">
                  Save role
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MOVE LISTINGS (TRANSFER) MODAL */}
      {transferModal.isOpen && transferModal.member && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'var(--cmp-overlay)',
            zIndex: 100,
            display: 'grid',
            placeItems: 'center',
            padding: '16px'
          }}
          onClick={() => setTransferModal({ isOpen: false, member: null, toAgentId: '', loading: false })}
        >
          <div
            className="card"
            style={{
              maxWidth: '460px',
              width: '100%',
              padding: '24px',
              background: 'var(--cmp-surface-raised)',
              boxShadow: 'var(--cmp-shadow-lg)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h2 style={{ fontSize: '18px', margin: 0 }}>
                Move listings from {transferModal.member.fullName || transferModal.member.name}
              </h2>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setTransferModal({ isOpen: false, member: null, toAgentId: '', loading: false })}
              >
                <X size={18} />
              </button>
            </div>

            <p className="muted" style={{ fontSize: '13px', margin: '0 0 16px', lineHeight: 1.5 }}>
              Transfer all listings owned by this broker to another active member before deactivating or reassigning them. If any listing is live, the target agent must have a verified BRN.
            </p>

            <form onSubmit={handleTransferSubmit}>
              <div style={{ margin: '14px 0' }}>
                <label>Select destination agent</label>
                <select
                  value={transferModal.toAgentId}
                  onChange={(e) => setTransferModal({ ...transferModal, toAgentId: e.target.value })}
                  required
                >
                  <option value="">-- Choose active agent --</option>
                  {members
                    .filter((m) => m.id !== transferModal.member.id && m.status === 'ACTIVE')
                    .map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.fullName} {m.compliance?.brn ? `(BRN: ${m.compliance.brn})` : ''} - {m.role?.name || m.role}
                      </option>
                    ))}
                </select>
              </div>

              <div className="row" style={{ justifyContent: 'flex-end', gap: '8px', marginTop: '20px' }}>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => setTransferModal({ isOpen: false, member: null, toAgentId: '', loading: false })}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  disabled={!transferModal.toAgentId || transferModal.loading}
                >
                  {transferModal.loading ? 'Transferring...' : 'Transfer listings'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REQUEST BRN VERIFICATION MODAL */}
      {verifyModal.isOpen && verifyModal.member && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'var(--cmp-overlay)',
            zIndex: 100,
            display: 'grid',
            placeItems: 'center',
            padding: '16px'
          }}
          onClick={() => setVerifyModal({ isOpen: false, member: null, brn: '', brnExpiry: '', loading: false })}
        >
          <div
            className="card"
            style={{
              maxWidth: '460px',
              width: '100%',
              padding: '24px',
              background: 'var(--cmp-surface-raised)',
              boxShadow: 'var(--cmp-shadow-lg)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h2 style={{ fontSize: '18px', margin: 0 }}>
                Request BRN verification
              </h2>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setVerifyModal({ isOpen: false, member: null, brn: '', brnExpiry: '', loading: false })}
              >
                <X size={18} />
              </button>
            </div>

            <p className="muted" style={{ fontSize: '13px', margin: '0 0 16px', lineHeight: 1.5 }}>
              Submit broker licence number (BRN) to CMP compliance for manual or automated DLD validation.
            </p>

            <form onSubmit={handleVerifySubmit}>
              <div style={{ display: 'grid', gap: '14px' }}>
                <div>
                  <label>Dubai Broker Licence (BRN)*</label>
                  <input
                    type="text"
                    placeholder="e.g. 50318"
                    value={verifyModal.brn}
                    onChange={(e) => setVerifyModal({ ...verifyModal, brn: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label>BRN Card Expiry Date (optional if on DLD list)</label>
                  <input
                    type="date"
                    value={verifyModal.brnExpiry}
                    onChange={(e) => setVerifyModal({ ...verifyModal, brnExpiry: e.target.value })}
                  />
                </div>
              </div>

              <div className="row" style={{ justifyContent: 'flex-end', gap: '8px', marginTop: '20px' }}>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => setVerifyModal({ isOpen: false, member: null, brn: '', brnExpiry: '', loading: false })}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  disabled={!verifyModal.brn.trim() || verifyModal.loading}
                >
                  {verifyModal.loading ? 'Submitting...' : 'Submit verification'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
