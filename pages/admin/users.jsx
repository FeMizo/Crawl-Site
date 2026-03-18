import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import AppShell from "../../components/layout/AppShell";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Eyebrow from "../../components/ui/Eyebrow";
import Icon from "../../components/ui/Icon";
import Select from "../../components/ui/Select";
import useSessionUser from "../../hooks/useSessionUser";

const { USER_ROLE, getRoleLabel } = require("../../lib/user-roles");

const ROLE_OPTIONS = [
  USER_ROLE.OWNER,
  USER_ROLE.SUPER_ADMIN,
  USER_ROLE.ADMIN,
  USER_ROLE.EDITOR,
  USER_ROLE.USER,
];

function formatDate(value) {
  if (!value) return "Sin fecha";
  return new Date(value).toLocaleString("es-MX");
}

function getUserStatus(user) {
  if (user.role === USER_ROLE.OWNER) return "Protegido";
  return "Activo";
}

export default function AdminUsersPage() {
  const router = useRouter();
  const { sessionUser, setSessionUser, clearSessionUser } = useSessionUser();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [savingUserId, setSavingUserId] = useState("");
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  useEffect(() => {
    let active = true;

    Promise.all([
      fetch("/api/auth/me").then(async (response) => {
        if (response.status === 401) {
          clearSessionUser();
          router.replace("/login?next=/admin/users");
          return null;
        }
        return response.json();
      }),
      fetch("/api/admin/users").then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (response.status === 401) {
          clearSessionUser();
          router.replace("/login?next=/admin/users");
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
        setSessionUser(meData?.user || null);
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
  }, [clearSessionUser, router, setSessionUser]);

  const assignableRoles = useMemo(
    () => new Set(sessionUser?.permissions?.assignableRoles || []),
    [sessionUser],
  );

  const filteredUsers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return users.filter((user) => {
      const matchesRole =
        roleFilter === "all" || (user.role || USER_ROLE.USER) === roleFilter;
      if (!matchesRole) return false;
      if (!normalizedQuery) return true;

      return [user.name, user.email, user.roleLabel]
        .filter(Boolean)
        .some((value) =>
          String(value).toLowerCase().includes(normalizedQuery),
        );
    });
  }, [query, roleFilter, users]);

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
        user={sessionUser}
        kicker="Administracion / Usuarios"
        title="Gestion de usuarios"
        description="Administra roles en una vista mas clara, con jerarquia segura y cambios validados desde servidor."
        actions={
          <Button href="/settings" variant="outline" tone="secondary" iconLeft={<Icon name="settings" size={15} />}>
            Volver a ajustes
          </Button>
        }
      >
        {loading ? <p className="feedback">Cargando usuarios...</p> : null}
        {error ? <p className="feedback error">{error}</p> : null}
        {message ? <p className="feedback ok">{message}</p> : null}

        <Card className="toolbar-card">
          <div className="toolbar-head">
            <div>
              <Eyebrow icon={<Icon name="users" size={12} />}>Usuarios</Eyebrow>
              <h2>Panel de roles</h2>
              <p>Busca, filtra y ajusta permisos sin perder de vista el estado actual de cada cuenta.</p>
            </div>
            <div className="toolbar-metrics">
              <Badge tone="secondary">{filteredUsers.length} visibles</Badge>
              <Badge tone="primary">{users.length} totales</Badge>
            </div>
          </div>

          <div className="toolbar-grid">
            <label className="ui-field">
              <span className="ui-field-label">Buscar</span>
              <input
                className="ui-input"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Nombre, email o rol"
              />
            </label>
            <Select
              label="Filtrar por rol"
              value={roleFilter}
              onChange={(event) => setRoleFilter(event.target.value)}
            >
              <option value="all">Todos</option>
              {ROLE_OPTIONS.map((role) => (
                <option key={role} value={role}>
                  {getRoleLabel(role)}
                </option>
              ))}
            </Select>
          </div>
        </Card>

        <Card className="table-card" padding="sm">
          <div className="table-wrap">
            <table className="users-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Email</th>
                  <th>Rol</th>
                  <th>Estado</th>
                  <th>Creacion</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => {
                  const currentRole = user.assignedRole || USER_ROLE.USER;
                  const disabled =
                    !assignableRoles.size ||
                    user.id === sessionUser?.id ||
                    user.role === USER_ROLE.OWNER;

                  return (
                    <tr key={user.id}>
                      <td>
                        <div className="cell-primary">
                          <strong>{user.name || "Sin nombre"}</strong>
                          <span>{user.phoneE164 || "Sin telefono"}</span>
                        </div>
                      </td>
                      <td className="cell-email">{user.email}</td>
                      <td>
                        <div className="role-stack">
                          <Badge tone={user.role === USER_ROLE.OWNER ? "primary" : "secondary"}>
                            {user.roleLabel || getRoleLabel(user.role)}
                          </Badge>
                          <span>Asignado: {getRoleLabel(currentRole)}</span>
                        </div>
                      </td>
                      <td>
                        <Badge tone={user.role === USER_ROLE.OWNER ? "primary" : "secondary"}>
                          {getUserStatus(user)}
                        </Badge>
                      </td>
                      <td>{formatDate(user.createdAt)}</td>
                      <td>
                        <div className="actions-cell">
                          <select
                            className="ui-select inline-select"
                            value={currentRole}
                            disabled={disabled || savingUserId === user.id}
                            onChange={(event) =>
                              updateUserRole(user.id, event.target.value)
                            }
                          >
                            {ROLE_OPTIONS.filter(
                              (role) =>
                                assignableRoles.has(role) || role === currentRole,
                            ).map((role) => (
                              <option key={role} value={role}>
                                {getRoleLabel(role)}
                              </option>
                            ))}
                          </select>
                          <span className="action-hint">
                            {user.id === sessionUser?.id
                              ? "No puedes editar tu propio rol."
                              : user.role === USER_ROLE.OWNER
                                ? "Propietario protegido por servidor."
                                : "Cambio inmediato al guardar."}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {!loading && !filteredUsers.length ? (
                  <tr>
                    <td colSpan={6}>
                      <div className="empty-state">
                        <strong>Sin resultados</strong>
                        <span>Ajusta la busqueda o el filtro para ver otros usuarios.</span>
                      </div>
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </Card>

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
          .toolbar-card,
          .table-card {
            display: grid;
            gap: 16px;
          }
          .toolbar-head {
            display: flex;
            justify-content: space-between;
            gap: 16px;
            align-items: flex-start;
          }
          .toolbar-head h2,
          .toolbar-head p {
            margin: 0;
          }
          .toolbar-head h2 {
            font-family: "Syne", "Manrope", sans-serif;
            font-size: 1.4rem;
          }
          .toolbar-head p {
            color: var(--text2);
            margin-top: 8px;
          }
          .toolbar-metrics {
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
            justify-content: flex-end;
          }
          .toolbar-grid {
            display: grid;
            grid-template-columns: minmax(220px, 1.5fr) minmax(180px, 0.7fr);
            gap: 14px;
          }
          .table-wrap {
            overflow-x: auto;
          }
          .users-table {
            width: 100%;
            border-collapse: collapse;
            min-width: 980px;
          }
          .users-table th,
          .users-table td {
            text-align: left;
            padding: 14px 12px;
            border-bottom: 1px solid var(--border);
            vertical-align: top;
          }
          .users-table th {
            color: var(--muted);
            font-size: 12px;
            letter-spacing: 0.1em;
            text-transform: uppercase;
            background: rgba(255, 255, 255, 0.02);
          }
          .users-table tbody tr:hover {
            background: rgba(77, 141, 255, 0.06);
          }
          .cell-primary,
          .role-stack,
          .actions-cell,
          .empty-state {
            display: grid;
            gap: 6px;
          }
          .cell-primary strong {
            font-size: 0.98rem;
          }
          .cell-primary span,
          .role-stack span,
          .action-hint,
          .empty-state span,
          .cell-email {
            color: var(--text2);
            font-size: 13px;
          }
          .inline-select {
            min-width: 180px;
          }
          .empty-state {
            padding: 24px 8px;
            text-align: center;
            justify-items: center;
          }
          @media (max-width: 860px) {
            .toolbar-head,
            .toolbar-grid {
              grid-template-columns: 1fr;
              display: grid;
            }
            .toolbar-metrics {
              justify-content: flex-start;
            }
          }
        `}</style>
      </AppShell>
    </>
  );
}
