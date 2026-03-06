export default function PageContainer({ className = "", children }) {
  return <section className={["page-container", className].filter(Boolean).join(" ")}>{children}</section>;
}
