import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/server/auth/getCurrentUser";
import { getSemesterPlanService } from "@/server/semester-plans/semester-plan.service";
import { apiError, handleError } from "@/server/api/handleError";

const dayOfWeekEnum = z.enum([
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
]);

const createPlanBody = z.object({
  name: z.string().min(1, "Name is required"),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  courses: z
    .array(
      z.object({
        name: z.string().min(1, "Course name is required"),
        creditHours: z.number().int().positive().optional(),
        priority: z.number().int().min(1).max(10).optional(),
        exams: z
          .array(
            z.object({
              title: z.string().min(1, "Exam title is required"),
              scheduledAt: z.coerce.date(),
              weightPercent: z.number().int().min(1).max(100).optional(),
            })
          )
          .optional(),
      })
    )
    .min(1, "At least one course is required"),
  availability: z
    .array(
      z.object({
        dayOfWeek: dayOfWeekEnum,
        startHour: z.number().int().min(0).max(23),
        endHour: z.number().int().min(1).max(24),
      })
    )
    .min(1, "At least one availability slot is required"),
});

export async function GET() {
  try {
    const { clerkId, email } = await getCurrentUser();
    const plans = await getSemesterPlanService().listPlans(clerkId, email);
    return NextResponse.json({ plans });
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(req: Request) {
  try {
    const { clerkId, email } = await getCurrentUser();
    const parsed = createPlanBody.safeParse(await req.json());
    if (!parsed.success) {
      return apiError("VALIDATION_ERROR", parsed.error.issues[0].message, 400);
    }
    const plan = await getSemesterPlanService().createPlan(
      clerkId,
      email,
      parsed.data
    );
    return NextResponse.json({ plan }, { status: 201 });
  } catch (err) {
    return handleError(err);
  }
}
