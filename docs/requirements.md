AIStudyGenerator — Requirements & Project Scope
1. Problem Statement

Students frequently experience "planning paralysis," spending excessive time organizing schedules instead of studying. While AI tools are commonly used for academic assistance, most planning systems remain static and fail when real-life disruptions occur.

AIStudyGenerator addresses this by providing a conversational, adaptive study planning engine that dynamically re-optimizes a student’s schedule when sessions are missed or mastery levels change.

2. MVP Scope (V1 – 3–4 Day Build)
Phase 1: Conversational Onboarding

Agent-Led Interview

A voice-enabled AI agent gathers:

Peak energy times

Weekly availability

Work/commute constraints

Subject difficulty rankings

Syllabus Ingestion

Student provides raw syllabus text or uploads PDF

AI extracts:

Assessments (name, due date, weight)

Topics

Deadlines

Grading breakdown

Phase 2: Adaptive Scheduling Engine

Hybrid Plan Generation

AI provides:

Encouraging free-form summary (user-facing)

Strict structured JSON (system-facing)

Confidence-Based Weighting

After each study session:

Student rates mastery (1–10)

System reallocates future time accordingly

“Life Happens” Re-Optimization

If a session is missed:

AI re-optimizes the remaining week

Ensures high-weight assessments stay prioritized

Phase 3: Technical Rigor (Production Readiness)

Zod schema validation for all AI outputs

Structured JSON contract with versioning

Graceful error handling for malformed LLM responses

Unit tests for:

JSON parsing

Re-optimization logic

CI validation pipeline

Public GitHub history demonstrating iterative development

3. Core Entities (V1 Data Model)

Assessment

name

dueDate

weight

courseName

Topic

name

difficulty (1–10)

masteryScore (1–10)

StudySession

startTime

durationMinutes

linked Topic or Assessment

status (pending | completed | missed)

Reflection

sessionId

masteryScore

completionStatus

notes

4. Hiring Narrative & Attribution

This project follows a "Public from Day 1" philosophy to demonstrate professional Git workflows, incremental refactoring, and architectural discipline.

While inspired by academic coursework, the domain model, AI contract enforcement, schema validation strategy, and adaptive scheduling logic are original implementations designed to reflect production-level engineering practices.