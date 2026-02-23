import { NextResponse } from "next/server";
import { z } from "zod";
import type { SessionStatus } from "@prisma/client";
import { getCurrentUser } from "@/server/auth/getCurrentUser";
import { sessionService } from "@/server/sessions/session.service";
import { apiError, handleError } from "@/server/api/handleError";

const paramsSchema = z.object({ sessionId: z.string().uuid() });

const updateStatusBody = z.object({
  status: z.enum(["PENDING", "COMPLETED", "MISSED"]),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = paramsSchema.parse(await params);
    const { clerkId, email } = await getCurrentUser();
    const parsed = updateStatusBody.safeParse(await req.json());
    if (!parsed.success) {
      return apiError("VALIDATION_ERROR", parsed.error.issues[0].message, 400);
    }
    const session = await sessionService.updateStatus(
      clerkId,
      email,
      sessionId,
      parsed.data.status as SessionStatus
    );
    return NextResponse.json({ session });
  } catch (err) {
    return handleError(err);
  }
}
