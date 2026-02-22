import { auth, currentUser } from "@clerk/nextjs/server";
import { AuthError } from "@/server/errors/AuthError";

export interface ClerkUserInfo {
  clerkId: string;
  email: string;
}

export async function getCurrentUser(): Promise<ClerkUserInfo> {
  const { userId } = await auth();

  if (!userId) {
    throw new AuthError();
  }

  const user = await currentUser();

  if (!user) {
    throw new AuthError();
  }

  const email =
    user.primaryEmailAddress?.emailAddress ??
    user.emailAddresses[0]?.emailAddress;

  if (!email) {
    throw new AuthError("No email address found for user");
  }

  return { clerkId: userId, email };
}
