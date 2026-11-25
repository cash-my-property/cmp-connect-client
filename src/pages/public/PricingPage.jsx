import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Gift } from 'lucide-react';
import PublicPageShell from './PublicPageShell';

// AED 1 per credit, billed monthly. Optional yearly prepay 5% off. Prices excl. 5% VAT.
const PRICE_PER_CREDIT = 1;
const MONTHS = 12;
const YEARLY_DISCOUNT = 0.05;
const VAT = 0.05;

const PACKAGES = [
  { key: 'starter', name: 'Starter', for: 'Small brokerages & individual agents', credits: 5000, bonus: 0, bonusMonths: 0 },
  { key: 'pro', name: 'Pro', for: 'Growing agencies', credits: 7500, bonus: 900, bonusMonths: 3, featured: true },
  { key: 'premium', name: 'Premium', for: 'Large agencies & developers', credits: 10000, bonus: 2000, bonusMonths: 6 }
].map((p) => {
  const monthly = p.credits * PRICE_PER_CREDIT;
  const total = monthly * MONTHS;
  const totalCredits = p.credits * MONTHS + p.bonus * p.bonusMonths;
  return { ...p, monthly, total, totalCredits, effective: total / totalCredits };
});

export const PRICING_TERMS = [
  'No minimum contract. Plans are billed monthly and you can cancel anytime; cancellation takes effect at the end of the current billing month.',
  'No undated cheque or security cheque required.',
  'Optional: pay 12 months in advance and get 5% off.',
  'Bonus credits (Pro: 900/month for the first 3 months, Premium: 2,000/month for the first 6 months) are added only while the plan is active.',
  'The client must hold a valid Real Estate Brokerage Trade License, ORN, BRN and Trakheesi permit (DLD) throughout the term.',
  'Credits are deducted per listing based on community, sale/rent and price band. Unused monthly credits expire at the end of each cycle.',
  'All prices exclude 5% VAT.'
];

const aed = (n) => `AED ${Math.round(n).toLocaleString('en-US')}`;
const num = (n) => Math.round(n).toLocaleString('en-US');

export default function PricingPage() {
  const [yearly, setYearly] = useState(false);
  const k = yearly ? 1 - YEARLY_DISCOUNT : 1;

  return (
    <PublicPageShell title="Pricing">
      <header className="pub-hero">
        <span className="pub-tag">CMP Connect · No contract · Cancel anytime</span>
        <h1>Listing credit packages</h1>
        <p className="pub-sub">
          AED 1 per credit, billed monthly. No lock-in, cancel anytime. Credits per listing depend on community, sale or rent, and price band.
        </p>
        <p className="pub-free">
          <Gift size={15} /> Your first five listings are free, so you can be live before you spend anything.
        </p>
        <div className="pub-toggle" role="tablist" aria-label="Billing">
          <button type="button" role="tab" aria-selected={!yearly} className={!yearly ? 'on' : ''} onClick={() => setYearly(false)}>
            Monthly payment
          </button>
          <button type="button" role="tab" aria-selected={yearly} className={yearly ? 'on' : ''} onClick={() => setYearly(true)}>
            Pay yearly <span className="pub-toggle-save">−5%</span>
          </button>
        </div>
      </header>

      <section className="pub-plans">
        {PACKAGES.map((p) => (
          <article key={p.key} className={`pub-plan ${p.key}${p.featured ? ' featured' : ''}`}>
            {p.featured && <span className="pub-plan-badge">Most popular</span>}
            <p className="pub-plan-name">{p.name}</p>
            <p className="pub-plan-for">{p.for}</p>
            <p className="pub-plan-price">
              {yearly ? aed(p.total * k) : aed(p.monthly)}
              <small>{yearly ? ' / year' : ' / month'}</small>
            </p>
            <p className="pub-plan-yr">
              {yearly
                ? `Optional yearly prepay, 5% off · ${aed(p.total)} before discount`
                : 'Billed monthly · cancel anytime · excl. VAT'}
            </p>
            <ul className="pub-plan-rows">
              <li><span>Monthly credits</span><span>{num(p.credits)}</span></li>
              <li><span>Bonus credits</span><span>{p.bonus ? `${num(p.bonus)} × ${p.bonusMonths} months` : '—'}</span></li>
              <li><span>Contract</span><span>None · cancel anytime</span></li>
              <li><span>Total credits (12 months)</span><span>{num(p.totalCredits)}</span></li>
              <li><span>Price per credit</span><span>AED {PRICE_PER_CREDIT.toFixed(2)}</span></li>
              <li><span>12 months incl. VAT</span><span>{aed(p.total * k * (1 + VAT))}</span></li>
            </ul>
            <div className="pub-plan-eff">
              Effective price per credit
              <b>AED {(p.effective * k).toFixed(2)}</b>
            </div>
            <Link to="/signup" className={`pub-btn ${p.featured ? 'solid' : 'outline'} block`}>Get started</Link>
          </article>
        ))}
      </section>

      <section className="pub-section">
        <h2>Terms &amp; Conditions</h2>
        <p className="pub-note">
          The key terms for credit packages. Read the full <Link to="/terms">Terms &amp; Conditions</Link>.
        </p>
        <div className="pub-card">
          <ol className="pub-terms">
            {PRICING_TERMS.map((t) => <li key={t}>{t}</li>)}
          </ol>
        </div>
      </section>

      <p className="pub-tagline">AED 1 per credit · billed monthly · no contract, cancel anytime.</p>
    </PublicPageShell>
  );
}
