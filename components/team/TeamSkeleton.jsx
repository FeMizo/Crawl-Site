import Skeleton from "../ui/Skeleton";

const ROWS = 4;

export default function TeamSkeleton() {
  return (
    <div className="sk-wrap">
      {/* meta badge */}
      <Skeleton width="110px" height="22px" borderRadius="999px" />

      {/* table card */}
      <div className="sk-card">
        {/* thead */}
        <div className="sk-row sk-head">
          <div className="sk-cell sk-col-main"><Skeleton width="40px" height="11px" borderRadius="4px" /></div>
          <div className="sk-cell sk-col-role"><Skeleton width="28px" height="11px" borderRadius="4px" /></div>
          <div className="sk-cell sk-col-date"><Skeleton width="90px" height="11px" borderRadius="4px" /></div>
          <div className="sk-cell sk-col-action" />
        </div>

        {Array.from({ length: ROWS }).map((_, i) => (
          <div key={i} className="sk-row" style={{ opacity: 1 - i * 0.15 }}>
            {/* Email + nombre */}
            <div className="sk-cell sk-col-main">
              <div className="sk-name-cell">
                <Skeleton width="30px" height="30px" borderRadius="50%" />
                <div className="sk-name-stack">
                  <Skeleton width="120px" height="13px" borderRadius="4px" />
                  <Skeleton width="160px" height="11px" borderRadius="4px" />
                </div>
              </div>
            </div>
            {/* Rol */}
            <div className="sk-cell sk-col-role">
              <Skeleton width="60px" height="20px" borderRadius="999px" />
            </div>
            {/* Fecha */}
            <div className="sk-cell sk-col-date">
              <Skeleton width="80px" height="13px" borderRadius="4px" />
            </div>
            {/* Acción */}
            <div className="sk-cell sk-col-action">
              <Skeleton width="64px" height="28px" borderRadius="7px" />
            </div>
          </div>
        ))}
      </div>

      <style jsx>{`
        .sk-wrap {
          display: grid;
          gap: 14px;
        }
        .sk-card {
          background: var(--bg2);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 4px 0;
          overflow-x: auto;
        }
        .sk-row {
          display: flex;
          align-items: center;
          min-width: 520px;
          padding: 0 16px;
          border-bottom: 1px solid var(--border);
        }
        .sk-row:last-child {
          border-bottom: none;
        }
        .sk-head {
          opacity: 0.55;
          padding-top: 4px;
          padding-bottom: 4px;
        }
        .sk-cell {
          padding: 11px 8px;
          box-sizing: border-box;
        }
        .sk-col-main  { flex: 1; }
        .sk-col-role  { flex: 0 0 110px; }
        .sk-col-date  { flex: 0 0 140px; }
        .sk-col-action { flex: 0 0 100px; display: flex; justify-content: flex-end; }
        .sk-name-cell {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .sk-name-stack {
          display: grid;
          gap: 5px;
        }
      `}</style>
    </div>
  );
}
