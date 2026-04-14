import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import useSessionUser from "../../hooks/useSessionUser";
import Icon from "../ui/Icon";

export default function UserMenu({ user }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const router = useRouter();
  const { clearSessionUser } = useSessionUser();

  useEffect(() => {
    if (!open) return;
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const logout = async () => {
    setOpen(false);
    await fetch("/api/auth/logout", { method: "POST" });
    clearSessionUser();
    router.push("/login");
  };

  const label = user?.name || user?.email || "Usuario";

  return (
    <div className="user-menu-wrap" ref={ref}>
      <button
        className="user-menu-trigger"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="true"
        type="button"
      >
        <span className="user-menu-dot">
          <Icon name="user" size={13} />
        </span>
        <span className="user-menu-label">{label}</span>
        <span className="user-menu-chevron" style={{ transform: open ? "rotate(180deg)" : "none" }}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </button>

      {open && (
        <div className="user-menu-dropdown" role="menu">
          {user?.permissions?.canManageUsers && (
            <a
              className="user-menu-item"
              href="/admin/users"
              role="menuitem"
              onClick={() => setOpen(false)}
            >
              <Icon name="users" size={14} />
              Gestionar usuarios
            </a>
          )}
          <button
            className="user-menu-item user-menu-item-danger"
            onClick={logout}
            role="menuitem"
            type="button"
          >
            <Icon name="login" size={14} />
            Cerrar sesion
          </button>
        </div>
      )}

      <style jsx>{`
        .user-menu-wrap {
          position: relative;
          z-index: 50;
        }
        .user-menu-trigger {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: var(--bg3);
          border: 1px solid var(--border2);
          border-radius: 10px;
          color: var(--text2);
          padding: 7px 12px;
          font-size: 14px;
          font-family: "Manrope", sans-serif;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
          max-width: 200px;
        }
        .user-menu-trigger:hover,
        .user-menu-trigger[aria-expanded="true"] {
          border-color: var(--accent);
          color: var(--accent);
          background: var(--adim);
        }
        .user-menu-trigger:active {
          transform: scale(0.97);
          opacity: 0.9;
        }
        .user-menu-trigger:focus-visible {
          outline: 2px solid var(--accent);
          outline-offset: 2px;
        }
        .user-menu-dot {
          width: 22px;
          height: 22px;
          border-radius: 999px;
          background: var(--adim);
          color: var(--accent);
          display: grid;
          place-items: center;
          flex: 0 0 auto;
        }
        .user-menu-label {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          max-width: 120px;
        }
        .user-menu-chevron {
          display: inline-flex;
          align-items: center;
          flex: 0 0 auto;
          transition: transform 0.2s;
        }
        @keyframes menu-in {
          from { opacity: 0; transform: translateY(-6px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)   scale(1); }
        }
        .user-menu-dropdown {
          position: absolute;
          top: calc(100% + 6px);
          right: 0;
          min-width: 200px;
          background: var(--bg2);
          border: 1px solid var(--border2);
          border-radius: 14px;
          padding: 6px;
          display: flex;
          flex-direction: column;
          gap: 2px;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
          animation: menu-in 0.15s ease-out both;
          transform-origin: top right;
        }
        .user-menu-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 14px;
          border-radius: 10px;
          font-size: 14px;
          font-family: "Manrope", sans-serif;
          font-weight: 700;
          color: var(--text2);
          text-decoration: none;
          border: none;
          background: transparent;
          cursor: pointer;
          width: 100%;
          text-align: left;
          transition: all 0.15s;
        }
        .user-menu-item:hover {
          background: var(--bg3);
          color: var(--text);
        }
        .user-menu-item-danger {
          color: var(--error, #f87171);
        }
        .user-menu-item-danger:hover {
          background: var(--edim, rgba(248, 113, 113, 0.12));
          color: var(--error, #f87171);
        }
      `}</style>
    </div>
  );
}
