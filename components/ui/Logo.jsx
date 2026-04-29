export default function Logo({ compact = false, className = "" }) {
  return (
    <svg
      className={className}
      viewBox={compact ? "0 0 176 40" : "0 0 240 54"}
      role="img"
      aria-label="SEO CRAWLER"
      fill="none"
    >
      <text x="0" y="22" fill="currentColor" font-family="Syne, Manrope, sans-serif" font-weight="700" font-size="17" letter-spacing="-0.02em">SEO</text>
      <circle cx="64" cy="20" r="2.2" fill="currentColor" opacity=".55"></circle>
      <text x="68" y="22" fill="currentColor" font-family="Syne, Manrope, sans-serif" font-weight="700" font-size="17" letter-spacing="-0.02em">CRAWLER</text>
      {!compact ? <text x="0" y="40" fill="currentColor" opacity="0.68" fontFamily="Manrope, sans-serif" fontWeight="700" fontSize="11" letterSpacing=".28em">ESPACIO TECNICO SEO</text> : null}
    </svg>
  );
}
