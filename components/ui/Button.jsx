import Link from "next/link";

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

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
    "ui-btn",
    `ui-btn-${variant}`,
    `ui-btn-${tone}`,
    `ui-btn-${size}`,
    loading && "is-loading",
    className,
  );

  const content = (
    <>
      {iconLeft ? <span className="ui-btn-icon left">{iconLeft}</span> : null}
      <span>{loading ? "Cargando..." : children}</span>
      {iconRight ? <span className="ui-btn-icon right">{iconRight}</span> : null}
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className={classes}
        aria-disabled={disabled || loading ? "true" : undefined}
        {...props}
      >
        {content}
      </Link>
    );
  }

  return (
    <button className={classes} disabled={disabled || loading} {...props}>
      {content}
    </button>
  );
}
