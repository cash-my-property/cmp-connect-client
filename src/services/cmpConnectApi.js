/**
 * CMP Connect Registration & Onboarding API Client
 * Integrates all 7 Public / Registration Portal APIs from cmp-server:
 * 1. GET   /api/cmpConnect/check-existence
 * 2. POST  /api/cmpConnect/register
 * 3. GET   /api/cmpConnect/portal/:token
 * 4. GET   /api/cmpConnect/upload/:token
 * 5. PATCH /api/cmpConnect/upload/:token/details
 * 6. POST  /api/cmpConnect/upload/:token/documents/:docKey
 * 7. POST  /api/cmpConnect/upload/:token/submit
 */

function getBaseUrl() {
  const envUrl =
    (typeof import.meta !== 'undefined' && import.meta.env?.NEXT_PUBLIC_API_URL) ||
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) ||
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL) ||
    'https://testapi.cmpdubai.com/api';

  return String(envUrl).trim().replace(/\/+$/, '');
}

function resolveApiUrl(path) {
  const base = getBaseUrl();
  const cleanPath = path.startsWith('/') ? path : `/${path}`;

  // If base is empty, use relative path (e.g. /api/cmpConnect/register)
  if (!base) {
    return cleanPath;
  }

  // If base already ends with /api (e.g. https://testapi.cmpdubai.com/api)
  // and cleanPath starts with /api/, strip leading /api to avoid duplicate /api/api
  if (base.endsWith('/api') && cleanPath.startsWith('/api/')) {
    return `${base}${cleanPath.substring(4)}`;
  }

  return `${base}${cleanPath}`;
}

/**
 * Generic request helper with robust error handling
 */
async function apiRequest(endpoint, options = {}) {
  const url = resolveApiUrl(endpoint);
  const headers = { ...options.headers };

  // If body is NOT FormData, set JSON Content-Type
  if (options.body && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers
    });

    const contentType = response.headers.get('content-type') || '';
    let data;
    if (contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    if (!response.ok) {
      const errorMsg = data?.message || data?.error || (typeof data === 'string' ? data : `HTTP ${response.status}`);
      const err = new Error(errorMsg);
      err.status = response.status;
      err.data = data;
      throw err;
    }

    return data;
  } catch (error) {
    console.error(`[cmpConnectApi] Error on ${options.method || 'GET'} ${url}:`, error);
    throw error;
  }
}

export const cmpConnectApi = {
  /**
   * 1. Check Existence (Pre-check)
   * GET /api/cmpConnect/check-existence?type=AGENCY&orn=... | ?type=DEVELOPER&companyName=...&email=...
   */
  async checkExistence({ type, orn, companyName, email }) {
    const params = new URLSearchParams();
    if (type) params.append('type', type);

    if (type === 'AGENCY') {
      if (orn) params.append('orn', orn.trim());
    } else if (type === 'DEVELOPER') {
      if (companyName && companyName.trim()) params.append('companyName', companyName.trim());
      if (email && email.trim()) params.append('email', email.trim().toLowerCase());
    }

    return apiRequest(`/api/cmpConnect/check-existence?${params.toString()}`, {
      method: 'GET'
    });
  },

  /**
   * 2. Step 1: Submit Registration Request
   * POST /api/cmpConnect/register
   */
  async register(payload) {
    return apiRequest('/api/cmpConnect/register', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  /**
   * 3. Hosted Portal URL (standalone HTML page)
   * GET /api/cmpConnect/portal/:token
   */
  getPortalUrl(token) {
    return resolveApiUrl(`/api/cmpConnect/portal/${token}`);
  },

  /**
   * 4. Fetch Portal State (Fields, Document requirements, Upload status)
   * GET /api/cmpConnect/upload/:token
   */
  async getPortal(token) {
    return apiRequest(`/api/cmpConnect/upload/${token}`, {
      method: 'GET'
    });
  },

  /**
   * 5. Save Details (Step 2 form fields)
   * PATCH /api/cmpConnect/upload/:token/details
   */
  async saveDetails(token, details) {
    return apiRequest(`/api/cmpConnect/upload/${token}/details`, {
      method: 'PATCH',
      body: JSON.stringify(details)
    });
  },

  /**
   * 6. Upload a Single Document
   * POST /api/cmpConnect/upload/:token/documents/:docKey
   * Expects multipart/form-data with field name "file"
   */
  async uploadDocument(token, docKey, file) {
    const formData = new FormData();
    formData.append('file', file);

    return apiRequest(`/api/cmpConnect/upload/${token}/documents/${docKey}`, {
      method: 'POST',
      body: formData
    });
  },

  /**
   * 7. Final Submission (Submit for CMP Compliance Review)
   * POST /api/cmpConnect/upload/:token/submit
   */
  async submit(token) {
    return apiRequest(`/api/cmpConnect/upload/${token}/submit`, {
      method: 'POST'
    });
  }
};

export default cmpConnectApi;
