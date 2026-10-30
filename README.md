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

## React integration contract

The frontend should treat the API response envelope and the role attached to the JWT as the source of truth. The API does not issue a token during registration; call login after registration. Send the login token on protected requests as `Authorization: Bearer <token>` and keep it out of URLs and logs.

### Base URL and accounts by environment

| Environment | API base URL | Database / account setup |
| --- | --- | --- |
| Local development | `http://localhost:3000` (or the configured `PORT`) | Use the local `.env` database. `POST /api/auth/register` creates a learner account. To exercise trainer/admin screens, first register a development account, then change its `role` in the local MongoDB `users` collection to `trainer` or `admin`. |
| Docker Compose | `http://localhost:3001` with the supplied `.docker.env.example` (or the configured host port) | Register through the mapped API URL. For trainer/admin demo accounts, change the role of a registered account in the Compose MongoDB database. Do not use production credentials or data for demos. |
| Automated tests | Set `MONGO_URI` to a dedicated test database before running `npm test`. | Most integration tests create their own fixtures. `tests/feedback.test.js` also reads `TEST_ADMIN_EMAIL` and `TEST_ADMIN_PASSWORD` and expects that admin account to exist in the database it connects to. `MONGO_URI_TEST` is currently used by `tests/adminConfig.test.js`; it does not configure the whole suite. |

Registration only creates learner accounts. The current API has no public endpoint for creating trainer/admin accounts and the seed script does not create demo users, so those accounts must be provisioned separately in non-production data. Keep environment-specific passwords and JWT secrets outside the repository.

### Authentication

Register a learner with `POST /api/auth/register`:

```json
{
  "name": "Samira Learner",
  "email": "samira@example.com",
  "password": "<password>"
}
```

The response is `201 Created` and contains the created user, but no token:

```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "name": "Samira Learner",
      "id": "<userId>",
      "email": "samira@example.com",
      "role": "learner"
    }
  }
}
```

Then call `POST /api/auth/login` with the same email and password. Save `token` from the response and send it as a bearer token for protected calls. The login response user has `name`, `id`, `email`, and `role` fields.

```http
Authorization: Bearer <token>
```

### Course catalog and enrollment

The catalog is public. `GET /api/courses` returns `{ "success": true, "data": { "courses": [...] } }`; each course includes its published course fields such as `_id`, `title`, `description`, `objectives`, `level`, `category`, `estimatedDuration`, `status`, `publishedAt`, and `trainer`. Optional query parameters are `category`, `level`, `keyword`, and `sort` (`createdAt`, `-createdAt`, `publishedAt`, or `-publishedAt`).

Use `GET /api/courses/:courseId` for one published course and `GET /api/courses/:courseId/modules` for its modules. An authenticated learner enrolls with `POST /api/enrollments/courses/:courseId/enroll`; the response puts the created enrollment at `data.enrollment`. `GET /api/enrollments/me` returns the learner's enrollments at `data.enrollments`.

### Learner progression

Progress is learner-specific and requires an active enrollment. The current progression routes are:

1. `GET /api/progress/resources/:resourceId/view` retrieves an accessible resource and creates the learner's initial progress record if needed. Its response is `{ "success": true, "data": { "resource": ... } }`.
2. After the learner views it, `POST /api/progress/resources/:resourceId/complete` records it in progress. The response includes `data.progress`.
3. `POST /api/progress/modules/:moduleId/complete` completes the module after its resources, any required quiz, and the previous module satisfy the backend rules.
4. `GET /api/progress/courses/:courseId` returns the saved course progress.

The course progress response has this shape:

```json
{
  "success": true,
  "data": {
    "courseId": "<courseId>",
    "percent": 50,
    "completedResourcesCount": 2,
    "modules": [
      {
        "id": "<moduleId>",
        "title": "Module title",
        "position": 1,
        "status": "done"
      },
      {
        "id": "<nextModuleId>",
        "title": "Next module",
        "position": 2,
        "status": "accessible"
      }
    ]
  }
}
```

Module `status` values are `accessible`, `locked`, `in progress`, and `done`. The progress endpoint returns `404` until a progress record has been created through the resource view flow.

### Trainer statistics

`GET /api/trainer/statistics` requires a trainer bearer token. It returns one aggregate per course owned by that trainer:

```json
{
  "success": true,
  "data": {
    "coursesCount": 1,
    "courses": [
      {
        "courseId": "<courseId>",
        "courseTitle": "JavaScript Fundamentals",
        "enrolledLearnersCount": 12,
        "averageProgress": 45
      }
    ]
  }
}
```

`enrolledLearnersCount` counts active and completed enrollments. `averageProgress` is the rounded average percentage for enrolled learners who have started progress; it is `0` when there are no started progress records. `coursesCount` is the number of trainer-owned courses returned by the aggregation.

### Error responses

Errors handled by the shared middleware use this response shape; React can display `message` and use the HTTP status for handling authentication, access, validation, and missing-resource cases:

```json
{
  "success": false,
  "message": "Previous module must be completed first"
}
```

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
