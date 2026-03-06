import Head from "next/head";
import { useEffect, useState } from "react";
import AppShell from "../components/layout/AppShell";
import Card from "../components/ui/Card";
import Icon from "../components/ui/Icon";
import Select from "../components/ui/Select";
import Input from "../components/ui/Input";

export default function SettingsPage() {
  const [me, setMe] = useState(null);

  useEffect(() => {
    let active = true;
    fetch("/api/auth/me")
      .then(async (response) => {
        if (response.status === 401) {
          window.location.href = "/login?next=/settings";
          return null;
        }
        const data = await response.json();
        if (active) setMe(data.user || null);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  return (
    <>
      <Head>
        <title>Ajustes | SEO Crawler</title>
        <link rel="stylesheet" href="/styles.css" />
      </Head>
      <AppShell
        activeKey="settings"
        user={me}
        kicker="Ajustes / Preferencias"
        title="Preferencias"
        description="Vista base para futuras preferencias del producto usando el mismo sistema de layout, cards e inputs."
      >
        <div className="settings-grid">
          <Card className="settings-card">
            <div className="eyebrow"><Icon name="workspace" size={12} /> Espacio de trabajo</div>
            <Input label="Email" value={me?.email || ""} disabled readOnly />
            <Input label="Nombre del espacio" value="SEO Crawler Local" disabled readOnly />
          </Card>
          <Card className="settings-card">
            <div className="eyebrow"><Icon name="settings" size={12} /> Preferencias</div>
            <Select label="Idioma por defecto" defaultValue="es">
              <option value="es">Espanol</option>
              <option value="en">Ingles</option>
            </Select>
            <Select label="Tema recomendado" defaultValue="dark">
              <option value="dark">Oscuro</option>
              <option value="light">Claro</option>
              <option value="hc-dark">Alto contraste oscuro</option>
              <option value="hc-light">Alto contraste claro</option>
            </Select>
          </Card>
        </div>
        <style jsx>{`
          .settings-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
            gap: 18px;
            min-width: 0;
          }
          .settings-card {
            display: grid;
            gap: 16px;
            min-width: 0;
          }
          .eyebrow {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            color: var(--muted);
            font-size: 11px;
            letter-spacing: 0.22em;
            text-transform: uppercase;
          }
        `}</style>
      </AppShell>
    </>
  );
}
