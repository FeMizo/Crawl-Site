import Skeleton from "../ui/Skeleton";

const ROWS = 8;
const COL_WIDTHS = ["18%", "22%", "9%", "7%", "8%", "11%", "auto"];

export default function AdminUsersSkeleton() {
  return (
    <div className="sk-wrap">
      {/* Toolbar card */}
      <div className="sk-card sk-toolbar">
        <div className="sk-toolbar-head">
          <div className="sk-eyebrow-group">
            <Skeleton width="12px" height="12px" borderRadius="3px" />
            <Skeleton width="70px" height="11px" borderRadius="4px" />
          </div>
          <div className="sk-badges">
            <Skeleton width="72px" height="22px" borderRadius="999px" />
            <Skeleton width="80px" height="22px" borderRadius="999px" />
          </div>
        </div>
        <div className="sk-filters">
          <Skeleton width="100%" height="36px" borderRadius="8px" />
          <Skeleton width="100%" height="36px" borderRadius="8px" />
        </div>
      </div>

      {/* Table card */}
      <div className="sk-card sk-table-card">
        {/* thead */}
        <div className="sk-row sk-head">
          {COL_WIDTHS.map((w, i) => (
            <div key={i} className="sk-cell" style={{ flex: i === COL_WIDTHS.length - 1 ? "1" : `0 0 ${w}` }}>
              <Skeleton width={i === COL_WIDTHS.length - 1 ? "60px" : "80%"} height="11px" borderRadius="4px" />
            </div>
          ))}
        </div>

        {/* rows */}
        {Array.from({ length: ROWS }).map((_, i) => (
          <div key={i} className="sk-row" style={{ opacity: 1 - i * 0.08 }}>
            {/* Nombre + teléfono */}
            <div className="sk-cell" style={{ flex: `0 0 ${COL_WIDTHS[0]}` }}>
              <div className="sk-name-cell">
                <Skeleton width="28px" height="28px" borderRadius="50%" />
                <div className="sk-name-stack">
                  <Skeleton width="100px" height="13px" borderRadius="4px" />
                  <Skeleton width="72px" height="11px" borderRadius="4px" />
                </div>
              </div>
            </div>
            {/* Email */}
            <div className="sk-cell" style={{ flex: `0 0 ${COL_WIDTHS[1]}` }}>
              <Skeleton width="85%" height="13px" borderRadius="4px" />
            </div>
            {/* Rol badge */}
            <div className="sk-cell" style={{ flex: `0 0 ${COL_WIDTHS[2]}` }}>
              <Skeleton width="58px" height="20px" borderRadius="999px" />
            </div>
            {/* Plan */}
            <div className="sk-cell" style={{ flex: `0 0 ${COL_WIDTHS[3]}` }}>
              <Skeleton width="44px" height="13px" borderRadius="4px" />
            </div>
            {/* Estado badge */}
            <div className="sk-cell" style={{ flex: `0 0 ${COL_WIDTHS[4]}` }}>
              <Skeleton width="56px" height="20px" borderRadius="999px" />
            </div>
            {/* Fecha */}
            <div className="sk-cell" style={{ flex: `0 0 ${COL_WIDTHS[5]}` }}>
              <Skeleton width="88px" height="13px" borderRadius="4px" />
            </div>
            {/* Acciones */}
            <div className="sk-cell sk-actions" style={{ flex: 1 }}>
              <Skeleton width="80px" height="28px" borderRadius="7px" />
              <Skeleton width="56px" height="28px" borderRadius="7px" />
            </div>
          </div>
        ))}
      </div>

      <style jsx>{`
        .sk-wrap {
          display: grid;
          gap: 16px;
        }
        .sk-card {
          background: var(--bg2);
          border: 1px solid var(--border);
          border-radius: 16px;
        }
        .sk-toolbar {
          padding: 16px 20px;
          display: grid;
          gap: 14px;
        }
        .sk-toolbar-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .sk-eyebrow-group {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .sk-badges {
          display: flex;
          gap: 8px;
        }
        .sk-filters {
          display: grid;
          grid-template-columns: 1.5fr 0.7fr;
          gap: 12px;
        }
        .sk-table-card {
          padding: 4px 0;
          overflow-x: auto;
        }
        .sk-row {
          display: flex;
          align-items: center;
          gap: 0;
          min-width: 820px;
          padding: 0 16px;
          border-bottom: 1px solid var(--border);
        }
        .sk-row:last-child {
          border-bottom: none;
        }
        .sk-head {
          padding-top: 10px;
          padding-bottom: 10px;
          opacity: 0.6;
        }
        .sk-cell {
          padding: 11px 8px;
          box-sizing: border-box;
        }
        .sk-name-cell {
          display: flex;
          align-items: center;
          gap: 9px;
        }
        .sk-name-stack {
          display: grid;
          gap: 5px;
        }
        .sk-actions {
          display: flex;
          gap: 6px;
          align-items: center;
        }
        @media (max-width: 860px) {
          .sk-filters {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
