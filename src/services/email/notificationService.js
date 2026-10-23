import { renderEmailTemplate } from "./renderEmailTemplate.js";
import { sendEmail } from "./emailService.js";

export async function sendWelcomeEmail(user) {
  const html = await renderEmailTemplate("registration", {
    name: user.name,
  });
  console.log(user.email)
  return sendEmail({
    to: user.email,
    subject: "Bienvenue sur LMS",
    html,
  });
}