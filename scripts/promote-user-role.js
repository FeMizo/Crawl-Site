const { loadEnvConfig } = require("@next/env");
const { PrismaClient } = require("@prisma/client");
const { USER_ROLE, normalizeRole } = require("../lib/user-roles");

loadEnvConfig(process.cwd());

const prisma = new PrismaClient();

function readArg(name, fallback = "") {
  const prefix = `--${name}=`;
  const direct = process.argv.find((arg) => arg.startsWith(prefix));
  if (direct) return direct.slice(prefix.length);
  const index = process.argv.indexOf(`--${name}`);
  if (index >= 0) return process.argv[index + 1] || fallback;
  return fallback;
}

async function promoteUserToRole(email, role) {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const normalizedRole = normalizeRole(role);

  if (!normalizedEmail) {
    throw new Error("Debes indicar --email");
  }

  if (normalizedRole === USER_ROLE.OWNER) {
    throw new Error(
      "El rol owner no se asigna por script publico. Controlalo con OWNER_EMAILS.",
    );
  }

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (!user) {
    throw new Error(`No existe un usuario con email ${normalizedEmail}`);
  }

  return prisma.user.update({
    where: { id: user.id },
    data: { role: normalizedRole.toUpperCase() },
    select: { id: true, email: true, role: true },
  });
}

async function main() {
  const email = readArg("email");
  const role = readArg("role", USER_ROLE.SUPER_ADMIN);
  const updatedUser = await promoteUserToRole(email, role);
  console.log(
    JSON.stringify(
      {
        ok: true,
        user: updatedUser,
      },
      null,
      2,
    ),
  );
}

main()
  .catch((error) => {
    console.error(error.message || error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
