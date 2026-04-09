const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const projectRoot = path.resolve(__dirname, "..");
const prismaCli = path.join(projectRoot, "node_modules", "prisma", "build", "index.js");
const prismaClientDir = path.join(projectRoot, "node_modules", ".prisma", "client");
const engineFile = path.join(prismaClientDir, "query_engine-windows.dll.node");

function runPrismaGenerate() {
  return spawnSync(process.execPath, [prismaCli, "generate"], {
    cwd: projectRoot,
    encoding: "utf8",
    stdio: "pipe",
  });
}

function hasUsableClient() {
  return (
    fs.existsSync(engineFile) &&
    fs.existsSync(path.join(prismaClientDir, "index.js")) &&
    fs.existsSync(path.join(prismaClientDir, "schema.prisma"))
  );
}

function isWindowsEngineRenameError(output) {
  return (
    process.platform === "win32" &&
    /EPERM: operation not permitted, rename/i.test(output) &&
    /query_engine-windows\.dll\.node/i.test(output)
  );
}

function write(stream, text) {
  if (!text) return;
  stream.write(text);
  if (!text.endsWith("\n")) stream.write("\n");
}

const result = runPrismaGenerate();
const combinedOutput = `${result.stdout || ""}\n${result.stderr || ""}`;

write(process.stdout, result.stdout);
write(process.stderr, result.stderr);

if (result.status === 0) {
  process.exit(0);
}

if (isWindowsEngineRenameError(combinedOutput) && hasUsableClient()) {
  write(
    process.stderr,
    "Warning: Prisma Client engine is locked by another Node process. Using the existing generated client.",
  );
  process.exit(0);
}

process.exit(result.status || 1);
