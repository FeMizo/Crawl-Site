import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useMemo, useRef, useState } from "react";
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

const DEFAULT_PAGINATION = {
  page: 1,
  limit: 15,
  total: 0,
  pageCount: 1,
  hasPrev: false,
  hasNext: false,
};

function formatDate(value) {
  if (!value) return "Sin fecha";
  return new Date(value).toLocaleString("es-MX");
}

function getUserStatus(user) {
  if (user.role === USER_ROLE.OWNER) return "Protegido";
  return "Activo";
}

function getRoleTone(role) {
  switch (role) {
    case USER_ROLE.OWNER:       return "primary";
    case USER_ROLE.SUPER_ADMIN: return "purple";
    case USER_ROLE.ADMIN:       return "blue";
    case USER_ROLE.EDITOR:      return "warning";
    default:                    return "secondary";
  }
}

export default function AdminUsersPage() {
  const router = useRouter();
  const { sessionUser, setSessionUser, clearSessionUser } = useSessionUser();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [savingUserId, setSavingUserId] = useState("");
  const [deletingUserId, setDeletingUserId] = useState("");
  const [queryInput, setQueryInput] = useState("");
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(DEFAULT_PAGINATION);
  const previousFiltersRef = useRef({ query: "", roleFilter: "all" });

  useEffect(() => {
    const handle = window.setTimeout(() => {
      setQuery(queryInput.trim().slice(0, 64));
    }, 250);

    return () => window.clearTimeout(handle);
  }, [queryInput]);

  useEffect(() => {
    let active = true;
    const filtersChanged =
      previousFiltersRef.current.query !== query ||
      previousFiltersRef.current.roleFilter !== roleFilter;

    if (filtersChanged && page !== 1) {
      previousFiltersRef.current = { query, roleFilter };
      setPage(1);
      return () => {
        active = false;
      };
    }

    previousFiltersRef.current = { query, roleFilter };
    setLoading(true);
    setError("");

    const params = new URLSearchParams({
      page: String(page),
      limit: String(DEFAULT_PAGINATION.limit),
    });
    if (query) params.set("q", query);
    if (roleFilter !== "all") params.set("role", roleFilter);

    fetch(`/api/admin/users?${params.toString()}`)
      .then(async (response) => {
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
      })
      .then((usersData) => {
        if (!active || !usersData) return;
        setSessionUser(usersData.viewer || null);
        setUsers(usersData.users || []);
        setPagination(usersData.pagination || DEFAULT_PAGINATION);
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
  }, [clearSessionUser, page, query, roleFilter, router, setSessionUser]);

  const deleteUser = async (userId, userLabel) => {
    if (!window.confirm(`Eliminar a ${userLabel} y todos sus datos? Esta accion no se puede deshacer.`)) return;
    setDeletingUserId(userId);
    setError("");
    setMessage("");
    try {
      const response = await fetch(`/api/admin/users/${userId}`, { method: "DELETE" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "No se pudo eliminar el usuario.");
      setUsers((current) => current.filter((u) => u.id !== userId));
      setMessage("Usuario eliminado correctamente.");
    } catch (err) {
      setError(err.message || "No se pudo eliminar el usuario.");
    } finally {
      setDeletingUserId("");
    }
  };

  const assignableRoles = useMemo(
    () => new Set(sessionUser?.permissions?.assignableRoles || []),
    [sessionUser],
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
        <meta name="description" content="Panel de administración de usuarios: gestiona cuentas, roles y permisos del sistema SEO Crawler." />
        <link rel="canonical" href={`${process.env.NEXT_PUBLIC_APP_URL || ""}/admin/users`} />
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
              <Badge tone="secondary">{users.length} visibles</Badge>
              <Badge tone="primary">{pagination.total} totales</Badge>
            </div>
          </div>

          <div className="toolbar-grid">
            <label className="ui-field">
              <span className="ui-field-label">Buscar</span>
              <input
                className="ui-input"
                maxLength={64}
                value={queryInput}
                onChange={(event) => setQueryInput(event.target.value)}
                placeholder="Nombre, email o rol"
              />
            </label>
            <Select
              label="Filtrar por rol"
              value={roleFilter}
              onChange={(event) => {
                setRoleFilter(event.target.value);
                setPage(1);
              }}
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
                  <th>Correo</th>
                  <th>Rol</th>
                  <th>Estado</th>
                  <th>Creacion</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => {
                  const currentRole = user.assignedRole || USER_ROLE.USER;
                  const isOwner = user.role === USER_ROLE.OWNER;
                  const isSelf = user.id === sessionUser?.id;
                  const disabled =
                    !assignableRoles.size ||
                    isSelf ||
                    isOwner;

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
                          <Badge tone={getRoleTone(user.role)}>
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
                            {isSelf
                              ? "No puedes editar tu propio rol."
                              : isOwner
                                ? "Propietario protegido por servidor."
                                : "Cambio inmediato al guardar."}
                          </span>
                          {!isSelf && !isOwner && (
                            <button
                              type="button"
                              className="delete-btn"
                              disabled={deletingUserId === user.id}
                              onClick={() => deleteUser(user.id, user.name || user.email)}
                            >
                              {deletingUserId === user.id ? "Eliminando..." : "Eliminar"}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {!loading && !users.length ? (
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

        {!loading && pagination.pageCount > 1 ? (
          <div className="pagination-row">
            <Button
              type="button"
              variant="outline"
              tone="secondary"
              size="sm"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={!pagination.hasPrev}
            >
              Anterior
            </Button>
            <span className="pagination-text">
              Pagina {pagination.page} de {pagination.pageCount}
            </span>
            <Button
              type="button"
              variant="outline"
              tone="secondary"
              size="sm"
              onClick={() =>
                setPage((current) => Math.min(pagination.pageCount, current + 1))
              }
              disabled={!pagination.hasNext}
            >
              Siguiente
            </Button>
          </div>
        ) : null}

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
          .pagination-row {
            display: flex;
            gap: 12px;
            align-items: center;
            justify-content: flex-end;
            flex-wrap: wrap;
          }
          .pagination-text {
            color: var(--text2);
            font-size: 13px;
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
          .delete-btn {
            appearance: none;
            background: transparent;
            border: 1px solid rgba(248, 113, 113, 0.4);
            border-radius: 8px;
            color: var(--error, #f87171);
            cursor: pointer;
            font-family: "Manrope", sans-serif;
            font-size: 12px;
            font-weight: 700;
            padding: 5px 10px;
            transition: all 0.15s;
          }
          .delete-btn:hover:not(:disabled) {
            background: rgba(248, 113, 113, 0.12);
            border-color: var(--error, #f87171);
          }
          .delete-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
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
