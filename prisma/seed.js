const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const ROADMAP_PHASES = [
  {
    title: "Fundacion del producto",
    description: "Estructura base, experiencia del dashboard y APIs internas.",
    tasks: [
      {
        title: "Definir arquitectura de App Router para modulos nuevos",
        completed: true,
      },
      {
        title: "Crear capa Prisma reutilizable para server routes",
        completed: true,
      },
      {
        title: "Configurar roadmap persistente con progreso global",
        completed: true,
      },
    ],
  },
  {
    title: "Crecimiento y calidad",
    description: "Evolucion del roadmap con control de acceso y mejoras UX.",
    tasks: [
      {
        title: "Restringir edicion por administradores",
        completed: false,
      },
      {
        title: "Agregar filtros por estado y busqueda de tareas",
        completed: false,
      },
      {
        title: "Agregar pruebas de integracion para endpoints roadmap",
        completed: false,
      },
    ],
  },
];

async function syncRoadmapCompletionState() {
  for (const phase of ROADMAP_PHASES) {
    const dbPhase = await prisma.roadmapPhase.findFirst({
      where: { title: phase.title },
      select: { id: true },
    });

    if (!dbPhase) {
      continue;
    }

    for (const task of phase.tasks) {
      await prisma.roadmapTask.updateMany({
        where: {
          phaseId: dbPhase.id,
          title: task.title,
        },
        data: {
          completed: task.completed,
        },
      });
    }
  }
}

async function seedRoadmap() {
  const existingCount = await prisma.roadmapPhase.count();
  if (existingCount > 0) {
    await syncRoadmapCompletionState();
    return;
  }

  for (const [phaseIndex, phase] of ROADMAP_PHASES.entries()) {
    await prisma.roadmapPhase.create({
      data: {
        title: phase.title,
        description: phase.description,
        position: phaseIndex,
        tasks: {
          create: phase.tasks.map((task, taskIndex) => ({
            title: task.title,
            position: taskIndex,
            completed: task.completed,
          })),
        },
      },
    });
  }
}

async function main() {
  await seedRoadmap();
}

main()
  .catch((error) => {
    console.error("Seed roadmap fallo:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
