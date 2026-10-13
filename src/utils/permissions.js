/**
 * CMP Connect — Frontend Role & Permission Utilities
 * Mirrors server/src/utils/cmpConnectPermissions.js
 */

export const can = (me, ...keys) => {
  if (!me) return false;
  // Owner role always has every capability
  if (me.role?.key === 'OWNER') return true;
  if (!Array.isArray(me.permissions)) return false;
  return keys.every((k) => me.permissions.includes(k));
};

export const hasAny = (me, ...keys) => {
  if (!me) return false;
  if (me.role?.key === 'OWNER') return true;
  if (!Array.isArray(me.permissions)) return false;
  return keys.some((k) => me.permissions.includes(k));
};

export const assignableRoles = (roles = [], me = null) => {
  return roles
    .filter((r) => r.key !== 'OWNER')
    .map((r) => {
      const rolePerms = r.permissions || [];
      const disabled = me ? !rolePerms.every((p) => can(me, p)) : false;
      return {
        ...r,
        disabled
      };
    });
};
