const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function seedRoadmap() {
  const existingCount = await prisma.roadmapPhase.count();
  if (existingCount > 0) {
    return;
  }

  const phases = [
    {
      title: "Fundacion del producto",
      description: "Estructura base, experiencia del dashboard y APIs internas.",
      tasks: [
        "Definir arquitectura de App Router para modulos nuevos",
        "Crear capa Prisma reutilizable para server routes",
        "Configurar roadmap persistente con progreso global",
      ],
    },
    {
      title: "Crecimiento y calidad",
      description: "Evolucion del roadmap con control de acceso y mejoras UX.",
      tasks: [
        "Restringir edicion por administradores",
        "Agregar filtros por estado y busqueda de tareas",
        "Agregar pruebas de integracion para endpoints roadmap",
      ],
    },
  ];

  for (const [phaseIndex, phase] of phases.entries()) {
    await prisma.roadmapPhase.create({
      data: {
        title: phase.title,
        description: phase.description,
        position: phaseIndex,
        tasks: {
          create: phase.tasks.map((taskTitle, taskIndex) => ({
            title: taskTitle,
            position: taskIndex,
            completed: false,
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
