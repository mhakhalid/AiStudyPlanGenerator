Architecture Overview

AIStudyGenerator is designed to safely integrate non-deterministic AI outputs into a deterministic, type-safe web application.

The architecture enforces strict schema validation to ensure reliability when interacting with large language models.

1. Technical Stack
Layer	Technology	Purpose
Frontend	Next.js 15 (App Router)	Modern SSR/CSR hybrid web application
Language	TypeScript	End-to-end type safety
Styling	Tailwind + shadcn/ui	Consistent component-based UI
Authentication	Clerk	Secure identity management
Database	PostgreSQL	Relational data modeling
ORM	Prisma	Type-safe database access
Validation	Zod	Runtime validation of AI outputs
LLM Engine	Claude	Conversational onboarding + scheduling
Voice Interface	Vapi	Real-time voice agent
Testing	Vitest	Unit testing core scheduling logic
CI/CD	GitHub Actions + Vercel	Continuous deployment
2. System Architecture Diagram
+----------------------+
|   User (Browser)     |
+----------+-----------+
           |
           v
+----------------------+
|   Next.js Frontend   |
|  (App Router, TS)    |
+----------+-----------+
           |
           v
+----------------------+
|  API / Server Layer  |
|  (Route Handlers)    |
+----------+-----------+
           |
           v
+----------------------+
|   Claude API (LLM)   |
+----------+-----------+
           |
   (Structured JSON)
           |
           v
+----------------------+
|     Zod Validator    |
|  (Schema Enforcement)|
+----------+-----------+
           |
           v
+----------------------+
|  Prisma ORM Layer    |
+----------+-----------+
           |
           v
+----------------------+
|    PostgreSQL DB     |
+----------------------+

3. Core Architectural Principles
Schema-First AI Contract

All AI-generated structured data must conform to predefined Zod schemas before persisting to the database.

If validation fails:

The system returns a structured error envelope

The AI requests clarification

Separation of Concerns

UI components are presentation-only

Business logic lives in services

Database logic isolated via Prisma

AI interaction isolated in an AI service layer

Resilience & Observability

Strict JSON parsing

Explicit error envelopes

Logging hooks for monitoring (e.g., Sentry placeholder)

Unit-tested scheduling logic

Extensibility

The architecture allows:

Replacing Claude with another LLM

Adding analytics dashboards

Extending session types

Supporting future mobile clients