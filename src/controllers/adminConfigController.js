import { success } from "zod";
import AppConfig from "../models/appConfig.js";

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