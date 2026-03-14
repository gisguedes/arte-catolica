/** Roles de usuario en un vendor. Deben coincidir con el enum vendor_user_role en PostgreSQL. */
const VENDOR_USER_ROLES = Object.freeze({
  OWNER: 'owner',
  ADMIN: 'admin',
  FINANZAS: 'finanzas',
  LOGISTICA: 'logistica',
  COMERCIAL: 'comercial',
});

/** Roles que se pueden asignar al añadir un usuario (excluye owner) */
const VENDOR_ASSIGNABLE_ROLES = Object.freeze([
  VENDOR_USER_ROLES.ADMIN,
  VENDOR_USER_ROLES.FINANZAS,
  VENDOR_USER_ROLES.LOGISTICA,
  VENDOR_USER_ROLES.COMERCIAL,
]);

function isValidVendorRole(role) {
  return role && Object.values(VENDOR_USER_ROLES).includes(role);
}

function isAssignableVendorRole(role) {
  return role && VENDOR_ASSIGNABLE_ROLES.includes(role);
}

module.exports = {
  VENDOR_USER_ROLES,
  VENDOR_ASSIGNABLE_ROLES,
  isValidVendorRole,
  isAssignableVendorRole,
};
