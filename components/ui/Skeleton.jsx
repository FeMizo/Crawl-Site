export default function Skeleton({ width = "100%", height = "20px", borderRadius = "8px", className = "", style = {} }) {
  return (
    <div className={`skeleton ${className}`} style={{ width, height, borderRadius, ...style }}>
      <style jsx>{`
        .skeleton {
          background: linear-gradient(90deg, var(--bg3) 25%, var(--border) 50%, var(--bg3) 75%);
          background-size: 200% 100%;
          animation: pulse 2s infinite linear;
        }
        @keyframes pulse {
          0% {
            background-position: 200% 0;
          }
          100% {
            background-position: -200% 0;
          }
        }
      `}</style>
    </div>
  );
}

export function SkeletonGrid({ count = 3, minWidth = "280px", height = "150px" }) {
  return (
    <div className="skeleton-grid">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skeleton-card">
          <Skeleton height={height} borderRadius="16px" />
        </div>
      ))}
      <style jsx>{`
        .skeleton-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(${minWidth}, 1fr));
          gap: 20px;
          margin-top: 20px;
        }
      `}</style>
    </div>
  );
}

export function SkeletonPage() {
  return (
    <div className="skeleton-page">
      <Skeleton width="100%" height="150px" borderRadius="16px" className="mb-large" />
      
      <div className="skeleton-toolbar">
         <Skeleton width="120px" height="40px" borderRadius="10px" />
         <Skeleton width="120px" height="40px" borderRadius="10px" />
      </div>

      <SkeletonGrid count={6} />

      <style jsx>{`
        .skeleton-page {
          padding: 10px 0;
        }
        .mb-large { margin-bottom: 24px; }
        .skeleton-toolbar {
          display: flex;
          gap: 12px;
          margin-bottom: 24px;
        }
      `}</style>
    </div>
  );
}

export function SkeletonProjectList() {
  return (
    <div className="sk-list">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="sk-list-row">
          <Skeleton width="40px" height="40px" borderRadius="8px" />
          <div className="sk-list-col">
            <Skeleton width="180px" height="20px" borderRadius="4px" />
            <Skeleton width="120px" height="14px" borderRadius="4px" />
          </div>
          <div className="sk-list-col flex-1 hide-mobile">
            <Skeleton width="100px" height="16px" borderRadius="4px" />
          </div>
          <div className="sk-list-col hide-mobile">
            <Skeleton width="80px" height="24px" borderRadius="12px" />
          </div>
        </div>
      ))}
      <style jsx>{`
        .sk-list { display: flex; flex-direction: column; gap: 12px; margin-top: 20px; }
        .sk-list-row { display: flex; align-items: center; gap: 16px; padding: 16px; background: var(--bg2); border: 1px solid var(--border); border-radius: 12px; }
        .sk-list-col { display: flex; flex-direction: column; gap: 8px; }
        .flex-1 { flex: 1; }
        @media (max-width: 768px) { .hide-mobile { display: none; } }
      `}</style>
    </div>
  );
}

export function SkeletonProjectGrid() {
  return (
    <div className="sk-grid">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="sk-grid-card">
          <div className="sk-grid-head">
            <Skeleton width="32px" height="32px" borderRadius="8px" />
            <Skeleton width="60px" height="24px" borderRadius="12px" />
          </div>
          <Skeleton width="70%" height="20px" borderRadius="4px" className="mt-sm" />
          <Skeleton width="40%" height="14px" borderRadius="4px" className="mt-xs" />
          <div className="sk-grid-foot">
            <Skeleton width="100%" height="36px" borderRadius="8px" />
          </div>
        </div>
      ))}
      <style jsx>{`
        .sk-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; margin-top: 20px; }
        .sk-grid-card { padding: 20px; background: var(--bg2); border: 1px solid var(--border); border-radius: 16px; display: flex; flex-direction: column; }
        .sk-grid-head { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; }
        .sk-grid-foot { margin-top: 24px; padding-top: 16px; border-top: 1px solid var(--border); }
        .mt-sm { margin-top: 12px; }
        .mt-xs { margin-top: 8px; }
      `}</style>
    </div>
  );
}

export function SkeletonDashboard() {
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
