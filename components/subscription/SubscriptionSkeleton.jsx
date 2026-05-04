import Skeleton from "../ui/Skeleton";

export default function SubscriptionSkeleton() {
  return (
    <div className="sk-sub">
      {/* Current plan card */}
      <div className="sk-sub-card">
        <Skeleton width="90px" height="12px" borderRadius="4px" />
        <Skeleton width="60%" height="20px" borderRadius="6px" />
        <Skeleton width="45%" height="14px" borderRadius="4px" />
        <div className="sk-sub-row">
          <Skeleton width="120px" height="32px" borderRadius="8px" />
        </div>
      </div>
      {/* Plan cards carousel placeholder */}
      <div className="sk-sub-plans">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="sk-sub-plan">
            <Skeleton width="80px" height="12px" borderRadius="4px" />
            <Skeleton width="50%" height="28px" borderRadius="6px" />
            <Skeleton width="100%" height="14px" borderRadius="4px" />
            <Skeleton width="100%" height="14px" borderRadius="4px" />
            <Skeleton width="100%" height="14px" borderRadius="4px" />
            <div className="sk-sub-plan-cta">
              <Skeleton width="100%" height="36px" borderRadius="8px" />
            </div>
          </div>
        ))}
      </div>
      <style jsx>{`
        .sk-sub {
          display: grid;
          gap: 20px;
        }
        .sk-sub-card {
          display: grid;
          gap: 12px;
          padding: 20px;
          background: var(--bg2);
          border: 1px solid var(--border);
          border-radius: 16px;
        }
        .sk-sub-row {
          display: flex;
          gap: 10px;
          margin-top: 4px;
        }
        .sk-sub-plans {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
          gap: 16px;
        }
        .sk-sub-plan {
          display: grid;
          gap: 10px;
          padding: 20px;
          background: var(--bg2);
          border: 1px solid var(--border);
          border-radius: 16px;
        }
        .sk-sub-plan-cta {
          margin-top: 12px;
        }
      `}</style>
    </div>
  );
}
