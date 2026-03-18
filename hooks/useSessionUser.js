import { useEffect, useState } from "react";

const {
  clearStoredSessionUser,
  readStoredSessionUser,
  subscribeSessionUserChange,
  writeStoredSessionUser,
} = require("../lib/session-user-client");

export default function useSessionUser() {
  const [sessionUser, setSessionUserState] = useState(() =>
    readStoredSessionUser(),
  );

  useEffect(() => subscribeSessionUserChange(setSessionUserState), []);

  const setSessionUser = (user) => {
    const safeUser = writeStoredSessionUser(user);
    setSessionUserState(safeUser);
    return safeUser;
  };

  const clearSessionUser = () => {
    clearStoredSessionUser();
    setSessionUserState(null);
  };

  return {
    sessionUser,
    setSessionUser,
    clearSessionUser,
  };
}
