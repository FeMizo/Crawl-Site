import { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import TopHeader from "./TopHeader";
import PageContainer from "./PageContainer";

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
            actions={actions}
            user={user}
          />
          <PageContainer className={contentClassName}>{children}</PageContainer>
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
          display: grid;
          grid-template-rows: auto 1fr;
          align-content: start;
          padding: 0 var(--space-6) var(--space-6);
          overflow: visible;
        }
        .dashboard-top-header {
          position: sticky;
          top: 0;
          z-index: 40;
          padding: var(--space-4) 0;
          margin: 0 0 var(--space-4);
          border-bottom: 1px solid var(--border);
          display: flex;
          justify-content: space-between;
          gap: var(--space-3);
          align-items: flex-start;
          flex-wrap: wrap;
          min-width: 0;
          background: color-mix(in srgb, var(--bg) 82%, transparent);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
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
          font-size: 12px;
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
          margin-left: auto;
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
        .hdr-actions {
          display: flex;
          gap: var(--space-2);
          flex-wrap: wrap;
          align-items: center;
          min-width: 0;
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
        .ui-btn {
          min-height: 44px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
          padding: 0 16px;
          border-radius: var(--radius-control);
          border: 1px solid var(--border2);
          text-decoration: none;
          cursor: pointer;
          transition: all 0.2s ease;
          appearance: none;
          font-family: "Manrope", sans-serif;
          font-weight: 700;
          font-size: 14px;
          line-height: 1;
          max-width: 100%;
          white-space: nowrap;
        }
        .ui-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 0 0 3px rgba(77, 141, 255, 0.12);
        }
        .ui-btn:disabled,
        .ui-btn[aria-disabled="true"] {
          opacity: 0.5;
          cursor: not-allowed;
          pointer-events: none;
          transform: none;
          box-shadow: none;
        }
        .ui-btn:active:not(:disabled):not([aria-disabled="true"]) {
          transform: translateY(0);
          box-shadow: none;
          opacity: 0.88;
        }
        .ui-btn:focus-visible {
          outline: 2px solid var(--accent);
          outline-offset: 2px;
        }
        .ui-btn-sm {
          min-height: 34px;
          padding: 0 12px;
          font-size: 12px;
        }
        .ui-btn-md {
          min-height: 44px;
          padding: 0 16px;
          font-size: 14px;
        }
        .ui-btn-lg {
          min-height: 52px;
          padding: 0 18px;
          font-size: 16px;
        }
        .ui-btn-solid {
          font-family: "Syne", "Manrope", sans-serif;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          font-size: 13px;
        }
        .ui-btn-outline {
          background: transparent;
        }
        .ui-btn-primary.ui-btn-solid {
          background: #4d8dff;
          border-color: #4d8dff;
          color: #071226;
          box-shadow: 0 8px 18px rgba(44, 103, 197, 0.32);
        }
        .ui-btn-primary.ui-btn-outline {
          color: #77abff;
          border-color: rgba(77, 141, 255, 0.4);
          background: rgba(77, 141, 255, 0.14);
        }
        .ui-btn-secondary.ui-btn-solid {
          background: var(--bg3);
          border-color: var(--border2);
          color: var(--text);
        }
        .ui-btn-secondary.ui-btn-outline {
          background: transparent;
          border-color: var(--border2);
          color: var(--text);
        }
        .ui-btn-danger.ui-btn-solid {
          background: var(--error);
          border-color: var(--error);
          color: #fff;
        }
        .ui-btn-danger.ui-btn-outline {
          background: var(--edim);
          border-color: var(--error);
          color: var(--error);
        }
        .ui-btn-icon {
          display: inline-flex;
          align-items: center;
          flex: 0 0 auto;
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
          font-size: 13px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }
        .ui-field-hint {
          color: var(--muted);
          font-size: 12px;
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
          font-size: 13px;
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
