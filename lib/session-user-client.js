const SESSION_USER_STORAGE_KEY = "seoCrawlerSessionUser";
const SESSION_USER_EVENT = "seo-session-user-change";

function sanitizeSessionUser(user) {
  if (!user || typeof user !== "object") return null;

  return {
    id: user.id || null,
    name: user.name || null,
    email: user.email || null,
    role: user.role || null,
    roleLabel: user.roleLabel || null,
    permissions: user.permissions || null,
    createdAt: user.createdAt || null,
  };
}

function readStoredSessionUser() {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(SESSION_USER_STORAGE_KEY);
    if (!raw) return null;
    return sanitizeSessionUser(JSON.parse(raw));
  } catch {
    return null;
  }
}

function dispatchSessionUserChange(user) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(SESSION_USER_EVENT, {
      detail: { user: sanitizeSessionUser(user) },
    }),
  );
}

function writeStoredSessionUser(user) {
  if (typeof window === "undefined") return sanitizeSessionUser(user);
  const safeUser = sanitizeSessionUser(user);

  if (!safeUser) {
    window.localStorage.removeItem(SESSION_USER_STORAGE_KEY);
    dispatchSessionUserChange(null);
    return null;
  }

  window.localStorage.setItem(
    SESSION_USER_STORAGE_KEY,
    JSON.stringify(safeUser),
  );
  dispatchSessionUserChange(safeUser);
  return safeUser;
}

function clearStoredSessionUser() {
  return writeStoredSessionUser(null);
}

function subscribeSessionUserChange(listener) {
  if (typeof window === "undefined") return () => {};

  const onCustomEvent = (event) => {
    listener(sanitizeSessionUser(event?.detail?.user));
  };

  const onStorage = (event) => {
    if (event.key !== SESSION_USER_STORAGE_KEY) return;
    try {
      listener(
        event.newValue
          ? sanitizeSessionUser(JSON.parse(event.newValue))
          : null,
      );
    } catch {
      listener(null);
    }
  };

  window.addEventListener(SESSION_USER_EVENT, onCustomEvent);
  window.addEventListener("storage", onStorage);

  return () => {
    window.removeEventListener(SESSION_USER_EVENT, onCustomEvent);
    window.removeEventListener("storage", onStorage);
  };
}

module.exports = {
  clearStoredSessionUser,
  readStoredSessionUser,
  sanitizeSessionUser,
  subscribeSessionUserChange,
  writeStoredSessionUser,
};
