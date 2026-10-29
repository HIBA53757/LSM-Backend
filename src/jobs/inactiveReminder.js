
import AppConfig from "../models/appConfig.js";
import Progress from "../models/progress.js";
import { sendInactiveReminderEmail } from "../services/email/notificationService.js";

export async function inactiveReminder() {
  const config = await AppConfig.findOne();

  if (!config || !config.emailsEnabled) {
    return { skipped: true, reason: "Emails are disabled or not configured" };
  }

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - config.inactiveDays);

  const progressRecords = await Progress.find({
    updatedAt: { $lte: cutoffDate },
  })
    .populate("learner")
    .populate("course")
    .populate("enrollment");

  let sent = 0;
  let failed = 0;
  let skipped = 0;

  for (const progress of progressRecords) {
    if (!progress.learner || !progress.course || !progress.enrollment) {
      skipped++;
      continue;
    }

    if (progress.enrollment.status !== "active") {
      skipped++;
      continue;
    }

    try {
      await sendInactiveReminderEmail(
        progress.learner,
        progress.course,
        progress.updatedAt,
        config.emailDriver
      );

      sent++;
    } catch (error) {
      failed++;
      console.error(
        `Reminder failed for learner ${progress.learner._id}:`,
        error.message
      );
    }
  }

  return {
    checked: progressRecords.length,
    sent,
    failed,
    skipped,
  };
}
