import Head from "next/head";
import { useEffect, useMemo, useState } from "react";
import AppShell from "../../components/layout/AppShell";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Eyebrow from "../../components/ui/Eyebrow";
import Icon from "../../components/ui/Icon";
import Select from "../../components/ui/Select";

const { USER_ROLE, getRoleLabel } = require("../../lib/user-roles");

const ROLE_OPTIONS = [
  USER_ROLE.OWNER,
  USER_ROLE.SUPER_ADMIN,
  USER_ROLE.ADMIN,
  USER_ROLE.EDITOR,
  USER_ROLE.USER,
];

export default function AdminUsersPage() {
  const [me, setMe] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [savingUserId, setSavingUserId] = useState("");

  useEffect(() => {
    let active = true;

    Promise.all([
      fetch("/api/auth/me").then(async (response) => {
        if (response.status === 401) {
          window.location.href = "/login?next=/admin/users";
          return null;
        }
        return response.json();
      }),
      fetch("/api/admin/users").then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (response.status === 401) {
          window.location.href = "/login?next=/admin/users";
          return null;
        }
        if (response.status === 403) {
          throw new Error("No tienes permisos para administrar usuarios.");
        }
        if (!response.ok) {
          throw new Error(data.error || "No se pudo cargar el listado de usuarios.");
        }
        return data;
      }),
    ])
      .then(([meData, usersData]) => {
        if (!active) return;
        setMe(meData?.user || null);
        setUsers(usersData?.users || []);
      })
      .catch((err) => {
        if (active) setError(err.message || "No se pudo cargar el listado.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const assignableRoles = useMemo(
    () => new Set(me?.permissions?.assignableRoles || []),
    [me],
  );

  const updateUserRole = async (userId, role) => {
    setSavingUserId(userId);
    setError("");
    setMessage("");
    try {
      const response = await fetch(`/api/admin/users/${userId}/role`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || "No se pudo actualizar el rol.");
      }
      setUsers((current) =>
        current.map((user) => (user.id === userId ? data.user : user)),
      );
      setMessage("Rol actualizado correctamente.");
    } catch (err) {
      setError(err.message || "No se pudo actualizar el rol.");
    } finally {
      setSavingUserId("");
    }
  };

  return (
    <>
      <Head>
        <title>Usuarios | SEO Crawler</title>
        <link rel="stylesheet" href="/styles.css" />
      </Head>
      <AppShell
        activeKey="users"
        user={me}
        kicker="Administracion / Usuarios"
        title="Gestion de usuarios"
        description="Asigna roles desde el backend con jerarquia segura y sin elevacion de privilegios desde cliente."
        actions={
          <Button href="/settings" variant="outline" tone="secondary" iconLeft={<Icon name="settings" size={15} />}>
            Volver a ajustes
          </Button>
        }
      >
        {loading ? <p className="feedback">Cargando usuarios...</p> : null}
        {error ? <p className="feedback error">{error}</p> : null}
        {message ? <p className="feedback ok">{message}</p> : null}

        <section className="users-grid">
          {users.map((user) => {
            const currentRole = user.assignedRole || USER_ROLE.USER;
            const disabled =
              !assignableRoles.size ||
              user.id === me?.id ||
              user.role === USER_ROLE.OWNER;

            return (
              <Card key={user.id} className="user-card">
                <div className="user-head">
                  <div>
                    <Eyebrow icon={<Icon name="users" size={12} />}>Usuario</Eyebrow>
                    <h2>{user.name || user.email}</h2>
                    <p>{user.email}</p>
                  </div>
                  <Badge tone={user.role === USER_ROLE.OWNER ? "primary" : "secondary"}>
                    {getRoleLabel(user.role)}
                  </Badge>
                </div>

                <div className="meta-row">
                  <span>Rol asignado: {getRoleLabel(currentRole)}</span>
                  <span>Telefono: {user.phoneE164 || "Sin telefono"}</span>
                </div>

                <Select
                  label="Nuevo rol"
                  value={currentRole}
                  disabled={disabled || savingUserId === user.id}
                  onChange={(event) => updateUserRole(user.id, event.target.value)}
                >
                  {ROLE_OPTIONS.filter((role) => assignableRoles.has(role) || role === currentRole).map((role) => (
                    <option key={role} value={role}>
                      {getRoleLabel(role)}
                    </option>
                  ))}
                </Select>

                {user.id === me?.id ? (
                  <p className="hint">No puedes modificar tu propio rol desde esta vista.</p>
                ) : null}
                {user.role === USER_ROLE.OWNER ? (
                  <p className="hint">El rol owner solo se controla desde servidor o allowlist.</p>
                ) : null}
              </Card>
            );
          })}
        </section>

        <style jsx>{`
          .feedback {
            margin: 0;
            color: var(--text2);
          }
          .feedback.error {
            color: var(--error);
          }
          .feedback.ok {
            color: var(--ok);
          }
          .users-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
            gap: 18px;
          }
          .user-card {
            display: grid;
            gap: 14px;
          }
          .user-head {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 12px;
          }
          h2 {
            margin: 0 0 6px;
            font-family: "Syne", "Manrope", sans-serif;
            font-size: 1.3rem;
          }
          p,
          .meta-row,
          .hint {
            margin: 0;
            color: var(--text2);
          }
          .meta-row {
            display: grid;
            gap: 6px;
            font-size: 13px;
          }
          .hint {
            font-size: 12px;
          }
        `}</style>
      </AppShell>
    </>
  );
}
