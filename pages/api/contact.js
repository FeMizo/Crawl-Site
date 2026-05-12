import nodemailer from "nodemailer";
import rateLimit from "express-rate-limit";

// Rate limiter for contact form (prevent spam)
const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,                   // max 5 contact submissions per 15 min per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Demasiados mensajes. Intenta de nuevo en 15 minutos." },
  skipSuccessfulRequests: false, // count all requests for contact form
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Apply rate limiter
  await new Promise((resolve, reject) => {
    contactLimiter(req, res, (err) => {
      if (err) reject(err);
      else resolve(null);
    });
  });

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
