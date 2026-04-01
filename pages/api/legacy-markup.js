import { promises as fs } from "fs";
import path from "path";

let markupCache = null;

export default async function handler(req, res) {
  try {
    if (!markupCache) {
      const filePath = path.join(process.cwd(), "templates", "legacy-markup.html");
      markupCache = await fs.readFile(filePath, "utf8");
    }

    res.status(200).setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=3600, stale-while-revalidate=86400");
    res.send(markupCache);
  } catch {
    res.status(500).json({ error: "No se pudo cargar la interfaz" });
  }
}
