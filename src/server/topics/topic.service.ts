import type { Topic } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { AppError } from "@/server/errors/AppError";
import { userService, type UserService } from "@/server/users/user.service";
import {
  createAssessmentRepository,
  type AssessmentRepository,
} from "@/server/assessments/assessment.repository";
import {
  createTopicRepository,
  type TopicRepository,
  type CreateTopicParams,
} from "./topic.repository";

export type CreateTopicData = Omit<CreateTopicParams, "assessmentId">;

export interface TopicService {
  createTopic(
    clerkId: string,
    email: string,
    assessmentId: string,
    data: CreateTopicData
  ): Promise<Topic>;
}

export function createTopicService(
  topicRepo: TopicRepository,
  assessmentRepo: AssessmentRepository,
  users: UserService
): TopicService {
  return {
    async createTopic(clerkId, email, assessmentId, data) {
      const user = await users.ensureUserExists(clerkId, email);
      const assessment = await assessmentRepo.findByIdAndUser(assessmentId, user.id);
      if (!assessment) {
        throw new AppError("Assessment not found", 404, "NOT_FOUND");
      }
      return topicRepo.create({ assessmentId, ...data });
    },
  };
}

// Default singleton
const defaultTopicRepo = createTopicRepository(prisma);
const defaultAssessmentRepo = createAssessmentRepository(prisma);
export const topicService = createTopicService(
  defaultTopicRepo,
  defaultAssessmentRepo,
  userService
);
