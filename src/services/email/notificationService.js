import { renderEmailTemplate } from "./renderEmailTemplate.js";
import { sendEmail } from "./emailService.js";

export async function sendWelcomeEmail(user) {
  const html = await renderEmailTemplate("registration", {
    name: user.name,
  });

  return sendEmail({
    to: user.email,
    subject: "Bienvenue sur LMS",
    html,
  });
}