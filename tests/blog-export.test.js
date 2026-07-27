const { createBlogDocxBuffer } = require("../lib/blog-export");
const { decryptSecret, encryptSecret } = require("../lib/secret-crypto");

describe("blog export utilities", () => {
  test("encryptSecret round-trips stored credentials", () => {
    const encrypted = encryptSecret("wp-app-password");
    expect(encrypted).toMatch(/^v1:/);
    expect(decryptSecret(encrypted)).toBe("wp-app-password");
  });

  test("createBlogDocxBuffer returns a docx zip buffer", async () => {
    const buffer = await createBlogDocxBuffer({
      title: "Blog SEO",
      content: "# Blog SEO\n\n## Tema\n\nContenido de prueba.",
    });
    expect(Buffer.isBuffer(buffer)).toBe(true);
    expect(buffer.slice(0, 2).toString()).toBe("PK");
  });
});
