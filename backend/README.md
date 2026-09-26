# SangamSetu API

Node/Express REST API backed by MongoDB Atlas. It provides JWT authentication, role-protected challenge, university, project, team, proposal, notification, admin analytics, and local evidence-upload endpoints.

## Setup

1. Copy `.env.example` to `.env`, then set `MONGO_URI` (Atlas connection string) and a long `JWT_SECRET`.
2. In MongoDB Atlas, create a cluster and database user, allow your development IP in Network Access, and copy the driver connection string to `MONGO_URI`.
3. Run `npm install`, then `npm run seed` and `npm run dev` from `backend`.

The Vite application uses `VITE_API_URL=http://localhost:5000/api`. Demo accounts are `citizen@demo.com`, `university@demo.com`, `admin@demo.com`, and `industry@demo.com`; all use `password123`.

## API summary

`POST /auth/register`, `/auth/login`, `GET /auth/me`, `/auth/logout`; CRUD `/challenges`, `/projects`, `/teams`, `/proposals`; `GET /challenges/nearby`, `GET /challenges/:id/matches`; `GET /notifications`; and admin `/admin/stats`, `/admin/analytics`, `/admin/users`, `/admin/challenges`, `/admin/projects`, `/admin/activities`.

Authenticated calls require `Authorization: Bearer <token>`. Challenge evidence uses multipart field `evidence`; development files are served from `/uploads`. The optional `POST /ai/analyze-challenge` proxies only to `AI_SERVICE_URL`; it truthfully returns `AI analysis unavailable` if no AI service is configured.
