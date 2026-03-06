export default function Card({
  as: Tag = "section",
  className = "",
  padding = "md",
  children,
  ...props
}) {
  return (
    <Tag className={["ui-card", `ui-card-${padding}`, className].filter(Boolean).join(" ")} {...props}>
      {children}
    </Tag>
  );
}
