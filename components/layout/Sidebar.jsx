import Link from "next/link";
import Badge from "../ui/Badge";
import Card from "../ui/Card";
import FaviconMark from "../ui/FaviconMark";
import Icon from "../ui/Icon";
import Logo from "../ui/Logo";

const privateNav = [
  { key: "dashboard", href: "/", label: "Inicio", icon: "dashboard" },
  { key: "roadmap", href: "/dashboard/roadmap", label: "Roadmap", icon: "roadmap" },
  { key: "projects", href: "/projects", label: "Proyectos", icon: "projects" },
  { key: "history", href: "/history", label: "Historial", icon: "history" },
  { key: "settings", href: "/settings", label: "Ajustes", icon: "settings" },
];

const publicNav = [
  { key: "login", href: "/login", label: "Iniciar sesion", icon: "login" },
  { key: "register", href: "/register", label: "Registro", icon: "register" },
];

export default function Sidebar({ activeKey, user, aside }) {
  const navItems = user ? privateNav : publicNav;

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
          <Link key={item.key} className={activeKey === item.key ? "on" : ""} href={item.href}>
            <Icon name={item.icon} size={17} className="nav-icon" />
            {item.label}
          </Link>
        ))}
      </nav>

      <Card className="dashboard-user-card" padding="sm">
        <div className="user-dot"><Icon name="user" size={13} /></div>
        <div>
          <div className="user-name">{user?.email || "Sesion no iniciada"}</div>
          <div className="user-plan">{user ? "Espacio activo" : "Acceso publico"}</div>
        </div>
        {user ? <Badge tone="primary">Activo</Badge> : <Badge tone="secondary">Invitado</Badge>}
      </Card>

      {aside ? <Card className="dashboard-side-card" padding="sm">{aside}</Card> : null}
    </aside>
  );
}
