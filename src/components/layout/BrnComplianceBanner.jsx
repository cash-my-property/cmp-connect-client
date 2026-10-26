import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { AlertTriangle, AlertCircle, ShieldAlert, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function BrnComplianceBanner() {
  const { account, isLiveData, theme } = useApp();
  const [isDismissed, setIsDismissed] = useState(false);

  // Only relevant for live data
  if (!isLiveData || isDismissed || !account) {
    return null;
  }

  // Agency accounts have an ORN, not a BRN.
  // BRN licence warning only applies to individual agents/brokers who hold a BRN.
  const roleKey = (typeof account?.role === 'string' ? account.role : account?.role?.key || account?.role?.name || '').toUpperCase();
  const isAgent = roleKey === 'AGENT';
  const hasBrn = Boolean(account?.compliance?.brn);

  // If not an individual agent or account does not hold a BRN, do NOT show BRN warning
  if (!isAgent || !hasBrn) {
    return null;
  }

  const vStatus = account.verificationStatus || 'UNVERIFIED';
  const brnExpiry = account.compliance?.brnExpiry;
  const isExpired = brnExpiry ? new Date(brnExpiry).getTime() < Date.now() : false;

  // If verified and not expired, everything is good!
  if (vStatus === 'VERIFIED' && !isExpired) {
    return null;
  }

  const isDark = theme === 'dark';
  let config = null;

  if (isExpired) {
    config = {
      icon: <AlertTriangle size={15} style={{ color: isDark ? '#FBBF24' : '#b45309', flexShrink: 0 }} />,
      bg: isDark ? '#271704' : '#FEF3C7',
      border: isDark ? '#4A2A08' : '#FDE68A',
      color: isDark ? '#FDE68A' : '#92400e',
      title: 'BRN Licence Expired',
      message: 'Your broker licence (BRN) has expired. Publishing listings is restricted until renewed.',
      linkText: 'Update Licence',
      linkTo: '/account'
    };
  } else if (vStatus === 'REJECTED') {
    config = {
      icon: <AlertCircle size={15} style={{ color: isDark ? '#F87171' : '#dc2626', flexShrink: 0 }} />,
      bg: isDark ? '#2D0F0F' : '#FEE2E2',
      border: isDark ? '#531919' : '#FECACA',
      color: isDark ? '#FCA5A5' : '#991B1B',
      title: 'BRN Verification Rejected',
      message: 'Your broker licence verification was rejected by CMP. Please review your compliance details.',
      linkText: 'Check Compliance',
      linkTo: '/properties/compliance'
    };
  } else if (vStatus === 'PENDING') {
    config = {
      icon: <AlertTriangle size={15} style={{ color: isDark ? '#34D399' : '#059669', flexShrink: 0 }} />,
      bg: isDark ? '#06261D' : '#D1FAE5',
      border: isDark ? '#0D4736' : '#A7F3D0',
      color: isDark ? '#6EE7B7' : '#065F46',
      title: 'Verification In Review',
      message: 'Your broker licence (BRN) verification is currently being reviewed by CMP.',
      linkText: 'View Status',
      linkTo: '/properties/compliance'
    };
  } else if (vStatus === 'UNVERIFIED') {
    config = {
      icon: <ShieldAlert size={15} style={{ color: isDark ? '#FBBF24' : '#b45309', flexShrink: 0 }} />,
      bg: isDark ? '#271704' : '#FEF3C7',
      border: isDark ? '#4A2A08' : '#FDE68A',
      color: isDark ? '#FDE68A' : '#92400e',
      title: 'BRN Verification Required',
      message: 'Your broker licence (BRN) is not yet verified. Request verification to unlock live publishing.',
      linkText: 'Request Verification',
      linkTo: '/team/members'
    };
  }

  if (!config) return null;

  return (
    <div
      className="brn-compliance-banner"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        padding: '9px 28px',
        background: config.bg,
        borderBottom: `1px solid ${config.border}`,
        fontSize: '12.5px',
        color: config.color,
        fontWeight: 500,
        zIndex: 20,
        position: 'relative',
        width: '100%',
        boxSizing: 'border-box'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
        {config.icon}
        <span style={{ fontWeight: 700, flexShrink: 0 }}>{config.title}:</span>
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {config.message}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
        <NavLink
          to={config.linkTo}
          style={{
            color: 'inherit',
            fontWeight: 700,
            textDecoration: 'underline',
            fontSize: '12px'
          }}
        >
          {config.linkText}
        </NavLink>
        <button
          type="button"
          onClick={() => setIsDismissed(true)}
          style={{
            border: 'none',
            background: 'transparent',
            padding: '2px',
            cursor: 'pointer',
            color: 'inherit',
            opacity: 0.75,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '4px'
          }}
          title="Dismiss banner"
          aria-label="Dismiss banner"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
