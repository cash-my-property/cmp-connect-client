import React from 'react';
import { Link } from 'react-router-dom';
import PublicPageShell from './PublicPageShell';

const LAST_UPDATED = '25 November 2026';

const SECTIONS = [
  {
    id: 'plans',
    title: 'Plans and billing',
    items: [
      'No minimum contract. Plans are billed monthly and you can cancel anytime; cancellation takes effect at the end of the current billing month.',
      'No undated cheque or security cheque required.',
      'Optional: pay 12 months in advance and get 5% off.',
      'All prices exclude 5% VAT.'
    ]
  },
  {
    id: 'credits',
    title: 'Credits',
    items: [
      'Credits cost AED 1 each.',
      'Credits are deducted per listing based on community, sale/rent and price band. Unused monthly credits expire at the end of each cycle.',
      'Bonus credits (Pro: 900/month for the first 3 months, Premium: 2,000/month for the first 6 months) are added only while the plan is active.'
    ]
  },
  {
    id: 'free',
    title: 'Free listings',
    items: [
      'Every new account gets its first five listings free. Developers also get five free projects, and real estate companies five free Real Time Offer properties. Each count is separate.',
      'A free slot is used the first time a listing goes live, a project is first sent for review, or a Real Time Offer property is first submitted.',
      'Free slots are counted for the life of the account. Unpublishing, rejecting or deleting does not return a slot; republishing or resubmitting the same item is always free.',
      'Cash My Property may change the number of free items for new and existing accounts.'
    ]
  },
  {
    id: 'compliance',
    title: 'Eligibility and compliance',
    items: [
      'The client must hold a valid Real Estate Brokerage Trade License, ORN, BRN and Trakheesi permit (DLD) throughout the term.'
    ]
  }
];

export default function TermsPage() {
  return (
    <PublicPageShell title="Terms & Conditions">
      <header className="pub-hero left">
        <span className="pub-tag">CMP Connect</span>
        <h1>Terms &amp; Conditions</h1>
        <p className="pub-sub">
          The terms that apply to CMP Connect accounts and listing credit packages. Last updated {LAST_UPDATED}.
        </p>
      </header>

      <div className="pub-terms-layout">
        <nav className="pub-toc" aria-label="Sections">
          <p>On this page</p>
          {SECTIONS.map((s, i) => (
            <a key={s.id} href={`#${s.id}`}>{i + 1}. {s.title}</a>
          ))}
          <Link to="/pricing" className="pub-toc-cta">See pricing →</Link>
        </nav>

        <div className="pub-terms-body">
          {SECTIONS.map((s, i) => (
            <section key={s.id} id={s.id} className="pub-card pub-terms-sec">
              <h2><span>{i + 1}</span>{s.title}</h2>
              <ol className="pub-terms">
                {s.items.map((t) => <li key={t}>{t}</li>)}
              </ol>
            </section>
          ))}
          <p className="pub-note">
            Questions about these terms? Call <a href="tel:+971502402661">+971 50 240 2661</a> or email{' '}
            <a href="mailto:info@cmpdubai.com">info@cmpdubai.com</a>.
          </p>
        </div>
      </div>
    </PublicPageShell>
  );
}
