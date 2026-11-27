import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AlertTriangle, ArrowRight, CalendarX2, Check, Clock, CreditCard, Loader2, RefreshCw } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { cmpConnectApi } from '../../services/cmpConnectApi';
import { billingErrorText, fmtAed, fmtDate, periodLabel, subEndsAt } from '../../utils/billing';
import './paymentSuccess.css';

// /billing/success — Stripe pay ke baad yahan aata hai.
//   ?session_id=cs_…            nayi plan (Checkout) → POST /billing/verify, ACTIVE hone tak dobara
//   ?change=success[&key=…]     portal se plan badla → subscription dobara parho (key milne tak)
//   ?change=cancelled           portal se cancel → subscription par cancelAt / khatam hone tak parho
// Purana success_url (/billing?checkout=success&session_id=…) BillingPage yahin bhej deta hai.

const TRIES = 6;
const GAP_MS = 2500;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Mock Data mein design dekhne ke liye
const SAMPLE = {
  status: 'ACTIVE',
  packageKey: 'pro-monthly',
  plan: { name: 'Pro', billingPeriod: 'MONTHLY', priceAed: 7500, monthlyCredits: 7500, bonusCredits: 900, bonusMonths: 3 },
  currentPeriodEnd: new Date(Date.now() + 30 * 86400e3).toISOString()
};

export default function PaymentSuccessPage() {
  const { isLiveData, isDeveloper, refreshSubscription } = useApp();
  const { search } = useLocation();
  const params = new URLSearchParams(search);
  const sessionId = params.get('session_id');
  const isChange = params.get('change') === 'success';
  const isCancel = params.get('change') === 'cancelled';
  const wantKey = params.get('key');

  // 'checking' | 'done' | 'pending' | 'error'
  const [state, setState] = useState(isLiveData ? 'checking' : 'done');
  const [sub, setSub] = useState(isLiveData ? null : SAMPLE);
  const [error, setError] = useState('');
  const [expired, setExpired] = useState(false);
  const [round, setRound] = useState(0);
  const started = useRef(-1);

  useEffect(() => {
    if (!isLiveData || started.current === round) return undefined;
    started.current = round;
    let stop = false;

    (async () => {
      setState('checking');
      setError('');

      // Portal se cancel — period ke aakhir tak chalu (cancelAt) ya foran khatam (null / CANCELED)
      if (isCancel) {
        for (let i = 0; i < TRIES && !stop; i += 1) {
          const s = await refreshSubscription();
          if (!s || s.status === 'CANCELED' || subEndsAt(s)) {
            setSub(s); setState('cancelled'); return;
          }
          setSub(s);
          setState('pending');
          await sleep(GAP_MS);
        }
        return;
      }

      // Portal se plan badla — webhook ke baad subscription par naya package aata hai
      if (isChange || !sessionId) {
        for (let i = 0; i < TRIES && !stop; i += 1) {
          const s = await refreshSubscription();
          if (s && ['ACTIVE', 'TRIALING'].includes(s.status) && (!wantKey || s.packageKey === wantKey)) {
            setSub(s); setState('done'); return;
          }
          if (s) setSub(s);
          setState('pending');
          await sleep(GAP_MS);
        }
        return;
      }

      // Nayi plan — Stripe se seedha (webhook ka intezar nahi)
      for (let i = 0; i < TRIES && !stop; i += 1) {
        try {
          const res = await cmpConnectApi.verifyCheckout(sessionId, { _silent: true });
          const d = res?.data || {};
          if (d.checkout === 'expired') {
            setState('error');
            setExpired(true);
            setError('This payment session expired before it was completed. Nothing was charged.');
            return;
          }
          if (d.checkout === 'complete' && ['ACTIVE', 'TRIALING'].includes(d.subscription?.status)) {
            setSub(d.subscription); setState('done');
            refreshSubscription();
            return;
          }
          setState('pending');
        } catch (err) {
          setState('error');
          setError(billingErrorText(err, 'We could not confirm the payment.'));
          return;
        }
        await sleep(GAP_MS);
      }
      refreshSubscription();
    })();

    return () => { stop = true; };
  }, [isLiveData, isChange, isCancel, sessionId, wantKey, round, refreshSubscription]);

  useEffect(() => {
    const prev = document.title;
    document.title = `${state === 'done' ? 'Payment successful' : 'Payment'} · Cash My Property`;
    return () => { document.title = prev; };
  }, [state]);

  const home = isDeveloper ? '/developer' : '/';
  const plan = sub?.plan || {};
  const yearly = plan.billingPeriod === 'YEARLY';
  const renews = fmtDate(sub?.currentPeriodEnd);
  const ref = sessionId ? sessionId.slice(-10).toUpperCase() : null;

  return (
    <div className="pay-ok">
      <header className="pay-ok-band">
        <Link className="reg-logo" to={home}>Cash My <span>Property</span></Link>
      </header>

      <main className="pay-ok-main">
        <section className={`pay-ok-card ${state}`} aria-live="polite">
          {state === 'checking' && (
            <>
              <div className="pay-ok-icon wait"><Loader2 size={34} className="pay-ok-spin" /></div>
              <h1>Confirming your payment…</h1>
              <p className="pay-ok-sub">This takes a few seconds. Please keep this page open.</p>
            </>
          )}

          {state === 'pending' && (
            <>
              <div className="pay-ok-icon wait"><Clock size={34} /></div>
              <h1>Payment is being confirmed</h1>
              <p className="pay-ok-sub">
                {isChange || isCancel
                  ? 'Stripe is still applying your change. It usually shows within a minute.'
                  : 'If you have paid, your package will be active within a minute.'}
              </p>
              <div className="pay-ok-actions">
                <button type="button" className="btn btn-primary btn-lg" onClick={() => setRound((n) => n + 1)}>
                  <RefreshCw size={17} /> Check again
                </button>
                <Link to="/billing" className="btn btn-outline btn-lg">View billing</Link>
              </div>
            </>
          )}

          {state === 'error' && (
            <>
              <div className="pay-ok-icon bad"><AlertTriangle size={34} /></div>
              <h1>{expired ? 'Payment session expired' : "We couldn't confirm the payment"}</h1>
              <p className="pay-ok-sub">
                {error}{!expired && ' If you were charged, your package will appear in Billing once Stripe confirms it.'}
              </p>
              <div className="pay-ok-actions">
                <Link to="/pricing" className="btn btn-primary btn-lg">See packages</Link>
                <Link to="/billing" className="btn btn-outline btn-lg">View billing</Link>
              </div>
            </>
          )}

          {state === 'cancelled' && (
            <>
              <div className="pay-ok-icon wait"><CalendarX2 size={34} /></div>
              <p className="pay-ok-eyebrow muted">Package cancelled</p>
              <h1>{fmtDate(subEndsAt(sub)) ? 'Your package will not renew' : 'Your package has ended'}</h1>
              <p className="pay-ok-sub">
                {fmtDate(subEndsAt(sub))
                  ? `${sub?.plan?.name || 'Your package'} stays active until ${fmtDate(subEndsAt(sub))}. You will not be charged again.`
                  : 'Your account is back on its free listings. You can choose a package again at any time.'}
              </p>
              <div className="pay-ok-actions">
                <Link to="/billing" className="btn btn-primary btn-lg"><CreditCard size={17} /> View billing</Link>
                <Link to={home} className="btn btn-outline btn-lg">Go to dashboard</Link>
              </div>
              <p className="pay-ok-note">Changed your mind? You can keep the package from Billing → Manage billing.</p>
            </>
          )}

          {state === 'done' && (
            <>
              <div className="pay-ok-icon ok"><Check size={38} strokeWidth={3} /></div>
              <p className="pay-ok-eyebrow">{isChange ? 'Package updated' : 'Payment successful'}</p>
              <h1>{plan.name ? `You're on ${plan.name}` : 'Your package is active'}</h1>
              <p className="pay-ok-sub">
                {isChange
                  ? 'Your new package is active now. Any difference has been charged or credited by Stripe.'
                  : 'Thank you. Your CMP Connect package is active and ready to use.'}
              </p>

              <dl className="pay-ok-summary">
                {plan.name && (
                  <div><dt>Package</dt><dd>{plan.name} · {periodLabel(plan.billingPeriod)}</dd></div>
                )}
                {plan.priceAed != null && (
                  <div><dt>{yearly ? 'Price per year' : 'Price per month'}</dt><dd>{fmtAed(plan.priceAed)} <small>incl. VAT</small></dd></div>
                )}
                {Number(plan.monthlyCredits) > 0 && (
                  <div>
                    <dt>Monthly credits</dt>
                    <dd>
                      {Number(plan.monthlyCredits).toLocaleString('en-US')}
                      {Number(plan.bonusCredits) > 0 && Number(plan.bonusMonths) > 0 && (
                        <small> +{Number(plan.bonusCredits).toLocaleString('en-US')} bonus for {plan.bonusMonths} months</small>
                      )}
                    </dd>
                  </div>
                )}
                {renews && <div><dt>Next renewal</dt><dd>{renews}</dd></div>}
                {ref && <div><dt>Payment reference</dt><dd className="pay-ok-ref">…{ref}</dd></div>}
              </dl>

              <div className="pay-ok-actions">
                <Link to={home} className="btn btn-primary btn-lg">Go to dashboard <ArrowRight size={17} /></Link>
                <Link to="/billing" className="btn btn-outline btn-lg"><CreditCard size={17} /> View billing</Link>
              </div>
              <p className="pay-ok-note">Invoices and card details are in Billing → Manage billing.</p>
            </>
          )}
        </section>

        <p className="pay-ok-help">
          Need help? Call <a href="tel:+971502402661">+971 50 240 2661</a> or email <a href="mailto:info@cmpdubai.com">info@cmpdubai.com</a>
        </p>
      </main>
    </div>
  );
}
