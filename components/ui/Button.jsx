import Link from "next/link";
import { motion } from "motion/react";

const MotionLink = motion.create ? motion.create(Link) : motion(Link);

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

const VARIANT_CLASS = {
  solid_primary:    "btn-primary",
  solid_secondary:  "btn-neutral",
  solid_danger:     "btn-danger-solid",
  outline_primary:  "btn-secondary",
  outline_secondary:"btn-ghost",
  outline_danger:   "btn-danger",
};

export default function Button({
  href,
  variant = "outline",
  tone = "secondary",
  size = "md",
  loading = false,
  iconLeft = null,
  iconRight = null,
  className = "",
  children,
  disabled,
  ...props
}) {
  const classes = cx(
    "btn",
    `btn-${size}`,
    VARIANT_CLASS[`${variant}_${tone}`] || "",
    loading && "is-loading",
    className,
  );

  const content = (
    <>
      {iconLeft ? <span className="btn-icon left">{iconLeft}</span> : null}
      <span>{loading ? "Cargando..." : children}</span>
      {iconRight ? <span className="btn-icon right">{iconRight}</span> : null}
    </>
  );

  if (href) {
    return (
      <MotionLink
        href={href}
        className={classes}
        aria-disabled={disabled || loading ? "true" : undefined}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.97 }}
        transition={{ duration: 0.1 }}
        {...props}
      >
        {content}
      </MotionLink>
    );
  }

  return (
    <motion.button 
      className={classes} 
      disabled={disabled || loading}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.1 }}
      {...props}
    >
      {content}
    </motion.button>
  );
}
