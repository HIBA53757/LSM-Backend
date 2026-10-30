import { renderEmailTemplate } from "./renderEmailTemplate.js";
import { sendEmail } from "./emailService.js";


function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
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

export async function sendInactiveReminderEmail(
  user,
  course,
  lastActivityDate,
  driver
) {
  const html = await renderEmailTemplate("inactive-reminder", {
    name: user.name,
    course: course.title,
    lastActivityDate: new Date(lastActivityDate).toLocaleDateString("fr-FR"),
  });

  return sendEmail({
    to: user.email,
    subject: `Rappel de votre apprentissage : ${course.title}`,
    html,
    driver,
  });
}

export async function sendTrainerSummaryEmail(trainer, statistics, driver) {
  const coursesSummary = statistics.courses
    .map(
      (course) => `
        <div>
          <h3>${escapeHtml(course.courseTitle)}</h3>
          <p>Nombre d'apprenants inscrits : ${course.enrolledLearnersCount}</p>
          <p>Progression moyenne : ${course.averageProgress}%</p>
        </div>
      `
    )
    .join("");

  const html = await renderEmailTemplate(
    "trainer-summary",
    {
      name: trainer.name,
      date: new Date().toLocaleDateString("fr-FR"),
      courseCount: statistics.coursesCount,
      coursesSummary: coursesSummary || "<p>Aucun cours disponible.</p>",
    },
    ["coursesSummary"]
  );

  return sendEmail({
    to: trainer.email,
    subject: "Résumé de votre activité de formateur",
    html,
    driver,
  });
}


