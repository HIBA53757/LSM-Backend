
import nodemailer from "nodemailer";
import EmailLog from "../../models/emailLog.js";
import AppConfig from "../../models/appConfig.js";

export async function sendEmail({
  to,
  subject,
  text,
  html,
  driver = process.env.EMAIL_DRIVER || "log",
}) {
  console.log("EMAIL_DRIVER loaded:", process.env.EMAIL_DRIVER);

  if (!["log", "sandbox"].includes(driver)) {
    throw new Error(`Unsupported email driver: ${driver}`);
  }

  const config = await AppConfig.findOne();

  if (config && !config.emailsEnabled) {
    console.log("Email skipped: emails are disabled.");

    await EmailLog.create({
      to,
      subject,
      driver,
      status: "failed",
      error: "Email skipped: emails are disabled",
    });

    return {
      success: false,
      skipped: true,
      reason: "Emails are disabled",
    };
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
    } else if (driver === "sandbox") {
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
