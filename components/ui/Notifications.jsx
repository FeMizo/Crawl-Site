import { useCallback, useState } from "react";
import Icon from "./Icon";

let nextId = 1;

export function useNotifications() {
  const [items, setItems] = useState([]);

  const notify = useCallback((input) => {
    const item = {
      id: nextId++,
      tone: input?.tone || "info",
      title: input?.title || "",
      message: input?.message || "",
    };
    setItems((current) => [item, ...current].slice(0, 4));
    window.setTimeout(() => {
      setItems((current) => current.filter((entry) => entry.id !== item.id));
    }, input?.durationMs || 4500);
    return item.id;
  }, []);

  const dismiss = useCallback((id) => {
    setItems((current) => current.filter((entry) => entry.id !== id));
  }, []);

  return { notifications: items, notify, dismiss };
}

export default function Notifications({ items, onDismiss }) {
  if (!items?.length) return null;
  return (
    <div className="notification-stack" role="status" aria-live="polite">
      {items.map((item) => (
        <div key={item.id} className={`notification ${item.tone}`}>
          <div className="notification-icon">
            <Icon name={item.tone === "error" ? "shield" : "check"} size={14} />
          </div>
          <div className="notification-copy">
            {item.title ? <strong>{item.title}</strong> : null}
            {item.message ? <span>{item.message}</span> : null}
          </div>
          <button type="button" onClick={() => onDismiss(item.id)} aria-label="Cerrar notificacion">
            <Icon name="close" size={14} />
          </button>
        </div>
      ))}
      <style jsx>{`
        .notification-stack {
          position: fixed;
          top: 18px;
          right: 18px;
          z-index: 1200;
          display: grid;
          gap: 10px;
          width: min(360px, calc(100vw - 28px));
        }
        .notification {
          display: grid;
          grid-template-columns: auto minmax(0, 1fr) auto;
          align-items: start;
          gap: 10px;
          border: 1px solid var(--border2);
          border-radius: 10px;
          background: var(--bg2);
          color: var(--text);
          box-shadow: 0 18px 44px rgba(0,0,0,0.28);
          padding: 12px;
        }
        .notification.error {
          border-color: rgba(255,82,82,0.35);
        }
        .notification.success {
          border-color: rgba(0,255,136,0.28);
        }
        .notification-icon {
          color: var(--accent);
          padding-top: 2px;
        }
        .notification.error .notification-icon {
          color: var(--error);
        }
        .notification-copy {
          display: grid;
          gap: 3px;
          min-width: 0;
        }
        .notification-copy strong {
          font-size: 13px;
        }
        .notification-copy span {
          color: var(--text2);
          font-size: 13px;
          overflow-wrap: anywhere;
        }
        .notification button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          border: 0;
          border-radius: 6px;
          background: transparent;
          color: var(--text2);
          cursor: pointer;
        }
        .notification button:hover {
          background: var(--bg3);
          color: var(--text);
        }
      `}</style>
    </div>
  );
}
