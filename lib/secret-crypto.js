const crypto = require("crypto");

function getEncryptionKey() {
  const raw = process.env.CREDENTIAL_ENCRYPTION_KEY || process.env.JWT_SECRET || "";
  if (!raw && process.env.NODE_ENV === "production") {
    throw new Error("CREDENTIAL_ENCRYPTION_KEY or JWT_SECRET is required");
  }
  return crypto.createHash("sha256").update(raw || "local-dev-secret").digest();
}

function encryptSecret(value) {
  const text = String(value || "");
  if (!text) return "";
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", getEncryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v1:${iv.toString("base64")}:${tag.toString("base64")}:${encrypted.toString("base64")}`;
}

function decryptSecret(value) {
  const text = String(value || "");
  if (!text) return "";
  const [version, ivRaw, tagRaw, encryptedRaw] = text.split(":");
  if (version !== "v1" || !ivRaw || !tagRaw || !encryptedRaw) return "";
  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    getEncryptionKey(),
    Buffer.from(ivRaw, "base64"),
  );
  decipher.setAuthTag(Buffer.from(tagRaw, "base64"));
  return Buffer.concat([
    decipher.update(Buffer.from(encryptedRaw, "base64")),
    decipher.final(),
  ]).toString("utf8");
}

module.exports = { decryptSecret, encryptSecret };
