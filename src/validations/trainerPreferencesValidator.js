import z from "zod";


export const createTrainerPreferencesSchema = z.object({
  subscribed: z.boolean(),
  courses: z.array(z.string()),
  frequency: z.enum(["daily", "weekly", "monthly"]).optional(),
});


export const updateTrainerPreferencesSchema = createTrainerPreferencesSchema.partial()