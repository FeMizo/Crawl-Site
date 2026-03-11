export default function Logo({ compact = false, className = "" }) {
  const gradientId = compact
    ? "seoCrawlerLogoGradientCompact"
    : "seoCrawlerLogoGradient";

  return (
    <svg
      className={className}
      viewBox={compact ? "0 0 176 40" : "0 0 240 54"}
      role="img"
      aria-label="SEO CRAWLER"
      fill="none"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#86b9ff" />
          <stop offset="100%" stopColor="#4d8dff" />
        </linearGradient>
      </defs>
      <text x="0" y={compact ? "22" : "29"} fill="currentColor" fontFamily="Syne, Manrope, sans-serif" fontWeight="700" fontSize={compact ? "18" : "22"} letterSpacing="-0.02em">SEO</text>
      <circle cx={compact ? "40" : "45"} cy={compact ? "19" : "25"} r={compact ? "3.6" : "4.2"} fill={`url(#${gradientId})`} />
      <text x={compact ? "50" : "57"} y={compact ? "22" : "29"} fill={`url(#${gradientId})`} fontFamily="Syne, Manrope, sans-serif" fontWeight="700" fontSize={compact ? "18" : "22"} letterSpacing="-0.02em">CRAWLER</text>
      {!compact ? <text x="0" y="42" fill="currentColor" opacity="0.68" fontFamily="Manrope, sans-serif" fontWeight="700" fontSize="8.5" letterSpacing=".28em">ESPACIO TECNICO SEO</text> : null}
    </svg>
  );
}
