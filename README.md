# LMS Backend

REST API for a Learning Management System built with Node.js, Express, MongoDB, and Mongoose. It supports learner accounts, course enrollment and progression, learning resources, quizzes and quiz attempts, trainer statistics and preferences, feedback, configurable email delivery, and an administrator endpoint for manually running the inactive learner reminder job.

## Tech stack

- Node.js with ES modules
- Express 5
- MongoDB and Mongoose
- JWT bearer authentication with learner, trainer, and admin roles
- Jest and Supertest
- Docker Compose
- Swagger UI at `/api-docs`

## Requirements

- Node.js and npm
- MongoDB locally, or Docker with Docker Compose

## Local setup

Install the dependencies and create a local environment file:

```bash
npm install
cp .env.example .env
```

Set at least `MONGO_URI` and `JWT_SECRET` in `.env`. The example database URL is:

```dotenv
MONGO_URI=mongodb://localhost:27017/lms
```

Start the API in development mode:

```bash
npm run dev
```

Or start it normally:

```bash
npm start
```

The default local API URL is `http://localhost:3000`. The server uses the `HOST` and `PORT` values from `.env`.

## Demo seed and accounts

The seed script needs a password for each demo role. Add private values to `.env` before running it:

```dotenv
SEED_ADMIN_PASSWORD=<private-admin-password>
SEED_TRAINER_PASSWORD=<private-trainer-password>
SEED_LEARNER_PASSWORD=<private-learner-password>
```

Run the seed:

```bash
npm run db:seed
```

The script connects to the database configured by `MONGO_URI` and creates or updates these accounts:

| Role | Demo email | Password variable |
| --- | --- | --- |
| Admin | `admin.demo@example.test` | `SEED_ADMIN_PASSWORD` |
| Trainer | `trainer.one@example.test` | `SEED_TRAINER_PASSWORD` |
| Trainer | `trainer.two@example.test` | `SEED_TRAINER_PASSWORD` |
| Learner | `learner.one@example.test` | `SEED_LEARNER_PASSWORD` |
| Learner | `learner.two@example.test` | `SEED_LEARNER_PASSWORD` |

The seed also creates demo learning data. Re-running it resets the demo account passwords and replaces seed-owned demo courses and their related data. Run it only against a development database, never production.

Registration creates learner accounts only. To sign in as a demo account, use `POST /api/auth/login` with the email and password configured above.

## Docker Compose

Create the Docker environment file and start the services:

```bash
cp .docker.env.example .docker.env
```

Set private values for `JWT_SECRET` and the three `SEED_*_PASSWORD` variables in `.docker.env`, then start Docker:

```bash
docker compose up --build -d
```

The supplied Docker configuration connects the API to the Compose MongoDB service at `mongodb://mongodb:27017/lms`. The default API URL is `http://localhost:3001`.

Seed the Docker database from inside the API container:

```bash
docker compose exec api npm run db:seed
```

Stop the services with:

```bash
docker compose down
```

MongoDB data is kept in the `mongodb_data` volume. To also remove that database volume, Docker Compose supports `docker compose down -v`; this deletes the persisted database data.

## Environment variables

| Variable | Purpose | Example or default |
| --- | --- | --- |
| `HOST` | Address the API binds to | `0.0.0.0` |
| `PORT` | API port | `3000` locally; `3001` in `.docker.env.example` |
| `MONGO_URI` | MongoDB connection string | `mongodb://localhost:27017/lms` locally; `mongodb://mongodb:27017/lms` in Docker |
| `JWT_SECRET` | Secret used to sign and verify JWTs | Set a private value |
| `FRONTEND_URL` | Base URL used to build password reset links | Defaults to `http://localhost:5173` |
| `EMAIL_DRIVER` | Email delivery mode used by the email service | `log` by default; `sandbox` uses SMTP |
| `SMTP_HOST` | SMTP server hostname | See `.env.example` |
| `SMTP_PORT` | SMTP server port | `2525` by default in the email service |
| `SMTP_USER` | SMTP account username | Set for SMTP delivery |
| `SMTP_PASS` | SMTP account password | Set for SMTP delivery |
| `EMAIL_FROM` | Sender address used by the email service | Set for SMTP delivery |
| `SEED_ADMIN_PASSWORD` | Demo admin password | Required by the seed |
| `SEED_TRAINER_PASSWORD` | Shared password for both demo trainers | Required by the seed |
| `SEED_LEARNER_PASSWORD` | Shared password for both demo learners | Required by the seed |

Keep `.env`, `.docker.env`, JWT secrets, SMTP credentials, and demo passwords out of version control. The email service reads `EMAIL_FROM`; check the example environment files for the sender variable name before configuring SMTP.

## Authentication and React integration contract

All API endpoints are mounted under `/api`. Successful responses generally use a JSON envelope with `success`, `message` where provided, and `data`. Protected routes require:

```http
Authorization: Bearer <token>
```

Use the role returned by login as the source of truth for role-based screens. Registration does not return a token; call login after registration.

### Register and log in

Register a learner:

```http
POST /api/auth/register
Content-Type: application/json
```

```json
{
  "name": "Samira Learner",
  "email": "samira@example.com",
  "password": "<password>"
}
```

A successful registration returns `201 Created`, user details, and no token. Then log in:

```http
POST /api/auth/login
Content-Type: application/json
```

```json
{
  "email": "samira@example.com",
  "password": "<password>"
}
```

A successful login returns a bearer token and user details:

```json
{
  "success": true,
  "message": "Logged in successfully",
  "token": "<jwt>",
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

Send the token in the `Authorization` header for protected requests. Do not put tokens in URLs or logs.

### Course catalog and enrollment

The course catalog is public:

```http
GET /api/courses
GET /api/courses/:courseId
GET /api/courses/:courseId/modules
```

The listing accepts `category`, `level`, `keyword`, and `sort` query parameters. Supported sort values are `createdAt`, `-createdAt`, `publishedAt`, and `-publishedAt`. Example:

```text
GET /api/courses?category=JavaScript&level=beginner&sort=-createdAt
```

The course listing response places courses at `data.courses`. A course includes published course fields such as its ID, title, description, objectives, level, category, estimated duration, status, publication date, and trainer.

A learner enrolls in a course with:

```http
POST /api/enrollments/courses/:courseId/enroll
```

The response contains `data.enrollment`. Retrieve the signed-in learner’s enrollments with:

```http
GET /api/enrollments/me
```

Cancel an enrollment with:

```http
PATCH /api/enrollments/:id/cancel
```

### Learner progression

Progression routes are for learners with an active enrollment in the relevant course:

1. `GET /api/progress/resources/:resourceId/view` retrieves an accessible resource and creates an initial progress record when needed.
2. `POST /api/progress/resources/:resourceId/complete` records the resource as completed.
3. `POST /api/progress/modules/:moduleId/complete` completes a module when the required resources, quiz, and previous module meet the backend rules.
4. `GET /api/progress/courses/:courseId` returns the learner’s saved course progress.

A course progression response has this shape:

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

Module status values are `accessible`, `locked`, `in progress`, and `done`. The course progress endpoint can return `404` before the learner has created a progress record through the resource view flow.

### Trainer statistics

`GET /api/trainer/statistics` requires a trainer bearer token and returns only courses owned by the authenticated trainer.

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

`enrolledLearnersCount` counts active and completed enrollments. `averageProgress` is the rounded average progress percentage for enrolled learners with progress greater than zero; it is `0` when there are no such progress records. `coursesCount` is the number of trainer-owned courses in the response.

## API overview

Protected endpoints require a bearer token and enforce the listed role and ownership checks.

### Health, authentication, and profile

| Method | Endpoint | Access |
| --- | --- | --- |
| `GET` | `/` | Public health response |
| `POST` | `/api/auth/register` | Public; creates a learner |
| `POST` | `/api/auth/login` | Public |
| `POST` | `/api/auth/forgot-password` | Public |
| `POST` | `/api/auth/reset-password` | Public |
| `GET` | `/api/profiles/me` | Authenticated user |

### Courses, modules, and resources

| Method | Endpoint | Access |
| --- | --- | --- |
| `GET` | `/api/courses` | Public; supports filters and sorting |
| `GET` | `/api/courses/:id` | Public |
| `GET` | `/api/courses/:courseId/modules` | Public |
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
| `POST` | `/api/resources/modules/:moduleId` | Trainer or admin who owns the module; optional `file` upload |
| `PUT` | `/api/resources/:resourceId` | Resource owner or admin |
| `PATCH` | `/api/resources/:resourceId/published` | Resource owner or admin |

### Enrollment and progression

| Method | Endpoint | Access |
| --- | --- | --- |
| `GET` | `/api/enrollments/me` | Learner |
| `POST` | `/api/enrollments/courses/:courseId/enroll` | Learner |
| `PATCH` | `/api/enrollments/:id/cancel` | Learner |
| `GET` | `/api/progress/courses/:courseId` | Enrolled learner |
| `GET` | `/api/progress/resources/:resourceId/view` | Enrolled learner; subject to progression rules |
| `POST` | `/api/progress/resources/:resourceId/complete` | Enrolled learner |
| `POST` | `/api/progress/modules/:moduleId/complete` | Enrolled learner; subject to progression rules |

### Quizzes and attempts

The learner quiz view does not include correct answers. Quiz submissions are scored by the backend and saved as quiz attempts.

| Method | Endpoint | Access |
| --- | --- | --- |
| `GET` | `/api/quizzes/:quizId/view` | Enrolled learner |
| `POST` | `/api/quizzes/submit` | Enrolled learner |
| `GET` | `/api/quizzes/modules/:moduleId` | Trainer or admin who owns the module |
| `GET` | `/api/quizzes/:quizId` | Quiz owner or admin |
| `POST` | `/api/quizzes` | Trainer or admin who owns the module |
| `PATCH` | `/api/quizzes/:quizId` | Quiz owner or admin |
| `DELETE` | `/api/quizzes/:quizId` | Quiz owner or admin |
| `GET` | `/api/quiz/attempts/me` | Learner |
| `GET` | `/api/quiz/attempts/me/courses/:courseId` | Learner enrolled in the course |
| `GET` | `/api/quiz/attempts` | Trainer or admin; trainer sees their courses |
| `GET` | `/api/quiz/attempts/courses/:courseId` | Course owner or admin |

### Trainer, feedback, and preferences

| Method | Endpoint | Access |
| --- | --- | --- |
| `GET` | `/api/trainer/Courses` | Trainer or admin |
| `GET` | `/api/trainer/courses/:courseId/learners` | Course owner or admin |
| `GET` | `/api/trainer/statistics` | Trainer |
| `