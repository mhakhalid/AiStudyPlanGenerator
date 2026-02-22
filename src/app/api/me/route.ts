import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/server/auth/getCurrentUser";
import { userService } from "@/server/users/user.service";
import { AuthError } from "@/server/errors/AuthError";
import { AppError } from "@/server/errors/AppError";

const errorResponseSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
  }),
});

type ErrorResponse = z.infer<typeof errorResponseSchema>;

function errorResponse(
  code: string,
  message: string,
  status: number
): NextResponse<ErrorResponse> {
  return NextResponse.json({ error: { code, message } }, { status });
}

export async function GET() {
  try {
    const { clerkId, email } = await getCurrentUser();
    const user = await userService.ensureUserExists(clerkId, email);
    return NextResponse.json({ user });
  } catch (err) {
    if (err instanceof AuthError) {
      return errorResponse(err.code, err.message, 401);
    }
    if (err instanceof AppError) {
      return errorResponse(err.code, err.message, err.statusCode);
    }
    return errorResponse("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}
