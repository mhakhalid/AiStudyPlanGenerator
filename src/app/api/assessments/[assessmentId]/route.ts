import { z } from "zod";
import { getCurrentUser } from "@/server/auth/getCurrentUser";
import { assessmentService } from "@/server/assessments/assessment.service";
import { NextResponse } from "next/server";
import { apiError, handleError } from "@/server/api/handleError";

const paramsSchema = z.object({ assessmentId: z.string().uuid() });

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ assessmentId: string }> }
) {
  try {
    const { assessmentId } = paramsSchema.parse(await params);
    const { clerkId, email } = await getCurrentUser();
    const assessment = await assessmentService.getAssessment(
      clerkId,
      email,
      assessmentId
    );
    return NextResponse.json({ assessment });
  } catch (err) {
    return handleError(err);
  }
}
