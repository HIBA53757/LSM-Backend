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
// POST /api/modules/:moduleId/complete
export const completeModule = async (req, res) => {
  try {
    const { moduleId } = req.params;
    const learnerId = req.user.id;

    // 1. Récupérer le module demandé
    const currentModule = await Module.findById(moduleId);
    if (!currentModule) {
      return res.status(404).json({ message: "Module not found" });
    }

    const courseId = currentModule.course;

    // 2. Récupérer le document de progression de l'apprenant
    const progress = await Progress.findOne({
      learner: learnerId,
      course: courseId,
    });

    if (!progress) {
      return res.status(400).json({ message: "Please start the course first" });
    }

    // Si le module est déjà validé, pas besoin de refaire les calculs
    const isAlreadyDone = progress.completedModules.some(
      (id) => id.toString() === moduleId.toString(),
    );
    if (isAlreadyDone) {
      return res
        .status(200)
        .json({ message: "Module already completed", progress });
    }

    // 3. Récupérer tous les modules du cours dans l'ordre
    const allModules = await Module.find({ course: courseId }).sort({
      position: 1,
    });
    const currentIndex = allModules.findIndex(
      (m) => m.id.toString() === moduleId.toString(),
    );

    // 4. VERROU SÉQUENTIEL : Si ce n'est pas le 1er module, le précédent doit être terminé
    if (currentIndex > 0) {
      const previousModule = allModules[currentIndex - 1];
      const isPreviousDone = progress.completedModules.some(
        (id) => id.toString() === previousModule.id.toString(),
      );

      if (!isPreviousDone) {
        return res.status(400).json({
          message: "Previous module must be completed first",
        });
      }
    }

    // 5. CONTRÔLE DES RESSOURCES : Toutes les ressources du module doivent être vues
    const moduleResources = await Resource.find({ module: moduleId });
    const allResourcesDone = moduleResources.every((resource) =>
      progress.completedResources.some(
        (rId) => rId.toString() === resource.id.toString(),
      ),
    );

    if (!allResourcesDone) {
      return res.status(400).json({
        message: "All resources in this module must be viewed first",
      });
    }

    // 6. Validation du module et calcul du pourcentage
    progress.completedModules.push(moduleId);
    progress.percent = Math.round(
      (progress.completedModules.length / allModules.length) * 100,
    );

    await progress.save();

    res.status(200).json({
      message: "Module completed successfully",
      progress,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
