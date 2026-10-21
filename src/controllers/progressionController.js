import Progress from "../models/progress.js";
import Module from "../models/module.js";
import Resource from "../models/resource.js";
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from "../utils/errors.js";

export async function getResourceById(req, res, next) {
    try {
        const { resource, module, course, enrollment} = req;

        let progress = await Progress.findOne({ enrollment: enrollment.id });

        if (!progress) {
          progress = await Progress.create({
            enrollment: enrollment.id,
            learner: req.user.id,
            course: course.id,
            completedResources: [],
            completedModules: [],
            percent: 0,
          });
        }

        const modules = await Module.find({
            course: course._id,
            status: "published",
        }).sort({ position: 1 });

        const currentIndex = modules.findIndex(
            (item) => item._id.toString() === module._id.toString(),
        );

        if (currentIndex > 0) {
            const progress = await Progress.findOne({
                learner: req.user.id,
                course: course._id,
            });
            const previousModule = modules[currentIndex - 1];
            const previousCompleted = progress?.completedModules.some(
                (id) => id.toString() === previousModule._id.toString(),
            );

            if (!previousCompleted) {
                return next(new ForbiddenError("Previous module must be completed first"));
            }
        }

        res.status(200).json({
            success: true,
            data: { resource },
        });
    } catch (error) {
        next(error);
    }
}


export const markResourceViewed = async (req, res, next) => {
  try {
    const { resource, module, course, enrollment} = req;
    const learnerId = req.user.id;

    const progress = await Progress.findOne({
      learner: learnerId,
      course: course.id,
    });

    if (!progress) {
      return next(new BadRequestError("Please start the course before viewing resources"));
    }

    const alreadyViewed = progress.completedResources.some(
      (id) => id.toString() === resource.id.toString(),
    );

    if (!alreadyViewed) {
      progress.completedResources.push(resource.id);
      await progress.save();
    }

    res.status(200).json({
      message: "Resource marked as viewed",
      data : {
        progress
      }
    });
  } catch (error) {
    next(error);
  }
};


export const completeModule = async (req, res, next) => {
  try {
    const {module, course, enrollment} = req;
    const learnerId = req.user.id;

    const progress = await Progress.findOne({
      learner: learnerId,
      course: course.id,
    });

    if (!progress) {
      return next(new BadRequestError("Please start the course first"));
    }

    // Si le module est déjà validé, pas besoin de refaire les calculs
    const isAlreadyDone = progress.completedModules.some(
      (id) => id.toString() === module.id.toString(),
    );
    if (isAlreadyDone) {
      return res
        .status(200)
        .json({ 
          success: true,
          message: "Module already completed", 
          data: {
            progress
          }
        });
    }

    // 3. Récupérer tous les modules du cours dans l'ordre
    const allModules = await Module.find({ course: course.id }).sort({
      position: 1,
    });
    const currentIndex = allModules.findIndex(
      (m) => m.id.toString() === module.id.toString(),
    );

    // 4. VERROU SÉQUENTIEL : Si ce n'est pas le 1er module, le précédent doit être terminé
    if (currentIndex > 0) {
      const previousModule = allModules[currentIndex - 1];
      const isPreviousDone = progress.completedModules.some(
        (id) => id.toString() === previousModule.id.toString(),
      );

      if (!isPreviousDone) {
        return next(new BadRequestError("Previous module must be completed first"));
      }
    }

    // 5. CONTRÔLE DES RESSOURCES : Toutes les ressources du module doivent être vues
    const moduleResources = await Resource.find({ module: module.id });
    const allResourcesDone = moduleResources.every((resource) =>
      progress.completedResources.some(
        (rId) => rId.toString() === resource.id.toString(),
      ),
    );

    if (!allResourcesDone) {
      return next(new BadRequestError("All resources in this module must be viewed first"));
    }

    // 6. Validation du module et calcul du pourcentage
    progress.completedModules.push(module.id);
    progress.percent = Math.round(
      (progress.completedModules.length / allModules.length) * 100,
    );

    await progress.save();

    res.status(200).json({
      seccess: true,
      message: "Module completed successfully",
      data: {
        progress
      }
    });
  } catch (error) {
    next(error);
  }
};


export const getCourseProgression = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const learnerId = req.user.id;

    // 1. Récupérer le document de progression
    const progress = await Progress.findOne({
      learner: learnerId,
      course: courseId,
    });

    if (!progress) {
      return next(new NotFoundError("Progress not found. Please start the course first"));
    }

    // 2. Récupérer tous les modules triés par ordre
    const allModules = await Module.find({ course: courseId }).sort({
      position: 1,
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
        position: currentModule.position,
        status: status,
      });
    }

    // 4. Réponse envoyée
    res.status(200).json({
      success: true,
      data: {
        courseId: courseId,
        percent: progress.percent,
        completedResourcesCount: progress.completedResources.length,
        modules: modulesWithStatus,
      }
    });
  } catch (error) {
    next(error);
  }
};
