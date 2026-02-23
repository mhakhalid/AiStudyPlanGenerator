# Development Workflow (AIStudyPlanGenerator)

This repository follows a production-style workflow to demonstrate professional engineering practices (planning → implementation → testing → deployment).

## 1) Branching Strategy
All work is done on short-lived branches off `main`.

**Branch naming**
- `feature/<short-scope>` — new capabilities (e.g., `feature/ai-plan-generation`)
- `fix/<bug>` — bug fixes (e.g., `fix/clerk-provider-wrapper`)
- `refactor/<area>` — refactors with no behavior change (e.g., `refactor/api-error-handler`)
- `chore/<tooling>` — tooling/docs (e.g., `chore/add-workflow-docs`)

## 2) Issues → Branch → Commits → Merge
Every change should be tied to a GitHub Issue.

**Flow**
1. Create a GitHub Issue describing scope + acceptance criteria
2. Create a branch from `main`
3. Implement in small, reviewable commits
4. Run checks locally (`npm test`, `npm run dev`, migrations if needed)
5. Push branch regularly to show progress
6. Merge to `main` (PR preferred)
7. Close issue with `Closes #<issue-number>`

## 3) Commit Message Convention (Conventional Commits)
Commits follow this format:

- `feat: ...` new functionality
- `fix: ...` bug fix
- `test: ...` tests only
- `refactor: ...` refactor only (no behavior change)
- `chore: ...` tooling/docs/deps
- `docs: ...` documentation changes

**Examples**
- `feat: add assessment CRUD API routes`
- `feat(schema): add StudySession and Reflection models`
- `fix: enforce ClerkProvider wrapping in App Router`
- `test: add service-layer unit tests for session status updates`

## 4) Prisma Migration Policy
We treat DB changes as version-controlled artifacts.

**Local development**
- Use migrations to evolve schema:
  - `npx prisma migrate dev --name <migration_name>`
  - `npx prisma generate`

**Production**
- Apply existing migrations only:
  - `npx prisma migrate deploy`

**Rules**
- Do not manually edit production DB schema.
- Schema changes must be committed (migration SQL included).

## 5) Clean Architecture Rules
We follow a layered approach to keep code testable and scalable:

**Route handlers → Services → Repositories → Prisma**
- Route handlers: validate input, call service, return response
- Services: business rules + authorization
- Repositories: database operations only
- Prisma: ORM client

## 6) Validation & Error Handling
**Zod-first validation**
- API inputs are validated with Zod.
- AI outputs (Phase 4+) must be validated with Zod before persistence.

**Typed errors**
- Use `AppError` hierarchy for consistent error codes/status mapping.

## 7) Testing Policy
- Use **Vitest** for unit tests.
- Core business logic is tested at the **service layer** using dependency injection (mock repositories).
- Unit tests must not depend on a real DB connection.

## 8) Phase Roadmap (High-Level)
- Phase 0: Setup (Next.js, TS, Prisma, Supabase)
- Phase 1: Auth (Clerk + protected routes)
- Phase 2: Backend foundation (Clerk→Prisma user sync + tests)
- Phase 3: Domain modeling (Assessment/Topic/Session/Reflection + CRUD APIs)
- Phase 4: AI contract + plan generation endpoint (Zod-validated AI JSON)
- Phase 5: Deployment + observability (Vercel, env, Sentry/logging)
