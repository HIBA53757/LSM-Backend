import Enrollment from "../models/Enrollment.js";
import Course from "../models/course.js";
import { ConflictError, NotFoundError } from "../utils/errors.js";

// POST /api/courses/:courseId/enroll
export const enrollCourse = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const learnerId = req.user.id;

    // 1. Verify course exists and is published
    // const course = await Course.findById(courseId);
    // if (!course) {
    //   return res.status(404).json({ message: "Course not found" });
    // }
    const course = await Course.findById(courseId);
    if (!course || course.status !== "published") {
      return next(new NotFoundError("Course not found or not published"));
    }

    if (course.status !== "published") {
      return next(new ConflictError("Cannot enroll in an unpublished course"));
    }

    // 2. Check if user already has an active enrollment
    const existingEnrollment = await Enrollment.findOne({
      learner: learnerId,
      course: courseId,
      status: "active",
    });

    if (existingEnrollment) {
      return next(new ConflictError("You are already actively enrolled in this course"));
    }

    const enrollment = await Enrollment.create({
      learner: learnerId,
      course: courseId,
      status: "active",
    });

    res.status(201).json({
      success: true,
      message: "Successfully enrolled in course",
      data: {enrollment},
    });
  } catch (error) {
    // Handle Mongoose duplicate key error if race conditions occur
    next(error)
  }
};

// GET /api/learners/me/enrollments
export const getMyEnrollments = async (req, res, next) => {
  try {
    const enrollments = await Enrollment.find({ learner: req.user.id })
      .populate("course", "title description status")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success : true,
      data: {
        enrollments
      }
    });
  } catch (error) {
    next(error)
  }
};

// PATCH /api/enrollments/:id/cancel
export const cancelEnrollment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const learnerId = req.user.id;

    const enrollment = await Enrollment.findOne({
      _id: id,
      learner: learnerId,
    });
    if (!enrollment) {
      return next(new NotFoundError("Enrollment not found"));
    }

    if (enrollment.status === "dropped") {
      return next(new ConflictError("Enrollment already cancelled"));
    }

    enrollment.status = "dropped";
    await enrollment.save();

    res.status(200).json({ 
        success: true,
        message: "Enrollment cancelled successfully",
        data: {
          enrollment
        } });
  } catch (error) {
    next(error)
  }
};
