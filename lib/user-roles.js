const USER_ROLE = {
  OWNER: "owner",
  SUPER_ADMIN: "super_admin",
  ADMIN: "admin",
  EDITOR: "editor",
  USER: "user",
};

const USER_ROLE_VALUES = Object.values(USER_ROLE);

function normalizeRole(role) {
  const value = String(role || "")
    .trim()
    .toLowerCase();
  return USER_ROLE_VALUES.includes(value) ? value : USER_ROLE.USER;
}

function parseEmailList(raw) {
  return new Set(
    String(raw || "")
      .split(",")
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean),
  );
}

function getOwnerEmails() {
  return parseEmailList(process.env.OWNER_EMAILS);
}

function getRoadmapAdminEmails() {
  return parseEmailList(process.env.ROADMAP_ADMIN_EMAILS);
}

function getSystemRoleForEmail(email) {
  const normalized = String(email || "").trim().toLowerCase();
  if (!normalized) return null;
  if (getOwnerEmails().has(normalized)) {
    return USER_ROLE.OWNER;
  }
  return null;
}

function getAssignedRole(user) {
  return normalizeRole(user?.role);
}

function getEffectiveRole(user) {
  return getSystemRoleForEmail(user?.email) || getAssignedRole(user);
}

function isOwner(user) {
  return getEffectiveRole(user) === USER_ROLE.OWNER;
}

function isSuperAdmin(user) {
  const role = getEffectiveRole(user);
  return role === USER_ROLE.OWNER || role === USER_ROLE.SUPER_ADMIN;
}

function isAdmin(user) {
  const role = getEffectiveRole(user);
  return (
    role === USER_ROLE.OWNER ||
    role === USER_ROLE.SUPER_ADMIN ||
    role === USER_ROLE.ADMIN
  );
}

function canManageUsers(user) {
  return isAdmin(user);
}

function canEditContent(user) {
  const role = getEffectiveRole(user);
  if (
    role === USER_ROLE.OWNER ||
    role === USER_ROLE.SUPER_ADMIN ||
    role === USER_ROLE.ADMIN ||
    role === USER_ROLE.EDITOR
  ) {
    return true;
  }

  const email = String(user?.email || "").trim().toLowerCase();
  if (!email) return false;
  return getRoadmapAdminEmails().has(email);
}

function getAssignableRoles(actor) {
  const role = getEffectiveRole(actor);
  if (role === USER_ROLE.OWNER) {
    return [...USER_ROLE_VALUES];
  }
  if (role === USER_ROLE.SUPER_ADMIN) {
    return USER_ROLE_VALUES.filter((value) => value !== USER_ROLE.OWNER);
  }
  if (role === USER_ROLE.ADMIN) {
    return [USER_ROLE.EDITOR, USER_ROLE.USER];
  }
  return [];
}

function canAssignRole(actor, targetRole) {
  return getAssignableRoles(actor).includes(normalizeRole(targetRole));
}

function canManageTarget(actor, target) {
  const actorRole = getEffectiveRole(actor);
  const targetRole = getEffectiveRole(target);

  if (actorRole === USER_ROLE.OWNER) {
    return true;
  }
  if (actorRole === USER_ROLE.SUPER_ADMIN) {
    return targetRole !== USER_ROLE.OWNER;
  }
  if (actorRole === USER_ROLE.ADMIN) {
    return targetRole === USER_ROLE.USER || targetRole === USER_ROLE.EDITOR;
  }
  return false;
}

function getRoleLabel(role) {
  switch (normalizeRole(role)) {
    case USER_ROLE.OWNER:
      return "Owner";
    case USER_ROLE.SUPER_ADMIN:
      return "Super Admin";
    case USER_ROLE.ADMIN:
      return "Admin";
    case USER_ROLE.EDITOR:
      return "Editor";
    default:
      return "Usuario";
  }
}

function buildRolePermissions(user) {
  return {
    canManageUsers: canManageUsers(user),
    canEditContent: canEditContent(user),
    assignableRoles: getAssignableRoles(user),
  };
}

module.exports = {
  USER_ROLE,
  USER_ROLE_VALUES,
  buildRolePermissions,
  canAssignRole,
  canEditContent,
  canManageTarget,
  canManageUsers,
  getAssignableRoles,
  getAssignedRole,
  getEffectiveRole,
  getOwnerEmails,
  getRoleLabel,
  isAdmin,
  isOwner,
  isSuperAdmin,
  normalizeRole,
};
