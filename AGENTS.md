# Repository Guidelines

## Project Structure & Module Organization
- `app/`: Laravel application code (controllers, models, jobs, etc.).
- `routes/`: HTTP, console, and API route definitions.
- `resources/js/`: React + Inertia frontend source.
- `resources/css/`: Tailwind and app styles.
- `resources/views/`: Blade templates (Inertia root, emails, etc.).
- `database/`: migrations, factories, seeders, SQLite db file.
- `tests/`: Pest test suites in `Feature/` and `Unit/`.
- `public/`: web root; built assets land here via Vite.

## Build, Test, and Development Commands
- `composer dev`: Run Laravel server, queue, pail logs, and Vite in parallel.
- `composer dev:ssr`: Build SSR bundle and run server + SSR process.
- `ddev bun run dev`: Start Vite dev server only.
- `npm run build`: Build frontend assets for production (CI/release use).
- `composer test`: Clear config cache and run the test suite.
- `php artisan test`: Run tests directly (Pest runner under the hood).
- `npm run lint`: Run ESLint (auto-fix).
- `npm run format`: Prettier formatting for `resources/`.
- `npm run types`: TypeScript type-check (no emit).

## Coding Style & Naming Conventions
- PHP follows Laravel conventions and PSR-4 autoloading (`App\\` in `app/`).
- Frontend uses React + TypeScript in `resources/js/`.
- Formatting/linting tools:
  - `./vendor/bin/pint` for PHP formatting.
  - `npm run format` (Prettier) and `npm run lint` (ESLint) for JS/TS.
- Use descriptive component names (e.g., `AppHeader`, `NavTop`).

## Testing Guidelines
- Framework: Pest (`tests/Pest.php`) with Feature and Unit tests.
- Place behavioral tests in `tests/Feature/` and isolated logic tests in `tests/Unit/`.
- Name test files with clear intent, e.g., `DashboardTest.php`.
- Run tests with `composer test` or `php artisan test`.

## Commit & Pull Request Guidelines
- Commit history shows Conventional Commit prefixes like `feat:`, `fix:`, `refactor:`; some commits use sentence-style `Update ...`.
- Prefer Conventional Commits for consistency and quick scanning.
- Pull requests should include:
  - A short summary of changes and rationale.
  - Evidence of tests run (command + result).
  - UI screenshots or recordings when frontend changes are involved.

## Configuration Tips
- Copy `.env.example` to `.env` and set app/DB settings; first-time setup is handled by `composer install` hooks.
- If using the default SQLite flow, ensure `database/database.sqlite` exists.

## Agent-Specific Workflow
- This project is a League of Legends climb-tracking app using Laravel 12, Inertia, React, TypeScript, Tailwind CSS 4, and shadcn.
- Run project commands inside `ddev` (example: `ddev php artisan test`).
- Prefer `bun`/`bunx` for JS package tasks (example: `ddev bun add zod`, `ddev bunx eslint .`).
- Do not run `bun run build` during active development; the hot-reload dev server is expected to be running.
