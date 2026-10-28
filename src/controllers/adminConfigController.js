import AppConfig from "../models/appConfig.js";
import cron from "node-cron";
import { ValidationError } from "../utils/errors.js";


const defaultConfig = {
    emailsEnabled: true,
    emailDriver: "log",
    inactiveDays: 7,
    inactiveReminderFrequency: "0 9 * * *",
    trainerSummaryFrequency: "0 8 * * 1",
};

export async function getConfig(req, res, next) {
    try {
        let config = await AppConfig.findOne()
        if(!config){
            config = await AppConfig.create(defaultConfig)
        }
        return res.status(200).json({
            success:true,
            data: config
        })
    }
    catch (error) {
        next(error)
    }
}

export async function updateConfig(req, res, next) {
  try {
    const {
      emailsEnabled,
      emailDriver,
      inactiveDays,
      inactiveReminderFrequency,
      trainerSummaryFrequency,
    } = req.body || {};

    const allowedFields = [
      "emailsEnabled",
      "emailDriver",
      "inactiveDays",
      "inactiveReminderFrequency",
      "trainerSummaryFrequency",
    ];

    const providedFields = Object.keys(req.body || {});

    if (
      providedFields.length === 0 ||
      providedFields.some((field) => !allowedFields.includes(field))
    ) {
      return next(
        new ValidationError(
          "Provide valid configuration fields to update.",
        ),
      );
    }

    if (
      emailsEnabled !== undefined &&
      typeof emailsEnabled !== "boolean"
    ) {
      return next(
        new ValidationError("emailsEnabled must be a boolean."),
      );
    }

    if (
      emailDriver !== undefined &&
      !["log", "sandbox"].includes(emailDriver)
    ) {
      return next(
        new ValidationError(
          "emailDriver must be log or sandbox.",
        ),
      );
    }

    if (
      inactiveDays !== undefined &&
      (!Number.isInteger(inactiveDays) || inactiveDays < 1)
    ) {
      return next(
        new ValidationError(
          "inactiveDays must be a positive integer.",
        ),
      );
    }

    if (
      inactiveReminderFrequency !== undefined &&
      (typeof inactiveReminderFrequency !== "string" ||
        !cron.validate(inactiveReminderFrequency))
    ) {
      return next(
        new ValidationError(
          "Invalid inactive reminder cron expression.",
        ),
      );
    }

    if (
      trainerSummaryFrequency !== undefined &&
      (typeof trainerSummaryFrequency !== "string" ||
        !cron.validate(trainerSummaryFrequency))
    ) {
      return next(
        new ValidationError(
          "Invalid trainer summary cron expression.",
        ),
      );
    }

    let config = await AppConfig.findOne();

    if (!config) {
      config = new AppConfig(defaultConfig);
    }

    for (const field of providedFields) {
      config[field] = req.body[field];
    }

    await config.save();

    return res.status(200).json({
      success: true,
      message: "Configuration updated successfully.",
      data: config,
    });
  } catch (error) {
    next(error);
  }
}
