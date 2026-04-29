export default function FaviconMark({ className = "" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 44 44"
      role="img"
      aria-label="SEO CRAWLER"
      fill="none"
    >
      <defs>
        <linearGradient id="seoCrawlerMarkGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#5eb3ff" />
          <stop offset="50%" stopColor="#4d8dff" />
          <stop offset="100%" stopColor="#0066ff" />
        </linearGradient>
        <linearGradient id="seoCrawlerAccent" x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#00ff88" />
          <stop offset="100%" stopColor="#00cc6f" />
        </linearGradient>
        <filter id="seoCrawlerShadow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.15" />
        </filter>
      </defs>

      {/* Background with subtle border */}
      <rect
        x="1.5"
        y="1.5"
        width="41"
        height="41"
        rx="11"
        fill="rgba(77,141,255,.1)"
        stroke="rgba(77,141,255,.25)"
        strokeWidth="0.5"
      />

      {/* Main crawler path - left node and curve */}
      <circle
        cx="14"
        cy="18"
        r="2.5"
        fill="url(#seoCrawlerMarkGradient)"
        filter="url(#seoCrawlerShadow)"
      />

      {/* Primary path - main diagonal sweep */}
      <path
        d="M16.5 16 Q24 14 28 20 Q30 22 29.5 26"
        stroke="url(#seoCrawlerMarkGradient)"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter="url(#seoCrawlerShadow)"
      />

      {/* End point - right node */}
      <circle
        cx="29"
        cy="26"
        r="2.5"
        fill="url(#seoCrawlerMarkGradient)"
        filter="url(#seoCrawlerShadow)"
      />

      {/* Secondary discovery path - accent accent */}
      <path
        d="M14 18 L19 23 L22 20"
        stroke="url(#seoCrawlerAccent)"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.9"
        filter="url(#seoCrawlerShadow)"
      />

      {/* Lower accent nodes */}
      <circle
        cx="19"
        cy="23"
        r="1.8"
        fill="url(#seoCrawlerAccent)"
        opacity="0.85"
      />

      {/* Small detail - spider leg indicator */}
      <path
        d="M22 20 L24 24"
        stroke="rgba(77,141,255,.5)"
        strokeWidth="1.2"
        strokeLinecap="round"
        opacity="0.6"
      />
    </svg>
  );
}
