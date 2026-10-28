import cron from "node-cron";
import AppConfig from "../models/appConfig.js";
import { runJob } from "./jobRunner.js";
import { inactiveReminder } from "./inactiveReminder.js";

export async function startScheduler() {
  const config = await AppConfig.findOne();

  if (!config || !config.emailsEnabled) {
    console.log("Scheduler disabled: emails are disabled or not configured.");
    return;
  }

  cron.schedule(config.inactiveReminderFrequency, async () => {
    try {
      await runJob("inactiveReminder", inactiveReminder);
    } catch (error) {
      console.error("Inactive reminder job failed:", error.message);
    }
  });

  console.log("Inactive reminder scheduler started.");
}