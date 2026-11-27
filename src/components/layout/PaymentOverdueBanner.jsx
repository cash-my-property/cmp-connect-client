import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { AlertTriangle, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { overdueText } from '../../utils/billing';

// Package ki payment fail (PAST_DUE / UNPAID). Backend pehle graceDays (default 3) tak
// publish chalne deta hai — tab amber "X din baqi"; grace khatam → 402 PAYMENT_OVERDUE,
// tab laal "publishing paused". Har page ke upar, Billing ka rasta.
// /billing par nahi — wahan apna banner + "Update card" hai.
export default function PaymentOverdueBanner() {
  const { isLiveData, isPaymentOverdue, paymentGrace, canChangePackage, subscription, allowancePlan } = useApp();
  const { pathname } = useLocation();
  const [dismissed, setDismissed] = useState(false);

  if (!isLiveData || !isPaymentOverdue || dismissed || pathname === '/billing') return null;

  const msg = overdueText(paymentGrace, subscription?.plan?.name || allowancePlan?.name);

  return (
    <div className={`brn-compliance-banner pay-overdue-banner ${msg.tone}`} role="alert">
      <div className="pay-overdue-text">
        <AlertTriangle size={15} aria-hidden="true" />
        <span className="pay-overdue-title">{msg.title}:</span>
        <span className="pay-overdue-msg">
          {msg.text}
          {!canChangePackage && ' Ask the account owner to update it.'}
        </span>
      </div>
      <div className="pay-overdue-actions">
        <NavLink to="/billing">{canChangePackage ? 'Update card' : 'View billing'}</NavLink>
        <button type="button" onClick={() => setDismissed(true)} aria-label="Dismiss">
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
