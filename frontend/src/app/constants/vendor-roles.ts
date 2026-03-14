/**
 * Roles de usuario en un vendor.
 * Deben coincidir con el enum vendor_user_role en PostgreSQL.
 */
export type VendorUserRole = 'owner' | 'admin' | 'finanzas' | 'logistica' | 'comercial';

export const VENDOR_USER_ROLES = {
  OWNER: 'owner',
  ADMIN: 'admin',
  FINANZAS: 'finanzas',
  LOGISTICA: 'logistica',
  COMERCIAL: 'comercial',
} as const;

/** Roles que se pueden asignar al añadir un usuario (excluye owner) */
export const VENDOR_ASSIGNABLE_ROLES: readonly VendorUserRole[] = [
  VENDOR_USER_ROLES.ADMIN,
  VENDOR_USER_ROLES.FINANZAS,
  VENDOR_USER_ROLES.LOGISTICA,
  VENDOR_USER_ROLES.COMERCIAL,
];

export function isAssignableVendorRole(role: string): role is VendorUserRole {
  return (VENDOR_ASSIGNABLE_ROLES as readonly string[]).includes(role);
}
