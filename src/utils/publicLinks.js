// Links to the same property on the public CMP website (cmpdubai.com).
// Set VITE_PUBLIC_SITE_URL per environment (production: https://cmpdubai.com).
export const PUBLIC_SITE_URL = (import.meta.env.VITE_PUBLIC_SITE_URL || 'https://staging.cmpdubai.com').replace(/\/+$/, '');

/** Simple listing page: /en/listings/CLID-XXXXXXXX */
export const publicListingUrl = (listingRef) =>
  listingRef ? `${PUBLIC_SITE_URL}/en/listings/${encodeURIComponent(listingRef)}` : null;

/** Real-Time Offer page: /en/auctions/<auction id> */
export const publicAuctionUrl = (auctionId) =>
  auctionId ? `${PUBLIC_SITE_URL}/en/auctions/${encodeURIComponent(auctionId)}` : null;
