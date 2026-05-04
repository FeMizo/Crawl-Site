import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import AppShell from "../../components/layout/AppShell";
import RoadmapBoard from "../../components/roadmap/RoadmapBoard";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Icon from "../../components/ui/Icon";
import RoadmapSkeleton from "../../components/roadmap/RoadmapSkeleton";
import useSessionUser from "../../hooks/useSessionUser";

export default function RoadmapPage() {
  const router = useRouter();
  const { sessionUser, sessionHydrated } = useSessionUser();
  const [checkingSession, setCheckingSession] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!sessionHydrated) return;

    if (!sessionUser) {
      router.replace(`/login?next=${encodeURIComponent("/dashboard/roadmap")}`);
      return;
    }

    if (sessionUser.role !== "owner" && !sessionUser.permissions?.isOwner) {
      router.replace("/");
      return;
    }

    setCheckingSession(false);
  }, [sessionHydrated, sessionUser, router]);

  return (
    <AppShell
      activeKey="roadmap"
      user={sessionUser}
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
        <RoadmapSkeleton />
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
