import type { PrismaClient, Topic } from "@prisma/client";

export interface CreateTopicParams {
  assessmentId: string;
  name: string;
  difficulty?: number;
  mastery?: number;
}

export interface TopicRepository {
  create(params: CreateTopicParams): Promise<Topic>;
  findAllByAssessment(assessmentId: string): Promise<Topic[]>;
}

export function createTopicRepository(db: PrismaClient): TopicRepository {
  return {
    create({ assessmentId, name, difficulty = 5, mastery = 5 }) {
      return db.topic.create({ data: { assessmentId, name, difficulty, mastery } });
    },
    findAllByAssessment(assessmentId) {
      return db.topic.findMany({
        where: { assessmentId },
        orderBy: { name: "asc" },
      });
    },
  };
}
