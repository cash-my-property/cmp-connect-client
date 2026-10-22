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

const DEVICE_ID_KEY = 'cmpc_device_id';
const AUTH_TOKEN_KEY = 'cmp_connect_auth_token';

/**
 * Returns or generates a unique persistent device ID for x-device-id header
 */
export function getDeviceId() {
  try {
    let id = localStorage.getItem(DEVICE_ID_KEY);
    if (!id) {
      if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        id = crypto.randomUUID();
      } else {
        id = 'dev_' + Math.random().toString(36).substring(2, 12) + Date.now().toString(36);
      }
      localStorage.setItem(DEVICE_ID_KEY, id);
    }
    return id;
  } catch {
    return 'cmpc_device_default';
  }
}

// Backward compatibility helpers for token storage (cookies are primary)
export function getAuthToken() {
  try {
    return localStorage.getItem(AUTH_TOKEN_KEY) || sessionStorage.getItem(AUTH_TOKEN_KEY) || null;
  } catch {
    return null;
  }
}

export function setAuthToken(token, rememberMe = null) {
  try {
    if (token) {
      if (rememberMe) {
        localStorage.setItem(AUTH_TOKEN_KEY, token);
      } else {
        sessionStorage.setItem(AUTH_TOKEN_KEY, token);
      }
    } else {
      clearAuthToken();
    }
  } catch (e) {
    console.error('[cmpConnectApi] Failed to set auth token:', e);
  }
}

export function clearAuthToken() {
  try {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    sessionStorage.removeItem(AUTH_TOKEN_KEY);
  } catch (e) {
    console.error('[cmpConnectApi] Failed to clear auth token:', e);
  }
}

// Single in-flight token refresh promise (shared across concurrent requests)
let activeRefreshPromise = null;

async function executeTokenRefresh() {
  if (activeRefreshPromise) {
    return activeRefreshPromise;
  }

  activeRefreshPromise = (async () => {
    try {
      const url = resolveApiUrl('/api/cmpConnect/auth/refresh');
      const res = await fetch(url, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'x-device-id': getDeviceId()
        }
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        const err = new Error(data?.message || 'Session refresh failed');
        err.status = res.status;
        throw err;
      }

      const data = await res.json();
      return data;
    } finally {
      activeRefreshPromise = null;
    }
  })();

  return activeRefreshPromise;
}

/**
 * Generic request helper with credentials: 'include' (httpOnly cookies) and single in-flight 401 refresh
 */
async function apiRequest(endpoint, options = {}) {
  const url = resolveApiUrl(endpoint);
  const headers = { ...options.headers };

  // Always send device ID for session tracking and new device alerts
  const deviceId = getDeviceId();
  if (deviceId && !headers['x-device-id']) {
    headers['x-device-id'] = deviceId;
  }

  // If token is provided explicitly (e.g. mobile or legacy), attach Bearer header
  const token = options.token || getAuthToken();
  if (token && token !== 'cookie_session_active' && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // If body is NOT FormData, set JSON Content-Type
  if (options.body && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  try {
    // Every call sends httpOnly cookies via credentials: 'include'
    const response = await fetch(url, {
      ...options,
      credentials: 'include',
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

      // Handle 401: Auto-refresh once if not already retried and not an auth entry point
      const isAuthPath =
        endpoint.includes('/auth/login') ||
        endpoint.includes('/auth/refresh') ||
        endpoint.includes('/auth/forgot-password') ||
        endpoint.includes('/auth/reset-password') ||
        endpoint.includes('/auth/logout') ||
        endpoint.includes('/auth/invite');

      if (response.status === 401 && !isAuthPath && !options._retry) {
        try {
          await executeTokenRefresh();
          // Retry the original request once
          return await apiRequest(endpoint, { ...options, _retry: true });
        } catch (refreshErr) {
          clearAuthToken();
          if (typeof window !== 'undefined') {
            window.dispatchEvent(
              new CustomEvent('cmp_connect_unauthorized', {
                detail: { message: errorMsg || 'Your session has ended. Please log in again.' }
              })
            );
          }
          throw err;
        }
      }

      throw err;
    }

    return data;
  } catch (error) {
    if (!options._silent && error.status !== 401) {
      console.error(`[cmpConnectApi] Error on ${options.method || 'GET'} ${url}:`, error);
    }
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
   * Refresh session tokens (httpOnly cookies)
   * POST /api/cmpConnect/auth/refresh
   */
  async refresh() {
    return executeTokenRefresh();
  },

  /**
   * Logout current session & clear cookies
   * POST /api/cmpConnect/auth/logout
   */
  async logout() {
    try {
      return await apiRequest('/api/cmpConnect/auth/logout', {
        method: 'POST',
        _silent: true
      });
    } finally {
      clearAuthToken();
    }
  },

  /**
   * Logout all devices / revoke all sessions
   * POST /api/cmpConnect/auth/logout-all
   */
  async logoutAll() {
    return apiRequest('/api/cmpConnect/auth/logout-all', {
      method: 'POST'
    });
  },

  /**
   * List active sessions and devices
   * GET /api/cmpConnect/auth/sessions
   */
  async listSessions() {
    return apiRequest('/api/cmpConnect/auth/sessions', {
      method: 'GET'
    });
  },

  /**
   * Revoke a specific session
   * DELETE /api/cmpConnect/auth/sessions/:sessionId
   */
  async deleteSession(sessionId) {
    return apiRequest(`/api/cmpConnect/auth/sessions/${sessionId}`, {
      method: 'DELETE'
    });
  },

  /**
   * Forgot password request (always returns 200 with standard message)
   * POST /api/cmpConnect/auth/forgot-password
   */
  async forgotPassword({ email }) {
    return apiRequest('/api/cmpConnect/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({
        email: email ? email.trim().toLowerCase() : ''
      })
    });
  },

  /**
   * Verify reset password token on page load
   * GET /api/cmpConnect/auth/reset-password/:token
   */
  async verifyResetToken(token) {
    return apiRequest(`/api/cmpConnect/auth/reset-password/${encodeURIComponent(token)}`, {
      method: 'GET'
    });
  },

  /**
   * Submit new password with reset token
   * POST /api/cmpConnect/auth/reset-password
   */
  async resetPassword({ token, password }) {
    return apiRequest('/api/cmpConnect/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({
        token,
        password
      })
    });
  },

  /**
   * Team invite details (public verification)
   * GET /api/cmpConnect/auth/invite/:token
   */
  async getInviteDetails(token) {
    return apiRequest(`/api/cmpConnect/auth/invite/${encodeURIComponent(token)}`, {
      method: 'GET'
    });
  },

  /**
   * Accept team invite and set initial password
   * POST /api/cmpConnect/auth/accept-invite
   */
  async acceptInvite({ token, password }) {
    return apiRequest('/api/cmpConnect/auth/accept-invite', {
      method: 'POST',
      body: JSON.stringify({
        token,
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
  async getMe(token, options = {}) {
    return apiRequest('/api/cmpConnect/auth/me', {
      method: 'GET',
      token,
      ...options
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
   * 12. Check Team Invite Field Existence (Email, Mobile, BRN)
   * GET /api/cmpConnect/team/check-existence?email=&mobile=&brn=
   */
  async checkTeamExistence({ email, mobile, brn } = {}, token) {
    const params = new URLSearchParams();
    if (email && String(email).trim()) {
      params.append('email', String(email).trim().toLowerCase());
    }
    if (mobile && String(mobile).trim()) {
      params.append('mobile', String(mobile).trim());
    }
    if (brn && String(brn).trim()) {
      params.append('brn', String(brn).trim());
    }

    const queryString = params.toString();
    const endpoint = `/api/cmpConnect/team/check-existence${queryString ? `?${queryString}` : ''}`;
    return apiRequest(endpoint, {
      method: 'GET',
      token
    });
  },

  /**
   * Check BRN existence against DLD broker list (legacy)
   * GET /api/cmpConnect/team/check-brn?brn=50318
   */
  async checkBrn(brn, token) {
    const cleanBrn = encodeURIComponent(String(brn || '').trim());
    return apiRequest(`/api/cmpConnect/team/check-brn?brn=${cleanBrn}`, {
      method: 'GET',
      token
    });
  },

  /**
   * 13. Invite New Team Member
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

  /**
   * Request BRN Verification for Team Member (agencies only)
   * POST /api/cmpConnect/team/members/:id/request-verification
   */
  async requestMemberVerification(memberId, { brn, brnExpiry } = {}, token) {
    return apiRequest(`/api/cmpConnect/team/members/${memberId}/request-verification`, {
      method: 'POST',
      token,
      body: JSON.stringify({
        brn: String(brn || '').trim(),
        ...(brnExpiry ? { brnExpiry } : {})
      })
    });
  },

  async requestBrnVerification(memberId, payload, token) {
    return this.requestMemberVerification(memberId, payload, token);
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
  },

  // ─────────────────────────────────────────────────────────────
  // PROPERTIES (SIMPLE LISTINGS)
  // ─────────────────────────────────────────────────────────────

  /**
   * 22. Get Wizard Options & Rules
   * GET /api/cmpConnect/listings/options
   */
  async getListingOptions(token) {
    return apiRequest('/api/cmpConnect/listings/options', {
      method: 'GET',
      token
    });
  },

  /**
   * 23. Get Signed Upload Signature for Cloudinary Direct Upload
   * GET /api/cmpConnect/listings/upload-signature?listingId=
   */
  async getListingUploadSignature(listingId, token) {
    const qs = listingId ? `?listingId=${encodeURIComponent(listingId)}` : '';
    return apiRequest(`/api/cmpConnect/listings/upload-signature${qs}`, {
      method: 'GET',
      token
    });
  },

  /**
   * Upload file directly to Cloudinary using signed params
   */
  async uploadListingFileToCloudinary(file, sig) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('api_key', sig.apiKey);
    formData.append('timestamp', sig.timestamp);
    formData.append('signature', sig.signature);
    formData.append('folder', sig.folder);

    const res = await fetch(`https://api.cloudinary.com/v1_1/${sig.cloudName}/auto/upload`, {
      method: 'POST',
      body: formData
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || 'Cloudinary upload failed.');
    }

    const data = await res.json();
    return {
      url: data.secure_url || data.url,
      public_id: data.public_id,
      fileName: file.name
    };
  },

  /**
   * 24. List Listings (Portfolio)
   * GET /api/cmpConnect/listings?...
   */
  async listListings(params = {}, token) {
    const query = new URLSearchParams();
    if (params.status && params.status !== 'all') query.set('status', params.status);
    if (params.search) query.set('search', params.search);
    if (params.agentId) query.set('agentId', params.agentId);
    if (params.purpose) query.set('purpose', params.purpose);
    if (params.category) query.set('category', params.category);
    if (params.type) query.set('type', params.type);
    if (params.sort) query.set('sort', params.sort);
    if (params.page) query.set('page', params.page);
    if (params.limit) query.set('limit', params.limit);

    const qs = query.toString() ? `?${query.toString()}` : '';
    return apiRequest(`/api/cmpConnect/listings${qs}`, {
      method: 'GET',
      token
    });
  },

  /**
   * 25. Create Listing (Step 1 -> DRAFT)
   * POST /api/cmpConnect/listings
   */
  async createListing(data, token) {
    return apiRequest('/api/cmpConnect/listings', {
      method: 'POST',
      token,
      body: JSON.stringify(data)
    });
  },

  /**
   * 26. Get Listing Detail
   * GET /api/cmpConnect/listings/:id
   */
  async getListing(id, token) {
    return apiRequest(`/api/cmpConnect/listings/${id}`, {
      method: 'GET',
      token
    });
  },

  /**
   * 27. Update Listing (Steps 2–7)
   * PATCH /api/cmpConnect/listings/:id
   */
  async updateListing(id, data, token) {
    return apiRequest(`/api/cmpConnect/listings/${id}`, {
      method: 'PATCH',
      token,
      body: JSON.stringify(data)
    });
  },

  /**
   * 28. Assign Listing to Agent
   * PATCH /api/cmpConnect/listings/:id/assign
   */
  async assignListing(id, agentId, token) {
    return apiRequest(`/api/cmpConnect/listings/${id}/assign`, {
      method: 'PATCH',
      token,
      body: JSON.stringify({ agentId })
    });
  },

  /**
   * 29. Submit Listing for Approval
   * POST /api/cmpConnect/listings/:id/submit
   */
  async submitListing(id, token) {
    return apiRequest(`/api/cmpConnect/listings/${id}/submit`, {
      method: 'POST',
      token
    });
  },

  /**
   * 30. Approve Listing (→ LIVE)
   * POST /api/cmpConnect/listings/:id/approve
   */
  async approveListing(id, token) {
    return apiRequest(`/api/cmpConnect/listings/${id}/approve`, {
      method: 'POST',
      token
    });
  },

  /**
   * 31. Reject Listing (→ REJECTED)
   * POST /api/cmpConnect/listings/:id/reject
   */
  async rejectListing(id, reason, token) {
    return apiRequest(`/api/cmpConnect/listings/${id}/reject`, {
      method: 'POST',
      token,
      body: JSON.stringify({ reason })
    });
  },

  /**
   * 32. Publish Listing (UNPUBLISHED → LIVE)
   * POST /api/cmpConnect/listings/:id/publish
   */
  async publishListing(id, token) {
    return apiRequest(`/api/cmpConnect/listings/${id}/publish`, {
      method: 'POST',
      token
    });
  },

  /**
   * 33. Unpublish Listing (LIVE → UNPUBLISHED)
   * POST /api/cmpConnect/listings/:id/unpublish
   */
  async unpublishListing(id, token) {
    return apiRequest(`/api/cmpConnect/listings/${id}/unpublish`, {
      method: 'POST',
      token
    });
  },

  /**
   * Move Listing to Draft (LIVE/PENDING_APPROVAL/UNPUBLISHED/EXPIRED/REJECTED -> DRAFT)
   * POST /api/cmpConnect/listings/:id/move-to-draft
   */
  async moveListingToDraft(id, token) {
    return apiRequest(`/api/cmpConnect/listings/${id}/move-to-draft`, {
      method: 'POST',
      token
    });
  },

  /**
   * 34. Archive Listing (→ ARCHIVED)
   * POST /api/cmpConnect/listings/:id/archive
   */
  async archiveListing(id, token) {
    return apiRequest(`/api/cmpConnect/listings/${id}/archive`, {
      method: 'POST',
      token
    });
  },

  /**
   * 35. Restore Listing (ARCHIVED → DRAFT)
   * POST /api/cmpConnect/listings/:id/restore
   */
  async restoreListing(id, token) {
    return apiRequest(`/api/cmpConnect/listings/${id}/restore`, {
      method: 'POST',
      token
    });
  },

  /**
   * 36. Delete Listing (Soft Delete, not while LIVE)
   * DELETE /api/cmpConnect/listings/:id
   */
  async deleteListing(id, token) {
    return apiRequest(`/api/cmpConnect/listings/${id}`, {
      method: 'DELETE',
      token
    });
  },


  // ─────────────────────────────────────────────────────────────
  // 8. HOME ("Today"), ACTIVITY & GLOBAL SEARCH
  // ─────────────────────────────────────────────────────────────

  /**
   * 37. Get Home / Today Dashboard
   * GET /api/cmpConnect/home
   */
  async getHomeDashboard(token) {
    return apiRequest('/api/cmpConnect/home', {
      method: 'GET',
      token
    });
  },

  /**
   * 38. Get Activity Log
   * GET /api/cmpConnect/activity?type=&actorId=&from=&to=&page=&limit=
   */
  async getActivityLog(params = {}, token) {
    const query = new URLSearchParams();
    if (params.type && params.type !== 'ALL') query.set('type', params.type);
    if (params.actorId) query.set('actorId', params.actorId);
    if (params.from) query.set('from', params.from);
    if (params.to) query.set('to', params.to);
    if (params.page) query.set('page', params.page);
    if (params.limit) query.set('limit', params.limit);

    const qs = query.toString() ? `?${query.toString()}` : '';
    return apiRequest(`/api/cmpConnect/activity${qs}`, {
      method: 'GET',
      token
    });
  },

  /**
   * 39. Global Search (Ctrl + K)
   * GET /api/cmpConnect/search?q=
   */
  async globalSearch(q, token) {
    if (!q || q.trim().length < 2) return { data: { listings: [], members: [] } };
    return apiRequest(`/api/cmpConnect/search?q=${encodeURIComponent(q.trim())}`, {
      method: 'GET',
      token
    });
  },

  // ─────────────────────────────────────────────────────────────
  // 9. COMPANY: BRAND KIT (WATERMARK)
  // ─────────────────────────────────────────────────────────────

  /**
   * 40. Get Brand Kit (Watermark Settings)
   * GET /api/cmpConnect/company/brand-kit
   */
  async getBrandKit(token) {
    return apiRequest('/api/cmpConnect/company/brand-kit', {
      method: 'GET',
      token
    });
  },

  /**
   * 41. Update Brand Kit
   * PUT /api/cmpConnect/company/brand-kit
   */
  async updateBrandKit(data, token) {
    return apiRequest('/api/cmpConnect/company/brand-kit', {
      method: 'PUT',
      token,
      body: JSON.stringify(data)
    });
  },

  /**
   * 42. Brand Kit Upload Signature
   * GET /api/cmpConnect/company/brand-kit/upload-signature
   */
  async getBrandKitUploadSignature(token) {
    return apiRequest('/api/cmpConnect/company/brand-kit/upload-signature', {
      method: 'GET',
      token
    });
  },

  // ─────────────────────────────────────────────────────────────
  // 10. LISTINGS: REFRESH, BULK ACTIONS, EXPORT & TRANSFER
  // ─────────────────────────────────────────────────────────────

  /**
   * 43. Refresh / Bump Listing (once per 24h)
   * POST /api/cmpConnect/listings/:id/refresh
   */
  async refreshListing(id, token) {
    return apiRequest(`/api/cmpConnect/listings/${id}/refresh`, {
      method: 'POST',
      token
    });
  },

  /**
   * 44. Bulk Listings Actions (publish, unpublish, archive, restore, delete, assign, refresh)
   * POST /api/cmpConnect/listings/bulk
   */
  async bulkListingsAction({ ids, action, agentId }, token) {
    return apiRequest('/api/cmpConnect/listings/bulk', {
      method: 'POST',
      token,
      body: JSON.stringify({ ids, action, agentId })
    });
  },

  /**
   * 45. Export Listings to CSV
   * GET /api/cmpConnect/listings/export?...
   */
  async exportListingsCsv(params = {}, token) {
    const query = new URLSearchParams();
    if (params.status && params.status !== 'all') query.set('status', params.status);
    if (params.search) query.set('search', params.search);
    if (params.agentId) query.set('agentId', params.agentId);
    if (params.purpose) query.set('purpose', params.purpose);
    if (params.category) query.set('category', params.category);
    if (params.type) query.set('type', params.type);
    if (params.sort) query.set('sort', params.sort);

    const qs = query.toString() ? `?${query.toString()}` : '';
    const url = resolveApiUrl(`/api/cmpConnect/listings/export${qs}`);
    const actualToken = token || getAuthToken();

    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      headers: {
        ...(actualToken ? { Authorization: `Bearer ${actualToken}` } : {})
      }
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to export listings CSV.');
    }

    return response.blob();
  },

  /**
   * 46. Transfer Listings from one Agent to another
   * POST /api/cmpConnect/team/members/:id/transfer-listings
   */
  async transferAgentListings(memberId, toAgentId, token) {
    return apiRequest(`/api/cmpConnect/team/members/${memberId}/transfer-listings`, {
      method: 'POST',
      token,
      body: JSON.stringify({ toAgentId })
    });
  },

  // ─────────────────────────────────────────────────────────────
  // 11. TRANSACTIONS (CLOSED DEALS)
  // ─────────────────────────────────────────────────────────────

  /**
   * 47. Get Signed Upload Signature for Proof Document
   * GET /api/cmpConnect/transactions/upload-signature
   */
  async getTransactionUploadSignature(token) {
    return apiRequest('/api/cmpConnect/transactions/upload-signature', {
      method: 'GET',
      token
    });
  },

  /**
   * Helper: Upload proof file to Cloudinary using transaction signature
   */
  async uploadTransactionProof(file, sig) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('api_key', sig.apiKey);
    formData.append('timestamp', sig.timestamp);
    formData.append('signature', sig.signature);
    formData.append('folder', sig.folder);

    const res = await fetch(`https://api.cloudinary.com/v1_1/${sig.cloudName}/auto/upload`, {
      method: 'POST',
      body: formData
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || 'Transaction proof document upload failed.');
    }

    const data = await res.json();
    return {
      url: data.secure_url || data.url,
      public_id: data.public_id,
      fileName: file.name
    };
  },

  /**
   * 48. List Closed Deals (Transactions)
   * GET /api/cmpConnect/transactions?status=&search=&ref=&agentId=&offering=&propertyType=&outcome=&page=&limit=
   */
  async listTransactions(params = {}, token) {
    const query = new URLSearchParams();
    if (params.status && params.status !== 'all') query.set('status', params.status);
    if (params.search) query.set('search', params.search);
    if (params.ref) query.set('ref', params.ref);
    if (params.agentId) query.set('agentId', params.agentId);
    if (params.offering) query.set('offering', params.offering);
    if (params.propertyType) query.set('propertyType', params.propertyType);
    if (params.outcome) query.set('outcome', params.outcome);
    if (params.page) query.set('page', params.page);
    if (params.limit) query.set('limit', params.limit);

    const qs = query.toString() ? `?${query.toString()}` : '';
    return apiRequest(`/api/cmpConnect/transactions${qs}`, {
      method: 'GET',
      token
    });
  },

  /**
   * 49. Get Closed Deal Details ("View claim")
   * GET /api/cmpConnect/transactions/:id
   */
  async getTransaction(id, token) {
    return apiRequest(`/api/cmpConnect/transactions/${id}`, {
      method: 'GET',
      token
    });
  },

  /**
   * 50. Record a Closed Deal (Mark as sold / rented with proof)
   * POST /api/cmpConnect/transactions
   * Payload: { listingId, agentId, transactionDate, finalPrice, counterpartyName, notes, document: { url, public_id, fileName }, declared: true }
   */
  async recordClosedDeal(payload, token) {
    return apiRequest('/api/cmpConnect/transactions', {
      method: 'POST',
      token,
      body: JSON.stringify(payload)
    });
  },

  /**
   * 51. Mark Listing as Sold / Rented (Step 1)
   * POST /api/cmpConnect/listings/:id/mark-sold
   * Moves listing to CLOSED and adds UNCLAIMED deal in Transactions
   */
  async markListingSold(listingId, closedAt, token) {
    let body = undefined;
    let actualToken = token;
    if (typeof closedAt === 'string') {
      body = JSON.stringify({ closedAt });
    } else if (typeof closedAt === 'object' && closedAt?.closedAt) {
      body = JSON.stringify(closedAt);
    } else if (closedAt && !token) {
      actualToken = closedAt;
    }

    return apiRequest(`/api/cmpConnect/listings/${listingId}/mark-sold`, {
      method: 'POST',
      token: actualToken,
      body
    });
  },

  /**
   * 52. Submit Contract (Step 2 - Agent)
   * POST /api/cmpConnect/transactions/:id/submit
   * Payload: { transactionDate, finalPrice, counterpartyName, notes, document, declared: true }
   */
  async submitTransactionContract(transactionId, payload, token) {
    return apiRequest(`/api/cmpConnect/transactions/${transactionId}/submit`, {
      method: 'POST',
      token,
      body: JSON.stringify(payload)
    });
  },

  /**
   * 53. Claim Deal (Step 3a - Company Manager / Accounts)
   * POST /api/cmpConnect/transactions/:id/claim
   * Finalises and marks deal as CLAIMED (no body)
   */
  async claimTransaction(transactionId, token) {
    return apiRequest(`/api/cmpConnect/transactions/${transactionId}/claim`, {
      method: 'POST',
      token
    });
  },

  /**
   * 54. Send Back Deal (Step 3b - Company Manager / Accounts)
   * POST /api/cmpConnect/transactions/:id/send-back
   * Payload: { reason: string } (3-500 chars)
   */
  async sendBackTransaction(transactionId, reason, token) {
    return apiRequest(`/api/cmpConnect/transactions/${transactionId}/send-back`, {
      method: 'POST',
      token,
      body: JSON.stringify(typeof reason === 'object' ? reason : { reason })
    });
  },

  /**
   * 53. Insights - Performance figures (Section 11)
   * GET /api/cmpConnect/insights/performance?agentId=&propertyType=&offering=&location=&range=
   */
  async getInsightsPerformance(params = {}, token) {
    const query = new URLSearchParams();
    if (params.agentId) {
      query.set('agentId', Array.isArray(params.agentId) ? params.agentId.join(',') : params.agentId);
    }
    if (params.propertyType) {
      query.set('propertyType', Array.isArray(params.propertyType) ? params.propertyType.join(',') : params.propertyType);
    }
    if (params.offering && params.offering !== 'all') {
      query.set('offering', params.offering);
    }
    if (params.location) {
      query.set('location', Array.isArray(params.location) ? params.location.join('|') : params.location);
    }
    if (params.range) {
      query.set('range', params.range);
    }

    const qs = query.toString() ? `?${query.toString()}` : '';
    return apiRequest(`/api/cmpConnect/insights/performance${qs}`, {
      method: 'GET',
      token
    });
  },

  /**
   * 54. Insights - Views, leads and locations overview (Section 11)
   * GET /api/cmpConnect/insights/overview?range=
   */
  async getInsightsOverview(params = {}, token) {
    const query = new URLSearchParams();
    if (params.range) {
      query.set('range', params.range);
    }

    const qs = query.toString() ? `?${query.toString()}` : '';
    return apiRequest(`/api/cmpConnect/insights/overview${qs}`, {
      method: 'GET',
      token
    });
  },

  /**
   * 55. Insights - Market Standing (Section 11)
   * GET /api/cmpConnect/insights/market?offering=all&search=
   */
  async getInsightsMarket(params = {}, token) {
    const query = new URLSearchParams();
    if (params.offering && params.offering !== 'all') {
      query.set('offering', params.offering);
    }
    if (params.search) {
      query.set('search', params.search);
    }

    const qs = query.toString() ? `?${query.toString()}` : '';
    return apiRequest(`/api/cmpConnect/insights/market${qs}`, {
      method: 'GET',
      token
    });
  },

  /**
   * 56. Insights - Enquiry Insights (Section 11)
   * GET /api/cmpConnect/insights/enquiries?range=7
   */
  async getInsightsEnquiries(params = {}, token) {
    const query = new URLSearchParams();
    if (params.range) {
      query.set('range', params.range);
    }

    const qs = query.toString() ? `?${query.toString()}` : '';
    return apiRequest(`/api/cmpConnect/insights/enquiries${qs}`, {
      method: 'GET',
      token
    });
  },

  /**
   * 57. Insights - Spotlighted Properties & Eligibility (Section 11)
   * GET /api/cmpConnect/insights/spotlight
   */
  async getInsightsSpotlight(token) {
    return apiRequest('/api/cmpConnect/insights/spotlight', {
      method: 'GET',
      token
    });
  }
};

export default cmpConnectApi;

