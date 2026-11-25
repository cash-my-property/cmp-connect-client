import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpDown, Gift, RefreshCw } from 'lucide-react';
import PublicPageShell from './PublicPageShell';
import { useApp } from '../../context/AppContext';
import { cmpConnectApi } from '../../services/cmpConnectApi';

// Plans, qeemat aur terms sab GET /api/cmpConnect/public/packages se aate hain.
// Admin plan ka price likhta hai, server VAT / per-credit / yearly muqabla banata hai —
// is page par koi hisaab ya static plan nahi.

const aed = (n) =>
  `AED ${(Number(n) || 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
const num = (n) => (Number(n) || 0).toLocaleString('en-US');

// Online payment abhi nahi — tab tak package badalne ki darkhwast CMP ko email se
const CMP_EMAIL = 'info@cmpdubai.com';
const switchMailto = (plan, company) => {
  const type = plan.billingPeriod === 'YEARLY' ? 'Yearly' : 'Monthly';
  const subject = `Package change: ${plan.name} (${type})${company ? ` for ${company}` : ''}`;
  const body = [
    'Hello CMP team,',
    '',
    `Please switch our CMP Connect package to ${plan.name} (${type}).`,
    '',
    `Company: ${company || ''}`
  ].join('\r\n');
  return `mailto:${CMP_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
};

function PlanCard({ plan, cta, company }) {
  const p = plan.pricing || {};
  const c = p.credits || {};
  const yearly = plan.billingPeriod === 'YEARLY';
  const cmp = plan.comparison;

  return (
    <article className={`pub-plan${plan.featured ? ' featured' : ''}`}>
      {plan.badgeText && <span className="pub-plan-badge">{plan.badgeText}</span>}
      <p className="pub-plan-name">{plan.name}</p>
      {plan.audience && <p className="pub-plan-for">{plan.audience}</p>}
      <p className="pub-plan-price">
        {aed(p.price?.net)}
        <small>{yearly ? ' / year' : ' / month'}</small>
      </p>
      <p className="pub-plan-yr">
        {yearly
          ? `${aed(p.perMonth)} a month, paid yearly · excl. VAT`
          : 'Billed monthly · excl. VAT'}
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
        <li>
          <span>{yearly ? 'Price' : '12 months'} incl. {p.vatPct ?? 0}% VAT</span>
          <span>{aed(yearly ? p.price?.total : p.year?.total)}</span>
        </li>
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
      {cta === 'switch' && (
        <a href={switchMailto(plan, company)} className={`pub-btn ${plan.featured ? 'solid' : 'outline'} block`}>
          <ArrowUpDown size={15} /> Switch to {plan.name}
        </a>
      )}
    </article>
  );
}

export default function PricingPage() {
  const { isAuthenticated, canChangePackage, agency } = useApp();
  const cta = !isAuthenticated ? 'signup' : (canChangePackage ? 'switch' : null);
  const [state, setState] = useState({ loading: true, error: '', data: null });
  const [period, setPeriod] = useState('MONTHLY');

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
  const plans = data ? (period === 'YEARLY' ? data.yearly : data.monthly) : [];
  const bestSaving = data
    ? Math.max(0, ...data.yearly.map((p) => Number(p.comparison?.savingPct) || 0))
    : 0;
  const vatPct = data?.rates?.vatPct;

  return (
    <PublicPageShell title="Pricing">
      <header className="pub-hero">
        <span className="pub-tag">CMP Connect</span>
        <h1>Listing credit packages</h1>
        <p className="pub-sub">
          Pick a plan for your monthly listing credits. Credits per listing depend on community, sale or rent, and price band.
          {vatPct != null && ` Prices exclude ${vatPct}% VAT.`}
        </p>
        <p className="pub-free">
          <Gift size={15} /> Your first five listings are free, so you can be live before you spend anything.
        </p>
        {cta === 'switch' && (
          <p className="pub-change-note">
            Upgrading or downgrading? Pick a package below. Until online payment is available, the request goes to the CMP team by email.
          </p>
        )}
        {hasBoth && (
          <div className="pub-toggle" role="tablist" aria-label="Billing">
            <button type="button" role="tab" aria-selected={period === 'MONTHLY'} className={period === 'MONTHLY' ? 'on' : ''} onClick={() => setPeriod('MONTHLY')}>
              Monthly payment
            </button>
            <button type="button" role="tab" aria-selected={period === 'YEARLY'} className={period === 'YEARLY' ? 'on' : ''} onClick={() => setPeriod('YEARLY')}>
              Pay yearly {bestSaving > 0 && <span className="pub-toggle-save">Save up to {bestSaving}%</span>}
            </button>
          </div>
        )}
      </header>

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
          {plans.map((p) => <PlanCard key={p.id || p.key} plan={p} cta={cta} company={agency?.name} />)}
        </section>
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
