
import { readFile } from "node:fs/promises";

const allowedTemplates = [
  "registration",
  "course-enrolled",
  "password-reset",
  "inactive-reminder",
  "trainer-summary",
];

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export async function renderEmailTemplate(templateName, data = {}) {
  if (!allowedTemplates.includes(templateName)) {
    throw new Error(`Unknown email template: ${templateName}`);
  }

  const templateUrl = new URL(
    `../../templates/${templateName}.html`,
    import.meta.url
  );

  const template = await readFile(templateUrl, "utf8");

  return template.replace(
    /{{\s*([a-zA-Z0-9_]+)\s*}}/g,
    (placeholder, key) => {
      if (!(key in data) || data[key] == null) {
        throw new Error(`Missing template variable: ${key}`);
      }

      return escapeHtml(data[key]);
    }
  );
}
