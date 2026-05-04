import Skeleton from "../ui/Skeleton";

export default function AdminUsersSkeleton() {
  return (
    <div className="sk-admin">
      {/* Toolbar card */}
      <div className="sk-admin-toolbar">
        <Skeleton width="50%" height="20px" borderRadius="6px" />
        <Skeleton width="30%" height="14px" borderRadius="4px" />
        <div className="sk-admin-filters">
          <Skeleton width="100%" height="36px" borderRadius="8px" />
          <Skeleton width="100%" height="36px" borderRadius="8px" />
        </div>
      </div>
      {/* Table rows */}
      <div className="sk-admin-table">
        <div className="sk-admin-thead">
          {["15%", "20%", "10%", "8%", "8%", "12%", "18%"].map((w, i) => (
            <Skeleton key={i} width={w} height="12px" borderRadius="4px" />
          ))}
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="sk-admin-row">
            <Skeleton width="140px" height="18px" borderRadius="4px" />
            <Skeleton width="180px" height="14px" borderRadius="4px" />
            <Skeleton width="70px" height="22px" borderRadius="12px" />
            <Skeleton width="50px" height="14px" borderRadius="4px" />
            <Skeleton width="60px" height="22px" borderRadius="12px" />
            <Skeleton width="100px" height="14px" borderRadius="4px" />
            <Skeleton width="120px" height="28px" borderRadius="8px" />
          </div>
        ))}
      </div>
      <style jsx>{`
        .sk-admin {
          display: grid;
          gap: 16px;
        }
        .sk-admin-toolbar {
          display: grid;
          gap: 12px;
          padding: 20px;
          background: var(--bg2);
          border: 1px solid var(--border);
          border-radius: 16px;
        }
        .sk-admin-filters {
          display: grid;
          grid-template-columns: 1.5fr 0.7fr;
          gap: 14px;
        }
        .sk-admin-table {
          padding: 12px 16px;
          background: var(--bg2);
          border: 1px solid var(--border);
          border-radius: 16px;
          overflow-x: auto;
        }
        .sk-admin-thead,
        .sk-admin-row {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 0;
          border-bottom: 1px solid var(--border);
          min-width: 800px;
        }
        .sk-admin-thead {
          padding-bottom: 10px;
        }
        .sk-admin-row:last-child {
          border-bottom: none;
        }
        @media (max-width: 860px) {
          .sk-admin-filters {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
