import type { PrismaClient, Reflection } from "@prisma/client";

export interface CreateReflectionParams {
  sessionId: string;
  understanding: number;
  notes?: string;
}

export interface ReflectionRepository {
  create(params: CreateReflectionParams): Promise<Reflection>;
  findBySession(sessionId: string): Promise<Reflection | null>;
}

export function createReflectionRepository(db: PrismaClient): ReflectionRepository {
  return {
    create({ sessionId, understanding, notes }) {
      return db.reflection.create({ data: { sessionId, understanding, notes } });
    },
    findBySession(sessionId) {
      return db.reflection.findUnique({ where: { sessionId } });
    },
  };
}
