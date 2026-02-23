import { describe, it, expect, vi, beforeEach } from "vitest";

// Must be hoisted before any import that transitively touches @/lib/prisma,
// otherwise the top-level `new PrismaClient()` in user.service.ts fires first.
vi.mock("@/lib/prisma", () => ({ prisma: {} }));

import { createUserService } from "../user.service";
import type { UserRepository } from "../user.repository";
import type { User } from "@prisma/client";

const mockUser: User = {
  id: "uuid-1",
  clerkId: "clerk_abc123",
  email: "test@example.com",
  createdAt: new Date("2024-01-01T00:00:00.000Z"),
  updatedAt: new Date("2024-01-01T00:00:00.000Z"),
};

describe("UserService.ensureUserExists", () => {
  let mockRepo: UserRepository;

  beforeEach(() => {
    mockRepo = {
      upsert: vi.fn().mockResolvedValue(mockUser),
    };
  });

  it("calls repo.upsert with the given clerkId and email", async () => {
    const service = createUserService(mockRepo);

    await service.ensureUserExists("clerk_abc123", "test@example.com");

    expect(mockRepo.upsert).toHaveBeenCalledOnce();
    expect(mockRepo.upsert).toHaveBeenCalledWith({
      clerkId: "clerk_abc123",
      email: "test@example.com",
    });
  });

  it("returns the upserted user from the repository", async () => {
    const service = createUserService(mockRepo);

    const result = await service.ensureUserExists(
      "clerk_abc123",
      "test@example.com"
    );

    expect(result).toStrictEqual(mockUser);
  });

  it("propagates errors thrown by the repository", async () => {
    mockRepo.upsert = vi.fn().mockRejectedValue(new Error("DB connection lost"));
    const service = createUserService(mockRepo);

    await expect(
      service.ensureUserExists("clerk_abc123", "test@example.com")
    ).rejects.toThrow("DB connection lost");
  });

  it("calls repo.upsert with updated email when email changes", async () => {
    const updatedUser = { ...mockUser, email: "new@example.com" };
    mockRepo.upsert = vi.fn().mockResolvedValue(updatedUser);
    const service = createUserService(mockRepo);

    const result = await service.ensureUserExists("clerk_abc123", "new@example.com");

    expect(mockRepo.upsert).toHaveBeenCalledWith({
      clerkId: "clerk_abc123",
      email: "new@example.com",
    });
    expect(result.email).toBe("new@example.com");
  });
});
