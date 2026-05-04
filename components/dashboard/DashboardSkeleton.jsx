import Skeleton from "../ui/Skeleton";

export default function DashboardSkeleton() {
  return (
    <div className="sk-dash">
      <div className="sk-dash-sidebar">
        <Skeleton width="100%" height="40px" borderRadius="8px" className="mb" />
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} width="100%" height="60px" borderRadius="8px" className="mb-sm" />
        ))}
      </div>
      <div className="sk-dash-main">
        <Skeleton width="100%" height="120px" borderRadius="16px" className="mb" />
        <div className="sk-dash-grid">
          <Skeleton width="100%" height="200px" borderRadius="16px" />
          <Skeleton width="100%" height="200px" borderRadius="16px" />
          <Skeleton width="100%" height="200px" borderRadius="16px" />
        </div>
      </div>
      <style jsx>{`
        .sk-dash { display: grid; grid-template-columns: 270px minmax(0, 1fr); gap: 24px; align-items: flex-start; }
        .sk-dash-main { min-width: 0; }
        .sk-dash-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 16px; }
        .mb { margin-bottom: 20px; }
        .mb-sm { margin-bottom: 12px; }
        @media (max-width: 980px) {
          .sk-dash { grid-template-columns: 1fr; }
          .sk-dash-sidebar { display: none; }
        }
      `}</style>
    </div>
  );
}
