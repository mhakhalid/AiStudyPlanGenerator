import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/server/auth/getCurrentUser";
import { sessionService } from "@/server/sessions/session.service";
import { apiError, handleError } from "@/server/api/handleError";

const paramsSchema = z.object({ assessmentId: z.string().uuid() });

const createSessionBody = z.object({
  scheduledAt: z.coerce.date(),
  durationMinutes: z.number().int().min(15, "Minimum duration is 15 minutes"),
  topicId: z.string().uuid().optional(),
});

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ assessmentId: string }> }
) {
  try {
    const { assessmentId } = paramsSchema.parse(await params);
    const { clerkId, email } = await getCurrentUser();
    const sessions = await sessionService.listSessionsForAssessment(
      clerkId,
      email,
      assessmentId
    );
    return NextResponse.json({ sessions });
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
    const parsed = createSessionBody.safeParse(await req.json());
    if (!parsed.success) {
      return apiError("VALIDATION_ERROR", parsed.error.issues[0].message, 400);
    }
    const session = await sessionService.createSession(
      clerkId,
      email,
      assessmentId,
      parsed.data
    );
    return NextResponse.json({ session }, { status: 201 });
  } catch (err) {
    return handleError(err);
  }
}
