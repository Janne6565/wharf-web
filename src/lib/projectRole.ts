// Small framework-agnostic helpers for project roles, shared by the projects hub
// and the project-detail screen. Roles are the backend's OWNER / ADMIN / MEMBER
// (with undefined defensively treated as MEMBER).

type Role = "OWNER" | "ADMIN" | "MEMBER";

type RoleLabelKey =
  | "projectDetail.roles.owner"
  | "projectDetail.roles.admin"
  | "projectDetail.roles.member";

// Maps a role to its i18n label key. Returning a literal union keeps the typed
// t() happy without a dynamic template-literal key.
export function roleLabelKey(role: string | undefined): RoleLabelKey {
  if (role === "OWNER") return "projectDetail.roles.owner";
  if (role === "ADMIN") return "projectDetail.roles.admin";
  return "projectDetail.roles.member";
}

export function canAdminister(role: string | undefined): boolean {
  return role === "OWNER" || role === "ADMIN";
}

export function isOwner(role: string | undefined): boolean {
  return role === "OWNER";
}

export const ROLE_ORDER: readonly Role[] = ["OWNER", "ADMIN", "MEMBER"];
