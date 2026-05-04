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
