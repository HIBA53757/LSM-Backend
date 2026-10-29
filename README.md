# LMS Backend

REST API for a Learning Management System built with Node.js, Express, MongoDB, and Mongoose. It supports learner enrollment and sequential course progression, course content management, quizzes, quiz attempts, trainer preferences, and feedback.

## Tech stack

- Node.js (ES modules)
- Express 5
- MongoDB and Mongoose
- JWT authentication and role-based access
- Jest and Supertest for API tests
- Docker Compose for running the API and MongoDB

## Requirements

- Node.js and npm
- MongoDB locally, or Docker with Docker Compose

## Local setup

Install dependencies and create your local environment file:

```bash
npm install
cp .env.example .env
```

Set `MONGO_URI` and `JWT_SECRET` in `.env`. The supplied example uses a local MongoDB instance at `mongodb://localhost:27017/lms`.

Start the API in development mode:

```bash
npm run dev
```

Or start it normally:

```bash
npm start
```

The default API address is `http://localhost:3000`. The server binds to the configured `HOST` and `PORT` and logs the listener addresses it detects.

## Docker setup

Create the Docker environment file and start the services:

```bash
cp .docker.env.example .docker.env
docker compose up --build -d
```

The Docker environment example connects the API to the Compose MongoDB service at `mongodb://mongodb:27017/lms`. The API port and bind host are configured by `HOST` and `PORT` in `.docker.env`.

Stop the services with:

```bash
docker compose down
```

MongoDB data is stored in the `mongodb_data` Docker volume.

## Environment variables

| Variable | Purpose | Example |
| --- | --- | --- |
| `HOST` | Address the API binds to | `0.0.0.0` |
| `PORT` | API port | `3000` locally; `.docker.env.example` uses `3001` |
| `MONGO_URI` | MongoDB connection string | `mongodb://localhost:27017/lms` |
| `JWT_SECRET` | Secret used to sign and verify tokens | Set a private value |
| `EMAIL_DRIVER` | Email delivery mode | `log` |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` | SMTP settings when using SMTP email delivery | See `.env.example` |
| `FRONTEND_URL` | Frontend base URL used in password reset links | Defaults to `http://localhost:5173` |

Use a private `JWT_SECRET` and real SMTP credentials only in your local environment; do not commit secrets.

## API overview

All API routes are mounted under `/api`. Protected routes require a bearer token and enforce the role shown in the route definitions.

### Health and account

| Method | Endpoint | Access |
| --- | --- | --- |
| `GET` | `/` | Health response |
| `POST` | `/api/auth/register` | Public |
| `POST` | `/api/auth/login` | Public |
| `POST` | `/api/auth/forgot-password` | Public |
| `POST` | `/api/auth/reset-password` | Public |
| `GET` | `/api/profiles/me` | Authenticated user |

### Courses and content

| Method | Endpoint | Access |
| --- | --- | --- |
| `GET` | `/api/courses` | Public course listing; supports query filters/search/sorting |
| `GET` | `/api/courses/:id` | Public course details |
| `GET` | `/api/courses/:courseId/modules` | Public course modules |
| `POST` | `/api/courses` | Trainer or admin |
| `PATCH` | `/api/courses/:id` | Course owner or admin |
| `PATCH` | `/api/courses/:id/publish` | Course owner or admin |
| `PATCH` | `/api/courses/:id/unpublish` | Course owner or admin |
| `PATCH` | `/api/courses/:id/archived` | Course owner or admin |
| `POST` | `/api/modules/courses/:courseId` | Trainer or admin who owns the course |
| `GET` | `/api/modules/:moduleId/resources` | Authenticated user |
| `PUT` | `/api/modules/:moduleId` | Module owner or admin |
| `PATCH` | `/api/modules/:moduleId/publish` | Module owner or admin |
| `PATCH` | `/api/modules/:moduleId/unpublish` | Module owner or admin |
| `POST` | `/api/resources/modules/:moduleId` | Trainer or admin who owns the module; accepts an optional uploaded `file` |
| `PUT` | `/api/resources/:resourceId` | Resource owner or admin |
| `PATCH` | `/api/resources/:resourceId/published` | Resource owner or admin |

Course listing filters include `category`, `level`, `keyword`, and `sort`. For example:

```text
GET /api/courses?category=JavaScript&level=beginner&sort=-createdAt
```

### Enrollment and learner progression

| Method | Endpoint | Access |
| --- | --- | --- |
| `GET` | `/api/enrollments/me` | Learner |
| `POST` | `/api/enrollments/courses/:courseId/enroll` | Learner |
| `PATCH` | `/api/enrollments/:id/cancel` | Learner |
| `GET` | `/api/progress/courses/:courseId` | Enrolled learner |
| `GET` | `/api/progress/resources/:resourceId/view` | Enrolled learner; retrieves a resource subject to progression rules |
| `POST` | `/api/progress/resources/:resourceId/complete` | Enrolled learner; records a resource as viewed/completed |
| `POST` | `/api/progress/modules/:moduleId/complete` | Enrolled learner; completes a module subject to progression rules |

Progress endpoints resolve the course/module/resource from the supplied identifier and check the learner's active enrollment. Sequential access and completion rules are enforced by the backend.

### Quizzes and quiz attempts

| Method | Endpoint | Access |
| --- | --- | --- |
| `GET` | `/api/quizzes/:quizId/view` | Learner enrolled in the quiz's course |
| `POST` | `/api/quizzes/submit` | Learner enrolled in the quiz's course |
| `GET` | `/api/quizzes/modules/:moduleId` | Trainer or admin; lists quizzes in a module |
| `GET` | `/api/quizzes/:quizId` | Quiz owner or admin |
| `POST` | `/api/quizzes` | Trainer or admin who owns the module |
| `PATCH` | `/api/quizzes/:quizId` | Quiz owner or admin |
| `DELETE` | `/api/quizzes/:quizId` | Quiz owner or admin |
| `GET` | `/api/quiz/attempts/me` | Learner |
| `GET` | `/api/quiz/attempts/me/courses/:courseId` | Learner enrolled in the course |
| `GET` | `/api/quiz/attempts` | Trainer or admin; lists attempts for their courses (admin: all courses) |
| `GET` | `/api/quiz/attempts/courses/:courseId` | Course owner or admin |

The learner quiz view omits correct answers. Submissions are scored and saved as quiz attempts.

### Trainer, feedback, and preferences

| Method | Endpoint | Access |
| --- | --- | --- |
| `GET` | `/api/trainer/Courses` | Trainer or admin |
| `GET` | `/api/trainer/courses/:courseId/learners` | Course owner or admin |
| `POST` | `/api/preferences` | Trainer |
| `GET` | `/api/preferences` | Trainer |
| `DELETE` | `/api/preferences` | Trainer |
| `POST` | `/api/feedback` | Trainer or admin |
| `PUT` | `/api/feedback/:id` | Trainer or admin |
| `DELETE` | `/api/feedback/:id` | Trainer or admin |
| `GET` | `/api/feedback/me` | Learner |
| `GET` | `/api/feedback` | Admin |

## Tests

Run the Jest and Supertest suite with:

```bash
npm test
```

The tests cover authentication, courses, enrollment, trainer quiz management, learner quiz viewing/submission, and quiz attempt endpoints.

## Project structure

```text
src/
  config/        Database connection
  controllers/   Request handlers
  middlewares/   Authentication, authorization, ownership, validation, and errors
  models/        Mongoose models
  routes/        Feature route definitions
  services/      Email services
  templates/     Email templates
  utils/         Shared helpers, errors, and listener reporting
  validations/   Request schemas
 tests/          Jest and Supertest tests
 seed/           Database seed script
 docs/           Project diagrams and progression notes
```

## Contrat React

### Statistiques du formateur

**Endpoint :** `GET /api/trainer/statistics`  
**Authentification :** token Bearer obligatoire. Réservé au rôle `trainer`.  
**Résultat :** les statistiques portent uniquement sur les cours du formateur authentifié.

**Réponse `200` :**

```json
{
  "success": true,
  "data": {
    "coursesCount": 1,
    "courses": [
      {
        "courseId": "64f000000000000000000001",
        "courseTitle": "JavaScript",
        "enrolledLearnersCount": 12,
        "averageProgress": 48
      }
    ]
  }
}
