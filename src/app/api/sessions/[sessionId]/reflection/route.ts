import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/server/auth/getCurrentUser";
import { reflectionService } from "@/server/reflections/reflection.service";
import { apiError, handleError } from "@/server/api/handleError";

const paramsSchema = z.object({ sessionId: z.string().uuid() });

const createReflectionBody = z.object({
  understanding: z.number().int().min(1).max(10),
  notes: z.string().optional(),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = paramsSchema.parse(await params);
    const { clerkId, email } = await getCurrentUser();
    const parsed = createReflectionBody.safeParse(await req.json());
    if (!parsed.success) {
      return apiError("VALIDATION_ERROR", parsed.error.issues[0].message, 400);
    }
    const reflection = await reflectionService.createReflection(
      clerkId,
      email,
      sessionId,
      parsed.data
    );
    return NextResponse.json({ reflection }, { status: 201 });
  } catch (err) {
    return handleError(err);
  }
}
