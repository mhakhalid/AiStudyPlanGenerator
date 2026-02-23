import { describe, it, expect, vi, beforeEach } from "vitest";

// Prevent top-level PrismaClient instantiation in service singletons
vi.mock("@/lib/prisma", () => ({ prisma: {} }));

import { createAssessmentService } from "../assessment.service";
import type { AssessmentRepository } from "../assessment.repository";
import type { UserService } from "@/server/users/user.service";
import type { Assessment } from "@prisma/client";

const mockDbUser = {
  id: "user-uuid-1",
  clerkId: "clerk_abc123",
  email: "test@example.com",
  createdAt: new Date("2024-01-01T00:00:00.000Z"),
  updatedAt: new Date("2024-01-01T00:00:00.000Z"),
};

const mockAssessment: Assessment = {
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

describe("AssessmentService.createAssessment", () => {
  let mockRepo: AssessmentRepository;
  let mockUserService: UserService;

  beforeEach(() => {
    mockRepo = {
      create: vi.fn().mockResolvedValue(mockAssessment),
      findAllByUser: vi.fn().mockResolvedValue([mockAssessment]),
      findByIdAndUser: vi.fn().mockResolvedValue(mockAssessment),
      findByIdAndUserWithTopics: vi.fn().mockResolvedValue({ ...mockAssessment, topics: [] }),
    };
    mockUserService = {
      ensureUserExists: vi.fn().mockResolvedValue(mockDbUser),
    };
  });

  it("upserts user and creates assessment with correct params", async () => {
    const service = createAssessmentService(mockRepo, mockUserService);
    const data = {
      title: "Final Exam",
      courseName: "Mathematics",
      dueAt: new Date("2024-06-01"),
      weightPercent: 40,
    };

    const result = await service.createAssessment("clerk_abc123", "test@example.com", data);

    expect(mockUserService.ensureUserExists).toHaveBeenCalledWith(
      "clerk_abc123",
      "test@example.com"
    );
    expect(mockRepo.create).toHaveBeenCalledWith({ userId: "user-uuid-1", ...data });
    expect(result).toStrictEqual(mockAssessment);
  });

  it("propagates error from user service", async () => {
    mockUserService.ensureUserExists = vi
      .fn()
      .mockRejectedValue(new Error("User service failed"));
    const service = createAssessmentService(mockRepo, mockUserService);

    await expect(
      service.createAssessment("clerk_abc123", "test@example.com", {
        title: "Test",
        dueAt: new Date(),
      })
    ).rejects.toThrow("User service failed");
  });

  it("throws NOT_FOUND when assessment does not belong to user", async () => {
    mockRepo.findByIdAndUser = vi.fn().mockResolvedValue(null);
    const service = createAssessmentService(mockRepo, mockUserService);

    await expect(
      service.getAssessment("clerk_abc123", "test@example.com", "nonexistent-id")
    ).rejects.toMatchObject({ code: "NOT_FOUND", statusCode: 404 });
  });
});
