"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import AppShell from "../../../components/layout/AppShell";
import RoadmapBoard from "../../../components/roadmap/RoadmapBoard";
import Button from "../../../components/ui/Button";
import Card from "../../../components/ui/Card";
import Icon from "../../../components/ui/Icon";
import useSessionUser from "../../../hooks/useSessionUser";

type Viewer = {
  id: string;
  email: string;
  name: string | null;
};

type MeResponse = {
  user?: Viewer;
  error?: string;
};

export default function RoadmapPage() {
  const router = useRouter();
  const { sessionUser, setSessionUser, clearSessionUser } = useSessionUser();
  const [checkingSession, setCheckingSession] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    fetch("/api/auth/me", { cache: "no-store" })
      .then(async (response) => {
        if (response.status === 401) {
          clearSessionUser();
          router.replace(`/login?next=${encodeURIComponent("/dashboard/roadmap")}`);
          return null;
        }

        const payload = (await response.json().catch(() => ({}))) as MeResponse;

        if (!response.ok) {
          throw new Error(payload.error || "No se pudo validar la sesion");
        }

        return payload;
      })
      .then((payload) => {
        if (!active || !payload) return;
        setSessionUser(payload.user ?? null);
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : "No se pudo validar la sesion");
      })
      .finally(() => {
        if (active) setCheckingSession(false);
      });

    return () => {
      active = false;
    };
  }, [clearSessionUser, router, setSessionUser]);

  return (
    <AppShell
      activeKey="roadmap"
      user={sessionUser as Viewer | null}
      kicker="Espacio de trabajo / Roadmap interno"
      title="Roadmap del proyecto"
      description="Fases, tareas y progreso persistente para coordinar ejecucion interna."
      actions={
        <>
          <Button href="/projects" variant="outline" tone="secondary" iconLeft={<Icon name="projects" size={15} />}>
            Proyectos
          </Button>
          <Button href="/" variant="outline" tone="secondary" iconLeft={<Icon name="dashboard" size={15} />}>
            Inicio
          </Button>
        </>
      }
      aside={
        <div className="roadmap-aside">
          <div className="sidebar-kicker with-icon">
            <Icon name="roadmap" size={12} />
            Roadmap
          </div>
          <p>Checklist persistente por fases para alinear el trabajo del equipo.</p>
        </div>
      }
    >
      {checkingSession ? (
        <Card><p className="feedback">Validando sesion...</p></Card>
      ) : error ? (
        <Card><p className="feedback error">{error}</p></Card>
      ) : (
        <RoadmapBoard />
      )}

      <style jsx>{`
        .roadmap-aside p {
          margin: 0;
        }
        .feedback {
          margin: 0;
          color: var(--text2);
        }
        .feedback.error {
          color: var(--error);
        }
      `}</style>
    </AppShell>
  );
}
