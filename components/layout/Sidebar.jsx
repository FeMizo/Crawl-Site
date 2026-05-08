import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Badge from "../ui/Badge";
import Card from "../ui/Card";
import FaviconMark from "../ui/FaviconMark";
import Icon from "../ui/Icon";
import Logo from "../ui/Logo";
import PlanWidget from "./PlanWidget";
import PreferenceToggles from "../navigation/PreferenceToggles";
import UserMenu from "./UserMenu";
import { tUi } from "../../lib/ui-language";

const { getRoleLabel } = require("../../lib/user-roles");

const PLANS_WITH_TEAM = ["STARTER", "PRO", "AGENCY"];

export default function Sidebar({ activeKey, user, aside, lang = "es", theme, onLangChange, onThemeChange }) {
  const router = useRouter();
  const [pendingHref, setPendingHref] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [planKey, setPlanKey] = useState(null);

  useEffect(() => {
    if (!user) return;
    fetch("/api/subscription")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => {
        if (!d?.subscription) return;
        d.subscription.plan && setPlanKey(d.subscription.plan);
      })
      .catch(() => {});
  }, [user]);

  useEffect(() => {
    const clear = () => setPendingHref("");
    router.events.on("routeChangeComplete", clear);
    router.events.on("routeChangeError", clear);
    return () => {
      router.events.off("routeChangeComplete", clear);
      router.events.off("routeChangeError", clear);
    };
  }, [router.events]);

  const hasTeamFeature = planKey ? PLANS_WITH_TEAM.includes(planKey) : false;

  const privateNav = [
    {
      key: "dashboard",
      href: "/",
      label: tUi(lang, "navDashboard"),
      icon: "dashboard",
    },
    ...(user?.permissions?.isOwner
      ? [
          {
            key: "roadmap",
            href: "/dashboard/roadmap",
            label: tUi(lang, "navRoadmap"),
            icon: "roadmap",
          },
        ]
      : []),
    {
      key: "projects",
      href: "/projects",
      label: tUi(lang, "navProjects"),
      icon: "projects",
    },
    {
      key: "history",
      href: "/history",
      label: tUi(lang, "navHistory"),
      icon: "history",
    },
    {
      key: "subscription",
      href: "/subscription",
      label: tUi(lang, "navSubscription"),
      icon: "plan",
    },
    {
      key: "settings",
      href: "/settings",
      label: tUi(lang, "navSettings"),
      icon: "settings",
    },
    ...(user?.permissions?.canManageUsers || hasTeamFeature
      ? [
          {
            key: "team",
            href: "/team",
            label: tUi(lang, "navTeam"),
            icon: "users",
          },
        ]
      : []),
    ...(user?.permissions?.isOwner || user?.role === "super_admin"
      ? [
          {
            key: "users",
            href: "/admin/users",
            label: tUi(lang, "navUsers"),
            icon: "users",
          },
        ]
      : []),
  ];

  const publicNav = [
    {
      key: "login",
      href: "/login",
      label: tUi(lang, "navLogin"),
      icon: "login",
    },
    {
      key: "register",
      href: "/register",
      label: tUi(lang, "navRegister"),
      icon: "register",
    },
  ];

  const navItems = user ? privateNav : publicNav;
  const userDisplay = user?.name || user?.email || tUi(lang, "statusGuest");
  const userSummary = user
    ? `${user.email}${user.role ? ` - ${getRoleLabel(user.role)}` : ""}`
    : tUi(lang, "statusPublicAccess");

  return (
    <aside className="dashboard-sidebar">
      <div className="sidebar-top-row">
        <div className="brand-block">
          <div className="brand-icon" aria-hidden="true">
            <FaviconMark />
          </div>
          <div>
            <Logo className="sidebar-logo" />
          </div>
        </div>
        <div className="hdr-r sidebar-hdr-r">
          <PreferenceToggles
            lang={lang}
            theme={theme}
            onLangChange={onLangChange}
            onThemeChange={onThemeChange}
          />
          {user ? <UserMenu user={user} /> : null}
        </div>
        <button
          className="nav-mobile-toggle"
          aria-label={mobileOpen ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((v) => !v)}
        >
          {mobileOpen ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
              <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          )}
        </button>
      </div>

      <nav className={`dashboard-nav${mobileOpen ? " open" : ""}`}>
        {navItems.map((item) => (
          <Link
            key={item.key}
            className={
              activeKey === item.key
                ? "on"
                : pendingHref === item.href
                  ? "pending"
                  : ""
            }
            href={item.href}
            aria-current={activeKey === item.key ? "page" : undefined}
            onClick={() => { setPendingHref(item.href); setMobileOpen(false); }}
          >
            <Icon name={item.icon} size={17} className="nav-icon" />
            {item.label}
          </Link>
        ))}
      </nav>

      {user ? (
        <Card className="dashboard-side-card" padding="sm">
          <PlanWidget user={user} />
        </Card>
      ) : null}
    </aside>
  );
}
