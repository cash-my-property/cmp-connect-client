// Billing (Stripe) helpers — /api/cmpConnect/billing/*
// Card kabhi hamare paas nahi aata: checkout aur portal dono Stripe ke hosted page hain.
import { cmpConnectApi } from '../services/cmpConnectApi';

export const SUB_STATUS = {
  ACTIVE: { label: 'Active', tone: 'success' },
  TRIALING: { label: 'Trial', tone: 'success' },
  PAST_DUE: { label: 'Payment overdue', tone: 'danger' },
  UNPAID: { label: 'Unpaid', tone: 'danger' },
  PAUSED: { label: 'Paused', tone: 'warning' },
  INCOMPLETE: { label: 'Waiting for payment', tone: 'warning' },
  CANCELED: { label: 'Cancelled', tone: 'neutral' }
};

// Aisi subscription jise Stripe portal se chalaya jata hai (plan badalna, card, cancel).
// INCOMPLETE = checkout shuru hua par pay nahi hua → abhi koi plan nahi.
export const isManagedPlan = (sub) => ['ACTIVE', 'TRIALING', 'PAST_DUE', 'UNPAID', 'PAUSED'].includes(sub?.status);

export const periodLabel = (p) => (p === 'YEARLY' ? 'Yearly' : 'Monthly');

// Plan khatam hone wala hai? Stripe ka naya API portal cancel par `cancel_at` deta hai,
// purana `cancel_at_period_end` — dono ko maano. Date ya null.
export const subEndsAt = (sub) => {
  if (!sub) return null;
  if (sub.cancelAt) return sub.cancelAt;
  return sub.cancelAtPeriodEnd ? sub.currentPeriodEnd || null : null;
};

export const fmtDate = (d) => {
  if (!d) return null;
  const x = new Date(d);
  return Number.isNaN(x.getTime()) ? null : x.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

export const fmtAed = (n) => {
  const v = Number(n) || 0;
  const d = Number.isInteger(v) ? 0 : 2;
  return `AED ${v.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d })}`;
};

// Overdue ka jumla — grace ke andar (publish chal raha hai) ya khatam (ruka hua)
// grace = { graceDays, since, until, daysLeft, inGrace } (backend)
export function overdueText(grace, planName) {
  const what = planName ? `Your ${planName} package payment` : 'Your package payment';
  if (grace?.inGrace) {
    const d = Number(grace.daysLeft) || 0;
    const until = fmtDate(grace.until);
    const left = d <= 1 ? 'less than a day' : `${d} more days`;
    return {
      tone: 'warning',
      title: 'Payment failed',
      text: `${what} failed. Publishing continues for ${left}${until ? ` (until ${until})` : ''}. Update the card to avoid an interruption.`
    };
  }
  return {
    tone: 'danger',
    title: 'Payment overdue',
    text: `${what} is overdue${grace?.graceDays ? ` and the ${grace.graceDays}-day grace period has ended` : ''}, so publishing is paused until the card is updated.`
  };
}

// Ek saal ka kharcha (VAT samet) — monthly aur yearly plans ko ek paimane par
const yearOf = (priceAed, billingPeriod) => (Number(priceAed) || 0) * (billingPeriod === 'YEARLY' ? 1 : 12);

/**
 * Chalu plan ke muqable mein ye card kya hai:
 *   'current' | 'upgrade' | 'downgrade' | 'period' (wahi plan, doosra Type)
 * `card` = /public/packages ka card, `sub` = /billing/subscription.
 */
export function compareToCurrent(card, sub) {
  if (!sub || !card) return null;
  // Portal se agli renewal par badalna chuna hua hai
  if (sub.scheduledPlan?.key && card.key === sub.scheduledPlan.key) return 'scheduled';
  if (sub.packageKey && card.key === sub.packageKey) return 'current';
  const curName = String(sub.plan?.name || '').trim().toLowerCase();
  if (curName && String(card.name).trim().toLowerCase() === curName) {
    return card.billingPeriod === sub.plan?.billingPeriod ? 'current' : 'period';
  }
  const mine = yearOf(sub.plan?.priceAed, sub.plan?.billingPeriod);
  const theirs = yearOf(card.pricing?.price?.total, card.billingPeriod);
  return theirs >= mine ? 'upgrade' : 'downgrade';
}

// Server ke jawab ko seedhe jumle mein (status code ke hisaab se)
export function billingErrorText(err, fallback = 'Something went wrong. Please try again.') {
  if (!err) return fallback;
  if (err.status === 503) return err.message || 'Payments are not available yet. Please try again later.';
  if (err.status === 403) return err.message || 'Only the company owner can change the plan or payment details.';
  return err.message || fallback;
}

// Plan kharido → Stripe Checkout par bhej do
export async function goToCheckout(key) {
  // Pay ke baad seedha confirmation page; cancel par Billing
  const res = await cmpConnectApi.startCheckout(key, { _silent: true }, { successPath: '/billing/success', cancelPath: '/billing' });
  const url = res?.data?.url;
  if (!url) throw new Error('Could not open the payment page. Please try again.');
  window.location.assign(url);
}

// Stripe billing portal.
//   goToPortal()                    card, invoices (plan picker ab aam portal mein nahi)
//   goToPortal({ changeTo: key })   seedha us plan ka confirm page → /billing/success?change=success&key=…
//   goToPortal({ cancel: true })    cancel flow → /billing/success?change=cancelled
export async function goToPortal(body = {}) {
  const res = await cmpConnectApi.openBillingPortal({ _silent: true }, body);
  const url = res?.data?.url;
  if (!url) throw new Error('Could not open billing. Please try again.');
  window.location.assign(url);
}
