import Skeleton from "../ui/Skeleton";

export default function RoadmapSkeleton() {
  return (
    <div className="sk-roadmap">
      {/* Filters bar */}
      <div className="sk-roadmap-bar">
        <Skeleton width="200px" height="36px" borderRadius="8px" />
        <Skeleton width="140px" height="36px" borderRadius="8px" />
      </div>
      {/* Phase cards */}
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="sk-roadmap-phase">
          <Skeleton width="40%" height="18px" borderRadius="4px" />
          <Skeleton width="100%" height="8px" borderRadius="4px" />
          {Array.from({ length: 3 }).map((__, j) => (
            <Skeleton key={j} width="100%" height="40px" borderRadius="8px" />
          ))}
        </div>
      ))}
      <style jsx>{`
        .sk-roadmap {
          display: grid;
          gap: 16px;
        }
        .sk-roadmap-bar {
          display: flex;
          gap: 12px;
        }
        .sk-roadmap-phase {
          display: grid;
          gap: 10px;
          padding: 20px;
          background: var(--bg2);
          border: 1px solid var(--border);
          border-radius: 16px;
        }
      `}</style>
    </div>
  );
}
