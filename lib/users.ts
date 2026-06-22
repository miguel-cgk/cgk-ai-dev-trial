import "server-only";
import { clerkClient } from "@clerk/nextjs/server";
import type { User } from "@clerk/nextjs/server";

export type AssignableUser = { id: string; name: string };

/** Best-effort display name from a Clerk backend user, matching lib/auth's snapshot logic. */
function displayName(user: User): string {
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
  const email =
    user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId)?.emailAddress ??
    user.emailAddresses[0]?.emailAddress;
  return fullName || user.username || email || "Unknown user";
}

/**
 * Every user in the Clerk instance, as assignable owners. Clerk is the system of
 * record (ADR 0003) so this is read live; capped and sorted for a small team.
 */
export async function listAssignableUsers(): Promise<AssignableUser[]> {
  const client = await clerkClient();
  const { data } = await client.users.getUserList({ limit: 100 });
  return data
    .map((user) => ({ id: user.id, name: displayName(user) }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

/** Canonical name for a single Clerk user id, or null if no such user exists. */
export async function resolveUserName(userId: string): Promise<string | null> {
  try {
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    return displayName(user);
  } catch {
    return null;
  }
}
