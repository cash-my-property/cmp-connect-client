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

const AUTH_TOKEN_KEY = 'cmp_connect_auth_token';

export function getAuthToken() {
  try {
    return sessionStorage.getItem(AUTH_TOKEN_KEY) || null;
  } catch {
    return null;
  }
}

export function setAuthToken(token) {
  try {
    if (token) {
      sessionStorage.setItem(AUTH_TOKEN_KEY, token);
    } else {
      sessionStorage.removeItem(AUTH_TOKEN_KEY);
    }
  } catch (e) {
    console.error('[cmpConnectApi] Failed to set auth token:', e);
  }
}

export function clearAuthToken() {
  try {
    sessionStorage.removeItem(AUTH_TOKEN_KEY);
  } catch (e) {
    console.error('[cmpConnectApi] Failed to clear auth token:', e);
  }
}

/**
 * Generic request helper with robust error handling
 */
async function apiRequest(endpoint, options = {}) {
  const url = resolveApiUrl(endpoint);
  const headers = { ...options.headers };

  // If token is provided or exists in storage, attach Bearer auth header
  const token = options.token || getAuthToken();
  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

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
      // Backend error format: { "status": "error", "message": "..." } or rate limit: { "status": false, "message": "..." }
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
  },

  /**
   * 8. CMP Connect Login
   * POST /api/cmpConnect/auth/login
   */
  async login({ email, password }) {
    return apiRequest('/api/cmpConnect/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: email ? email.trim().toLowerCase() : '',
        password
      })
    });
  },

  /**
   * 9. CMP Connect Change Password (Mandatory on first login or user request)
   * POST /api/cmpConnect/auth/change-password
   */
  async changePassword({ currentPassword, newPassword }, token) {
    return apiRequest('/api/cmpConnect/auth/change-password', {
      method: 'POST',
      token,
      body: JSON.stringify({
        currentPassword,
        newPassword
      })
    });
  },

  /**
   * 10. CMP Connect Current Session
   * GET /api/cmpConnect/auth/me
   */
  async getMe(token) {
    return apiRequest('/api/cmpConnect/auth/me', {
      method: 'GET',
      token
    });
  },

  // ─────────────────────────────────────────────────────────────
  // TEAM: MEMBERS (users.html)
  // ─────────────────────────────────────────────────────────────

  /**
   * 11. List Team Members
   * GET /api/cmpConnect/team/members?search=&roleId=&status=&page=&limit=
   */
  async listMembers(params = {}, token) {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.roleId) query.append('roleId', params.roleId);
    if (params.status && params.status !== 'all') query.append('status', params.status);
    if (params.page) query.append('page', params.page);
    if (params.limit) query.append('limit', params.limit);

    const queryString = query.toString();
    const endpoint = `/api/cmpConnect/team/members${queryString ? `?${queryString}` : ''}`;
    return apiRequest(endpoint, {
      method: 'GET',
      token
    });
  },

  /**
   * 12. Invite New Team Member
   * POST /api/cmpConnect/team/invite
   */
  async inviteMember(data, token) {
    return apiRequest('/api/cmpConnect/team/invite', {
      method: 'POST',
      token,
      body: JSON.stringify(data)
    });
  },

  /**
   * 13. Resend Member Invite Email
   * POST /api/cmpConnect/team/members/:id/resend-invite
   */
  async resendInvite(memberId, token) {
    return apiRequest(`/api/cmpConnect/team/members/${memberId}/resend-invite`, {
      method: 'POST',
      token
    });
  },

  /**
   * 14. Change Member Role
   * PATCH /api/cmpConnect/team/members/:id/role
   */
  async changeMemberRole(memberId, roleId, token) {
    return apiRequest(`/api/cmpConnect/team/members/${memberId}/role`, {
      method: 'PATCH',
      token,
      body: JSON.stringify({ roleId })
    });
  },

  /**
   * 15. Set Member Status (Active / Inactive)
   * PATCH /api/cmpConnect/team/members/:id/status
   */
  async setMemberStatus(memberId, status, token) {
    return apiRequest(`/api/cmpConnect/team/members/${memberId}/status`, {
      method: 'PATCH',
      token,
      body: JSON.stringify({ status })
    });
  },

  // ─────────────────────────────────────────────────────────────
  // TEAM: ROLES & ACCESS (roles.html)
  // ─────────────────────────────────────────────────────────────

  /**
   * 16. List Roles & Permission Matrix
   * GET /api/cmpConnect/roles
   */
  async listRoles(token) {
    return apiRequest('/api/cmpConnect/roles', {
      method: 'GET',
      token
    });
  },

  /**
   * 17. Create Custom Role
   * POST /api/cmpConnect/roles/custom
   */
  async createCustomRole(data, token) {
    return apiRequest('/api/cmpConnect/roles/custom', {
      method: 'POST',
      token,
      body: JSON.stringify(data)
    });
  },

  /**
   * 18. Update Custom Role
   * PATCH /api/cmpConnect/roles/custom/:id
   */
  async updateCustomRole(roleId, data, token) {
    return apiRequest(`/api/cmpConnect/roles/custom/${roleId}`, {
      method: 'PATCH',
      token,
      body: JSON.stringify(data)
    });
  },

  /**
   * 19. Delete Custom Role
   * DELETE /api/cmpConnect/roles/custom/:id
   */
  async deleteCustomRole(roleId, token) {
    return apiRequest(`/api/cmpConnect/roles/custom/${roleId}`, {
      method: 'DELETE',
      token
    });
  },

  // ─────────────────────────────────────────────────────────────
  // TEAM: INVITE ACCEPT / SET PASSWORD (Public)
  // ─────────────────────────────────────────────────────────────

  /**
   * 20. Get Invite Details by Token
   * GET /api/cmpConnect/auth/invite/:token
   */
  async getInviteDetails(inviteToken) {
    return apiRequest(`/api/cmpConnect/auth/invite/${inviteToken}`, {
      method: 'GET'
    });
  },

  /**
   * 21. Accept Invite and Set Password
   * POST /api/cmpConnect/auth/accept-invite
   */
  async acceptInvite({ token, password }) {
    return apiRequest('/api/cmpConnect/auth/accept-invite', {
      method: 'POST',
      body: JSON.stringify({ token, password })
    });
  }
};

export default cmpConnectApi;
