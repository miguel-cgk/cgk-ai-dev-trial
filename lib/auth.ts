import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export type AuthedUser = { id: string; name: string };

/**
 * Server-side auth gate. Call at the top of every protected page/layout and
 * every Server Action. Redirects unauthenticated callers to sign-in.
 */
export async function requireUser(): Promise<AuthedUser> {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await currentUser();
  const name =
    user?.fullName ??
    user?.primaryEmailAddress?.emailAddress ??
    user?.username ??
    "Unknown user";

  return { id: userId, name };
}
