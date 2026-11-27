import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowDown, ArrowUp, ArrowUpDown, Gift, Loader2, RefreshCw } from 'lucide-react';
import PublicPageShell from './PublicPageShell';
import { useApp } from '../../context/AppContext';
import { cmpConnectApi } from '../../services/cmpConnectApi';
import {
  billingErrorText, compareToCurrent, fmtDate, goToCheckout, goToPortal, isManagedPlan, overdueText, periodLabel, subEndsAt
} from '../../utils/billing';

// Plans, qeemat aur terms sab GET /api/cmpConnect/public/packages se aate hain.
// Admin plan ka price likhta hai (VAT-inclusive — jo likha wahi gaahak deta hai),
// server VAT ka hissa / per-credit / yearly muqabla banata hai. Is page par koi hisaab nahi.
//
// Owner (Agency/Developer) ke button:
//   koi plan nahi → "Choose X" → POST /billing/checkout → Stripe ka hosted page
//   plan hai      → current card par "Current plan", baqi Upgrade/Downgrade → Stripe portal
//                   (checkout chalu plan par 409 deta hai; badalna portal se hota hai)

// Poore number par decimals nahi; adhoore par hamesha 2 (238.10, 238.1 nahi)
const aed = (n) => {
  const v = Number(n) || 0;
  const d = Number.isInteger(v) ? 0 : 2;
  return `AED ${v.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d })}`;
};
const num = (n) => (Number(n) || 0).toLocaleString('en-US');

const ACTION = {
  choose: { icon: null, text: (p) => `Choose ${p.name}` },
  upgrade: { icon: ArrowUp, text: (p) => `Upgrade to ${p.name}` },
  downgrade: { icon: ArrowDown, text: (p) => `Downgrade to ${p.name}` },
  period: { icon: ArrowUpDown, text: (p) => `Switch to ${p.billingPeriod === 'YEARLY' ? 'yearly' : 'monthly'}` }
};

function PlanCard({ plan, cta, relation, startsAt, busy, disabled, onAction }) {
  const p = plan.pricing || {};
  const c = p.credits || {};
  const yearly = plan.billingPeriod === 'YEARLY';
  const cmp = plan.comparison;
  const isCurrent = relation === 'current';
  const isScheduled = relation === 'scheduled';
  const action = cta === 'owner' && !isCurrent ? ACTION[relation || 'choose'] : null;
  const Icon = action?.icon;
  const badge = isCurrent ? 'Current plan' : isScheduled ? (startsAt ? `Starts ${startsAt}` : 'Next plan') : plan.badgeText;

  return (
    <article className={`pub-plan${plan.featured ? ' featured' : ''}${isCurrent ? ' current' : ''}${isScheduled ? ' scheduled' : ''}`}>
      {badge && <span className="pub-plan-badge">{badge}</span>}
      <p className="pub-plan-name">{plan.name}</p>
      {plan.audience && <p className="pub-plan-for">{plan.audience}</p>}
      <p className="pub-plan-price">
        {aed(p.price?.total)}
        <small>{yearly ? ' / year' : ' / month'}</small>
      </p>
      <p className="pub-plan-yr">
        {yearly
          ? `${aed(p.perMonth)} a month, paid yearly · incl. VAT`
          : 'Billed monthly · incl. VAT · cancel anytime'}
      </p>
      {yearly && cmp && cmp.saving > 0 && (
        <p className="pub-plan-save">
          Save {aed(cmp.saving)}{cmp.savingPct ? ` (${cmp.savingPct}%)` : ''} vs {aed(cmp.twelveMonths)} paid monthly
        </p>
      )}

      <ul className="pub-plan-rows">
        <li><span>Monthly credits</span><span>{num(c.perMonth)}</span></li>
        <li>
          <span>Bonus credits</span>
          <span>{c.bonusPerMonth && c.bonusMonths ? `${num(c.bonusPerMonth)} × ${c.bonusMonths} months` : '—'}</span>
        </li>
        <li><span>Credits in the first {p.months || 12} months</span><span>{num(c.firstYear)}</span></li>
        <li><span>Includes {p.vatPct ?? 0}% VAT</span><span>{aed(p.price?.vat)}</span></li>
        {!yearly && <li><span>12 months total</span><span>{aed(p.year?.total)}</span></li>}
      </ul>

      {plan.highlights?.length > 0 && (
        <ul className="pub-plan-highlights">
          {plan.highlights.map((h) => <li key={h}>{h}</li>)}
        </ul>
      )}

      {p.effectivePerCredit != null && (
        <div className="pub-plan-eff">
          Effective price per credit
          <b>AED {Number(p.effectivePerCredit).toFixed(2)}</b>
        </div>
      )}
      {cta === 'signup' && (
        <Link to="/signup" className={`pub-btn ${plan.featured ? 'solid' : 'outline'} block`}>Get started</Link>
      )}
      {cta === 'owner' && isCurrent && (
        <p className="pub-plan-current">You are on this plan</p>
      )}
      {cta === 'owner' && isScheduled && (
        <p className="pub-plan-current next">Your package changes to this{startsAt ? ` on ${startsAt}` : ' at the next renewal'}</p>
      )}
      {action && (
        <button
          type="button"
          className={`pub-btn ${plan.featured || relation === 'upgrade' ? 'solid' : 'outline'} block`}
          onClick={() => onAction(plan, relation)}
          disabled={disabled}
          aria-busy={busy || undefined}
        >
          {busy ? <Loader2 size={15} className="pub-spin" /> : Icon && <Icon size={15} />} {action.text(plan)}
        </button>
      )}
    </article>
  );
}

export default function PricingPage() {
  const {
    isAuthenticated, canChangePackage, isMockData,
    subscription, subscriptionLoading, isPaymentOverdue, paymentGrace, refreshSubscription
  } = useApp();
  const cta = !isAuthenticated ? 'signup' : (canChangePackage ? 'owner' : null);
  const [state, setState] = useState({ loading: true, error: '', data: null });
  const [period, setPeriod] = useState('MONTHLY');
  const [busyKey, setBusyKey] = useState('');
  const [actionError, setActionError] = useState('');
  const periodTouched = useRef(false);

  const currentSub = isAuthenticated && isManagedPlan(subscription) ? subscription : null;

  const load = useCallback(async () => {
    setState({ loading: true, error: '', data: null });
    try {
      const res = await cmpConnectApi.getPublicPackages({ _silent: true });
      const monthly = Array.isArray(res?.monthly) ? res.monthly : [];
      const yearly = Array.isArray(res?.yearly) ? res.yearly : [];
      setState({
        loading: false,
        error: '',
        data: { monthly, yearly, rates: res?.rates || {}, terms: Array.isArray(res?.terms) ? res.terms : [] }
      });
      // Sirf ek Type ho to wahi dikhao
      if (!monthly.length && yearly.length) setPeriod('YEARLY');
    } catch (err) {
      setState({ loading: false, error: err?.message || 'Could not load the packages.', data: null });
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const data = state.data;
  const hasBoth = !!(data?.monthly.length && data?.yearly.length);

  // Chalu plan yearly ho to pehle yearly tab kholo (jab tak user khud na badle)
  useEffect(() => {
    if (periodTouched.current || !hasBoth || !currentSub?.plan?.billingPeriod) return;
    setPeriod(currentSub.plan.billingPeriod === 'YEARLY' ? 'YEARLY' : 'MONTHLY');
  }, [hasBoth, currentSub?.plan?.billingPeriod]);

  const pickPeriod = (p) => { periodTouched.current = true; setPeriod(p); };

  const plans = data ? (period === 'YEARLY' ? data.yearly : data.monthly) : [];
  const bestSaving = data
    ? Math.max(0, ...data.yearly.map((p) => Number(p.comparison?.savingPct) || 0))
    : 0;
  const vatPct = data?.rates?.vatPct;

  const onAction = async (plan, relation) => {
    setActionError('');
    if (isMockData) {
      setActionError('Payments work in Live Data mode. Switch to Live Data to choose a package.');
      return;
    }
    setBusyKey(plan.key);
    try {
      // Chalu plan par checkout 409 deta hai — badalna Stripe portal se
      if (currentSub && relation) await goToPortal();
      else await goToCheckout(plan.key);
      // Browser Stripe par ja raha hai — button busy hi rehne do
    } catch (err) {
      setBusyKey('');
      if (err?.status === 409) refreshSubscription();
      setActionError(billingErrorText(err, 'Could not open the payment page.'));
    }
  };

  const openPortal = async () => {
    setActionError('');
    setBusyKey('__portal');
    try { await goToPortal(); } catch (err) {
      setBusyKey('');
      setActionError(billingErrorText(err, 'Could not open billing.'));
    }
  };

  const ownerWaiting = cta === 'owner' && subscriptionLoading;

  return (
    <PublicPageShell title="Pricing">
      <header className="pub-hero">
        <span className="pub-tag">CMP Connect</span>
        <h1>Listing credit packages</h1>
        <p className="pub-sub">
          Pick a plan for your monthly listing credits. Credits per listing depend on community, sale or rent, and price band.
          {vatPct != null && ` Prices include ${vatPct}% VAT.`}
        </p>
        {!currentSub && (
          <p className="pub-free">
            <Gift size={15} /> Your first five listings are free, so you can be live before you spend anything.
          </p>
        )}
        {cta === 'owner' && (
          <p className="pub-change-note">
            {currentSub
              ? `You are on ${currentSub.plan?.name || 'a package'} (${periodLabel(currentSub.plan?.billingPeriod)})${subEndsAt(currentSub) ? `, which ends on ${fmtDate(subEndsAt(currentSub))}` : ''}. Upgrading or downgrading opens Stripe, where you confirm the change.`
              : 'Choose a package to pay securely with Stripe. Your card details never reach CMP.'}
          </p>
        )}
        {hasBoth && (
          <div className="pub-toggle" role="tablist" aria-label="Billing">
            <button type="button" role="tab" aria-selected={period === 'MONTHLY'} className={period === 'MONTHLY' ? 'on' : ''} onClick={() => pickPeriod('MONTHLY')}>
              Monthly payment
            </button>
            <button type="button" role="tab" aria-selected={period === 'YEARLY'} className={period === 'YEARLY' ? 'on' : ''} onClick={() => pickPeriod('YEARLY')}>
              Pay yearly {bestSaving > 0 && <span className="pub-toggle-save">Save up to {bestSaving}%</span>}
            </button>
          </div>
        )}
      </header>

      {isAuthenticated && isPaymentOverdue && (
        <div className={`pub-alert ${overdueText(paymentGrace).tone}`} role="alert">
          <AlertTriangle size={18} />
          <div>
            <b>{overdueText(paymentGrace).title}</b>
            <p>{overdueText(paymentGrace, currentSub?.plan?.name).text}{!canChangePackage && ' Ask the account owner to update it.'}</p>
          </div>
          {canChangePackage && (
            <button type="button" className="pub-btn solid" onClick={openPortal} disabled={!!busyKey}>
              {busyKey === '__portal' && <Loader2 size={15} className="pub-spin" />} Update card
            </button>
          )}
        </div>
      )}

      {actionError && (
        <div className="pub-alert danger" role="alert">
          <AlertTriangle size={18} />
          <div><p>{actionError}</p></div>
          <button type="button" className="pub-alert-x" onClick={() => setActionError('')} aria-label="Dismiss">×</button>
        </div>
      )}

      {state.loading && (
        <section className="pub-plans" style={{ '--cols': 3 }} aria-busy="true" aria-label="Loading packages">
          {[0, 1, 2].map((i) => <div key={i} className="pub-plan pub-plan-skel" />)}
        </section>
      )}

      {!state.loading && state.error && (
        <div className="pub-card pub-state">
          <p>We couldn't load the packages right now.</p>
          <p className="pub-note">{state.error}</p>
          <button type="button" className="pub-btn outline" onClick={load}>
            <RefreshCw size={15} /> Try again
          </button>
        </div>
      )}

      {!state.loading && !state.error && plans.length === 0 && (
        <div className="pub-card pub-state">
          <p>No packages are available at the moment.</p>
          <p className="pub-note">
            Call <a href="tel:+971502402661">+971 50 240 2661</a> or email <a href="mailto:info@cmpdubai.com">info@cmpdubai.com</a> for pricing.
          </p>
        </div>
      )}

      {plans.length > 0 && (
        <section className="pub-plans" style={{ '--cols': Math.min(plans.length, 3) }}>
          {plans.map((p) => (
            <PlanCard
              key={p.id || p.key}
              plan={p}
              cta={cta}
              relation={currentSub ? compareToCurrent(p, currentSub) : null}
              startsAt={fmtDate(currentSub?.scheduledPlan?.startsAt)}
              busy={busyKey === p.key}
              disabled={!!busyKey || ownerWaiting}
              onAction={onAction}
            />
          ))}
        </section>
      )}

      {cta === 'owner' && currentSub && (
        <p className="pub-note pub-billing-link">
          Card, invoices and cancellation are in <Link to="/billing">Billing</Link>.
        </p>
      )}

      {data?.terms.length > 0 && (
        <section className="pub-section">
          <h2>Terms &amp; Conditions</h2>
          <p className="pub-note">
            The key terms for credit packages. Read the full <Link to="/terms">Terms &amp; Conditions</Link>.
          </p>
          <div className="pub-card">
            <ol className="pub-terms">
              {data.terms.map((t, i) => <li key={i}>{t}</li>)}
            </ol>
          </div>
        </section>
      )}
    </PublicPageShell>
  );
}
