import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { AlertTriangle, AlertCircle, ShieldAlert, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function BrnComplianceBanner() {
  const { account, isLiveData } = useApp();
  const [isDismissed, setIsDismissed] = useState(false);

  // Only relevant for live data and AGENCY accounts
  if (!isLiveData || isDismissed || !account || account.accountType !== 'AGENCY') {
    return null;
  }

  const vStatus = account.verificationStatus || 'UNVERIFIED';
  const brnExpiry = account.compliance?.brnExpiry;
  const isExpired = brnExpiry ? new Date(brnExpiry).getTime() < Date.now() : false;

  // If verified and not expired, everything is good!
  if (vStatus === 'VERIFIED' && !isExpired) {
    return null;
  }

  let config = null;

  if (isExpired) {
    config = {
      icon: <AlertTriangle size={15} style={{ color: '#b45309', flexShrink: 0 }} />,
      bg: 'rgba(245, 158, 11, 0.1)',
      border: 'rgba(245, 158, 11, 0.3)',
      color: '#92400e',
      title: 'BRN Licence Expired',
      message: 'Your broker licence (BRN) has expired. Publishing listings is restricted until renewed.',
      linkText: 'Update Licence',
      linkTo: '/account'
    };
  } else if (vStatus === 'REJECTED') {
    config = {
      icon: <AlertCircle size={15} style={{ color: 'var(--cmp-danger)', flexShrink: 0 }} />,
      bg: 'var(--cmp-danger-subtle, rgba(220, 38, 38, 0.1))',
      border: 'var(--cmp-danger)',
      color: 'var(--cmp-danger)',
      title: 'BRN Verification Rejected',
      message: 'Your broker licence verification was rejected by CMP. Please review your compliance details.',
      linkText: 'Check Compliance',
      linkTo: '/properties/compliance'
    };
  } else if (vStatus === 'PENDING') {
    config = {
      icon: <AlertTriangle size={15} style={{ color: 'var(--cmp-brand)', flexShrink: 0 }} />,
      bg: 'var(--cmp-brand-subtle)',
      border: 'var(--cmp-brand)',
      color: 'var(--cmp-brand)',
      title: 'Verification In Review',
      message: 'Your broker licence (BRN) verification is currently being reviewed by CMP.',
      linkText: 'View Status',
      linkTo: '/properties/compliance'
    };
  } else if (vStatus === 'UNVERIFIED') {
    config = {
      icon: <ShieldAlert size={15} style={{ color: '#b45309', flexShrink: 0 }} />,
      bg: 'rgba(245, 158, 11, 0.1)',
      border: 'rgba(245, 158, 11, 0.3)',
      color: '#92400e',
      title: 'BRN Verification Required',
      message: 'Your broker licence (BRN) is not yet verified. Request verification to unlock live publishing.',
      linkText: 'Request Verification',
      linkTo: '/team/members'
    };
  }

  if (!config) return null;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        padding: '8px 16px',
        background: config.bg,
        borderBottom: `1px solid ${config.border}`,
        fontSize: '12.5px',
        color: config.color,
        fontWeight: 500,
        zIndex: 30,
        position: 'relative'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
        {config.icon}
        <span style={{ fontWeight: 700 }}>{config.title}:</span>
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {config.message}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
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
            padding: 0,
            cursor: 'pointer',
            color: 'inherit',
            opacity: 0.7,
            display: 'inline-flex'
          }}
          title="Dismiss banner"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
