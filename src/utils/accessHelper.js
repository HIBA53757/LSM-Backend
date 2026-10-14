import Enrollment from "../models/Enrollment.js";

export const canAccessCourse = async (user, course) => {
  if (!user || !course) return false;

  if (user.role === "admin") return true;

  if (user.role === "trainer") {
    const trainerId = course.trainer?._id || course.trainer;
    return trainerId && trainerId.toString() === user.id.toString();
  }

  if (user.role === "learner") {
    const courseId = course._id || course;
    const activeEnrollment = await Enrollment.findOne({
      learner: user.id,
      course: courseId,
      status: "active",
    });
    return !!activeEnrollment;
  }

  return false;
};
