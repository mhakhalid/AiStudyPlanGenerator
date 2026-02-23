import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/server/auth/getCurrentUser";
import { getPlanGenerationService } from "@/server/plan-generation/plan-generation.service";
import { handleError } from "@/server/api/handleError";

const paramsSchema = z.object({ assessmentId: z.string().uuid() });

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ assessmentId: string }> }
) {
  try {
    const { assessmentId } = paramsSchema.parse(await params);
    const { clerkId, email } = await getCurrentUser();

    const sessions = await getPlanGenerationService().generatePlan(
      clerkId,
      email,
      assessmentId
    );

    return NextResponse.json({ sessions }, { status: 201 });
  } catch (err) {
    return handleError(err);
  }
}
