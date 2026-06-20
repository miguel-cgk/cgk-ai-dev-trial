"use server";

import { requireUser } from "@/lib/auth";
import type { Priority, Status } from "@prisma/client";
import type { CreateRequestInput } from "@/lib/requests/validation";

export type ActionResult = { ok: true } | { ok: false; error: string };

// Frozen contract for the spine. Full implementations land with Agent 2
// (Data + Features): validate -> write record + matching ActivityEvent in one
// transaction -> revalidatePath. Each action gates on requireUser() first.

export async function createRequest(
  _input: CreateRequestInput,
): Promise<{ id: string } | { error: string }> {
  await requireUser();
  return { error: "Not implemented yet (Agent 2: Data + Features)" };
}

export async function updateStatus(_id: string, _status: Status): Promise<ActionResult> {
  await requireUser();
  return { ok: false, error: "Not implemented yet (Agent 2)" };
}

export async function updatePriority(_id: string, _priority: Priority): Promise<ActionResult> {
  await requireUser();
  return { ok: false, error: "Not implemented yet (Agent 2)" };
}

export async function assignOwner(_id: string, _assign: boolean): Promise<ActionResult> {
  await requireUser();
  return { ok: false, error: "Not implemented yet (Agent 2)" };
}

export async function addNote(_id: string, _body: string): Promise<ActionResult> {
  await requireUser();
  return { ok: false, error: "Not implemented yet (Agent 2)" };
}
