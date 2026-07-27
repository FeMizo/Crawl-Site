const { google } = require("googleapis");
const { Document, Packer, Paragraph, HeadingLevel, TextRun } = require("docx");
const { decryptSecret } = require("./secret-crypto");

function sanitizeFileName(value) {
  return String(value || "blog")
    .replace(/[^a-z0-9-_ .]/gi, "-")
    .replace(/\s+/g, "-")
    .slice(0, 80);
}

function markdownToDocxParagraphs(markdown) {
  const blocks = String(markdown || "").split(/\n{2,}/);
  return blocks.flatMap((block) => {
    const text = block.trim();
    if (!text) return [];
    if (text.startsWith("# ")) {
      return [new Paragraph({ text: text.slice(2).trim(), heading: HeadingLevel.TITLE })];
    }
    if (text.startsWith("## ")) {
      return [new Paragraph({ text: text.slice(3).trim(), heading: HeadingLevel.HEADING_2 })];
    }
    return text.split(/\n/).map((line) => new Paragraph({
      children: [new TextRun(line.replace(/^[-*]\s+/, ""))],
    }));
  });
}

async function createBlogDocxBuffer(blog) {
  const doc = new Document({
    sections: [{
      properties: {},
      children: markdownToDocxParagraphs(blog.content || `# ${blog.title}\n\n${blog.excerpt || ""}`),
    }],
  });
  return Packer.toBuffer(doc);
}

function getGoogleOAuthClient() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;
  if (!clientId || !clientSecret || !redirectUri) return null;
  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

function getGoogleAuthUrl(state) {
  const client = getGoogleOAuthClient();
  if (!client) return "";
  return client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: ["https://www.googleapis.com/auth/drive.file", "openid", "email"],
    state,
  });
}

async function exchangeGoogleCode(code) {
  const client = getGoogleOAuthClient();
  if (!client) throw new Error("Google Drive no configurado");
  const { tokens } = await client.getToken(code);
  client.setCredentials(tokens);
  let email = "";
  try {
    const oauth2 = google.oauth2({ auth: client, version: "v2" });
    const me = await oauth2.userinfo.get();
    email = me.data.email || "";
  } catch {}
  return { tokens, email };
}

async function uploadDocxToDrive({ connection, blog, buffer }) {
  const client = getGoogleOAuthClient();
  if (!client) throw new Error("Google Drive no configurado");
  client.setCredentials({
    access_token: connection.encryptedAccessToken ? decryptSecret(connection.encryptedAccessToken) : undefined,
    refresh_token: decryptSecret(connection.encryptedRefreshToken),
    expiry_date: connection.expiryDate ? new Date(connection.expiryDate).getTime() : undefined,
  });
  const drive = google.drive({ version: "v3", auth: client });
  const file = await drive.files.create({
    requestBody: {
      name: `${sanitizeFileName(blog.slug || blog.title)}.docx`,
      parents: connection.folderId ? [connection.folderId] : undefined,
      mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    },
    media: {
      mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      body: require("stream").Readable.from(buffer),
    },
    fields: "id,webViewLink",
  });
  return {
    fileId: file.data.id,
    webViewLink: file.data.webViewLink || "",
  };
}

function markdownToHtml(markdown) {
  return String(markdown || "")
    .split(/\n{2,}/)
    .map((block) => {
      const text = block.trim();
      if (!text) return "";
      if (text.startsWith("# ")) return `<h1>${escapeHtml(text.slice(2))}</h1>`;
      if (text.startsWith("## ")) return `<h2>${escapeHtml(text.slice(3))}</h2>`;
      return `<p>${escapeHtml(text).replace(/\n/g, "<br>")}</p>`;
    })
    .join("\n");
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function publishToWordPress({ connection, blog, status }) {
  const siteUrl = String(connection.siteUrl || "").replace(/\/+$/, "");
  const endpoint = `${siteUrl}/wp-json/wp/v2/posts`;
  const auth = Buffer.from(`${connection.username}:${decryptSecret(connection.encryptedAppPassword)}`).toString("base64");
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "authorization": `Basic ${auth}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      title: blog.title,
      slug: blog.slug,
      excerpt: blog.excerpt || "",
      content: markdownToHtml(blog.content),
      status,
    }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.message || "No se pudo exportar a WordPress");
  }
  return {
    postId: String(data.id || ""),
    link: data.link || "",
  };
}

module.exports = {
  createBlogDocxBuffer,
  exchangeGoogleCode,
  getGoogleAuthUrl,
  publishToWordPress,
  sanitizeFileName,
  uploadDocxToDrive,
};
