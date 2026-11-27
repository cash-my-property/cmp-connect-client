import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AlertTriangle, ArrowUpDown, CheckCircle2, CreditCard, Loader2, XCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { cmpConnectApi } from '../../services/cmpConnectApi';
import {
  SUB_STATUS, billingErrorText, fmtAed, fmtDate, goToPortal, isManagedPlan, overdueText, periodLabel, subEndsAt
} from '../../utils/billing';
import './billing.css';

// /billing — company ka package (Stripe). Stripe yahin wapas bhejta hai:
//   ?checkout=success&session_id=cs_…  → /billing/verify (webhook ka intezar nahi)
//   ?checkout=cancelled                → kuch charge nahi hua
// Plan dekhna sab members ke liye; badalna / card sirf Owner (canChangePackage).

const VERIFY_TRIES = 6;
const VERIFY_GAP_MS = 2500;

function CheckoutResult() {
  const location = useLocation();
  const navigate = useNavigate();
  const { refreshSubscription, isLiveData } = useApp();
  const params = new URLSearchParams(location.search);
  const kind = params.get('checkout');
  const sessionId = params.get('session_id');
  // success → 'checking' | 'done' | 'pending' | 'expired' | 'error'
  const [state, setState] = useState(() => (kind === 'success' ? 'checking' : kind === 'cancelled' ? 'cancelled' : null));
  const [planName, setPlanName] = useState('');
  const [error, setError] = useState('');
  const started = useRef(false);

  useEffect(() => {
    if (kind !== 'success' || started.current) return;
    started.current = true;
    if (!sessionId || !isLiveData) {
      setState('error');
      setError(!sessionId ? 'The payment reference is missing.' : 'Switch to Live Data to confirm the payment.');
      return;
    }
    let cancelled = false;
    (async () => {
      for (let i = 0; i < VERIFY_TRIES && !cancelled; i += 1) {
        try {
          const res = await cmpConnectApi.verifyCheckout(sessionId, { _silent: true });
          const d = res?.data || {};
          const sub = d.subscription;
          if (d.checkout === 'expired') { setState('expired'); break; }
          if (d.checkout === 'complete' && sub && ['ACTIVE', 'TRIALING'].includes(sub.status)) {
            setPlanName(sub.plan?.name ? `${sub.plan.name} (${periodLabel(sub.plan.billingPeriod)})` : '');
            setState('done');
            break;
          }
          // Pay ho gaya par Stripe ne abhi confirm nahi kiya — thora ruk kar dobara
          setState('pending');
        } catch (err) {
          setState('error');
          setError(billingErrorText(err, 'We could not confirm the payment.'));
          break;
        }
        await new Promise((r) => setTimeout(r, VERIFY_GAP_MS));
      }
      if (!cancelled) await refreshSubscription();
    })();
    return () => { cancelled = true; };
  }, [kind, sessionId, isLiveData, refreshSubscription]);

  if (!state) return null;
  const clear = () => navigate('/billing', { replace: true });

  if (state === 'checking') {
    return (
      <div className="bill-banner info" role="status">
        <Loader2 size={18} className="bill-spin" />
        <div><b>Confirming your payment…</b><p>This takes a few seconds.</p></div>
      </div>
    );
  }
  if (state === 'done') {
    return (
      <div className="bill-banner success" role="status">
        <CheckCircle2 size={18} />
        <div>
          <b>Payment received.</b>
          <p>{planName ? `Your company is now on ${planName}.` : 'Your package is now active.'}</p>
        </div>
        <button type="button" className="bill-x" onClick={clear} aria-label="Dismiss">×</button>
      </div>
    );
  }
  if (state === 'pending') {
    return (
      <div className="bill-banner warning" role="status">
        <Loader2 size={18} className="bill-spin" />
        <div>
          <b>Waiting for Stripe to confirm the payment.</b>
          <p>If you have paid, your package will show here shortly. You can refresh this page in a minute.</p>
        </div>
      </div>
    );
  }
  if (state === 'expired') {
    return (
      <div className="bill-banner warning" role="status">
        <AlertTriangle size={18} />
        <div><b>That payment session expired.</b><p>Nothing was charged. You can choose a package again.</p></div>
        <Link to="/pricing" className="btn btn-outline btn-sm">See packages</Link>
      </div>
    );
  }
  if (state === 'cancelled') {
    return (
      <div className="bill-banner neutral" role="status">
        <XCircle size={18} />
        <div><b>Payment cancelled.</b><p>You have not been charged.</p></div>
        <Link to="/pricing" className="btn btn-outline btn-sm">See packages</Link>
        <button type="button" className="bill-x" onClick={clear} aria-label="Dismiss">×</button>
      </div>
    );
  }
  return (
    <div className="bill-banner danger" role="alert">
      <AlertTriangle size={18} />
      <div><b>We could not confirm the payment.</b><p>{error} If you were charged, the package will appear here once Stripe confirms it.</p></div>
    </div>
  );
}

function Row({ label, children }) {
  if (children == null || children === '') return null;
  return (<div className="bill-row"><dt>{label}</dt><dd>{children}</dd></div>);
}

export default function BillingPage() {
  const { subscription, subscriptionLoading, isPaymentOverdue, paymentGrace, canChangePackage, isMockData, allowancePlan } = useApp();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const openPortal = async () => {
    setError('');
    setBusy(true);
    try {
      await goToPortal();
    } catch (err) {
      setError(billingErrorText(err, 'Could not open billing.'));
      setBusy(false);
    }
  };

  const sub = isManagedPlan(subscription) ? subscription : null;
  const plan = sub?.plan || {};
  const st = SUB_STATUS[sub?.status] || SUB_STATUS.ACTIVE;
  const yearly = plan.billingPeriod === 'YEARLY';
  const endsOn = fmtDate(sub?.currentPeriodEnd);
  // Cancel ho chuka (portal) — is date ko khatam
  const cancelsOn = fmtDate(subEndsAt(sub));
  const next = sub?.scheduledPlan;
  const failedAfterPaid = sub?.lastPaymentFailedAt && (!sub.lastPaidAt || new Date(sub.lastPaymentFailedAt) > new Date(sub.lastPaidAt));

  return (
    <div className="bill">
      <h1 style={{ fontSize: '26px' }}>Billing</h1>
      <p className="muted" style={{ marginTop: 4 }}>
        Your CMP Connect package and payments. Card payments are handled securely by Stripe.
      </p>

      <CheckoutResult />

      {isMockData && (
        <div className="bill-banner info"><CreditCard size={18} /><div><b>Mock Data</b><p>Switch to Live Data to see your real package and payments.</p></div></div>
      )}

      {isPaymentOverdue && (() => {
        const m = overdueText(paymentGrace, plan.name || allowancePlan?.name);
        return (
        <div className={`bill-banner ${m.tone}`} role="alert">
          <AlertTriangle size={18} />
          <div>
            <b>{m.title}</b>
            <p>{m.text}{!canChangePackage && ' Ask the account owner to update it.'}</p>
          </div>
          {canChangePackage && (
            <button type="button" className="btn btn-primary btn-sm" onClick={openPortal} disabled={busy}>Update card</button>
          )}
        </div>
        );
      })()}

      {error && <div className="bill-banner danger" role="alert"><AlertTriangle size={18} /><div><p>{error}</p></div></div>}

      {subscriptionLoading ? (
        <section className="card bill-card bill-skel" aria-busy="true" />
      ) : sub ? (
        <section className="card bill-card">
          <div className="bill-head">
            <div>
              <p className="bill-eyebrow">Current package</p>
              <h2 className="bill-plan">
                {plan.name || 'Package'} <span className="badge badge-neutral">{periodLabel(plan.billingPeriod)}</span>
                <span className={`badge badge-${st.tone}`}>{st.label}</span>
              </h2>
              {plan.priceAed != null && (
                <p className="bill-price">{fmtAed(plan.priceAed)}<small>{yearly ? ' / year' : ' / month'} · incl. VAT</small></p>
              )}
            </div>
            {canChangePackage && (
              <div className="bill-actions">
                <button type="button" className="btn btn-primary" onClick={openPortal} disabled={busy}>
                  {busy ? <Loader2 size={16} className="bill-spin" /> : <CreditCard size={16} />} Manage billing
                </button>
                <Link to="/pricing" className="btn btn-outline"><ArrowUpDown size={16} /> Change package</Link>
              </div>
            )}
          </div>

          <dl className="bill-rows">
            {cancelsOn ? <Row label="Ends on">{cancelsOn}</Row> : <Row label="Renews on">{endsOn}</Row>}
            <Row label="Current period">
              {fmtDate(sub.currentPeriodStart) && endsOn ? `${fmtDate(sub.currentPeriodStart)} – ${endsOn}` : null}
            </Row>
            <Row label="Last payment">{fmtDate(sub.lastPaidAt)}</Row>
            {failedAfterPaid && <Row label="Last failed payment"><span className="bill-bad">{fmtDate(sub.lastPaymentFailedAt)}</span></Row>}
            <Row label="Monthly credits">{plan.monthlyCredits ? Number(plan.monthlyCredits).toLocaleString('en-US') : null}</Row>
            <Row label="Bonus credits">
              {plan.bonusCredits && plan.bonusMonths ? `${Number(plan.bonusCredits).toLocaleString('en-US')} a month for the first ${plan.bonusMonths} months` : null}
            </Row>
          </dl>

          {next && !cancelsOn && (
            <div className="bill-banner info">
              <ArrowUpDown size={18} />
              <div>
                <b>Changes to {next.name} ({periodLabel(next.billingPeriod)}){fmtDate(next.startsAt) ? ` on ${fmtDate(next.startsAt)}` : ' at the next renewal'}.</b>
                <p>{next.priceAed != null ? `${fmtAed(next.priceAed)} ${next.billingPeriod === 'YEARLY' ? 'a year' : 'a month'}, incl. VAT. ` : ''}Your current package stays active until then.</p>
              </div>
            </div>
          )}
          {cancelsOn && (
            <div className="bill-banner warning">
              <AlertTriangle size={18} />
              <div>
                <b>This package is cancelled.</b>
                <p>It stays active until {cancelsOn}. {canChangePackage ? 'You can undo this from Manage billing.' : ''}</p>
              </div>
            </div>
          )}
          <p className="bill-foot">
            {canChangePackage
              ? 'Use Manage billing to update your card, download invoices or cancel. Changing to another package also happens there.'
              : 'Only the account owner can change the package or the payment details.'}
          </p>
        </section>
      ) : (
        <section className="card bill-card bill-empty">
          <p className="bill-eyebrow">Current package</p>
          <h2 className="bill-plan">No package yet</h2>
          <p className="muted">
            Your account is using its free listings. Choose a package to keep publishing beyond the free limit.
          </p>
          {subscription?.status === 'INCOMPLETE' && (
            <p className="bill-foot">A payment was started but not finished. Nothing was charged.</p>
          )}
          <div className="bill-actions">
            <Link to="/pricing" className="btn btn-primary">See packages</Link>
          </div>
          {!canChangePackage && <p className="bill-foot">Only the account owner can choose a package.</p>}
        </section>
      )}
    </div>
  );
}
