import type { User } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createUserRepository, type UserRepository } from "./user.repository";

export interface UserService {
  ensureUserExists(clerkId: string, email: string): Promise<User>;
}

export function createUserService(repo: UserRepository): UserService {
  return {
    async ensureUserExists(clerkId, email) {
      return repo.upsert({ clerkId, email });
    },
  };
}

// Default singleton wired to the real Prisma client
const defaultRepo = createUserRepository(prisma);
export const userService = createUserService(defaultRepo);
