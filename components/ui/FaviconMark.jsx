import { motion } from "motion/react";

const nodeVariants = {
  hidden: { scale: 0, opacity: 0 },
  visible: (i) => ({
    scale: 1,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 260,
      damping: 18,
      delay: 0.3 + i * 0.15,
    },
  }),
};

const pathVariants = {
  hidden: { pathLength: 0, opacity: 0 },
  visible: (i) => ({
    pathLength: 1,
    opacity: 1,
    transition: {
      pathLength: { duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.1 + i * 0.12 },
      opacity: { duration: 0.2, delay: 0.1 + i * 0.12 },
    },
  }),
};

export default function FaviconMark({ className = "", animate = true }) {
  const initial = animate ? "hidden" : "visible";
  const anim = animate ? "visible" : "visible";

  return (
    <motion.svg
      className={className}
      viewBox="0 0 44 44"
      role="img"
      aria-label="SEO CRAWLER"
      fill="none"
      initial={initial}
      animate={anim}
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

      {/* Main crawler path - left node */}
      <motion.circle
        cx="14"
        cy="18"
        r="2.5"
        fill="url(#seoCrawlerMarkGradient)"
        filter="url(#seoCrawlerShadow)"
        variants={nodeVariants}
        custom={0}
      />

      {/* Primary path - main diagonal sweep (draws itself) */}
      <motion.path
        d="M16.5 16 Q24 14 28 20 Q30 22 29.5 26"
        stroke="url(#seoCrawlerMarkGradient)"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter="url(#seoCrawlerShadow)"
        fill="none"
        variants={pathVariants}
        custom={0}
      />

      {/* End point - right node */}
      <motion.circle
        cx="29"
        cy="26"
        r="2.5"
        fill="url(#seoCrawlerMarkGradient)"
        filter="url(#seoCrawlerShadow)"
        variants={nodeVariants}
        custom={1}
      />

      {/* Secondary discovery path - accent (draws itself) */}
      <motion.path
        d="M14 18 L19 23 L22 20"
        stroke="url(#seoCrawlerAccent)"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.9"
        filter="url(#seoCrawlerShadow)"
        fill="none"
        variants={pathVariants}
        custom={1}
      />

      {/* Lower accent node with idle pulse */}
      <motion.circle
        cx="19"
        cy="23"
        r="1.8"
        fill="url(#seoCrawlerAccent)"
        variants={nodeVariants}
        custom={2}
        animate={animate ? {
          scale: [1, 1.2, 1],
          opacity: [0.85, 1, 0.85],
        } : undefined}
        transition={animate ? {
          duration: 2.5,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1.5,
        } : undefined}
      />

      {/* Small detail - spider leg indicator (draws itself) */}
      <motion.path
        d="M22 20 L24 24"
        stroke="rgba(77,141,255,.5)"
        strokeWidth="1.2"
        strokeLinecap="round"
        fill="none"
        variants={pathVariants}
        custom={2}
        style={{ opacity: 0.6 }}
      />
    </motion.svg>
  );
}
