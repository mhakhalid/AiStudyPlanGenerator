import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/server/auth/getCurrentUser";
import { topicService } from "@/server/topics/topic.service";
import { apiError, handleError } from "@/server/api/handleError";

const paramsSchema = z.object({ assessmentId: z.string().uuid() });

const createTopicBody = z.object({
  name: z.string().min(1, "Name is required"),
  difficulty: z.number().int().min(1).max(10).optional(),
  mastery: z.number().int().min(1).max(10).optional(),
});

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ assessmentId: string }> }
) {
  try {
    const { assessmentId } = paramsSchema.parse(await params);
    const { clerkId, email } = await getCurrentUser();
    const topics = await topicService.listTopics(clerkId, email, assessmentId);
    return NextResponse.json({ topics });
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ assessmentId: string }> }
) {
  try {
    const { assessmentId } = paramsSchema.parse(await params);
    const { clerkId, email } = await getCurrentUser();
    const parsed = createTopicBody.safeParse(await req.json());
    if (!parsed.success) {
      return apiError("VALIDATION_ERROR", parsed.error.issues[0].message, 400);
    }
    const topic = await topicService.createTopic(
      clerkId,
      email,
      assessmentId,
      parsed.data
    );
    return NextResponse.json({ topic }, { status: 201 });
  } catch (err) {
    return handleError(err);
  }
}
