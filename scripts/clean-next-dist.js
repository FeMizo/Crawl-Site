const fs = require("fs");
const path = require("path");

function resolveDistDir(mode) {
  if (process.env.NEXT_DIST_DIR) {
    return process.env.NEXT_DIST_DIR;
  }

  return mode === "development" ? ".next-dev" : ".next";
}

const mode = process.argv[2] || process.env.NODE_ENV || "production";
const distDir = resolveDistDir(mode);
const distPath = path.resolve(process.cwd(), distDir);

if (fs.existsSync(distPath)) {
  fs.rmSync(distPath, { recursive: true, force: true });
  console.log(`Removed Next dist directory: ${distDir}`);
} else {
  console.log(`Next dist directory already clean: ${distDir}`);
}
