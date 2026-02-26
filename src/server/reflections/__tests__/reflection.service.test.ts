import { describe, it, expect, vi, beforeEach } from "vitest";

// Must be hoisted before any import that transitively touches @/lib/prisma
vi.mock("@/lib/prisma", () => ({ prisma: {} }));

import { createReflectionService } from "../reflection.service";
import type { ReflectionRepository } from "../reflection.repository";
import type { SessionRepository } from "@/server/sessions/session.repository";
import type { UserService } from "@/server/users/user.service";
import type { Reflection } from "@prisma/client";

// ── Fixtures ───────────────────────────────────────────────────────────────────

const mockUser = {
  id: "user-uuid-1",
  clerkId: "clerk_abc123",
  email: "test@example.com",
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-01"),
};

const mockSessionWithAssessment = {
  id: "session-uuid-1",
  assessmentId: "assessment-uuid-1",
  topicId: null,
  scheduledAt: new Date("2024-06-01T10:00:00.000Z"),
  durationMinutes: 60,
  status: "PENDING" as const,
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-01"),
  assessment: { userId: "user-uuid-1" },
};

const mockReflection: Reflection = {
  id: "reflection-uuid-1",
  sessionId: "session-uuid-1",
  understanding: 8,
  notes: "Felt confident with integration by parts",
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-01"),
};

// ── Mocks ──────────────────────────────────────────────────────────────────────

let mockReflectionRepo: ReflectionRepository;
let mockSessionRepo: SessionRepository;
let mockUsers: UserService;

beforeEach(() => {
  mockReflectionRepo = {
    create: vi.fn().mockResolvedValue(mockReflection),
    findBySession: vi.fn().mockResolvedValue(null),
  };

  mockSessionRepo = {
    create: vi.fn(),
    findByIdWithAssessment: vi.fn().mockResolvedValue(mockSessionWithAssessment),
    updateStatus: vi.fn(),
    findAllByAssessmentWithDetails: vi.fn(),
    replaceForAssessment: vi.fn(),
  };

  mockUsers = {
    ensureUserExists: vi.fn().mockResolvedValue(mockUser),
  };
});

// ── Tests ──────────────────────────────────────────────────────────────────────

describe("ReflectionService.createReflection", () => {
  it("creates a reflection for an owned session", async () => {
    const service = createReflectionService(mockReflectionRepo, mockSessionRepo, mockUsers);

    const result = await service.createReflection(
      "clerk_abc123",
      "test@example.com",
      "session-uuid-1",
      { understanding: 8, notes: "Felt confident with integration by parts" }
    );

    expect(mockUsers.ensureUserExists).toHaveBeenCalledWith("clerk_abc123", "test@example.com");
    expect(mockSessionRepo.findByIdWithAssessment).toHaveBeenCalledWith("session-uuid-1");
    expect(mockReflectionRepo.findBySession).toHaveBeenCalledWith("session-uuid-1");
    expect(mockReflectionRepo.create).toHaveBeenCalledWith({
      sessionId: "session-uuid-1",
      understanding: 8,
      notes: "Felt confident with integration by parts",
    });
    expect(result).toStrictEqual(mockReflection);
  });

  it("throws NOT_FOUND (404) when session does not exist", async () => {
    mockSessionRepo.findByIdWithAssessment = vi.fn().mockResolvedValue(null);
    const service = createReflectionService(mockReflectionRepo, mockSessionRepo, mockUsers);

    await expect(
      service.createReflection("clerk_abc123", "test@example.com", "bad-session-id", {
        understanding: 7,
      })
    ).rejects.toMatchObject({ code: "NOT_FOUND", statusCode: 404 });

    expect(mockReflectionRepo.create).not.toHaveBeenCalled();
  });

  it("throws FORBIDDEN (403) when session belongs to another user", async () => {
    mockSessionRepo.findByIdWithAssessment = vi.fn().mockResolvedValue({
      ...mockSessionWithAssessment,
      assessment: { userId: "other-user-uuid" },
    });
    const service = createReflectionService(mockReflectionRepo, mockSessionRepo, mockUsers);

    await expect(
      service.createReflection("clerk_abc123", "test@example.com", "session-uuid-1", {
        understanding: 7,
      })
    ).rejects.toMatchObject({ code: "FORBIDDEN", statusCode: 403 });

    expect(mockReflectionRepo.create).not.toHaveBeenCalled();
  });

  it("throws CONFLICT (409) when a reflection already exists for the session", async () => {
    mockReflectionRepo.findBySession = vi.fn().mockResolvedValue(mockReflection);
    const service = createReflectionService(mockReflectionRepo, mockSessionRepo, mockUsers);

    await expect(
      service.createReflection("clerk_abc123", "test@example.com", "session-uuid-1", {
        understanding: 9,
      })
    ).rejects.toMatchObject({ code: "CONFLICT", statusCode: 409 });

    expect(mockReflectionRepo.create).not.toHaveBeenCalled();
  });

  it("propagates errors from user service", async () => {
    mockUsers.ensureUserExists = vi.fn().mockRejectedValue(new Error("User service failed"));
    const service = createReflectionService(mockReflectionRepo, mockSessionRepo, mockUsers);

    await expect(
      service.createReflection("clerk_abc123", "test@example.com", "session-uuid-1", {
        understanding: 7,
      })
    ).rejects.toThrow("User service failed");
  });
});
