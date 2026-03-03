export default function DashboardFrame() {
  return (
    <main className="frame">
      <aside className="sidebar">
        <h1>SEO.CRAWLER</h1>
        <p>Next frontend base</p>
      </aside>
      <section className="content">
        <header className="topbar">
          <h2>Crawl Dashboard</h2>
        </header>
        <div className="card">
          <h3>Migration Started</h3>
          <p>
            This is the reusable component shell in Next.js. Next step is
            migrating the current legacy dashboard sections into isolated
            components.
          </p>
        </div>
      </section>
    </main>
  );
}
