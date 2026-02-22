import type { PrismaClient, User } from "@prisma/client";

export interface UpsertUserParams {
  clerkId: string;
  email: string;
}

export interface UserRepository {
  upsert(params: UpsertUserParams): Promise<User>;
}

export function createUserRepository(db: PrismaClient): UserRepository {
  return {
    async upsert({ clerkId, email }) {
      return db.user.upsert({
        where: { clerkId },
        update: { email },
        create: { clerkId, email },
      });
    },
  };
}
