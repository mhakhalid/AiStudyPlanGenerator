AIStudyGenerator


![Demo App](/public/Screenshot-for-ReadME.png)
An AI-powered adaptive study planning engine that transforms static schedules into dynamic, conversational learning systems.
>>>>>>> e65e2fc (docs: add project overview, requirements, and architecture documentation)

🚀 Problem

Students often spend more time planning than studying. Traditional planners fail when real-life interruptions occur. AIStudyGenerator introduces a conversational AI agent that dynamically re-optimizes a student’s schedule when sessions are missed or mastery levels change.

🧠 Core Features (V1)

Voice-based AI onboarding (Vapi)

Hybrid AI plan generation (free-form + structured JSON)

Strict Zod schema validation of AI outputs

PostgreSQL + Prisma data modeling

Adaptive re-optimization engine

Clerk authentication

Public-from-day-one GitHub workflow

🏗 Tech Stack

Next.js 15 (App Router)

TypeScript

Tailwind + shadcn/ui

PostgreSQL (Prisma ORM)

Clerk (Authentication)

Claude (LLM)

Zod (Schema Validation)

Vercel (Deployment)

🛠 Local Development
npm install
npm run dev

📚 Documentation

Requirements: docs/requirements.md

Architecture: docs/architecture.md