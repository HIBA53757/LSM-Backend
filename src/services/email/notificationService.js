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

export async function sendCourseEnrolledEmail(user, course) {
  const html = await renderEmailTemplate("course-enrolled", {
    name: user.name,
    courseTitle: course.title,
  });
   
  return sendEmail({
    to: user.email,
    subject: `Inscription confirmée : ${course.title}`,
    html,
  });
}

export async function sendPasswordResetEmail(user, resetUrl,resetToken) {
  const html = await renderEmailTemplate("password-reset", {
    name: user.name,
    resetUrl,
    resetToken,
  });

  return sendEmail({
    to: user.email,
    subject: "Réinitialisation de votre mot de passe LMS",
    html,
  });
}

