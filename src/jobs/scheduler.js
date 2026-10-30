import cron from "node-cron";
import AppConfig from "../models/appConfig.js";
import { runJob } from "./jobRunner.js";
import { inactiveReminder } from "./inactiveReminder.js";
import { trainerSummary } from "./trainerSummary.js";

export async function startScheduler() {
  const config = await AppConfig.findOne();

  if (!config || !config.emailsEnabled) {
    console.log("Scheduler disabled: emails are disabled or not configured.");
    return;
  }

  // job 1: inactive learner reminders
  if (cron.validate(config.inactiveReminderFrequency)) {
    cron.schedule(config.inactiveReminderFrequency, async () => {
      try {
        await runJob("inactiveReminder", inactiveReminder);
      } catch (error) {
        console.error("Inactive reminder job failed:", error.message);
      }
    });

    console.log("Inactive reminder scheduler started.");
  }

  // job 2: Trainer summaries
  if (cron.validate(config.trainerSummaryFrequency)) {
    cron.schedule(config.trainerSummaryFrequency, async () => {
      try {
        await runJob("trainerSummary", trainerSummary);
      } catch (error) {
        console.error("Trainer summary job failed:", error.message);
      }
    });

    console.log("Trainer summary scheduler started.");
  }
}