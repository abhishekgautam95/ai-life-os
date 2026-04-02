# AI Life OS

AI Life OS is a Phase 1 MVP for a personal productivity web app.

It lets a user:

- register and log in
- manage tasks
- manage notes
- manage goals
- view a simple dashboard

The current version focuses on a clean, working foundation first. Advanced AI features are intentionally not included yet.

## Open Source

This project is open source under the [MIT License](./LICENSE).

If you want to contribute, start with:

- [CONTRIBUTING.md](./CONTRIBUTING.md)
- [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md)
- [SECURITY.md](./SECURITY.md)

## Phase 1 Scope

This repository currently includes:

- JWT authentication with hashed passwords
- protected frontend routes
- REST API for tasks, notes, and goals
- PostgreSQL database with Prisma ORM
- Next.js frontend with a production-style SaaS UI
- optimistic CRUD interactions for core productivity screens

## Tech Stack

### Frontend

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4

### Backend

- Node.js
- Express
- TypeScript
- Prisma
- PostgreSQL
- JWT authentication
- bcrypt password hashing

## Project Structure

```text
ai-life-os/
├── backend/
│   ├── prisma/
│   │   ├── migrations/
│   │   └── schema.prisma
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── app.ts
│   │   └── index.ts
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   ├── hooks/
│   │   └── lib/
│   ├── package.json
│   └── tsconfig.json
├── TODAY_COMMANDS_2026-04-03.txt
├── TODAY_REVISION_2026-04-03.txt
└── README.md
```

## Core Features

### Authentication

- register with name, email, and password
- login with email and password
- JWT-based backend auth
- hashed passwords using bcrypt
- protected frontend routes
- guest-only route redirection for login and register

### Dashboard

- total tasks
- completed tasks
- notes count
- goals count
- recent tasks
- recent notes
- recent goals

### Tasks

- create task
- list tasks
- edit task
- delete task
- mark task completed or open
- optimistic UI updates

### Notes

- create note
- list notes
- edit note
- delete note
- optimistic UI updates

### Goals

- create goal
- list goals
- edit goal
- delete goal
- mark goal completed or active
- optimistic UI updates

## Current Frontend Experience

The frontend is no longer a placeholder.

It now includes:

- premium sticky navbar
- desktop and mobile navigation
- active nav states
- signed-in user shell
- reusable page headers and cards
- loading states
- empty states
- inline success and error banners
- confirmation before delete
- responsive layout for desktop and mobile

## Backend API Routes

Base URL:

```text
http://localhost:3001/api
```

### Health

- `GET /health`

### Auth

- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/me`

### Tasks

- `POST /tasks`
- `GET /tasks`
- `GET /tasks/:id`
- `PUT /tasks/:id`
- `DELETE /tasks/:id`

### Notes

- `POST /notes`
- `GET /notes`
- `GET /notes/:id`
- `PUT /notes/:id`
- `DELETE /notes/:id`

### Goals

- `POST /goals`
- `GET /goals`
- `GET /goals/:id`
- `PUT /goals/:id`
- `DELETE /goals/:id`

## Database Schema

The database currently has four models:

- `User`
- `Task`
- `Note`
- `Goal`

Relationships:

- one user has many tasks
- one user has many notes
- one user has many goals
- deleting a user cascades to the related records

Main fields:

- `User`: `id`, `name`, `email`, `password`
- `Task`: `title`, `description`, `completed`
- `Note`: `title`, `content`
- `Goal`: `title`, `description`, `completed`

## Local Development Setup

## 1. Prerequisites

Install these first:

- Node.js
- npm
- PostgreSQL
- Git

Recommended checks:

```bash
node -v
npm -v
psql --version
git --version
```

## 2. Clone or Open the Project

```bash
cd /home/abhishek/ai-life-os
```

## 3. Backend Setup

Move into backend:

```bash
cd /home/abhishek/ai-life-os/backend
```

Install packages:

```bash
npm install
```

Create env file:

```bash
cp .env.example .env
```

Example backend env:

```env
# Server
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/ai_life_os?schema=public"

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d
```

If your PostgreSQL password contains special characters like `@`, URL-encode them in `DATABASE_URL`.

Example:

```env
DATABASE_URL="postgresql://postgres:yourpassword%40123@localhost:5432/ai_life_os?schema=public"
```

Generate Prisma client:

```bash
npm run db:generate
```

Run migration:

```bash
npx prisma migrate dev --name init
```

Start backend:

```bash
npm run dev
```

Expected backend URL:

```text
http://localhost:3001
```

## 4. Frontend Setup

Move into frontend:

```bash
cd /home/abhishek/ai-life-os/frontend
```

Install packages:

```bash
npm install
```

Start frontend:

```bash
npm run dev
```

Expected frontend URL:

```text
http://localhost:3000
```

## 5. Run Full App

Terminal 1:

```bash
cd /home/abhishek/ai-life-os/backend
npm run dev
```

Terminal 2:

```bash
cd /home/abhishek/ai-life-os/frontend
npm run dev
```

## Production Build Check

Frontend:

```bash
cd /home/abhishek/ai-life-os/frontend
npm run build
```

Backend:

```bash
cd /home/abhishek/ai-life-os/backend
npm run build
```

## Useful Test Commands

### Health Check

```bash
curl http://localhost:3001/api/health
```

Expected:

```json
{"success":true,"message":"AI Life OS API is healthy"}
```

### Register

```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Abhishek","email":"abhigautam954820@gmail.com","password":"secret123"}'
```

### Login

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"abhigautam954820@gmail.com","password":"secret123"}'
```

### Generate Token Into Shell Variable

```bash
TOKEN=$(curl -s -X POST http://localhost:3001/api/auth/login -H "Content-Type: application/json" -d '{"email":"abhigautam954820@gmail.com","password":"secret123"}' | node -pe "JSON.parse(require('fs').readFileSync(0,'utf8')).data.token")
```

### Get Current User

```bash
curl http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

### Create Task

```bash
curl -s -X POST http://localhost:3001/api/tasks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"title":"First task","description":"Finish MVP","completed":false}'
```

### Create Note

```bash
curl -s -X POST http://localhost:3001/api/notes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"title":"First note","content":"This is my first note."}'
```

### Create Goal

```bash
curl -s -X POST http://localhost:3001/api/goals \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"title":"Launch AI Life OS MVP","description":"Ship Phase 1 cleanly","completed":false}'
```

## Frontend Routes

### Public / Shared

- `/`

### Guest Only

- `/login`
- `/register`

### Protected

- `/dashboard`
- `/tasks`
- `/notes`
- `/goals`

## Frontend Architecture Notes

Important areas in the frontend:

- `src/app/`
  App Router pages
- `src/components/`
  reusable UI building blocks
- `src/hooks/use-auth-session.ts`
  client-side auth session access
- `src/lib/auth.ts`
  token and user session helpers
- `src/lib/api.ts`
  API request helper
- `src/lib/navigation.ts`
  nav items and route visibility rules
- `src/lib/types.ts`
  shared frontend types

## UX Improvements Already Implemented

- route-level auth behavior in shared shell
- mobile navigation menu
- optimistic CRUD flows
- rollback on API failure
- feedback banners for success and error states
- delete confirmation
- loading skeletons for CRUD lists
- structured dashboard summary cards

## Known Issues / Cleanup Opportunities

These are not blockers, but they are good next improvements:

- add a backend dashboard summary endpoint to reduce multiple frontend requests
- replace inline banners with a toast system if desired
- remove the Next.js workspace-root warning related to multiple lockfiles
- add automated tests for backend routes and frontend auth/session flow
- deploy frontend and backend to a production environment

## Roadmap After Phase 1

Planned direction after the MVP foundation:

- AI-powered productivity workflows
- AI-assisted goal and task planning
- AI note summarization
- better analytics or productivity insights

These are intentionally out of scope for the current Phase 1 MVP.

## Troubleshooting

### Backend does not start

Check:

- PostgreSQL is running
- `.env` exists in `backend`
- `DATABASE_URL` is correct

Try:

```bash
cd /home/abhishek/ai-life-os/backend
npm install
npm run db:generate
npm run dev
```

### Prisma authentication error

This usually means the PostgreSQL username or password is wrong in `DATABASE_URL`.

### Frontend cannot reach backend

Check that backend is running on:

```text
http://localhost:3001
```

### Redirect issues on protected pages

The frontend shell checks session state from `localStorage`. Make sure login completed successfully and the token exists.

### Build verification

Frontend:

```bash
cd /home/abhishek/ai-life-os/frontend
npm run build
```

Backend:

```bash
cd /home/abhishek/ai-life-os/backend
npm run build
```

## Revision Files Added During Development

For quick revision, this repo also contains:

- `TODAY_REVISION_2026-04-03.txt`
- `TODAY_COMMANDS_2026-04-03.txt`

## Summary

AI Life OS currently has a strong Phase 1 base:

- working authentication
- working CRUD for tasks, notes, and goals
- responsive frontend
- polished SaaS-style UI
- protected routes
- optimistic user interactions

The product is now in a good state for final cleanup, deployment preparation, and the next layer of AI features later.
