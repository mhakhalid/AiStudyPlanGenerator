🤖 **AI Study Planner**

[![CI](https://github.com/mhakhalid/AiStudyPlanGenerator/actions/workflows/ci.yml/badge.svg)](https://github.com/mhakhalid/AiStudyPlanGenerator/actions/workflows/ci.yml)
Transforming static schedules into dynamic, conversational learning systems.

![Demo App](/public/screenshot-for-readme.png)
An AI-powered adaptive study planning engine that transforms static schedules into dynamic, conversational learning systems.

🚀 **The Problem**
Students often spend more time planning than actually studying. Traditional planners are rigid and fail the moment real-life interruptions occur.

AI Study Planner introduces a conversational AI agent that dynamically re-optimizes your schedule in real-time when sessions are missed or mastery levels change.

🧠 **Core Features (V1)**
Voice-based AI Onboarding: Seamlessly set up your profile using Vapi.

Hybrid Plan Generation: Creates plans using a mix of free-form natural language and structured JSON.

Strict Validation: Ensures AI reliability using Zod schema validation.

Adaptive Re-optimization: An intelligent engine that shifts your schedule based on your actual progress.

Secure Auth: Fully integrated with Clerk for user management.

Transparent Development: Built with a "Public-from-day-one" GitHub workflow.

🏗 **Tech Stack**

| Category | Technology |
| :--- | :--- |
| **Framework** | Next.js 15 (App Router) |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS + shadcn/ui |
| **Database** | PostgreSQL (via Prisma ORM) |
| **Authentication** | Clerk |
| **AI / LLM** | Claude (Anthropic API) |
| **Validation** | Zod |
| **Deployment** | Vercel |

🛠 **Local Development**
Clone the repo.

Install dependancies: npm install

Run server: npm run dev


📚 **Documentation**

**Requirements**: docs/requirements.md

**Architecture**: docs/architecture.md
