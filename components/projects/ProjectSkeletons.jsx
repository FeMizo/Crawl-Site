import Skeleton from "../ui/Skeleton";
import Card from "../ui/Card";

/**
 * Skeleton for ProjectListView — mimics the table layout inside a Card.
 * 5 columns: Project (name+url), Crawls, Last Run, Created, Actions.
 */
export function ProjectListSkeleton() {
  return (
    <Card className="table-card" padding="sm">
      <div className="sk-table-wrap">
        <table className="sk-table">
          <thead>
            <tr>
              {["35%", "10%", "22%", "18%", "15%"].map((w, i) => (
                <th key={i}>
                  <Skeleton
                    width={i < 4 ? "60%" : "0"}
                    height="10px"
                    borderRadius="3px"
                    style={i === 4 ? { visibility: "hidden" } : {}}
                  />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 5 }).map((_, i) => (
              <tr key={i}>
                {/* Project name + url */}
                <td>
                  <div className="sk-cell-name">
                    <Skeleton width="55%" height="14px" borderRadius="4px" />
                    <Skeleton width="70%" height="11px" borderRadius="3px" />
                  </div>
                </td>
                {/* Crawls */}
                <td>
                  <Skeleton width="28px" height="16px" borderRadius="4px" />
                </td>
                {/* Last run */}
                <td>
                  <div className="sk-cell-run">
                    <Skeleton width="80%" height="12px" borderRadius="3px" />
                    <Skeleton width="55%" height="11px" borderRadius="3px" />
                  </div>
                </td>
                {/* Created */}
                <td>
                  <Skeleton width="75%" height="12px" borderRadius="3px" />
                </td>
                {/* Actions */}
                <td>
                  <div className="sk-actions">
                    <Skeleton width="68px" height="30px" borderRadius="8px" />
                    <Skeleton width="68px" height="30px" borderRadius="8px" />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <style jsx>{`
        .sk-table-wrap { overflow-x: auto; }
        .sk-table { width: 100%; border-collapse: collapse; min-width: 680px; }
        .sk-table th,
        .sk-table td {
          text-align: left;
          padding: 12px 14px;
          border-bottom: 1px solid var(--border);
          vertical-align: middle;
        }
        .sk-table th {
          background: rgba(255, 255, 255, 0.02);
        }
        .sk-table tbody tr:last-child td {
          border-bottom: none;
        }
        .sk-cell-name { display: grid; gap: 5px; }
        .sk-cell-run  { display: grid; gap: 4px; }
        .sk-actions   { display: flex; gap: 8px; justify-content: flex-end; }
      `}</style>
    </Card>
  );
}

/**
 * Skeleton for ProjectGridView — mimics the 3-column card grid.
 * Each card: avatar + name/url + badge  →  stats row  →  health bar  →  footer
 */
export function ProjectGridSkeleton() {
  return (
    <div className="sk-grid">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="sk-card">
          <div className="sk-body">
            {/* Top: avatar + identity + badge */}
            <div className="sk-top">
              <Skeleton width="40px" height="40px" borderRadius="12px" />
              <div className="sk-identity">
                <Skeleton width="60%" height="14px" borderRadius="4px" />
                <Skeleton width="80%" height="10px" borderRadius="3px" />
              </div>
              <Skeleton width="72px" height="20px" borderRadius="20px" />
            </div>
            {/* Stats row */}
            <div className="sk-stats">
              <div className="sk-stat">
                <Skeleton width="24px" height="18px" borderRadius="4px" />
                <Skeleton width="50px" height="9px" borderRadius="3px" />
              </div>
              <div className="sk-stat-sep" />
              <div className="sk-stat">
                <Skeleton width="18px" height="18px" borderRadius="4px" />
                <Skeleton width="36px" height="9px" borderRadius="3px" />
              </div>
              <div className="sk-stat-sep" />
              <div className="sk-stat">
                <Skeleton width="22px" height="18px" borderRadius="4px" />
                <Skeleton width="46px" height="9px" borderRadius="3px" />
              </div>
            </div>
            {/* Health bar */}
            <div className="sk-bar-row">
              <Skeleton width="100%" height="4px" borderRadius="99px" style={{ flex: 1 }} />
              <Skeleton width="65px" height="10px" borderRadius="3px" />
            </div>
          </div>
          {/* Footer */}
          <div className="sk-footer">
            <Skeleton width="100px" height="11px" borderRadius="3px" />
            <Skeleton width="28px" height="28px" borderRadius="8px" />
          </div>
        </div>
      ))}
      <style jsx>{`
        .sk-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }
        @media (max-width: 1100px) {
          .sk-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 600px) {
          .sk-grid { grid-template-columns: 1fr; }
        }
        .sk-card {
          background: var(--bg2);
          border: 1px solid var(--border2);
          border-radius: 16px;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .sk-body {
          display: flex;
          flex-direction: column;
          gap: 14px;
          padding: 18px 18px 14px;
        }
        .sk-top {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .sk-identity {
          display: grid;
          gap: 5px;
          flex: 1;
          min-width: 0;
        }
        .sk-stats {
          display: flex;
          align-items: center;
          background: var(--bg3);
          border-radius: 10px;
          padding: 10px 14px;
        }
        .sk-stat {
          display: flex;
          flex-direction: column;
          gap: 4px;
          flex: 1;
          min-width: 0;
        }
        .sk-stat-sep {
          width: 1px;
          height: 28px;
          background: var(--border2);
          flex: 0 0 auto;
          margin: 0 12px;
        }
        .sk-bar-row {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .sk-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 18px 14px;
          border-top: 1px solid var(--border2);
        }
      `}</style>
    </div>
  );
}
