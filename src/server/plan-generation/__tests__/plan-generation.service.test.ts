import { describe, it, expect, vi, beforeEach } from "vitest";

// Prevent top-level PrismaClient instantiation in service singletons
vi.mock("@/lib/prisma", () => ({ prisma: {} }));

import { createPlanGenerationService } from "../plan-generation.service";
import type { AssessmentRepository } from "@/server/assessments/assessment.repository";
import type { SessionRepository } from "@/server/sessions/session.repository";
import type { UserService } from "@/server/users/user.service";
import type { AiProvider } from "@/server/ai/ai.provider";
import { SessionStatus } from "@prisma/client";

// ── Fixtures — all IDs are real UUID v4 values (Zod validates topicId format) ──

const IDS = {
  user:       "d0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44",
  assessment: "c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33",
  topic1:     "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
  topic2:     "b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22",
  session:    "e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a55",
} as const;

const mockUser = {
  id: IDS.user,
  clerkId: "clerk_abc123",
  email: "test@example.com",
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-01"),
};

const mockTopics = [
  {
    id: IDS.topic1,
    assessmentId: IDS.assessment,
    name: "Calculus",
    difficulty: 8,
    mastery: 3,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
  {
    id: IDS.topic2,
    assessmentId: IDS.assessment,
    name: "Linear Algebra",
    difficulty: 6,
    mastery: 5,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
];

const mockAssessmentWithTopics = {
  id: IDS.assessment,
  userId: IDS.user,
  title: "Final Exam",
  courseName: "Mathematics",
  dueAt: new Date("2024-12-01T00:00:00.000Z"),
  weightPercent: 40,
  notes: null,
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-01"),
  topics: mockTopics,
};

const validAiResponse = JSON.stringify({
  sessions: [
    {
      topicId: IDS.topic1,
      date: "2024-11-01T09:00:00.000Z",
      durationMinutes: 90,
      focusLevel: 8,
      notes: "Focus on integration techniques",
    },
    {
      topicId: IDS.topic2,
      date: "2024-11-03T09:00:00.000Z",
      durationMinutes: 60,
      focusLevel: 6,
    },
  ],
});

const mockPersistedSession = {
  id: IDS.session,
  assessmentId: IDS.assessment,
  topicId: IDS.topic1,
  scheduledAt: new Date("2024-11-01T09:00:00.000Z"),
  durationMinutes: 90,
  status: SessionStatus.PENDING,
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-01"),
};

// ── Test suite ─────────────────────────────────────────────────────────────────

describe("PlanGenerationService.generatePlan", () => {
  let mockAssessmentRepo: AssessmentRepository;
  let mockSessionRepo: SessionRepository;
  let mockUserService: UserService;
  let mockAi: AiProvider;

  beforeEach(() => {
    mockUserService = {
      ensureUserExists: vi.fn().mockResolvedValue(mockUser),
    };
    mockAssessmentRepo = {
      create: vi.fn(),
      findAllByUser: vi.fn(),
      findByIdAndUser: vi.fn(),
      findByIdAndUserWithTopics: vi
        .fn()
        .mockResolvedValue(mockAssessmentWithTopics),
    };
    mockSessionRepo = {
      create: vi.fn(),
      findByIdWithAssessment: vi.fn(),
      updateStatus: vi.fn(),
      findAllByAssessmentWithDetails: vi.fn(),
      replaceForAssessment: vi
        .fn()
        .mockResolvedValue([mockPersistedSession, mockPersistedSession]),
    };
    mockAi = {
      complete: vi.fn().mockResolvedValue(validAiResponse),
    };
  });

  it("calls replaceForAssessment (idempotent) with the correct session params", async () => {
    const service = createPlanGenerationService(
      mockAssessmentRepo,
      mockSessionRepo,
      mockUserService,
      mockAi
    );

    const result = await service.generatePlan(
      "clerk_abc123",
      "test@example.com",
      IDS.assessment
    );

    expect(mockAi.complete).toHaveBeenCalledOnce();
    // Idempotency: replaceForAssessment (not createMany) must be called
    expect(mockSessionRepo.replaceForAssessment).toHaveBeenCalledWith(
      IDS.assessment,
      [
        {
          assessmentId: IDS.assessment,
          topicId: IDS.topic1,
          scheduledAt: new Date("2024-11-01T09:00:00.000Z"),
          durationMinutes: 90,
        },
        {
          assessmentId: IDS.assessment,
          topicId: IDS.topic2,
          scheduledAt: new Date("2024-11-03T09:00:00.000Z"),
          durationMinutes: 60,
        },
      ]
    );
    expect(result).toHaveLength(2);
  });

  it("does NOT call replaceForAssessment if AI response is invalid (no partial writes)", async () => {
    mockAi.complete = vi.fn().mockResolvedValue("{ broken json");
    const service = createPlanGenerationService(
      mockAssessmentRepo,
      mockSessionRepo,
      mockUserService,
      mockAi
    );

    await expect(
      service.generatePlan("clerk_abc123", "test@example.com", IDS.assessment)
    ).rejects.toMatchObject({ code: "AI_INVALID_RESPONSE" });

    expect(mockSessionRepo.replaceForAssessment).not.toHaveBeenCalled();
  });

  it("throws NOT_FOUND when assessment does not exist or is not owned", async () => {
    mockAssessmentRepo.findByIdAndUserWithTopics = vi.fn().mockResolvedValue(null);
    const service = createPlanGenerationService(
      mockAssessmentRepo,
      mockSessionRepo,
      mockUserService,
      mockAi
    );

    await expect(
      service.generatePlan("clerk_abc123", "test@example.com", "nonexistent")
    ).rejects.toMatchObject({ code: "NOT_FOUND", statusCode: 404 });
  });

  it("throws NO_TOPICS when assessment has no topics", async () => {
    mockAssessmentRepo.findByIdAndUserWithTopics = vi
      .fn()
      .mockResolvedValue({ ...mockAssessmentWithTopics, topics: [] });
    const service = createPlanGenerationService(
      mockAssessmentRepo,
      mockSessionRepo,
      mockUserService,
      mockAi
    );

    await expect(
      service.generatePlan("clerk_abc123", "test@example.com", IDS.assessment)
    ).rejects.toMatchObject({ code: "NO_TOPICS", statusCode: 422 });
  });

  it("throws AI_INVALID_RESPONSE when AI returns malformed JSON", async () => {
    mockAi.complete = vi.fn().mockResolvedValue("not valid json {{{");
    const service = createPlanGenerationService(
      mockAssessmentRepo,
      mockSessionRepo,
      mockUserService,
      mockAi
    );

    await expect(
      service.generatePlan("clerk_abc123", "test@example.com", IDS.assessment)
    ).rejects.toMatchObject({ code: "AI_INVALID_RESPONSE", statusCode: 502 });
  });

  it("throws AI_VALIDATION_FAILED when AI JSON does not match the schema", async () => {
    mockAi.complete = vi.fn().mockResolvedValue(
      JSON.stringify({
        sessions: [{ topicId: "not-a-uuid", date: "bad-date", durationMinutes: 5 }],
      })
    );
    const service = createPlanGenerationService(
      mockAssessmentRepo,
      mockSessionRepo,
      mockUserService,
      mockAi
    );

    await expect(
      service.generatePlan("clerk_abc123", "test@example.com", IDS.assessment)
    ).rejects.toMatchObject({ code: "AI_VALIDATION_FAILED", statusCode: 502 });
  });

  it("throws AI_INVALID_TOPIC when AI references a UUID not in this assessment", async () => {
    mockAi.complete = vi.fn().mockResolvedValue(
      JSON.stringify({
        sessions: [
          {
            topicId: "00000000-0000-0000-0000-000000000000", // valid UUID but not in mockTopics
            date: "2024-11-01T09:00:00.000Z",
            durationMinutes: 60,
            focusLevel: 5,
          },
        ],
      })
    );
    const service = createPlanGenerationService(
      mockAssessmentRepo,
      mockSessionRepo,
      mockUserService,
      mockAi
    );

    await expect(
      service.generatePlan("clerk_abc123", "test@example.com", IDS.assessment)
    ).rejects.toMatchObject({ code: "AI_INVALID_TOPIC", statusCode: 502 });
  });
});
