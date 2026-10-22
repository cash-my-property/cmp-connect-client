import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { cmpConnectApi } from '../../services/cmpConnectApi';
import UpdateDocumentsModal from '../../components/properties/UpdateDocumentsModal';
import {
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  Upload,
  ArrowRight,
  Search,
  Filter,
  Loader2,
  Building,
  User,
  ExternalLink,
  RefreshCw,
  X
} from 'lucide-react';

export default function CompliancePage() {
  const { isLiveData, authToken } = useApp();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('properties'); // 'properties' | 'agents'
  const [searchTerm, setSearchTerm] = useState('');
  const [onlyProblems, setOnlyProblems] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState(null);

  // Modal & Toast state
  const [selectedPropertyForModal, setSelectedPropertyForModal] = useState(null);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Live state
  const [rawListings, setRawListings] = useState([]);
  const [rawMembers, setRawMembers] = useState([]);

  // Fetch live listings & members
  const fetchComplianceData = useCallback(async () => {
    if (!isLiveData) return;
    if (!authToken) return;

    setIsLoading(true);
    setApiError(null);

    try {
      const [listingsRes, membersRes] = await Promise.allSettled([
        cmpConnectApi.listListings({ limit: 100 }, authToken),
        cmpConnectApi.listMembers({ limit: 100 }, authToken)
      ]);

      if (listingsRes.status === 'fulfilled' && Array.isArray(listingsRes.value?.data)) {
        setRawListings(listingsRes.value.data);
      } else {
        setRawListings([]);
      }

      if (membersRes.status === 'fulfilled' && Array.isArray(membersRes.value?.data)) {
        setRawMembers(membersRes.value.data);
      } else {
        setRawMembers([]);
      }
    } catch (err) {
      console.error('[CompliancePage] Error fetching compliance data:', err);
      setApiError(err.message || 'Failed to load compliance data.');
    } finally {
      setIsLoading(false);
    }
  }, [isLiveData, authToken]);

  useEffect(() => {
    fetchComplianceData();
  }, [fetchComplianceData]);

  // Demo fallback when in mock mode
  const DEFAULT_MOCK_PROPERTIES = useMemo(() => [
    {
      id: 'CMP-S-001001',
      title: 'Full marina view 2 bed in Marina Gate',
      location: 'Dubai Marina',
      status: 'LIVE',
      permitNumber: 'DLD-7128394',
      permitExpiry: '2026-12-24',
      permitStatus: 'Valid · 64 days left',
      permitSeverity: 'success',
      formAFileName: 'form-a-marina-gate.pdf',
      formAExpiry: '2027-05-19',
      formAStatus: 'Valid · 210 days left',
      formAActive: 'active',
      formASeverity: 'success',
      agent: 'Karim Saleh',
      hasProblem: false
    },
    {
      id: 'CMP-S-001002',
      title: 'Burj Khalifa facing one bed',
      location: 'Downtown Dubai',
      status: 'LIVE',
      permitNumber: 'DLD-7284410',
      permitExpiry: '2026-11-12',
      permitStatus: 'Expires in 22 days',
      permitSeverity: 'warning',
      formAFileName: 'form-a-the-address.pdf',
      formAExpiry: '2027-01-24',
      formAStatus: 'Valid · 95 days left',
      formAActive: 'active',
      formASeverity: 'success',
      agent: 'Layla Haddad',
      hasProblem: true
    },
    {
      id: 'CMP-S-001004',
      title: 'Duplex penthouse on the Palm',
      location: 'Palm Jumeirah',
      status: 'LIVE',
      permitNumber: 'DLD-6880412',
      permitExpiry: '2026-10-18',
      permitStatus: 'Expired 3 days ago',
      permitSeverity: 'danger',
      formAFileName: 'form-a-palm-penthouse.pdf',
      formAExpiry: '2026-11-02',
      formAStatus: 'Expires in 12 days',
      formAActive: 'active',
      formASeverity: 'warning',
      agent: 'Layla Haddad',
      hasProblem: true
    },
    {
      id: 'CMP-S-001005',
      title: 'Three bed townhouse near the park',
      location: 'Dubai Hills Estate',
      status: 'LIVE',
      permitNumber: 'DLD-7388120',
      permitExpiry: '2027-03-10',
      permitStatus: 'Valid · 140 days left',
      permitSeverity: 'success',
      formAFileName: null,
      formAExpiry: '',
      formAStatus: 'Expired / Missing',
      formAActive: 'expired',
      formASeverity: 'danger',
      agent: 'Arjun Mehta',
      hasProblem: true
    },
    {
      id: 'CMP-R-002003',
      title: 'High floor corner apartment',
      location: 'Jumeirah Lake Towers',
      status: 'PENDING_APPROVAL',
      permitNumber: 'DLD-7455901',
      permitExpiry: '2027-04-09',
      permitStatus: 'Valid · 170 days left',
      permitSeverity: 'success',
      formAFileName: 'form-a-jlt.pdf',
      formAExpiry: '2027-08-17',
      formAStatus: 'Valid · 300 days left',
      formAActive: 'active',
      formASeverity: 'success',
      agent: 'Emma Clarke',
      hasProblem: false
    },
    {
      id: 'CMP-R-002004',
      title: 'Corner shop on retail podium',
      location: 'Business Bay',
      status: 'DRAFT',
      permitNumber: null,
      permitExpiry: '',
      permitStatus: 'Not on file',
      permitSeverity: 'muted',
      formAFileName: null,
      formAExpiry: '',
      formAStatus: 'Overdue since 16 Sep',
      formAActive: 'expired',
      formASeverity: 'danger',
      agent: 'Emma Clarke',
      hasProblem: true
    }
  ], []);

  const [mockProperties, setMockProperties] = useState(() => {
    const saved = localStorage.getItem('cmp-compliance-mock-properties');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return DEFAULT_MOCK_PROPERTIES;
  });

  // Handle saving documents from modal
  const handleSaveDocuments = useCallback(async (updatedData) => {
    if (isLiveData) {
      await fetchComplianceData();
      setToastMessage(`Documents updated successfully.`);
      setTimeout(() => setToastMessage(''), 4000);
      return;
    }

    setMockProperties((prev) => {
      const next = prev.map((item) => {
        if (item.id === updatedData.id) {
          const permitDays = updatedData.permitExpiry
            ? Math.ceil((new Date(updatedData.permitExpiry).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
            : null;
          let permitStatus = 'Not on file';
          let permitSeverity = 'muted';
          if (updatedData.permitNumber) {
            if (permitDays != null) {
              if (permitDays < 0) {
                permitStatus = `Expired ${Math.abs(permitDays)} days ago`;
                permitSeverity = 'danger';
              } else if (permitDays <= 30) {
                permitStatus = `Expires in ${permitDays} days`;
                permitSeverity = 'warning';
              } else {
                permitStatus = `Valid · ${permitDays} days left`;
                permitSeverity = 'success';
              }
            } else {
              permitStatus = updatedData.permitNumber;
              permitSeverity = 'success';
            }
          }

          const formADays = updatedData.formAExpiry
            ? Math.ceil((new Date(updatedData.formAExpiry).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
            : null;
          let formAStatus = 'Not on file';
          let formASeverity = 'muted';
          if (updatedData.formAStatus === 'expired') {
            formAStatus = 'Expired';
            formASeverity = 'danger';
          } else if (updatedData.formAFileName) {
            if (formADays != null) {
              if (formADays < 0) {
                formAStatus = `Expired ${Math.abs(formADays)} days ago`;
                formASeverity = 'danger';
              } else if (formADays <= 30) {
                formAStatus = `Expires in ${formADays} days`;
                formASeverity = 'warning';
              } else {
                formAStatus = `Valid · ${formADays} days left`;
                formASeverity = 'success';
              }
            } else {
              formAStatus = 'Valid on file';
              formASeverity = 'success';
            }
          }

          const hasProblem =
            permitSeverity === 'danger' ||
            permitSeverity === 'warning' ||
            formASeverity === 'danger' ||
            formASeverity === 'warning' ||
            item.status === 'REJECTED';

          return {
            ...item,
            permitNumber: updatedData.permitNumber,
            permitExpiry: updatedData.permitExpiry,
            permitStatus,
            permitSeverity,
            formAFileName: updatedData.formAFileName,
            formAExpiry: updatedData.formAExpiry,
            formAStatus,
            formAActive: updatedData.formAStatus,
            formASeverity,
            hasProblem
          };
        }
        return item;
      });

      try {
        localStorage.setItem('cmp-compliance-mock-properties', JSON.stringify(next));
      } catch (e) {}
      return next;
    });

    setToastMessage(`Documents saved for ${updatedData.id}.`);
    setTimeout(() => setToastMessage(''), 4000);
  }, [isLiveData, fetchComplianceData]);

  const mockAgents = useMemo(() => [
    {
      id: '1',
      name: 'Layla Haddad',
      email: 'layla@agency.ae',
      role: 'Director',
      brn: '58210',
      brnExpiry: '2027-10-30',
      verificationStatus: 'VERIFIED',
      whitelisted: true,
      statusText: 'Verified · Valid until Oct 2027',
      severity: 'success',
      hasProblem: false
    },
    {
      id: '2',
      name: 'Karim Saleh',
      email: 'karim@agency.ae',
      role: 'Senior Agent',
      brn: '49120',
      brnExpiry: '2026-11-10',
      verificationStatus: 'VERIFIED',
      whitelisted: true,
      statusText: 'Expires in 22 days',
      severity: 'warning',
      hasProblem: true
    },
    {
      id: '3',
      name: 'Arjun Mehta',
      email: 'arjun@agency.ae',
      role: 'Property Consultant',
      brn: '20182',
      brnExpiry: '2026-10-01',
      verificationStatus: 'VERIFIED',
      whitelisted: false,
      statusText: 'Expired 18 days ago',
      severity: 'danger',
      hasProblem: true
    },
    {
      id: '4',
      name: 'Emma Clarke',
      email: 'emma@agency.ae',
      role: 'Listing Coordinator',
      brn: null,
      brnExpiry: null,
      verificationStatus: 'UNVERIFIED',
      whitelisted: false,
      statusText: 'No BRN registered',
      severity: 'muted',
      hasProblem: false
    }
  ], []);

  // Process live properties
  const processedProperties = useMemo(() => {
    if (!isLiveData) return mockProperties;

    return rawListings.map((l) => {
      const ref = l.listingRef || l.id;
      const title = l.title || l.propertyTitle || 'Untitled Property';
      const location = l.location || l.propertyLocation || '—';
      const status = l.status || 'DRAFT';
      const permitNumber = l.permitNumber || null;

      // Extract Form A document if available
      const docs = Array.isArray(l.documents) ? l.documents : [];
      const formADoc = docs.find((d) => d.key === 'propertyFormA' || d.key === 'formA' || (d.label && d.label.toLowerCase().includes('form a')));
      const trakheesiDoc = docs.find((d) => d.key === 'propertyTrakheesi' || (d.label && d.label.toLowerCase().includes('trakheesi')));

      // Permit status logic
      let permitStatus = 'Not on file';
      let permitSeverity = 'muted';
      if (permitNumber || trakheesiDoc?.url) {
        permitStatus = permitNumber || 'Uploaded';
        permitSeverity = 'success';
      } else if (status === 'LIVE') {
        permitStatus = 'Missing (Live listing!)';
        permitSeverity = 'danger';
      }

      // Form A status logic
      let formAFileName = formADoc?.fileName || (formADoc?.url ? 'form-a-agreement.pdf' : null);
      let formAStatus = formAFileName ? 'Valid on file' : 'Not on file';
      let formASeverity = formAFileName ? 'success' : (status === 'LIVE' || status === 'PENDING_APPROVAL' ? 'warning' : 'muted');

      const hasProblem = permitSeverity === 'danger' || permitSeverity === 'warning' || formASeverity === 'danger' || formASeverity === 'warning' || status === 'REJECTED';

      return {
        id: l.id || l._id,
        ref,
        title,
        location,
        status,
        permitNumber,
        permitExpiry: l.permitExpiry || '',
        permitStatus,
        permitSeverity,
        formAFileName,
        formAExpiry: formADoc?.expiryDate || '',
        formAStatus,
        formASeverity,
        formAActive: formADoc ? 'active' : 'expired',
        agent: l.listedBy?.fullName || '—',
        hasProblem
      };
    });
  }, [isLiveData, rawListings, mockProperties]);

  // Process live agents
  const processedAgents = useMemo(() => {
    if (!isLiveData) return mockAgents;

    const now = Date.now();
    return rawMembers.map((m) => {
      const brn = m.compliance?.brn || null;
      const brnExpiry = m.compliance?.brnExpiry || null;
      const verificationStatus = m.verificationStatus || 'UNVERIFIED';
      const whitelisted = !!m.compliance?.whitelisted;

      let statusText = 'No BRN registered';
      let severity = 'muted';
      let hasProblem = false;

      if (brn) {
        if (brnExpiry) {
          const expTime = new Date(brnExpiry).getTime();
          const daysLeft = Math.ceil((expTime - now) / (1000 * 60 * 60 * 24));
          if (daysLeft < 0) {
            statusText = `Expired ${Math.abs(daysLeft)} days ago`;
            severity = 'danger';
            hasProblem = true;
          } else if (daysLeft <= 30) {
            statusText = `Expires in ${daysLeft} days`;
            severity = 'warning';
            hasProblem = true;
          } else {
            statusText = `Valid · ${daysLeft} days left`;
            severity = 'success';
          }
        } else if (verificationStatus === 'VERIFIED') {
          statusText = 'Verified DLD Broker';
          severity = 'success';
        } else if (verificationStatus === 'PENDING') {
          statusText = 'Pending DLD review';
          severity = 'warning';
          hasProblem = true;
        } else {
          statusText = 'Unverified BRN';
          severity = 'warning';
          hasProblem = true;
        }
      }

      return {
        id: m.id || m._id,
        name: m.fullName || `${m.firstName || ''} ${m.lastName || ''}`.trim() || 'Team Member',
        email: m.email || '—',
        role: m.role?.name || m.role || 'Member',
        brn,
        brnExpiry,
        verificationStatus,
        whitelisted,
        statusText,
        severity,
        hasProblem
      };
    });
  }, [isLiveData, rawMembers, mockAgents]);

  // KPIs
  const kpis = useMemo(() => {
    const totalProps = processedProperties.length;
    const compliantProps = processedProperties.filter((p) => !p.hasProblem).length;
    const compliancePercent = totalProps > 0 ? Math.round((compliantProps / totalProps) * 100) : 100;

    const liveWithoutPermit = processedProperties.filter((p) => p.status === 'LIVE' && p.permitSeverity === 'danger').length;
    const expiringIn30Days = processedProperties.filter((p) => p.permitSeverity === 'warning' || p.formASeverity === 'warning').length +
      processedAgents.filter((a) => a.severity === 'warning').length;

    const formAExpiredOrMissing = processedProperties.filter((p) => (p.status === 'LIVE' || p.status === 'PENDING_APPROVAL') && !p.formAFileName).length;

    return {
      compliancePercent,
      liveWithoutPermit,
      expiringIn30Days,
      formAExpiredOrMissing
    };
  }, [processedProperties, processedAgents]);

  // Filtered views
  const filteredProperties = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return processedProperties.filter((p) => {
      if (onlyProblems && !p.hasProblem) return false;
      if (!q) return true;
      return (
        (p.ref || '').toLowerCase().includes(q) ||
        (p.title || '').toLowerCase().includes(q) ||
        (p.location || '').toLowerCase().includes(q) ||
        (p.agent || '').toLowerCase().includes(q)
      );
    });
  }, [processedProperties, searchTerm, onlyProblems]);

  const filteredAgents = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return processedAgents.filter((a) => {
      if (onlyProblems && !a.hasProblem) return false;
      if (!q) return true;
      return (
        (a.name || '').toLowerCase().includes(q) ||
        (a.email || '').toLowerCase().includes(q) ||
        (a.brn || '').toLowerCase().includes(q) ||
        (a.role || '').toLowerCase().includes(q)
      );
    });
  }, [processedAgents, searchTerm, onlyProblems]);

  return (
    <div>
      {/* Top Header */}
      <div
        className="row"
        style={{
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: '16px',
          flexWrap: 'wrap',
          marginBottom: '20px'
        }}
      >
        <div>
          <h1
            style={{
              fontSize: '22px',
              display: 'flex',
              alignItems: 'baseline',
              gap: '10px',
              letterSpacing: '-0.02em',
              margin: 0
            }}
          >
            Compliance & Regulatory Tracking
          </h1>
          <p className="muted" style={{ margin: '4px 0 0', fontSize: '13.5px', maxWidth: '820px' }}>
            Keep every DLD permit, Form A seller agreement, and agent RERA BRN in date. Real-time validation against Dubai regulations.
          </p>
        </div>

        <div className="row" style={{ gap: '8px' }}>
          <button
            type="button"
            className="btn btn-sm btn-outline"
            onClick={fetchComplianceData}
            disabled={isLoading}
            title="Refresh compliance"
          >
            <RefreshCw size={13} className={isLoading ? 'spin' : ''} />
            <span>Refresh</span>
          </button>
          <NavLink to="/properties" className="btn btn-sm btn-outline">
            Active portfolio
          </NavLink>
        </div>
      </div>

      {/* API Error Banner */}
      {apiError && (
        <div
          className="card row card-danger"
          style={{
            padding: '12px 16px',
            marginBottom: '16px',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'rgba(239, 68, 68, 0.08)',
            borderColor: 'var(--cmp-danger)',
            color: 'var(--cmp-danger)'
          }}
        >
          <div className="row" style={{ gap: '10px', alignItems: 'center' }}>
            <AlertTriangle size={18} />
            <span style={{ fontSize: '13.5px', fontWeight: 600 }}>{apiError}</span>
          </div>
          <button type="button" className="btn btn-sm btn-outline" onClick={fetchComplianceData}>
            Retry
          </button>
        </div>
      )}

      {/* 4 KPI Cards (as in compliance.html concept) */}
      <div className="kpi-grid" style={{ marginBottom: '20px' }}>
        <div className="card kpi-tile" style={{ padding: '16px' }}>
          <span className="kpi-icon" style={{ color: 'var(--cmp-brand)' }}>
            <ShieldCheck size={20} />
          </span>
          <span style={{ display: 'grid', gap: '2px' }}>
            <span className="muted" style={{ fontSize: '13px', fontWeight: 600 }}>
              Fully compliant
            </span>
            <span style={{ fontSize: '26px', fontWeight: 800, color: 'var(--cmp-text)' }}>
              {isLoading ? '...' : `${kpis.compliancePercent}%`}
            </span>
            <span className="faint" style={{ fontSize: '12px' }}>
              {processedProperties.length} active listings tracked
            </span>
          </span>
        </div>

        <div className="card kpi-tile" style={{ padding: '16px' }}>
          <span className="kpi-icon" style={{ color: kpis.liveWithoutPermit > 0 ? 'var(--cmp-danger)' : 'var(--cmp-text-faint)' }}>
            <ShieldAlert size={20} />
          </span>
          <span style={{ display: 'grid', gap: '2px' }}>
            <span className="muted" style={{ fontSize: '13px', fontWeight: 600 }}>
              Live without valid permit
            </span>
            <span style={{ fontSize: '26px', fontWeight: 800, color: kpis.liveWithoutPermit > 0 ? 'var(--cmp-danger)' : 'var(--cmp-text)' }}>
              {isLoading ? '...' : kpis.liveWithoutPermit}
            </span>
            <span className="faint" style={{ fontSize: '12px' }}>
              {kpis.liveWithoutPermit > 0 ? 'Immediate DLD penalty risk' : 'Zero compliance penalties'}
            </span>
          </span>
        </div>

        <div className="card kpi-tile" style={{ padding: '16px' }}>
          <span className="kpi-icon" style={{ color: kpis.expiringIn30Days > 0 ? 'var(--cmp-warning)' : 'var(--cmp-text-faint)' }}>
            <AlertTriangle size={20} />
          </span>
          <span style={{ display: 'grid', gap: '2px' }}>
            <span className="muted" style={{ fontSize: '13px', fontWeight: 600 }}>
              Expiring in 30 days
            </span>
            <span style={{ fontSize: '26px', fontWeight: 800, color: kpis.expiringIn30Days > 0 ? 'var(--cmp-warning)' : 'var(--cmp-text)' }}>
              {isLoading ? '...' : kpis.expiringIn30Days}
            </span>
            <span className="faint" style={{ fontSize: '12px' }}>
              Permits or agent BRNs needing renewal
            </span>
          </span>
        </div>

        <div className="card kpi-tile" style={{ padding: '16px' }}>
          <span className="kpi-icon" style={{ color: kpis.formAExpiredOrMissing > 0 ? 'var(--cmp-danger)' : 'var(--cmp-text-faint)' }}>
            <FileCheck size={20} />
          </span>
          <span style={{ display: 'grid', gap: '2px' }}>
            <span className="muted" style={{ fontSize: '13px', fontWeight: 600 }}>
              Form A expired / missing
            </span>
            <span style={{ fontSize: '26px', fontWeight: 800, color: kpis.formAExpiredOrMissing > 0 ? 'var(--cmp-danger)' : 'var(--cmp-text)' }}>
              {isLoading ? '...' : kpis.formAExpiredOrMissing}
            </span>
            <span className="faint" style={{ fontSize: '12px' }}>
              Signed seller representation contracts
            </span>
          </span>
        </div>
      </div>

      {/* Segmented Area Tabs */}
      <div
        className="segmented"
        style={{
          marginBottom: '16px',
          height: '42px',
          padding: '3px'
        }}
      >
        <button
          type="button"
          aria-selected={activeTab === 'properties'}
          onClick={() => setActiveTab('properties')}
          style={{ gap: '6px' }}
        >
          <Building size={14} />
          <span>Properties ({processedProperties.length})</span>
        </button>
        <button
          type="button"
          aria-selected={activeTab === 'agents'}
          onClick={() => setActiveTab('agents')}
          style={{ gap: '6px' }}
        >
          <User size={14} />
          <span>Agents ({processedAgents.length})</span>
        </button>
      </div>

      {/* Filter and Control Bar */}
      <div
        className="row"
        style={{
          gap: '12px',
          flexWrap: 'wrap',
          marginBottom: '14px',
          alignItems: 'center'
        }}
      >
        <div style={{ position: 'relative', flex: '1 1 320px', maxWidth: '360px' }}>
          <Search
            size={16}
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--cmp-text-faint)',
              pointerEvents: 'none'
            }}
          />
          <input
            id="compliance-search"
            type="search"
            placeholder={activeTab === 'properties' ? 'Search reference, title or location' : 'Search agent name, email or BRN'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '36px', height: '40px', width: '100%' }}
          />
        </div>

        <label
          className="row"
          style={{
            gap: '8px',
            fontSize: '13.5px',
            fontWeight: 600,
            cursor: 'pointer',
            marginLeft: 'auto'
          }}
        >
          <input
            type="checkbox"
            checked={onlyProblems}
            onChange={(e) => setOnlyProblems(e.target.checked)}
            style={{ width: '18px', height: '18px', accentColor: 'var(--cmp-brand)' }}
          />
          <span>Only show problems</span>
        </label>
      </div>

      {/* Content Section */}
      {isLoading ? (
        <div className="card muted" style={{ padding: '60px 24px', textAlign: 'center' }}>
          <div style={{ display: 'grid', placeItems: 'center', gap: '12px' }}>
            <Loader2 size={28} className="spin" style={{ color: 'var(--cmp-brand)' }} />
            <strong style={{ fontSize: '15px', color: 'var(--cmp-text)' }}>
              Verifying live regulatory status...
            </strong>
          </div>
        </div>
      ) : activeTab === 'properties' ? (
        filteredProperties.length === 0 ? (
          <div className="card muted" style={{ padding: '60px 24px', textAlign: 'center' }}>
            <div style={{ display: 'grid', placeItems: 'center', gap: '12px' }}>
              <CheckCircle2 size={32} style={{ color: 'var(--cmp-success)' }} />
              <strong style={{ fontSize: '16px', color: 'var(--cmp-text)' }}>
                {onlyProblems ? 'No property compliance issues found!' : 'No properties matched your search'}
              </strong>
              <p className="muted" style={{ margin: 0, fontSize: '13.5px', maxWidth: '420px' }}>
                {onlyProblems
                  ? 'All active property listings satisfy Dubai Land Department regulations and permits.'
                  : 'Try clearing your search filters to view your entire portfolio.'}
              </p>
              {(searchTerm || onlyProblems) && (
                <button
                  type="button"
                  className="btn btn-sm btn-outline"
                  onClick={() => {
                    setSearchTerm('');
                    setOnlyProblems(false);
                  }}
                >
                  Clear filters
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="card table-scroll">
            <table className="data">
              <thead>
                <tr>
                  <th>Property</th>
                  <th>Status</th>
                  <th>DLD Permit</th>
                  <th>Form A (Agreement)</th>
                  <th>Responsible Agent</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProperties.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <NavLink
                        to={`/properties/${p.id}/edit`}
                        style={{ fontWeight: 700, color: 'var(--cmp-brand)', textDecoration: 'none' }}
                      >
                        {p.ref}
                      </NavLink>
                      <span style={{ fontWeight: 600, color: 'var(--cmp-text)', display: 'block', fontSize: '13px' }}>
                        {p.title}
                      </span>
                      <span className="faint" style={{ display: 'block', fontSize: '12px' }}>
                        {p.location}
                      </span>
                    </td>
                    <td>
                      <span
                        className="badge"
                        style={{
                          background:
                            p.status === 'LIVE'
                              ? 'var(--cmp-brand)'
                              : p.status === 'PENDING_APPROVAL'
                              ? 'var(--cmp-warning)'
                              : p.status === 'REJECTED'
                              ? 'var(--cmp-danger)'
                              : 'var(--cmp-surface-sunken)',
                          color:
                            p.status === 'LIVE' || p.status === 'REJECTED' ? '#fff' : undefined,
                          fontSize: '11.5px',
                          textTransform: 'uppercase'
                        }}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '13px', fontWeight: 600, display: 'block' }}>
                        {p.permitNumber || '—'}
                      </span>
                      <span
                        className={`badge ${
                          p.permitSeverity === 'danger'
                            ? 'badge-danger'
                            : p.permitSeverity === 'warning'
                            ? 'badge-warning'
                            : p.permitSeverity === 'success'
                            ? 'badge-success'
                            : 'badge-neutral'
                        }`}
                        style={{ marginTop: '2px', fontSize: '11px' }}
                      >
                        {p.permitStatus}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '13px', fontWeight: 600, display: 'block' }}>
                        {p.formAFileName || 'No file'}
                      </span>
                      <span
                        className={`badge ${
                          p.formASeverity === 'danger'
                            ? 'badge-danger'
                            : p.formASeverity === 'warning'
                            ? 'badge-warning'
                            : p.formASeverity === 'success'
                            ? 'badge-success'
                            : 'badge-neutral'
                        }`}
                        style={{ marginTop: '2px', fontSize: '11px' }}
                      >
                        {p.formAStatus}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '13px' }}>{p.agent}</span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedPropertyForModal(p);
                          setIsUpdateModalOpen(true);
                        }}
                        className={`btn btn-sm ${p.hasProblem ? 'btn-primary' : 'btn-outline'}`}
                        style={{ height: '32px', padding: '0 10px', gap: '4px', cursor: 'pointer' }}
                      >
                        <span>Update</span>
                        <ArrowRight size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : (
        filteredAgents.length === 0 ? (
          <div className="card muted" style={{ padding: '60px 24px', textAlign: 'center' }}>
            <div style={{ display: 'grid', placeItems: 'center', gap: '12px' }}>
              <CheckCircle2 size={32} style={{ color: 'var(--cmp-success)' }} />
              <strong style={{ fontSize: '16px', color: 'var(--cmp-text)' }}>
                {onlyProblems ? 'No agent license issues found!' : 'No agents matched your search'}
              </strong>
              <p className="muted" style={{ margin: 0, fontSize: '13.5px', maxWidth: '420px' }}>
                All registered brokers and coordinators have active, verified RERA credentials.
              </p>
            </div>
          </div>
        ) : (
          <div className="card table-scroll">
            <table className="data">
              <thead>
                <tr>
                  <th>Agent / Member</th>
                  <th>Role</th>
                  <th>RERA BRN</th>
                  <th>License Status</th>
                  <th>Verification</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAgents.map((a) => (
                  <tr key={a.id}>
                    <td>
                      <strong style={{ color: 'var(--cmp-text)', fontSize: '13.5px' }}>{a.name}</strong>
                      <span className="faint" style={{ display: 'block', fontSize: '12px' }}>
                        {a.email}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '13px' }}>{a.role}</span>
                    </td>
                    <td>
                      <strong style={{ fontSize: '13px' }}>
                        {a.brn ? `BRN#${a.brn}` : 'Not registered'}
                      </strong>
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          a.severity === 'danger'
                            ? 'badge-danger'
                            : a.severity === 'warning'
                            ? 'badge-warning'
                            : a.severity === 'success'
                            ? 'badge-success'
                            : 'badge-neutral'
                        }`}
                        style={{ fontSize: '11px' }}
                      >
                        {a.statusText}
                      </span>
                    </td>
                    <td>
                      <span
                        className="badge"
                        style={{
                          background:
                            a.verificationStatus === 'VERIFIED'
                              ? 'var(--cmp-brand-subtle)'
                              : 'var(--cmp-surface-sunken)',
                          color:
                            a.verificationStatus === 'VERIFIED'
                              ? 'var(--cmp-brand)'
                              : 'var(--cmp-text-muted)',
                          fontSize: '11px',
                          fontWeight: 700
                        }}
                      >
                        {a.verificationStatus}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <NavLink
                        to="/team/members"
                        className="btn btn-sm btn-outline"
                        style={{ height: '32px', padding: '0 10px', gap: '4px' }}
                      >
                        <span>View profile</span>
                        <ExternalLink size={12} />
                      </NavLink>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* Success Toast Notice */}
      {toastMessage && (
        <div
          role="status"
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            padding: '12px 18px',
            borderRadius: '10px',
            background: 'var(--cmp-surface)',
            border: '1px solid var(--cmp-success)',
            color: 'var(--cmp-text)',
            fontSize: '13.5px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            boxShadow: 'var(--cmp-shadow-lg, 0 10px 25px rgba(0,0,0,0.3))',
            zIndex: 1200
          }}
        >
          <CheckCircle2 size={18} style={{ color: 'var(--cmp-success)' }} />
          <span>{toastMessage}</span>
          <button
            type="button"
            onClick={() => setToastMessage('')}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--cmp-text-muted)',
              cursor: 'pointer',
              padding: '2px',
              marginLeft: '8px'
            }}
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* Update Documents Modal */}
      <UpdateDocumentsModal
        isOpen={isUpdateModalOpen}
        onClose={() => {
          setIsUpdateModalOpen(false);
          setSelectedPropertyForModal(null);
        }}
        property={selectedPropertyForModal}
        onSave={handleSaveDocuments}
        isLiveData={isLiveData}
        authToken={authToken}
      />
    </div>
  );
}

