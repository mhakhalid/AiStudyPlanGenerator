import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/server/auth/getCurrentUser";
import { assessmentService } from "@/server/assessments/assessment.service";
import { apiError, handleError } from "@/server/api/handleError";

const createAssessmentBody = z.object({
  title: z.string().min(1, "Title is required"),
  courseName: z.string().optional(),
  dueAt: z.coerce.date(),
  weightPercent: z.number().int().min(0).max(100).optional(),
  notes: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const { clerkId, email } = await getCurrentUser();
    const parsed = createAssessmentBody.safeParse(await req.json());
    if (!parsed.success) {
      return apiError("VALIDATION_ERROR", parsed.error.issues[0].message, 400);
    }
    const assessment = await assessmentService.createAssessment(
      clerkId,
      email,
      parsed.data
    );
    return NextResponse.json({ assessment }, { status: 201 });
  } catch (err) {
    return handleError(err);
  }
}

export async function GET() {
  try {
    const { clerkId, email } = await getCurrentUser();
    const assessments = await assessmentService.listAssessments(clerkId, email);
    return NextResponse.json({ assessments });
  } catch (err) {
    return handleError(err);
  }
}
