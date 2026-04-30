import nodemailer from "nodemailer";

const RATE_MAP = new Map();
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 3;

function checkRate(ip) {
  const now = Date.now();
  const entry = RATE_MAP.get(ip) || { count: 0, start: now };
  if (now - entry.start > WINDOW_MS) {
    RATE_MAP.set(ip, { count: 1, start: now });
    return true;
  }
  if (entry.count >= MAX_PER_WINDOW) return false;
  entry.count++;
  RATE_MAP.set(ip, entry);
  return true;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const ip = req.headers["x-forwarded-for"]?.split(",")[0].trim() || req.socket.remoteAddress || "unknown";
  if (!checkRate(ip)) {
    return res.status(429).json({ error: "Demasiadas solicitudes. Intenta en unos minutos." });
  }

  const { name, email, message } = req.body || {};

  function escHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  if (!name?.trim() || !email?.trim() || !message?.trim()) {
    return res.status(400).json({ error: "Todos los campos son requeridos." });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: "Correo electrónico inválido." });
  }
  if (message.length > 2000) {
    return res.status(400).json({ error: "El mensaje es demasiado largo." });
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  await transporter.sendMail({
    from: `"SEO Crawler Contacto" <${process.env.SMTP_USER}>`,
    to: process.env.CONTACT_TO || process.env.SMTP_USER,
    replyTo: email,
    subject: `Nuevo contacto: ${name}`,
    text: `Nombre: ${name}\nCorreo: ${email}\n\n${message}`,
    html: `<p><strong>Nombre:</strong> ${escHtml(name)}</p><p><strong>Correo:</strong> ${escHtml(email)}</p><hr><p style="white-space:pre-wrap">${escHtml(message)}</p>`,
  });

  return res.status(200).json({ ok: true });
}
