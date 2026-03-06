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
        <linearGradient id="seoCrawlerMarkGradient" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#86b9ff" />
          <stop offset="100%" stopColor="#4d8dff" />
        </linearGradient>
      </defs>
      <rect
        x="0.75"
        y="0.75"
        width="42.5"
        height="42.5"
        rx="12"
        fill="rgba(77,141,255,.12)"
        stroke="rgba(77,141,255,.32)"
      />
      <path
        d="M13.5 15.6c6-2.8 12.8 2.3 12.8 9.1-2.1-1.2-4.4-.8-6 .7L18 27.6l-5.2-5.1 2.3-2.3c1.6-1.6 2-3.9 1-5.4Z"
        fill="url(#seoCrawlerMarkGradient)"
      />
      <path
        d="M10 28.7c.4-2.3 1.5-4.2 3.2-5.8l2.4 2.3-.9 3.4-2.8 1.4a1.1 1.1 0 0 1-1.9-1.3Z"
        fill="#d5e6ff"
        opacity=".95"
      />
    </svg>
  );
}
