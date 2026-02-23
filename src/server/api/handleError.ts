import { NextResponse } from "next/server";
import { AuthError } from "@/server/errors/AuthError";
import { AppError } from "@/server/errors/AppError";

export interface ApiErrorPayload {
  error: { code: string; message: string };
}

export function apiError(
  code: string,
  message: string,
  status: number
): NextResponse<ApiErrorPayload> {
  return NextResponse.json({ error: { code, message } }, { status });
}

export function handleError(err: unknown): NextResponse<ApiErrorPayload> {
  if (err instanceof AuthError) {
    return apiError(err.code, err.message, 401);
  }
  if (err instanceof AppError) {
    return apiError(err.code, err.message, err.statusCode);
  }
  return apiError("INTERNAL_ERROR", "An unexpected error occurred", 500);
}
