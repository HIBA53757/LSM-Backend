# Transition Brief 1 → Brief 2

## 1. État initial du Brief 1

Le Brief 1 fournit une API LMS permettant de consulter le catalogue
pédagogique composé de cours, modules et ressources.

La stack utilisée est :

- Node.js
- Express
- MongoDB
- Mongoose

## 2. Routes existantes

| Méthode | Endpoint | Statut | Justification |
|---|---|---|---|
| GET | `/api/courses` | Modified | Le catalogue public utilisera le nouveau champ `status` et retournera uniquement les cours publiés. |
| GET | `/api/courses/:id` | Modified | Le détail public utilisera le nouveau champ `status`. |
| GET | `/api/courses/:courseId/modules` | Modified | Le modèle Module évolue et la gestion des permissions sera ajoutée. |
| GET | `/api/modules/:moduleId/resources` | Modified | Le modèle Resource évolue pour gérer les nouveaux types et l'upload réel. |
| GET | `/` | Kept | Route utilisée pour vérifier que l'API fonctionne. |

## 3. Fonctionnalités ajoutées dans le Brief 2

| Fonctionnalité | Statut |
|---|---|
| Gestion des cours par le formateur | New |
| Gestion des modules | New |
| Gestion des ressources | New |
| Upload et téléchargement sécurisé | New |
| Endpoints du dashboard formateur | New |
| Documentation Swagger/OpenAPI | New |
| Tests automatisés | New |

## 4. Fonctionnalités reportées ou non réalisées

Les fonctionnalités suivantes sont prévues par le brief mais peuvent être
reportées selon le temps disponible :

- suppression définitive des cours, modules ou ressources ;
- historique des changements ;
- stockage cloud ;
- workflow complet de demande formateur ;
- gestion avancée de plusieurs formateurs par cours ;
- statistiques détaillées.

## 5. Règles de collaboration

- `main` reste stable.
- Chaque fonctionnalité est développée sur une branche dédiée.
- Une Pull Request est créée pour chaque fonctionnalité ou correction significative.
- Le code est relu et validé par le partenaire avant fusion.
- Les commits doivent être explicites.