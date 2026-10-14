import Progress from "../models/Progress.js";
import Enrollment from "../models/Enrollment.js";
import Module from "../models/module.js";
import Resource from "../models/resource.js";

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

// POST /api/resources/:resourceId/view
export const markResourceViewed = async (req, res) => {
  try {
    const { resourceId } = req.params;
    const learnerId = req.user.id;

    // 1. Vérifier si la ressource existe
    const resource = await Resource.findById(resourceId);
    if (!resource) {
      return res.status(404).json({ message: "Resource not found" });
    }

    // 2. Trouver le module lié pour identifier le cours
    const moduleDoc = await Module.findById(resource.module);
    if (!moduleDoc) {
      return res
        .status(404)
        .json({ message: "Module not found for this resource" });
    }

    // 3. Récupérer le document de progression de l'apprenant
    const progress = await Progress.findOne({
      learner: learnerId,
      course: moduleDoc.course,
    });

    if (!progress) {
      return res
        .status(400)
        .json({ message: "Please start the course before viewing resources" });
    }

    // 4. Vérifier si la ressource est déjà marquée vue (éviter les doublons)
    const alreadyViewed = progress.completedResources.some(
      (id) => id.toString() === resourceId.toString(),
    );

    if (!alreadyViewed) {
      progress.completedResources.push(resourceId);
      await progress.save();
    }

    res.status(200).json({
      message: "Resource marked as viewed",
      progress,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
