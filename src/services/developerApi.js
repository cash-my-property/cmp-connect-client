// CMP Connect — Developer workspace APIs (/api/cmpConnect/developer/*)
// Sirf DEVELOPER account ke liye; agency ko 403 { code: "DEVELOPER_ONLY" } milta hai.
import { apiRequest, toQuery, downloadCsv } from './cmpConnectApi';

const BASE = '/api/cmpConnect/developer';
const json = (method, body) => ({ method, body: JSON.stringify(body) });

// Cloudinary signed upload (same flow as listings / brand kit)
async function uploadToCloudinary(file, sig) {
  if (!sig?.cloudName || !sig?.signature) throw new Error('Could not get an upload signature. Please try again.');
  const fd = new FormData();
  fd.append('file', file);
  fd.append('api_key', sig.apiKey);
  fd.append('timestamp', sig.timestamp);
  fd.append('signature', sig.signature);
  fd.append('folder', sig.folder);
  const res = await fetch(`https://api.cloudinary.com/v1_1/${sig.cloudName}/auto/upload`, { method: 'POST', body: fd });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Could not upload ${file.name}.`);
  }
  const data = await res.json();
  return { url: data.secure_url || data.url, public_id: data.public_id, fileName: file.name };
}

// Response { [kind]: sig } ya seedha sig — dono handle
const pickSig = (res, kind) => {
  const d = res?.data ?? res;
  return d?.[kind] || d;
};

export const developerApi = {
  // ── Projects ──────────────────────────────────────────────
  projectOptions: () => apiRequest(`${BASE}/projects/options`),
  listProjects: (params = {}) => apiRequest(`${BASE}/projects${toQuery(params)}`),
  getProject: (id) => apiRequest(`${BASE}/projects/${encodeURIComponent(id)}`),
  createProject: (payload) => apiRequest(`${BASE}/projects`, json('POST', payload)),
  updateProject: (id, payload) => apiRequest(`${BASE}/projects/${encodeURIComponent(id)}`, json('PATCH', payload)),
  deleteProject: (id) => apiRequest(`${BASE}/projects/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  markSoldOut: (id) => apiRequest(`${BASE}/projects/${encodeURIComponent(id)}/sold-out`, { method: 'POST' }),
  exportProjects: () => downloadCsv(`${BASE}/projects/export`, null, 'Could not export projects.'),

  /** kind: photo | brochure | document */
  async uploadProjectFile(file, kind) {
    const res = await apiRequest(`${BASE}/projects/upload-signature${toQuery({ kind })}`);
    return uploadToCloudinary(file, pickSig(res, kind));
  },

  // ── Availability ──────────────────────────────────────────
  availability: () => apiRequest(`${BASE}/availability`),
  moveUnit: (projectId, unitTypeId, action, enquiryId) =>
    apiRequest(
      `${BASE}/projects/${encodeURIComponent(projectId)}/units/${encodeURIComponent(unitTypeId)}/move`,
      json('POST', { action, ...(enquiryId ? { enquiryId } : {}) })
    ),
  movements: (projectId) => apiRequest(`${BASE}/projects/${encodeURIComponent(projectId)}/movements`),

  // ── Enquiries (shared inbox) ──────────────────────────────
  listEnquiries: (params = {}) => apiRequest(`${BASE}/enquiries${toQuery(params)}`),
  pickUpEnquiry: (id) => apiRequest(`${BASE}/enquiries/${encodeURIComponent(id)}/pick-up`, { method: 'POST' }),
  updateEnquiry: (id, patch) => apiRequest(`${BASE}/enquiries/${encodeURIComponent(id)}`, json('PATCH', patch)),
  exportEnquiries: () => downloadCsv(`${BASE}/enquiries/export`, null, 'Could not export enquiries.'),

  // ── Team (existing team routes, developer fields ke saath) ─
  listMembers: (params = {}) => apiRequest(`/api/cmpConnect/team/members${toQuery({ limit: 100, ...params })}`),
  updateMember: (id, patch) => apiRequest(`/api/cmpConnect/team/members/${encodeURIComponent(id)}`, json('PATCH', patch)),
  inviteMember: (payload) => apiRequest('/api/cmpConnect/team/invite', json('POST', payload)),
  setMemberStatus: (id, status) => apiRequest(`/api/cmpConnect/team/members/${encodeURIComponent(id)}/status`, json('PATCH', { status })),
  listRoles: () => apiRequest('/api/cmpConnect/roles'),

  // ── Home + Profile ────────────────────────────────────────
  home: () => apiRequest(`${BASE}/home`),
  getProfile: () => apiRequest(`${BASE}/profile`),
  updateProfile: (payload) => apiRequest(`${BASE}/profile`, json('PATCH', payload)),
  async uploadLogo(file) {
    const res = await apiRequest(`${BASE}/profile/logo-signature`);
    return uploadToCloudinary(file, pickSig(res, 'logo'));
  }
};

// CSV blob → download
export function saveBlob(blob, fileName) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = fileName;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

export default developerApi;
