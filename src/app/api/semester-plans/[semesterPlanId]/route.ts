import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/server/auth/getCurrentUser";
import { getSemesterPlanService } from "@/server/semester-plans/semester-plan.service";
import { handleError } from "@/server/api/handleError";

const paramsSchema = z.object({ semesterPlanId: z.string().uuid() });

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ semesterPlanId: string }> }
) {
  try {
    const { semesterPlanId } = paramsSchema.parse(await params);
    const { clerkId, email } = await getCurrentUser();
    const plan = await getSemesterPlanService().getPlan(
      clerkId,
      email,
      semesterPlanId
    );
    return NextResponse.json({ plan });
  } catch (err) {
    return handleError(err);
  }
}
