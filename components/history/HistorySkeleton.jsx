import Skeleton from "../ui/Skeleton";

export default function HistorySkeleton() {
  return (
    <div className="sk-history">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="sk-history-card">
          <Skeleton width="100px" height="12px" borderRadius="4px" />
          <Skeleton width="75%" height="20px" borderRadius="6px" />
          <Skeleton width="50%" height="14px" borderRadius="4px" />
          <div className="sk-history-meta">
            <Skeleton width="90px" height="14px" borderRadius="4px" />
            <Skeleton width="60px" height="14px" borderRadius="4px" />
          </div>
          <Skeleton width="120px" height="32px" borderRadius="8px" />
        </div>
      ))}
      <style jsx>{`
        .sk-history {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 18px;
          align-items: start;
        }
        .sk-history-card {
          display: grid;
          gap: 14px;
          padding: 20px;
          background: var(--bg2);
          border: 1px solid var(--border);
          border-radius: 16px;
        }
        .sk-history-meta {
          display: flex;
          justify-content: space-between;
          gap: 10px;
        }
      `}</style>
    </div>
  );
}
