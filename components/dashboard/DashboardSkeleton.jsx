import Skeleton from "../ui/Skeleton";

export default function DashboardSkeleton() {
  return (
    <div className="sk-dash">
      {/* HistoryPanel area */}
      <div className="sk-card">
        <Skeleton width="120px" height="18px" borderRadius="6px" style={{ marginBottom: "16px" }} />
        <div className="sk-history-grid">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="sk-history-item">
              <Skeleton width="80px" height="11px" borderRadius="4px" />
              <Skeleton width="100%" height="20px" borderRadius="4px" />
              <Skeleton width="70%" height="11px" borderRadius="4px" />
            </div>
          ))}
        </div>
      </div>

      {/* Legacy embed area */}
      <div className="sk-card">
        <div className="sk-stats-row">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="sk-stat-box">
              <Skeleton width="40px" height="11px" borderRadius="4px" />
              <Skeleton width="60px" height="28px" borderRadius="6px" />
            </div>
          ))}
        </div>
        <div className="sk-table">
          <Skeleton width="100%" height="32px" borderRadius="6px" />
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="sk-table-row">
              <Skeleton width="45%" height="14px" borderRadius="4px" />
              <Skeleton width="12%" height="14px" borderRadius="4px" />
              <Skeleton width="12%" height="14px" borderRadius="4px" />
              <Skeleton width="18%" height="14px" borderRadius="4px" />
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        .sk-dash {
          display: grid;
          gap: 18px;
        }
        .sk-card {
          background: var(--bg2);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 20px;
        }
        .sk-history-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 12px;
        }
        .sk-history-item {
          display: grid;
          gap: 8px;
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 16px;
        }
        .sk-stats-row {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          margin-bottom: 20px;
        }
        .sk-stat-box {
          display: grid;
          gap: 8px;
          background: var(--bg3);
          border-radius: 10px;
          padding: 12px;
        }
        .sk-table {
          display: grid;
          gap: 8px;
        }
        .sk-table-row {
          display: flex;
          gap: 12px;
          align-items: center;
          padding: 8px 0;
          border-top: 1px solid var(--border);
        }
        @media (max-width: 600px) {
          .sk-stats-row { grid-template-columns: repeat(2, 1fr); }
        }
      `}</style>
    </div>
  );
}
