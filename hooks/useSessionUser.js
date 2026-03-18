import { useCallback, useEffect, useLayoutEffect, useState } from "react";

const {
  clearStoredSessionUser,
  readStoredSessionUser,
  subscribeSessionUserChange,
  writeStoredSessionUser,
} = require("../lib/session-user-client");

export default function useSessionUser() {
  const [sessionUser, setSessionUserState] = useState(null);
  const [sessionHydrated, setSessionHydrated] = useState(false);

  const useClientLayoutEffect =
    typeof window !== "undefined" ? useLayoutEffect : useEffect;

  useClientLayoutEffect(() => {
    setSessionUserState(readStoredSessionUser());
    setSessionHydrated(true);
    return subscribeSessionUserChange(setSessionUserState);
  }, []);

  const setSessionUser = useCallback((user) => {
    const safeUser = writeStoredSessionUser(user);
    setSessionUserState(safeUser);
    return safeUser;
  }, []);

  const clearSessionUser = useCallback(() => {
    clearStoredSessionUser();
    setSessionUserState(null);
  }, []);

  return {
    sessionUser,
    sessionHydrated,
    setSessionUser,
    clearSessionUser,
  };
}
