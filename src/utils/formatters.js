/**
 * Standard formatters for CMP Connect
 */

/**
 * Format a number as UAE Dirhams (AED)
 * @param {number|string} amount
 * @param {boolean} [compact=false]
 * @returns {string}
 */
export function formatAED(amount, compact = false) {
  if (amount === undefined || amount === null || amount === '') return 'AED 0';
  const num = typeof amount === 'string' ? parseFloat(amount.replace(/[^0-9.-]+/g, '')) : amount;
  if (isNaN(num)) return 'AED 0';

  if (compact) {
    if (num >= 1_000_000) {
      return `AED ${(num / 1_000_000).toFixed(2).replace(/\.00$/, '')}M`;
    }
    if (num >= 1_000) {
      return `AED ${(num / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
    }
  }

  return `AED ${num.toLocaleString('en-US')}`;
}

/**
 * Format a plain number with commas
 * @param {number|string} num
 * @returns {string}
 */
export function formatNumber(num) {
  if (num === undefined || num === null || num === '') return '0';
  const parsed = Number(num);
  return isNaN(parsed) ? '0' : parsed.toLocaleString('en-US');
}

/**
 * Extract 2-letter uppercase initials from a full name
 * @param {string} name
 * @returns {string} e.g. "Layla Haddad" -> "LH", "Karim" -> "KA"
 */
export function getInitials(name) {
  if (!name || typeof name !== 'string') return '--';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Capitalize first letter of a string
 * @param {string} str
 * @returns {string}
 */
export function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}
