# Contributing to AI Life OS

Thanks for your interest in contributing to AI Life OS.

This project is currently a Phase 1 MVP focused on:

- authentication
- dashboard
- tasks
- notes
- goals

Please keep contributions aligned with the current product scope unless a roadmap item or issue says otherwise.

## How to Contribute

1. Fork the repository
2. Create a new branch
3. Make your changes
4. Test your changes locally
5. Open a pull request with a clear explanation

## Development Setup

### Backend

```bash
cd backend
npm install
cp .env.example .env
npm run db:generate
npx prisma migrate dev --name init
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Contribution Guidelines

- Keep code simple and beginner-friendly
- Avoid unnecessary abstraction
- Preserve the current product direction
- Prefer small, focused pull requests
- Update documentation when behavior changes
- Do not add advanced AI features unless that work is explicitly planned

## Pull Request Checklist

Before opening a PR, please make sure:

- the app still builds
- the relevant feature works locally
- no unrelated files were changed unnecessarily
- docs are updated if needed

Recommended checks:

```bash
cd backend
npm run build
```

```bash
cd frontend
npm run build
```

## Good Contribution Areas

- bug fixes
- UI polish
- accessibility improvements
- performance improvements
- test coverage
- setup and documentation improvements

## Before Large Changes

If you want to make a large change, open an issue first so the direction can be discussed before implementation.
