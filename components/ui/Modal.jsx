import { useEffect } from "react";
import Icon from "./Icon";

export default function Modal({ title, children, onClose, actions }) {
  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">{title}</span>
          <button className="modal-close" onClick={onClose} aria-label="Cerrar">
            <Icon name="close" size={16} />
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {actions && <div className="modal-actions">{actions}</div>}
      </div>

      <style jsx>{`
        .modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 1000;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
        }
        .modal-card {
          background: var(--bg2);
          border: 1px solid var(--border2);
          border-radius: 14px;
          width: 100%;
          max-width: 420px;
          box-shadow: 0 24px 64px rgba(0, 0, 0, 0.5);
          display: grid;
          gap: 0;
        }
        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 18px 20px 16px;
          border-bottom: 1px solid var(--border2);
        }
        .modal-title {
          font-size: 15px;
          font-weight: 700;
          color: var(--text);
          font-family: "Syne", sans-serif;
        }
        .modal-close {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          border: none;
          background: none;
          color: var(--muted);
          border-radius: 6px;
          cursor: pointer;
          transition: color 0.15s, background 0.15s;
        }
        .modal-close:hover {
          color: var(--text);
          background: var(--bg3);
        }
        .modal-body {
          padding: 20px;
        }
        .modal-actions {
          padding: 0 20px 20px;
          display: flex;
          gap: 10px;
          justify-content: flex-end;
        }
      `}</style>
    </div>
  );
}
