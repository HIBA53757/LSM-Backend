import Course from "../models/course.js";
import TrainerPreference from "../models/TrainerPreference.js"
import { ConflictError, ForbiddenError, NotFoundError } from "../utils/errors.js";


export async function createPreferences(req, res, next) {
    try {
        const { subscribed, courses, frequency } = req.body
        const gitPreferences = await TrainerPreference.findOne({
            trainer: req.user.id
        })

        if (gitPreferences) {
            return next(
                new ConflictError("Trainer preferences already exist.")
            );
        }

        for (const courseid of courses) {
            const course = await Course.findById(courseid)
            if (!course) {
                return next(new NotFoundError('not found course:', courseid))
            }
            const isOwner = req.user.id.toString() === course.trainer.toString()

            if (!isOwner) {
                return next(new ForbiddenError("You can only select your own courses."))
            }
            // console.log(course , isOwner)
        }

        const preferences = await TrainerPreference.create({
            trainer: req.user.id,
            subscribed,
            courses,
            frequency
        })

        // console.log(preferences)

        return res.status(201).json({
            message: "Preferences created successfully.",
            preferences
        })
    } catch (err) {
        next(err)
    }
}


export async function updatePreferences(req, res, next) {
    try {
        const { subscribed, courses, frequency } = req.body
        const { id } = req.params
        const gitPreferences = await TrainerPreference.findOne({
            _id: id,
            trainer: req.user.id
        })

        if (!gitPreferences) {
            return next(
                new NotFoundError("Trainer preferences not found.")
            );
        }

        if (courses !== undefined) {
            for (const courseid of courses) {
                const course = await Course.findById(courseid)
                if (!course) {
                    return next(new NotFoundError('not found course:', courseid))
                }
                const isOwner = req.user.id.toString() === course.trainer.toString()

                if (!isOwner) {
                    return next(new ForbiddenError("You can only select your own courses."))
                }
                // console.log(course , isOwner)
            }
        }

        const preferences = await TrainerPreference.findOneAndUpdate({
            _id: id,
            trainer: req.user.id
        }, {
            $set: {
                subscribed,
                courses,
                frequency
            }
        }, { new: true, runValidators: true })

        // console.log(preferences)

        return res.status(200).json({
            message: "Preferences updated successfully.",
            preferences
        })
    } catch (err) {
        next(err)
    }
}


export async function getPreferences(req, res, next) {
    try {
        const preferences = await TrainerPreference.findOne({
            _id: req.params.id,
            trainer: req.user.id
        }).populate("courses", "title status");

        if (!preferences) {
            return next(
                new NotFoundError("Trainer preferences not found.")
            );
        }

        return res.status(200).json({
            preferences
        });
    } catch (err) {
        next(err);
    }
}


export async function deletePreferences(req, res, next) {
    try {
        const preferences = await TrainerPreference.findOneAndDelete({
            _id: req.params.id,
            trainer: req.user.id
        });

        if (!preferences) {
            return next(
                new NotFoundError("Trainer preferences not found.")
            );
        }

        return res.status(200).json({
            message: "Preferences deleted successfully."
        });
    } catch (err) {
        next(err);
    }
}