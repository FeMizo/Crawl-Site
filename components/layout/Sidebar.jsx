import Link from "next/link";
import { useState } from "react";
import Badge from "../ui/Badge";
import Card from "../ui/Card";
import FaviconMark from "../ui/FaviconMark";
import Icon from "../ui/Icon";
import Logo from "../ui/Logo";
import PlanWidget from "./PlanWidget";
import { tUi } from "../../lib/ui-language";

const { getRoleLabel } = require("../../lib/user-roles");

export default function Sidebar({ activeKey, user, aside, lang = "es" }) {
  const [pendingHref, setPendingHref] = useState("");

  const privateNav = [
    {
      key: "dashboard",
      href: "/",
      label: tUi(lang, "navDashboard"),
      icon: "dashboard",
    },
    {
      key: "roadmap",
      href: "/dashboard/roadmap",
      label: tUi(lang, "navRoadmap"),
      icon: "roadmap",
    },
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
    ...(user?.permissions?.canManageUsers
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
      <div className="brand-block">
        <div className="brand-icon" aria-hidden="true">
          <FaviconMark />
        </div>
        <div>
          <Logo className="sidebar-logo" />
          <div className="logo-sub">SEO Crawler</div>
        </div>
      </div>

      <nav className="dashboard-nav">
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
            onClick={() => setPendingHref(item.href)}
          >
            <Icon name={item.icon} size={17} className="nav-icon" />
            {item.label}
          </Link>
        ))}
      </nav>

      {aside ? (
        <Card className="dashboard-side-card" padding="sm">
          {aside}
        </Card>
      ) : null}

      {user ? (
        <Card className="dashboard-side-card" padding="sm">
          <PlanWidget user={user} />
        </Card>
      ) : null}
    </aside>
  );
}
