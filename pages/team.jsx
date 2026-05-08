import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import AppShell from "../components/layout/AppShell";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Eyebrow from "../components/ui/Eyebrow";
import Icon from "../components/ui/Icon";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import useSessionUser from "../hooks/useSessionUser";
import TeamSkeleton from "../components/team/TeamSkeleton";

const { getRoleLabel } = require("../lib/user-roles");

const ROLE_OPTIONS = [
  { value: "user", label: "Usuario" },
  { value: "editor", label: "Editor" },
  { value: "admin", label: "Admin" },
];

function getRoleTone(role) {
  if (!role) return "secondary";
  switch (role.toLowerCase()) {
    case "admin": return "blue";
    case "editor": return "warning";
    default: return "secondary";
  }
}

function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" });
}

export default function TeamPage() {
  const router = useRouter();
  const { sessionUser, sessionHydrated, clearSessionUser } = useSessionUser();
  const [members, setMembers] = useState([]);
  const [maxMembers, setMaxMembers] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [deletingId, setDeletingId] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [formEmail, setFormEmail] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formRole, setFormRole] = useState("editor");
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (!sessionHydrated) return undefined;
    if (!sessionUser) {
      router.replace("/login?next=/team");
      return undefined;
    }

    let active = true;
    fetch("/api/team/members")
      .then(async (r) => {
        if (r.status === 401) { clearSessionUser(); router.replace("/login?next=/team"); return null; }
        if (r.status === 403) { router.replace("/"); return null; }
        const d = await r.json().catch(() => null);
        if (!r.ok) throw new Error(d?.error || "Error del servidor");
        return d;
      })
      .then((d) => {
        if (!active || !d) return;
        setMembers(d.members || []);
        setMaxMembers(d.maxMembers || 0);
      })
      .catch((err) => { if (active) setError(err.message || "No se pudo cargar el equipo."); })
      .finally(() => { if (active) setLoading(false); });

    return () => { active = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionHydrated]);

  const deleteMember = async (id, label) => {
    if (!window.confirm(`Eliminar a ${label}? Esta acción no se puede deshacer.`)) return;
    setDeletingId(id);
    setError(""); setMessage("");
    try {
      const r = await fetch(`/api/team/members/${id}`, { method: "DELETE" });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || "No se pudo eliminar.");
      setMembers((prev) => prev.filter((m) => m.id !== id));
      setMessage("Miembro eliminado.");
    } catch (err) {
      setError(err.message || "No se pudo eliminar.");
    } finally {
      setDeletingId("");
    }
  };

  const submitForm = async (e) => {
    e.preventDefault();
    setFormError(""); setMessage("");
    if (!formEmail || !formPassword) { setFormError("Email y contraseña son requeridos."); return; }
    if (formPassword.length < 8) { setFormError("La contraseña debe tener al menos 8 caracteres."); return; }

    setFormSubmitting(true);
    try {
      const r = await fetch("/api/team/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formEmail, password: formPassword, role: formRole }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || "No se pudo crear el miembro.");
      setMembers((prev) => [...prev, d.member]);
      setFormEmail(""); setFormPassword(""); setFormRole("editor"); setFormError("");
      setShowForm(false);
      setMessage(`${d.member.email} añadido al equipo.`);
    } catch (err) {
      setFormError(err.message || "No se pudo crear el miembro.");
    } finally {
      setFormSubmitting(false);
    }
  };

  const canAdd = members.length < maxMembers;

  return (
    <>
      <Head>
        <title>Equipo | SEO Crawler</title>
        <meta name="description" content="Gestiona los miembros de tu equipo de trabajo." />
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <AppShell
        activeKey="team"
        user={sessionUser}
        kicker="Workspace / Equipo"
        title="Tu equipo"
        description="Invita colaboradores a tu cuenta para revisar auditorías juntos."
        actions={
          canAdd ? (
            <Button
              variant="solid"
              tone="primary"
              iconLeft={<Icon name="plus" size={14} />}
              onClick={() => setShowForm(true)}
            >
              Añadir miembro
            </Button>
          ) : null
        }
      >
        {error ? <p className="feedback error">{error}</p> : null}
        {message ? <p className="feedback ok">{message}</p> : null}

        {loading ? <TeamSkeleton /> : (
        <>
        <div className="team-meta">
          <Badge tone="secondary">{members.length} de {maxMembers === 999 ? "∞" : maxMembers} usados</Badge>
          {!canAdd && maxMembers < 999 && (
            <span className="team-limit-hint">
              Límite alcanzado. <a href="/subscription">Mejorar plan →</a>
            </span>
          )}
        </div>

        <Card className="table-card" padding="sm">
          {members.length === 0 ? (
            <div className="empty-state">
              <strong>Sin miembros aún</strong>
              <span>Añade colaboradores con el botón de arriba.</span>
            </div>
          ) : (
            <div className="table-wrap">
              <table className="team-table">
                <thead>
                  <tr>
                    <th>Email</th>
                    <th>Rol</th>
                    <th>Miembro desde</th>
                    <th style={{ width: 100 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((m) => (
                    <tr key={m.id}>
                      <td>
                        <div className="cell-primary">
                          <strong>{m.name || m.email}</strong>
                          {m.name ? <span>{m.email}</span> : null}
                        </div>
                      </td>
                      <td>
                        <Badge tone={getRoleTone(m.role)}>{getRoleLabel(m.role)}</Badge>
                      </td>
                      <td className="cell-muted">{formatDate(m.createdAt)}</td>
                      <td>
                        <button
                          type="button"
                          className="btn btn-sm btn-danger"
                          disabled={deletingId === m.id}
                          onClick={() => deleteMember(m.id, m.name || m.email)}
                        >
                          {deletingId === m.id ? "..." : "Eliminar"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {showForm && (
          <div className="modal-overlay" onClick={() => { if (!formSubmitting) { setShowForm(false); setFormError(""); } }}>
            <div className="modal-box" onClick={(e) => e.stopPropagation()}>
              <div className="modal-head">
                <Eyebrow icon={<Icon name="plus" size={12} />}>Nuevo miembro</Eyebrow>
                <button
                  type="button"
                  className="modal-close"
                  onClick={() => { setShowForm(false); setFormError(""); }}
                  disabled={formSubmitting}
                  aria-label="Cerrar"
                >
                  ✕
                </button>
              </div>
              <form onSubmit={submitForm} className="member-form">
                <Input
                  label="Email"
                  type="email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  required
                  autoFocus
                />
                <Input
                  label="Contraseña"
                  type="password"
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  minLength={8}
                  required
                  hint="Mínimo 8 caracteres"
                />
                <Select
                  label="Rol"
                  value={formRole}
                  onChange={(e) => setFormRole(e.target.value)}
                >
                  {ROLE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </Select>
                {formError ? <p className="feedback error">{formError}</p> : null}
                <div className="form-actions">
                  <button type="button" className="cancel-btn" onClick={() => { setShowForm(false); setFormError(""); }} disabled={formSubmitting}>
                    Cancelar
                  </button>
                  <button type="submit" className="confirm-btn" disabled={formSubmitting}>
                    {formSubmitting ? "Creando..." : "Crear miembro"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        </>
        )}

        <style jsx>{`
          .feedback { margin: 0; }
          .feedback.error { color: var(--error); }
          .feedback.ok { color: var(--ok); }
          .team-meta {
            display: flex;
            align-items: center;
            gap: 12px;
            flex-wrap: wrap;
          }
          .team-limit-hint {
            font-size: 13px;
            color: var(--muted);
          }
          .team-limit-hint a {
            color: var(--accent);
            text-decoration: none;
            font-weight: 700;
          }
          .modal-overlay {
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.6);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            padding: 16px;
          }
          .modal-box {
            background: var(--surface, #1a1a2e);
            border: 1px solid var(--border);
            border-radius: 14px;
            padding: 24px;
            width: 100%;
            max-width: 420px;
            display: grid;
            gap: 20px;
          }
          .modal-head {
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .modal-close {
            background: none;
            border: none;
            color: var(--muted);
            cursor: pointer;
            font-size: 16px;
            padding: 4px 8px;
            line-height: 1;
            transition: color 0.15s;
          }
          .modal-close:hover:not(:disabled) { color: var(--text1); }
          .modal-close:disabled { opacity: 0.4; cursor: not-allowed; }
          .member-form {
            display: grid;
            gap: 14px;
          }
          .form-actions {
            display: flex;
            gap: 10px;
            justify-content: flex-end;
          }
          .cancel-btn {
            appearance: none;
            background: transparent;
            border: 1px solid var(--border);
            border-radius: 8px;
            color: var(--text2);
            cursor: pointer;
            font-family: "Manrope", sans-serif;
            font-size: 13px;
            font-weight: 600;
            padding: 7px 14px;
            transition: all 0.15s;
          }
          .cancel-btn:hover:not(:disabled) { border-color: var(--text2); color: var(--text1); }
          .confirm-btn {
            appearance: none;
            background: var(--blue, #4d8dff);
            border: none;
            border-radius: 8px;
            color: #fff;
            cursor: pointer;
            font-family: "Manrope", sans-serif;
            font-size: 13px;
            font-weight: 700;
            padding: 7px 14px;
            transition: opacity 0.15s;
          }
          .confirm-btn:disabled { opacity: 0.45; cursor: not-allowed; }
          .table-card { display: grid; gap: 14px; }
          .table-wrap { overflow-x: auto; }
          .team-table {
            width: 100%;
            border-collapse: collapse;
            min-width: 520px;
          }
          .team-table th,
          .team-table td {
            text-align: left;
            padding: 12px;
            border-bottom: 1px solid var(--border);
            vertical-align: middle;
          }
          .team-table th {
            color: var(--muted);
            font-size: 12px;
            letter-spacing: 0.1em;
            text-transform: uppercase;
            background: rgba(255,255,255,0.02);
          }
          .team-table tbody tr:hover { background: rgba(77,141,255,0.05); }
          .cell-primary { display: grid; gap: 3px; }
          .cell-primary strong { font-size: 0.95rem; }
          .cell-primary span,
          .cell-muted { color: var(--text2); font-size: 13px; }
          .empty-state {
            display: grid;
            gap: 6px;
            padding: 28px;
            text-align: center;
            justify-items: center;
          }
          .empty-state strong { font-size: 0.95rem; }
          .empty-state span { color: var(--text2); font-size: 13px; }
        `}</style>
      </AppShell>
    </>
  );
}
