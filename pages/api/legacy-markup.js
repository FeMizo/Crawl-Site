import { promises as fs } from "fs";
import path from "path";

export default async function handler(req, res) {
  try {
    const filePath = path.join(process.cwd(), "templates", "legacy-markup.html");
    const markup = await fs.readFile(filePath, "utf8");
    res.status(200).setHeader("Content-Type", "text/plain; charset=utf-8");
    res.send(markup);
  } catch {
    res.status(500).json({ error: "No se pudo cargar la interfaz" });
  }
}
