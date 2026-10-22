import nodemailer from "nodemailer";
import EmailLog from "../../models/emailLog.js";

export async function sendEmail({ to, subject, text, html ,  driver = process.env.EMAIL_DRIVER || "log" }) {
  

  if (!["log", "sandbox"].includes(driver)) {
    throw new Error(`Unsupported email driver: ${driver}`);
  }

  let sendError = null;

  try {
    if (driver === "log") {
      console.log("email log");
      console.log("to:", to);
      console.log("subject:", subject);
      console.log("text:", text || "");
      console.log("HTML:", html || "");
      console.log("driver:", driver);
    }

    if (driver === "sandbox") {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 2525),
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to,
        subject,
        text,
        html,
      });
    }
  } catch (error) {
    sendError = error;
  }

  await EmailLog.create({
    to,
    subject,
    driver,
    status: sendError ? "failed" : "sent",
    error: sendError ? sendError.message : null,
  });

  if (sendError) {
    throw sendError;
  }

  return { success: true, driver };
}