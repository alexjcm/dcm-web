# Repository Guidelines

## Project Structure & Module Organization
This repository is a Vite + React 19 + TypeScript frontend for family contributions management. Application code lives in `src/`: routes in `src/pages/`, reusable UI in `src/components/`, shared hooks in `src/hooks/`, cross-cutting utilities in `src/lib/`, config in `src/config/`, and shared types in `src/types/`. The app boots from `src/main.tsx` and route composition lives in `src/App.tsx`. Static assets and platform files live in `public/`; production output is generated in `dist/`. Supporting docs, including Auth0 setup, live in `docs/`.

## Build, Test, and Development Commands
- `npm install`: install dependencies. Use Node `24` as defined in `.nvmrc` and `package.json`.
- `npm run dev`: start the Vite dev server on `http://localhost:5173` with `--strictPort`.
- `npm run build`: create the production bundle in `dist/`.
- `npm run typecheck`: run `tsc --noEmit`; treat this as the required validation step before opening a PR.

## Coding Style & Naming Conventions
Follow the existing TypeScript/React style: 2-space indentation, semicolons omitted, and double-quoted imports/strings. Use `PascalCase` for React components and page modules (`SettingsPage`), `camelCase` for hooks and utilities (`useSettingsPageData`, `normalizeReturnTo`), and `SCREAMING_SNAKE_CASE` for exported constants. Keep screen-specific orchestration in page-level hooks and keep `src/lib/` focused on pure helpers and shared HTTP/auth logic.

## Security & Configuration Tips
Keep secrets out of git. Copy `.env.example` to `.env.local` and set Auth0 and API values locally. If authentication behavior changes, update both [`README.md`](/Users/ajcm/my/dmc/dcm-web/README.md) and [`docs/auth0-setup.md`](/Users/ajcm/my/dmc/dcm-web/docs/auth0-setup.md).
