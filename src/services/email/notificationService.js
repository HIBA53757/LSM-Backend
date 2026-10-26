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
