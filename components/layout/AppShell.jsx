import { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import TopHeader from "./TopHeader";
import PageContainer from "./PageContainer";
import { tUi } from "../../lib/ui-language";

const CURRENT_YEAR = new Date().getFullYear();

export default function AppShell({
  activeKey,
  title,
  kicker,
  description,
  user,
  actions,
  children,
  aside,
  contentClassName = "",
  showSidebar = true,
}) {
  const [theme, setTheme] = useState("dark");
  const [lang, setLang] = useState("es");

  useEffect(() => {
    const savedTheme = window.localStorage.getItem("seoCrawlerTheme") || "dark";
    const savedLang = window.localStorage.getItem("seoCrawlerLang") || "es";
    setTheme(savedTheme);
    setLang(savedLang);
    document.documentElement.setAttribute("data-theme", savedTheme);
    document.documentElement.lang = savedLang;
  }, []);

  const applyTheme = (nextTheme) => {
    setTheme(nextTheme);
    document.documentElement.setAttribute("data-theme", nextTheme);
    window.localStorage.setItem("seoCrawlerTheme", nextTheme);
    window.dispatchEvent(
      new CustomEvent("seo-theme-change", { detail: { theme: nextTheme } }),
    );
    if (typeof window.setTheme === "function") {
      try {
        window.setTheme(nextTheme);
      } catch {}
    }
  };

  const applyLang = (nextLang) => {
    setLang(nextLang);
    document.documentElement.lang = nextLang;
    window.localStorage.setItem("seoCrawlerLang", nextLang);
    window.dispatchEvent(
      new CustomEvent("seo-lang-change", { detail: { lang: nextLang } }),
    );
    if (typeof window.setLang === "function") {
      try {
        window.setLang(nextLang);
      } catch {}
    }
  };

  return (
    <main className="dashboard-shell-page">
      <div className={`dashboard-shell${showSidebar ? "" : " no-sidebar"}`}>
        {showSidebar ? (
          <Sidebar
            activeKey={activeKey}
            user={user}
            aside={aside}
            lang={lang}
          />
        ) : null}
        <div className="dashboard-main">
          <TopHeader
            eyebrow={kicker}
            title={title}
            description={description}
            lang={lang}
            theme={theme}
            onLangChange={applyLang}
            onThemeChange={applyTheme}
            user={user}
          />
          {actions ? (
            <div className="shell-content-bar">{actions}</div>
          ) : null}
          <PageContainer className={contentClassName}>{children}</PageContainer>
          <footer className="app-footer">
            <span className="app-footer-copy">© {CURRENT_YEAR} SEO Crawler</span>
            <nav className="app-footer-nav" aria-label="Footer">
              <a href="https://aionsite.com.mx/" target="_blank" rel="noopener noreferrer" className="footer-nav-link">{tUi(lang, "footerHome")}</a>
              <span className="footer-nav-sep" aria-hidden="true">·</span>
              <a href="https://aionsite.com.mx/blog" target="_blank" rel="noopener noreferrer" className="footer-nav-link">{tUi(lang, "footerBlog")}</a>
              <span className="footer-nav-sep" aria-hidden="true">·</span>
              <a href="/precios" className="footer-nav-link">{tUi(lang, "footerPricing")}</a>
              <span className="footer-nav-sep" aria-hidden="true">·</span>
              <a href="/aviso-privacidad" className="footer-nav-link">{tUi(lang, "footerPrivacy")}</a>
              <span className="footer-nav-sep" aria-hidden="true">·</span>
              <a href="/contacto" className="footer-nav-link">{tUi(lang, "footerContact")}</a>
            </nav>
            <div className="app-footer-social">
              <a
                href="https://www.facebook.com/aionsite/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="social-link"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.886v2.267h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/>
                </svg>
              </a>
              <a
                href="https://www.instagram.com/aionsite.webs/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="social-link"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                </svg>
              </a>
            </div>
          </footer>
        </div>
      </div>
      <style jsx global>{`
        .dashboard-shell-page {
          --space-1: 8px;
          --space-2: 12px;
          --space-3: 16px;
          --space-4: 20px;
          --space-5: 24px;
          --space-6: 28px;
          --radius-card: 20px;
          --radius-control: 14px;
          min-height: 100vh;
          background:
            radial-gradient(
              1200px 680px at 0% -10%,
              rgba(100, 181, 246, 0.14),
              transparent 55%
            ),
            radial-gradient(
              900px 620px at 100% 0%,
              rgba(0, 255, 136, 0.08),
              transparent 50%
            ),
            var(--bg);
          color: var(--text);
          overflow-x: hidden;
          overflow-y: visible;
        }
        .dashboard-shell {
          min-height: 100vh;
          display: grid;
          grid-template-columns: 270px minmax(0, 1fr);
          min-width: 0;
          overflow: visible;
        }
        .dashboard-shell.no-sidebar {
          grid-template-columns: minmax(0, 1fr);
        }
        .dashboard-sidebar {
          border-right: 1px solid var(--border);
          padding: var(--space-5) var(--space-3);
          display: grid;
          align-content: start;
          gap: var(--space-3);
          background: linear-gradient(
            180deg,
            rgba(255, 255, 255, 0.015),
            transparent
          );
          min-width: 0;
        }
        .dashboard-main {
          min-width: 0;
          display: flex;
          flex-direction: column;
          padding: 0 var(--space-6) var(--space-6);
          overflow: visible;
          min-height: 100vh;
        }
        .dashboard-main .page-container {
          flex: 1 0 auto;
        }
        .dashboard-main .app-footer {
          margin-top: auto;
        }
        .dashboard-top-header {
          position: sticky;
          top: 0;
          z-index: 40;
          padding: var(--space-4) var(--space-5);
          margin: 0 0 var(--space-4);
          border-bottom: 1px solid var(--border);
          display: flex;
          justify-content: space-between;
          gap: var(--space-3);
          align-items: flex-start;
          flex-wrap: wrap;
          min-width: 0;
        }
        .header-breadcrumb{
          flex: 1 1 100%;
          text-align: center;
        }
        .header-copy {
          min-width: 0;
          flex: 1 1 420px;
          overflow: hidden;
        }
        .header-copy h1 {
          font-family: "Syne", "Manrope", sans-serif;
          font-weight: 700;
          font-size: clamp(1.53rem, 2.3vw, 2.12rem);
          line-height: 1;
          margin: 0 0 var(--space-1);
          max-width: 100%;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .header-copy p {
          color: var(--text2);
          margin: 0;
          max-width: 860px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .page-kicker {
          font-size: 11px;
          color: var(--muted);
          letter-spacing: 0.22em;
          text-transform: uppercase;
          margin-bottom: var(--space-2);
        }
        .page-container {
          display: grid;
          gap: var(--space-4);
          min-width: 0;
          grid-auto-flow: row;
          align-items: stretch;
          align-content: start;
        }
        .page-container > * {
          min-width: 0;
          max-width: 100%;
        }
        .brand-block {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 0;
        }
        .brand-icon {
          width: 42px;
          height: 42px;
          display: grid;
          place-items: center;
          flex: 0 0 auto;
        }
        .brand-icon svg {
          width: 42px;
          height: 42px;
        }
        .sidebar-logo {
          width: min(100%, 210px);
          height: auto;
          display: block;
          max-width: 100%;
          color: var(--text);
        }
        .logo-sub {
          margin-top: 6px;
          letter-spacing: 0.14em;
          font-size: 11px;
          color: var(--muted);
          text-transform: uppercase;
          overflow-wrap: anywhere;
        }
        .dashboard-nav {
          display: grid;
          gap: var(--space-1);
          min-width: 0;
        }
        .dashboard-nav a {
          border: 1px solid transparent;
          background: transparent;
          color: var(--text2);
          border-radius: 12px;
          display: flex;
          align-items: center;
          gap: 10px;
          text-align: left;
          padding: 12px 14px;
          font-size: 15px;
          font-weight: 700;
          text-decoration: none;
          transition: all 0.2s ease;
          min-width: 0;
          overflow: hidden;
        }
        .dashboard-nav a:hover {
          border-color: var(--border2);
          color: var(--text);
        }
        .dashboard-nav a:focus-visible {
          outline: 2px solid var(--accent);
          outline-offset: -2px;
        }
        .dashboard-nav a.on {
          background: rgba(77, 141, 255, 0.14);
          color: #77abff;
          border-color: rgba(77, 141, 255, 0.4);
        }
        .dashboard-nav a.pending {
          background: rgba(77, 141, 255, 0.1);
          color: var(--text);
          border-color: rgba(77, 141, 255, 0.24);
          transform: translateX(2px);
        }
        .nav-icon {
          flex: 0 0 auto;
          opacity: 0.9;
        }
        .ui-card {
          --ui-card-top-space: 8px;
          display: flex;
          flex-direction: column;
          gap: var(--space-3);
          border: 1px solid var(--border);
          background: var(--bg2);
          border-radius: var(--radius-card);
          min-width: 0;
          max-width: 100%;
          overflow: hidden;
          margin-top: var(--ui-card-top-space);
        }
        .ui-card > * {
          margin-top: 0;
        }
        .ui-card.last-run {
          --ui-card-top-space: 16px;
        }
        .ui-card-md {
          padding: var(--space-5);
        }
        .ui-card-sm {
          padding: 18px;
        }
        .dashboard-side-card p {
          margin: 0;
          color: var(--text2);
          font-size: 14px;
          overflow-wrap: anywhere;
        }
        .sidebar-kicker {
          margin-bottom: 8px;
          color: var(--muted);
          font-size: 11px;
          letter-spacing: 0.22em;
          text-transform: uppercase;
        }
        .sidebar-kicker.with-icon {
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }
        .user-dot {
          width: 28px;
          height: 28px;
          border-radius: 999px;
          background: var(--adim);
          color: var(--accent);
          display: grid;
          place-items: center;
          flex: 0 0 auto;
        }
        .user-name {
          font-size: 14px;
          color: var(--text);
          word-break: break-word;
          overflow-wrap: anywhere;
        }
        .user-plan {
          font-size: 14px;
          color: var(--muted);
        }
        .ui-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 24px;
          padding: 0 10px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          border: 1px solid transparent;
          margin-right: auto;
        }
        .ui-badge-primary {
          background: var(--adim);
          color: var(--accent);
          border-color: rgba(0, 255, 136, 0.24);
        }
        .ui-badge-secondary {
          background: var(--bg3);
          color: var(--text2);
          border-color: var(--border2);
        }
        .ui-badge-purple {
          background: var(--pdim);
          color: var(--purple);
          border-color: rgba(206, 147, 216, 0.3);
        }
        .ui-badge-blue {
          background: var(--bdim);
          color: var(--blue);
          border-color: rgba(100, 181, 246, 0.3);
        }
        .ui-badge-warning {
          background: var(--wdim);
          color: var(--warn);
          border-color: rgba(255, 215, 64, 0.3);
        }
        .ui-badge-danger {
          background: var(--edim);
          color: var(--error);
          border-color: rgba(255, 82, 82, 0.3);
        }
        .shell-content-bar {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: var(--space-2);
          padding: 0 var(--space-6) var(--space-3);
          flex-wrap: wrap;
        }
        .hdr-r {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
          justify-content: flex-end;
          min-width: 0;
        }
        .toolbar-block {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
          align-items: center;
          min-width: 0;
        }
        .toolbar-themes {
          max-width: 380px;
        }
        .hdr-r .hdiv {
          width: 1px;
          height: 18px;
          background: var(--border2);
          margin: 0 3px;
        }
        .hbtn {
          background: var(--bg3);
          border: 1px solid var(--border2);
          border-radius: 10px;
          color: var(--text2);
          padding: 8px 12px;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s;
          font-family: "Manrope", sans-serif;
          font-weight: 700;
        }
        .hbtn:hover,
        .hbtn.on {
          border-color: var(--accent);
          color: var(--accent);
          background: var(--adim);
        }
        .hbtn:active {
          transform: scale(0.96);
          opacity: 0.9;
        }
        .hbtn:focus-visible {
          outline: 2px solid var(--accent);
          outline-offset: 2px;
        }
        .lang-btn {
          min-width: 46px;
          padding: 8px 10px;
        }
        .lang-emoji,
        .theme-emoji {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          line-height: 1;
          font-size: 16px;
        }
        .toolbar-themes .hbtn {
          min-width: 44px;
          padding: 8px 10px;
        }
        .ui-field {
          display: grid;
          gap: 8px;
          min-width: 0;
        }
        .ui-field + .ui-field {
          margin-top: 10px;
        }
        .ui-eyebrow {
          display: inline-flex;
          width: fit-content;
          align-items: center;
          gap: 6px;
          min-height: 24px;
          padding: 0 10px;
          border-radius: 999px;
          border: 1px solid var(--border2);
          background: var(--bg3);
          color: var(--text2);
          font-size: 11px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          white-space: nowrap;
          max-width: 100%;
        }
        .ui-eyebrow-icon {
          display: inline-flex;
          align-items: center;
          color: var(--accent);
          flex: 0 0 auto;
        }
        .ui-field-label {
          color: var(--text2);
          font-size: 15px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }
        .ui-field-hint {
          color: var(--muted);
          font-size: 14px;
        }
        .ui-input,
        .ui-select {
          min-height: 50px;
          border-radius: var(--radius-control);
          border: 1px solid var(--border2);
          background: var(--bg3);
          color: var(--text);
          padding: 0 16px;
          outline: none;
          font-size: 15px;
          width: 100%;
          max-width: 100%;
          min-width: 0;
        }
        .ui-input::placeholder {
          color: var(--muted);
        }
        .ui-select option {
          background: var(--bg2);
          color: var(--text);
        }
        .ui-input:focus,
        .ui-select:focus {
          border-color: var(--accent);
          box-shadow: 0 0 0 4px var(--adim);
        }
        .ui-stat-card {
          display: grid;
          gap: var(--space-1);
          min-width: 0;
        }
        .ui-stat-icon {
          display: inline-flex;
          width: 26px;
          height: 26px;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          background: rgba(77, 141, 255, 0.12);
          color: #77abff;
        }
        .ui-stat-secondary .ui-stat-icon {
          background: var(--adim);
          color: var(--accent);
        }
        .ui-stat-danger .ui-stat-icon {
          background: var(--edim);
          color: var(--error);
        }
        .ui-stat-label {
          color: var(--muted);
          font-size: 11px;
          letter-spacing: 0.16em;
          text-transform: uppercase;
        }
        .ui-stat-value {
          display: block;
          min-width: 0;
          font-family: "Manrope", sans-serif;
          font-variant-numeric: tabular-nums;
          font-weight: 700;
          font-size: 1.35rem;
          line-height: 1;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .ui-stat-hint {
          color: var(--text2);
          font-size: 15px;
          overflow-wrap: anywhere;
        }
        @media (max-width: 980px) {
          .dashboard-shell {
            grid-template-columns: 1fr;
          }
          .dashboard-sidebar {
            border-right: 0;
            border-bottom: 1px solid var(--border);
          }
        }
        .app-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: var(--space-4) 0 var(--space-5);
          border-top: 1px solid var(--border);
          margin-top: var(--space-4);
        }
        .app-footer-copy {
          font-size: 11px;
          color: var(--muted);
          letter-spacing: 0.08em;
          white-space: nowrap;
        }
        .app-footer-nav {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-wrap: wrap;
          justify-content: center;
        }
        .footer-nav-link {
          font-size: 11px;
          color: var(--text2);
          text-decoration: none;
          transition: color 0.2s;
          white-space: nowrap;
        }
        .footer-nav-link:hover {
          color: var(--accent);
        }
        .footer-nav-link:focus-visible {
          outline: 2px solid var(--accent);
          outline-offset: 2px;
          border-radius: 3px;
        }
        .footer-nav-sep {
          font-size: 11px;
          color: var(--border2);
        }
        .app-footer-social {
          display: flex;
          gap: 10px;
          align-items: center;
        }
        .social-link {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border-radius: 10px;
          border: 1px solid var(--border2);
          background: var(--bg3);
          color: var(--text2);
          text-decoration: none;
          transition: all 0.2s ease;
        }
        .social-link:hover {
          border-color: var(--accent);
          color: var(--accent);
          background: var(--adim);
        }
        .social-link:focus-visible {
          outline: 2px solid var(--accent);
          outline-offset: 2px;
        }
        @media (max-width: 720px) {
          .dashboard-main {
            padding: 0 var(--space-3) var(--space-5);
          }
          .dashboard-top-header {
            padding: var(--space-3) 0;
          }
          .dashboard-top-header,
          .hdr-r,
          .toolbar-block,
          .hdr-actions {
            width: 100%;
            justify-content: flex-start;
          }
        }
      `}</style>
    </main>
  );
}
