import EmailLog from "../../models/emailLog.js";

export async function sendEmail({ to, subject, text, html }) {
  const driver = process.env.EMAIL_DRIVER || "log";

  try {
    if (driver === "log") {
      console.log("logs")
      console.log("to:", to)
      console.log("subject:", subject)
      console.log("text:", text || "")
      console.log("html:", html || "")
      console.log("driver:", driver)
    } else {
      throw new Error(`Email driver not implemented: ${driver}`)
    }
  } catch (error) {
    await EmailLog.create({
      to,
      subject,
      driver,
      status: "failed",
      error: error.message,
    })

    throw error;
  }

  await EmailLog.create({
    to,
    subject,
    driver,
    status: "sent",
    error: null,
  })

  return { success: true, driver }
}
