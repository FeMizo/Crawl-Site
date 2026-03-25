function isSchemaMismatchError(error) {
  return (
    error?.code === "P2021" ||
    error?.code === "P2022" ||
    /does not exist/i.test(String(error?.message || ""))
  );
}

function isDatabaseConnectionError(error) {
  return (
    error?.name === "PrismaClientInitializationError" ||
    /can't reach database server/i.test(String(error?.message || "")) ||
    /authentication failed/i.test(String(error?.message || ""))
  );
}

function logServerError(context, error, details = {}) {
  const payload = {
    context,
    name: error?.name || "Error",
    code: error?.code || null,
    message: error?.message || "Unknown error",
    path: details.path || null,
    method: details.method || null,
  };
  console.error("[server-error]", payload);
}

function getPublicError(error, fallbackMessage) {
  if (isSchemaMismatchError(error)) {
    return {
      status: 500,
      message:
        process.env.NODE_ENV === "production"
          ? fallbackMessage
          : "La base local no esta sincronizada con Prisma. Ejecuta `npm run db:push`.",
    };
  }

  if (isDatabaseConnectionError(error)) {
    return {
      status: 500,
      message:
        process.env.NODE_ENV === "production"
          ? fallbackMessage
          : "No hay conexion con la base de datos configurada. Revisa `dashboard_DATABASE_URL` o levanta Postgres local con `npm run db:up`.",
    };
  }

  return {
    status: 500,
    message: fallbackMessage,
  };
}

module.exports = {
  getPublicError,
  isSchemaMismatchError,
  logServerError,
};
