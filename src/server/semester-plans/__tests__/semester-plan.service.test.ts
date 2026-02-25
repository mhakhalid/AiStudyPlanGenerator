import { describe, it, expect, vi, beforeEach } from "vitest";

// Must be hoisted before any import that transitively touches @/lib/prisma
vi.mock("@/lib/prisma", () => ({ prisma: {} }));

import { createSemesterPlanService } from "../semester-plan.service";
import type { SemesterPlanRepository } from "../semester-plan.repository";
import type { UserService } from "@/server/users/user.service";
import type { AiProvider } from "@/server/ai/ai.provider";
import type { SemesterPlan, SemesterSession } from "@prisma/client";

// ── Fixtures ──────────────────────────────────────────────────────────────────

const mockUser = {
  id: "user-uuid-1",
  clerkId: "clerk_abc",
  email: "test@example.com",
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockPlan: SemesterPlan = {
  id: "plan-uuid-1",
  userId: "user-uuid-1",
  name: "Fall 2025",
  startDate: new Date("2025-09-01"),
  endDate: new Date("2025-12-15"),
  createdAt: new Date(),
  updatedAt: new Date(),
};

const courseId = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";

const mockPlanWithRelations = {
  ...mockPlan,
  courses: [
    {
      id: courseId,
      semesterPlanId: mockPlan.id,
      name: "Calculus II",
      creditHours: 3,
      priority: 7,
      createdAt: new Date(),
      updatedAt: new Date(),
      exams: [],
      sessions: [],
    },
  ],
  availability: [
    {
      id: "avail-uuid-1",
      semesterPlanId: mockPlan.id,
      dayOfWeek: "MONDAY" as const,
      startHour: 9,
      endHour: 17,
      createdAt: new Date(),
    },
  ],
  sessions: [],
};

const mockSession: SemesterSession = {
  id: "session-uuid-1",
  semesterPlanId: mockPlan.id,
  semesterCourseId: courseId,
  scheduledAt: new Date("2025-09-08T09:00:00.000Z"),
  durationMinutes: 60,
  status: "PENDING",
  createdAt: new Date(),
  updatedAt: new Date(),
};

const validAiResponse = JSON.stringify({
  sessions: [
    {
      semesterCourseId: courseId,
      date: "2025-09-08T09:00:00.000Z",
      durationMinutes: 60,
    },
  ],
});

// ── Mocks ─────────────────────────────────────────────────────────────────────

let mockRepo: SemesterPlanRepository;
let mockUsers: UserService;
let mockAi: AiProvider;

beforeEach(() => {
  mockRepo = {
    create: vi.fn().mockResolvedValue(mockPlan),
    findAllByUser: vi.fn().mockResolvedValue([mockPlan]),
    findByIdAndUser: vi.fn().mockResolvedValue(mockPlanWithRelations),
    replaceSessionsForPlan: vi.fn().mockResolvedValue([mockSession]),
  };

  mockUsers = {
    ensureUserExists: vi.fn().mockResolvedValue(mockUser),
  };

  mockAi = {
    complete: vi.fn().mockResolvedValue(validAiResponse),
  };
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("SemesterPlanService.createPlan", () => {
  it("resolves user then calls repo.create with userId", async () => {
    const service = createSemesterPlanService(mockRepo, mockUsers, mockAi);
    const data = {
      name: "Fall 2025",
      startDate: new Date("2025-09-01"),
      endDate: new Date("2025-12-15"),
      courses: [{ name: "Calculus II" }],
      availability: [{ dayOfWeek: "MONDAY" as const, startHour: 9, endHour: 17 }],
    };

    const result = await service.createPlan("clerk_abc", "test@example.com", data);

    expect(mockUsers.ensureUserExists).toHaveBeenCalledWith("clerk_abc", "test@example.com");
    expect(mockRepo.create).toHaveBeenCalledWith({ userId: mockUser.id, ...data });
    expect(result).toStrictEqual(mockPlan);
  });
});

describe("SemesterPlanService.listPlans", () => {
  it("resolves user then calls repo.findAllByUser", async () => {
    const service = createSemesterPlanService(mockRepo, mockUsers, mockAi);

    const result = await service.listPlans("clerk_abc", "test@example.com");

    expect(mockUsers.ensureUserExists).toHaveBeenCalledOnce();
    expect(mockRepo.findAllByUser).toHaveBeenCalledWith(mockUser.id);
    expect(result).toStrictEqual([mockPlan]);
  });
});

describe("SemesterPlanService.getPlan", () => {
  it("returns plan when found", async () => {
    const service = createSemesterPlanService(mockRepo, mockUsers, mockAi);

    const result = await service.getPlan("clerk_abc", "test@example.com", mockPlan.id);

    expect(result).toStrictEqual(mockPlanWithRelations);
  });

  it("throws NOT_FOUND (404) when repo returns null", async () => {
    mockRepo.findByIdAndUser = vi.fn().mockResolvedValue(null);
    const service = createSemesterPlanService(mockRepo, mockUsers, mockAi);

    await expect(
      service.getPlan("clerk_abc", "test@example.com", "nonexistent-id")
    ).rejects.toMatchObject({ code: "NOT_FOUND", statusCode: 404 });
  });
});

describe("SemesterPlanService.generateSessions", () => {
  it("returns sessions on the happy path", async () => {
    const service = createSemesterPlanService(mockRepo, mockUsers, mockAi);

    const result = await service.generateSessions("clerk_abc", "test@example.com", mockPlan.id);

    expect(mockAi.complete).toHaveBeenCalledOnce();
    expect(mockRepo.replaceSessionsForPlan).toHaveBeenCalledWith(
      mockPlan.id,
      [
        {
          semesterPlanId: mockPlan.id,
          semesterCourseId: courseId,
          scheduledAt: new Date("2025-09-08T09:00:00.000Z"),
          durationMinutes: 60,
        },
      ]
    );
    expect(result).toStrictEqual([mockSession]);
  });

  it("throws NOT_FOUND (404) when plan does not exist", async () => {
    mockRepo.findByIdAndUser = vi.fn().mockResolvedValue(null);
    const service = createSemesterPlanService(mockRepo, mockUsers, mockAi);

    await expect(
      service.generateSessions("clerk_abc", "test@example.com", "bad-id")
    ).rejects.toMatchObject({ code: "NOT_FOUND", statusCode: 404 });
  });

  it("throws NO_COURSES (422) when plan has no courses", async () => {
    mockRepo.findByIdAndUser = vi.fn().mockResolvedValue({
      ...mockPlanWithRelations,
      courses: [],
    });
    const service = createSemesterPlanService(mockRepo, mockUsers, mockAi);

    await expect(
      service.generateSessions("clerk_abc", "test@example.com", mockPlan.id)
    ).rejects.toMatchObject({ code: "NO_COURSES", statusCode: 422 });
  });

  it("throws NO_AVAILABILITY (422) when plan has no availability slots", async () => {
    mockRepo.findByIdAndUser = vi.fn().mockResolvedValue({
      ...mockPlanWithRelations,
      availability: [],
    });
    const service = createSemesterPlanService(mockRepo, mockUsers, mockAi);

    await expect(
      service.generateSessions("clerk_abc", "test@example.com", mockPlan.id)
    ).rejects.toMatchObject({ code: "NO_AVAILABILITY", statusCode: 422 });
  });

  it("throws AI_INVALID_RESPONSE (502) when AI returns malformed JSON", async () => {
    mockAi.complete = vi.fn().mockResolvedValue("not json {{");
    const service = createSemesterPlanService(mockRepo, mockUsers, mockAi);

    await expect(
      service.generateSessions("clerk_abc", "test@example.com", mockPlan.id)
    ).rejects.toMatchObject({ code: "AI_INVALID_RESPONSE", statusCode: 502 });
  });

  it("throws AI_VALIDATION_FAILED (502) when AI JSON fails Zod schema", async () => {
    mockAi.complete = vi.fn().mockResolvedValue(
      JSON.stringify({ sessions: [{ semesterCourseId: "bad", date: "not-a-date", durationMinutes: 5 }] })
    );
    const service = createSemesterPlanService(mockRepo, mockUsers, mockAi);

    await expect(
      service.generateSessions("clerk_abc", "test@example.com", mockPlan.id)
    ).rejects.toMatchObject({ code: "AI_VALIDATION_FAILED", statusCode: 502 });
  });

  it("throws AI_INVALID_COURSE (502) when AI references an unknown course ID", async () => {
    mockAi.complete = vi.fn().mockResolvedValue(
      JSON.stringify({
        sessions: [
          {
            semesterCourseId: "00000000-0000-0000-0000-000000000000",
            date: "2025-09-08T09:00:00.000Z",
            durationMinutes: 60,
          },
        ],
      })
    );
    const service = createSemesterPlanService(mockRepo, mockUsers, mockAi);

    await expect(
      service.generateSessions("clerk_abc", "test@example.com", mockPlan.id)
    ).rejects.toMatchObject({ code: "AI_INVALID_COURSE", statusCode: 502 });
  });
});
