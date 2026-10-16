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
// GET /api/courses/:courseId/progression
export const getCourseProgression = async (req, res) => {
  try {
    const { courseId } = req.params;
    const learnerId = req.user.id;

    // 1. Récupérer le document de progression
    const progress = await Progress.findOne({
      learner: learnerId,
      course: courseId,
    });

    if (!progress) {
      return res
        .status(404)
        .json({ message: "Progress not found. Please start the course first" });
    }

    // 2. Récupérer tous les modules triés par ordre
    const allModules = await Module.find({ course: courseId }).sort({
      orderIndex: 1,
    });

    // 3. Tableau vide qu'on va remplir pas à pas
    const modulesWithStatus = [];

    // Boucle standard débutant : on traite chaque module l'un après l'autre
    for (let i = 0; i < allModules.length; i++) {
      const currentModule = allModules[i];
      let status = "locked";

      // Vérification 1 : Est-ce que ce module est déjà terminé ?
      let isDone = false;
      for (let m = 0; m < progress.completedModules.length; m++) {
        if (
          progress.completedModules[m].toString() ===
          currentModule.id.toString()
        ) {
          isDone = true;
          break;
        }
      }

      if (isDone) {
        status = "done";
      } else {
        // Vérification 2 : Est-ce qu'on a le droit d'y accéder ?
        let canAccess = false;

        if (i === 0) {
          // Le tout premier module est toujours accessible
          canAccess = true;
        } else {
          // Pour les suivants, on regarde si le module d'avant (i - 1) est terminé
          const previousModule = allModules[i - 1];
          for (let m = 0; m < progress.completedModules.length; m++) {
            if (
              progress.completedModules[m].toString() ===
              previousModule.id.toString()
            ) {
              canAccess = true;
              break;
            }
          }
        }

        // Si le module n'est pas accessible, il reste 'locked'
        if (canAccess) {
          // Vérification 3 : A-t-il commencé à voir des ressources de ce module ?
          const moduleResources = await Resource.find({
            module: currentModule.id,
          });
          let hasViewedAnyResource = false;

          for (let r = 0; r < moduleResources.length; r++) {
            const resourceId = moduleResources[r].id.toString();
            for (let c = 0; c < progress.completedResources.length; c++) {
              if (progress.completedResources[c].toString() === resourceId) {
                hasViewedAnyResource = true;
                break;
              }
            }
            if (hasViewedAnyResource) break;
          }

          if (hasViewedAnyResource) {
            status = "in progress";
          } else {
            status = "accessible";
          }
        }
      }

      // On ajoute l'objet propre dans notre liste
      modulesWithStatus.push({
        id: currentModule.id,
        title: currentModule.title,
        orderIndex: currentModule.orderIndex,
        status: status,
      });
    }

    // 4. Réponse envoyée
    res.status(200).json({
      courseId: courseId,
      percent: progress.percent,
      completedResourcesCount: progress.completedResources.length,
      modules: modulesWithStatus,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
