# AI Life Copilot

Telegram-first personal AI operating system for planning, memory, goals, tasks, reminders, daily reviews, and weekly summaries.

The MVP in this repository is backend-first. The production path is:

- Telegram receives the message
- backend classifies intent and stores useful memory
- goals/tasks/plans/reviews/reminders are persisted in PostgreSQL via Prisma
- OpenAI is used for structured intent extraction, memory extraction, planning, coaching, review summaries, and weekly summaries
- scheduler sends morning plan, evening review, weekly summary, and one-off reminders

The codebase is also structured for future WhatsApp support with a provider interface and a webhook stub.

## What’s Built

- Telegram integration with webhook support
- Optional Telegram polling mode for local development
- First-contact user creation from Telegram messages
- Intent detection for:
  - `SAVE_GOAL`
  - `ADD_TASK`
  - `PLAN_DAY`
  - `REVIEW_DAY`
  - `ASK_ADVICE`
  - `SAVE_MEMORY`
  - `WEEKLY_SUMMARY`
  - `UNKNOWN`
- Structured long-term memory storage
- Goal and task management tied to each user
- Daily planner generation using goals, pending tasks, memory, and review context
- Daily review capture with task status updates
- Weekly summary generation
- Reminder scheduler for morning plan, evening review, weekly summary, and custom reminders
- Clean backend module separation for AI, services, routes/controllers, providers, jobs, config, and utils
- Dev debug route to simulate Telegram messages locally

## Architecture

```text
backend/src/
├── ai/
│   ├── coach.ts
│   ├── intentClassifier.ts
│   ├── memoryExtractor.ts
│   ├── openaiClient.ts
│   ├── planner.ts
│   ├── promptTemplates.ts
│   └── types.ts
├── config/
├── controllers/
├── jobs/
├── middleware/
├── providers/
├── routes/
├── services/
├── utils/
├── app.ts
├── index.ts
└── runtime.ts
```

## Data Model

Main Prisma models:

- `User`
- `Goal`
- `Task`
- `Memory`
- `Message`
- `DailyPlan`
- `DailyReview`
- `Reminder`

Important enums:

- `IntentType`
- `TaskStatus`
- `GoalPriority`
- `GoalStatus`
- `MemoryCategory`
- `ReminderType`
- `ReminderRecurrence`
- `ReminderStatus`

## Routes

Primary routes:

- `GET /health`
- `POST /webhook/telegram`
- `POST /webhook/whatsapp`

Dev routes:

- `GET /debug/users`
- `POST /debug/message`

The same routes are also mounted under `/api/*` for compatibility.

## Environment Variables

Backend env file: [backend/.env.example](/home/abhishek/ai-life-os/backend/.env.example)

Required:

- `PORT`
- `DATABASE_URL`
- `OPENAI_API_KEY`
- `OPENAI_MODEL`
- `TELEGRAM_BOT_TOKEN`
- `APP_BASE_URL`
- `NODE_ENV`

Optional but useful:

- `TELEGRAM_WEBHOOK_SECRET`
- `TELEGRAM_TRANSPORT`
- `DEFAULT_TIMEZONE`
- `SCHEDULER_INTERVAL_MS`

Notes:

- Use `TELEGRAM_TRANSPORT=webhook` when the backend has a public URL.
- Use `TELEGRAM_TRANSPORT=polling` for local development without a public webhook.
- `APP_BASE_URL` is used to register the Telegram webhook automatically in webhook mode.

## Local Setup

1. Install dependencies.

```bash
cd /home/abhishek/ai-life-os
npm install
cd backend
npm install
```

2. Configure env.

```bash
cd /home/abhishek/ai-life-os/backend
cp .env.example .env
```

3. Generate Prisma client and apply migrations.

```bash
cd /home/abhishek/ai-life-os/backend
npm run db:generate
npm run db:migrate
```

4. Start the backend.

```bash
cd /home/abhishek/ai-life-os
npm run dev:copilot
```

5. Configure Telegram.

Webhook mode:

- set `APP_BASE_URL` to your public backend URL
- set `TELEGRAM_TRANSPORT=webhook`
- start the server
- the backend will attempt to register `POST /webhook/telegram`

Polling mode:

- set `TELEGRAM_TRANSPORT=polling`
- start the server
- no public webhook is required

## PostgreSQL and Docker

Backend Docker file: [backend/Dockerfile](/home/abhishek/ai-life-os/backend/Dockerfile)

Compose file: [docker-compose.yml](/home/abhishek/ai-life-os/docker-compose.yml)

Start backend + Postgres:

```bash
cd /home/abhishek/ai-life-os
docker compose up --build
```

## Debugging Without Telegram

You can simulate a Telegram message locally:

```bash
curl -X POST http://localhost:3001/debug/message \
  -H "Content-Type: application/json" \
  -d '{
    "telegramId": "123456",
    "name": "Abhishek",
    "timezone": "Asia/Kolkata",
    "text": "Plan my day, I have 4 focused hours and want to make progress on AI backend engineering."
  }'
```

Examples:

- Save goal:

```bash
curl -X POST http://localhost:3001/debug/message \
  -H "Content-Type: application/json" \
  -d '{"telegramId":"123456","name":"Abhishek","text":"My goal is to become a top AI backend engineer."}'
```

- Add task:

```bash
curl -X POST http://localhost:3001/debug/message \
  -H "Content-Type: application/json" \
  -d '{"telegramId":"123456","name":"Abhishek","text":"Task: finish the reminder service by tomorrow 6pm."}'
```

- Save memory:

```bash
curl -X POST http://localhost:3001/debug/message \
  -H "Content-Type: application/json" \
  -d '{"telegramId":"123456","name":"Abhishek","text":"Remember that my best deep work time is 6am to 9am."}'
```

- Daily review:

```bash
curl -X POST http://localhost:3001/debug/message \
  -H "Content-Type: application/json" \
  -d '{"telegramId":"123456","name":"Abhishek","text":"Review: completed API refactor, partial test coverage, skipped workout."}'
```

## Build Verification

Verified in this workspace:

```bash
cd /home/abhishek/ai-life-os/backend
npx prisma generate
npm run build
```

## Current Product Behavior

The assistant is tuned to be:

- structured
- concise
- practical
- personalized

It avoids generic motivational responses and focuses on actions, progress, blockers, and next steps.

## Easiest Next Upgrades

- Real WhatsApp provider implementation behind the existing provider interface
- Admin routes or dashboard endpoints for plans, tasks, reminders, and memory
- Better natural-language scheduling and timezone handling
- Embeddings or memory ranking for richer retrieval
- Rate limiting, request logging, and tests
- Deployment to Railway, Render, Fly.io, or a container platform

## Important Note

The frontend directory already had separate in-progress edits in this repository. This Telegram-first MVP work was kept isolated to the backend, schema, docs, and backend runtime setup.
