import Progress from "../models/Progress.js";
import Enrollment from "../models/Enrollment.js";

// POST /api/courses/:courseId/progress/start
export const startOrResumeCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const learnerId = req.user.id;

    const enrollment = await Enrollment.findOne({
      learner: learnerId,
      course: courseId,
      status: "active",
    });

    if (!enrollment) {
      return res
        .status(403)
        .json({ message: "Active enrollment required to start course" });
    }

    let progress = await Progress.findOne({ enrollment: enrollment.id });

    if (!progress) {
      progress = await Progress.create({
        enrollment: enrollment.id,
        learner: learnerId,
        course: courseId,
        completedResources: [],
        completedModules: [],
        percent: 0,
      });
    }

    res.status(200).json({ progress });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
