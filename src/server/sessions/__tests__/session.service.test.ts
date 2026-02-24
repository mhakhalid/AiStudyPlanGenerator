import { describe, it, expect, vi, beforeEach } from "vitest";

// Prevent top-level PrismaClient instantiation in service singletons
vi.mock("@/lib/prisma", () => ({ prisma: {} }));

import { createSessionService } from "../session.service";
import type { SessionRepository } from "../session.repository";
import type { AssessmentRepository } from "@/server/assessments/assessment.repository";
import type { UserService } from "@/server/users/user.service";
import type { StudySession } from "@prisma/client";
import { SessionStatus } from "@prisma/client";

const mockDbUser = {
  id: "user-uuid-1",
  clerkId: "clerk_abc123",
  email: "test@example.com",
  createdAt: new Date("2024-01-01T00:00:00.000Z"),
  updatedAt: new Date("2024-01-01T00:00:00.000Z"),
};

const mockAssessment = {
  id: "assessment-uuid-1",
  userId: "user-uuid-1",
  title: "Final Exam",
  courseName: "Mathematics",
  dueAt: new Date("2024-06-01T00:00:00.000Z"),
  weightPercent: 40,
  notes: null,
  createdAt: new Date("2024-01-01T00:00:00.000Z"),
  updatedAt: new Date("2024-01-01T00:00:00.000Z"),
};

const mockSession: StudySession = {
  id: "session-uuid-1",
  assessmentId: "assessment-uuid-1",
  topicId: null,
  scheduledAt: new Date("2024-06-01T10:00:00.000Z"),
  durationMinutes: 60,
  status: SessionStatus.PENDING,
  createdAt: new Date("2024-01-01T00:00:00.000Z"),
  updatedAt: new Date("2024-01-01T00:00:00.000Z"),
};

const mockSessionWithDetails = {
  ...mockSession,
  topic: { name: "Calculus" },
  reflection: null,
};

// ── updateStatus ──────────────────────────────────────────────────────────────
describe("SessionService.updateStatus", () => {
  let mockSessionRepo: SessionRepository;
  let mockAssessmentRepo: AssessmentRepository;
  let mockUserService: UserService;

  beforeEach(() => {
    mockSessionRepo = {
      create: vi.fn().mockResolvedValue(mockSession),
      findByIdWithAssessment: vi.fn().mockResolvedValue({
        ...mockSession,
        assessment: { userId: "user-uuid-1" },
      }),
      updateStatus: vi.fn().mockResolvedValue({
        ...mockSession,
        status: SessionStatus.COMPLETED,
      }),
      findAllByAssessmentWithDetails: vi.fn().mockResolvedValue([mockSessionWithDetails]),
      replaceForAssessment: vi.fn().mockResolvedValue([mockSession]),
    };
    mockAssessmentRepo = {
      create: vi.fn(),
      findAllByUser: vi.fn(),
      findByIdAndUser: vi.fn().mockResolvedValue(mockAssessment),
      findByIdAndUserWithTopics: vi.fn(),
    };
    mockUserService = {
      ensureUserExists: vi.fn().mockResolvedValue(mockDbUser),
    };
  });

  it("updates status for an owned session", async () => {
    const service = createSessionService(
      mockSessionRepo,
      mockAssessmentRepo,
      mockUserService
    );

    const result = await service.updateStatus(
      "clerk_abc123",
      "test@example.com",
      "session-uuid-1",
      SessionStatus.COMPLETED
    );

    expect(mockSessionRepo.findByIdWithAssessment).toHaveBeenCalledWith("session-uuid-1");
    expect(mockSessionRepo.updateStatus).toHaveBeenCalledWith(
      "session-uuid-1",
      SessionStatus.COMPLETED
    );
    expect(result.status).toBe(SessionStatus.COMPLETED);
  });

  it("throws NOT_FOUND when session does not exist", async () => {
    mockSessionRepo.findByIdWithAssessment = vi.fn().mockResolvedValue(null);
    const service = createSessionService(
      mockSessionRepo,
      mockAssessmentRepo,
      mockUserService
    );

    await expect(
      service.updateStatus(
        "clerk_abc123",
        "test@example.com",
        "nonexistent",
        SessionStatus.COMPLETED
      )
    ).rejects.toMatchObject({ code: "NOT_FOUND", statusCode: 404 });
  });

  it("throws FORBIDDEN when session belongs to another user", async () => {
    mockSessionRepo.findByIdWithAssessment = vi.fn().mockResolvedValue({
      ...mockSession,
      assessment: { userId: "other-user-uuid" },
    });
    const service = createSessionService(
      mockSessionRepo,
      mockAssessmentRepo,
      mockUserService
    );

    await expect(
      service.updateStatus(
        "clerk_abc123",
        "test@example.com",
        "session-uuid-1",
        SessionStatus.COMPLETED
      )
    ).rejects.toMatchObject({ code: "FORBIDDEN", statusCode: 403 });
  });
});

// ── listSessionsForAssessment ─────────────────────────────────────────────────
describe("SessionService.listSessionsForAssessment", () => {
  let mockSessionRepo: SessionRepository;
  let mockAssessmentRepo: AssessmentRepository;
  let mockUserService: UserService;

  beforeEach(() => {
    mockSessionRepo = {
      create: vi.fn(),
      findByIdWithAssessment: vi.fn(),
      updateStatus: vi.fn(),
      findAllByAssessmentWithDetails: vi.fn().mockResolvedValue([mockSessionWithDetails]),
      replaceForAssessment: vi.fn(),
    };
    mockAssessmentRepo = {
      create: vi.fn(),
      findAllByUser: vi.fn(),
      findByIdAndUser: vi.fn().mockResolvedValue(mockAssessment),
      findByIdAndUserWithTopics: vi.fn(),
    };
    mockUserService = {
      ensureUserExists: vi.fn().mockResolvedValue(mockDbUser),
    };
  });

  it("returns sessions with topic and reflection data for an owned assessment", async () => {
    const service = createSessionService(
      mockSessionRepo,
      mockAssessmentRepo,
      mockUserService
    );

    const result = await service.listSessionsForAssessment(
      "clerk_abc123",
      "test@example.com",
      "assessment-uuid-1"
    );

    expect(mockAssessmentRepo.findByIdAndUser).toHaveBeenCalledWith(
      "assessment-uuid-1",
      "user-uuid-1"
    );
    expect(mockSessionRepo.findAllByAssessmentWithDetails).toHaveBeenCalledWith(
      "assessment-uuid-1"
    );
    expect(result).toHaveLength(1);
    expect(result[0].topic).toEqual({ name: "Calculus" });
    expect(result[0].reflection).toBeNull();
  });

  it("throws NOT_FOUND when assessment does not belong to the user", async () => {
    mockAssessmentRepo.findByIdAndUser = vi.fn().mockResolvedValue(null);
    const service = createSessionService(
      mockSessionRepo,
      mockAssessmentRepo,
      mockUserService
    );

    await expect(
      service.listSessionsForAssessment(
        "clerk_abc123",
        "test@example.com",
        "nonexistent-assessment"
      )
    ).rejects.toMatchObject({ code: "NOT_FOUND", statusCode: 404 });

    // Repo must never be called if ownership check fails
    expect(mockSessionRepo.findAllByAssessmentWithDetails).not.toHaveBeenCalled();
  });
});
