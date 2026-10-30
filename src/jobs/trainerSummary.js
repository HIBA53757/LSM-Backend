import AppConfig from "../models/appConfig.js";
import User from "../models/User.js";

import { getTrainerStatistics } from "../services/email/trainerStatisticsService.js";
import { sendTrainerSummaryEmail } from "../services/email/notificationService.js";

export async function trainerSummary(trainerId = null) {
  const config = await AppConfig.findOne();

  if (!config || !config.emailsEnabled) {
    return {
      skipped: true,
      reason: "Emails are disabled or not configured",
    };
  }

  const filter = {
    role: "trainer",
    accountStatus: "active",
  };

  // If a trainer ID is provided, process only that trainer.
  if (trainerId) {
    filter._id = trainerId;
  }

  const trainers = await User.find(filter);

  let sent = 0;
  let failed = 0;
  let skipped = 0;

  for (const trainer of trainers) {
    try {
      const statistics = await getTrainerStatistics(trainer._id);

      if (statistics.coursesCount === 0) {
        skipped++;
        continue;
      }

      await sendTrainerSummaryEmail(
        trainer,
        statistics,
        config.emailDriver
      );

      sent++;
    } catch (error) {
      failed++;

      console.error(
        `Trainer summary failed for ${trainer.email}:`,
        error.message
      );
    }
  }

  return {
    checked: trainers.length,
    sent,
    failed,
    skipped,
  };
}