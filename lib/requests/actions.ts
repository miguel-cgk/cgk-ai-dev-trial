"use server";

import { revalidatePath } from "next/cache";
import type { Priority, Status } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { resolveUserName } from "@/lib/users";
import {
  addNoteSchema,
  createRequestSchema,
  ownerIdSchema,
  prioritySchema,
  statusSchema,
} from "@/lib/requests/validation";

export type ActionResult = { ok: true } | { ok: false; error: string };

function revalidateRequest(id?: string) {
  revalidatePath("/dashboard");
  if (id) revalidatePath(`/dashboard/requests/${id}`);
}

export async function createRequest(
  input: unknown,
): Promise<{ id: string } | { error: string }> {
  const user = await requireUser();

  const parsed = createRequestSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid request." };
  }
  const data = parsed.data;

  try {
    const request = await prisma.request.create({
      data: {
        title: data.title,
        description: data.description || null,
        requester: data.requester,
        category: data.category,
        priority: data.priority,
        createdById: user.id,
        createdByName: user.name,
        activity: {
          create: {
            type: "CREATED",
            actorId: user.id,
            actorName: user.name,
          },
        },
      },
    });

    revalidateRequest(request.id);
    return { id: request.id };
  } catch {
    return { error: "Could not create request." };
  }
}

export async function updateStatus(id: string, status: Status): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = statusSchema.safeParse(status);
  if (!parsed.success) return { ok: false, error: "Invalid status." };

  try {
    await prisma.$transaction(async (tx) => {
      const current = await tx.request.findUniqueOrThrow({ where: { id } });
      if (current.status === parsed.data) return;
      await tx.request.update({ where: { id }, data: { status: parsed.data } });
      await tx.activityEvent.create({
        data: {
          requestId: id,
          type: "STATUS_CHANGED",
          actorId: user.id,
          actorName: user.name,
          field: "status",
          fromValue: current.status,
          toValue: parsed.data,
        },
      });
    });
  } catch {
    return { ok: false, error: "Could not update status." };
  }

  revalidateRequest(id);
  return { ok: true };
}

export async function updatePriority(id: string, priority: Priority): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = prioritySchema.safeParse(priority);
  if (!parsed.success) return { ok: false, error: "Invalid priority." };

  try {
    await prisma.$transaction(async (tx) => {
      const current = await tx.request.findUniqueOrThrow({ where: { id } });
      if (current.priority === parsed.data) return;
      await tx.request.update({ where: { id }, data: { priority: parsed.data } });
      await tx.activityEvent.create({
        data: {
          requestId: id,
          type: "PRIORITY_CHANGED",
          actorId: user.id,
          actorName: user.name,
          field: "priority",
          fromValue: current.priority,
          toValue: parsed.data,
        },
      });
    });
  } catch {
    return { ok: false, error: "Could not update priority." };
  }

  revalidateRequest(id);
  return { ok: true };
}

export async function assignOwner(
  id: string,
  ownerId: string | null,
): Promise<ActionResult> {
  const user = await requireUser();

  const parsed = ownerIdSchema.safeParse(ownerId);
  if (!parsed.success) return { ok: false, error: "Invalid owner." };
  const nextOwnerId = parsed.data;

  // Resolve the name snapshot server-side; never trust a client-supplied name (ADR 0003/0005).
  let nextOwnerName: string | null = null;
  if (nextOwnerId) {
    nextOwnerName =
      nextOwnerId === user.id ? user.name : await resolveUserName(nextOwnerId);
    if (!nextOwnerName) return { ok: false, error: "That user no longer exists." };
  }

  try {
    await prisma.$transaction(async (tx) => {
      const current = await tx.request.findUniqueOrThrow({ where: { id } });
      if (current.ownerId === nextOwnerId) return;

      await tx.request.update({
        where: { id },
        data: { ownerId: nextOwnerId, ownerName: nextOwnerName },
      });
      await tx.activityEvent.create({
        data: {
          requestId: id,
          type: "OWNER_CHANGED",
          actorId: user.id,
          actorName: user.name,
          field: "owner",
          fromValue: current.ownerName ?? "Unassigned",
          toValue: nextOwnerName ?? "Unassigned",
        },
      });
    });
  } catch {
    return { ok: false, error: "Could not update owner." };
  }

  revalidateRequest(id);
  return { ok: true };
}

export async function addNote(id: string, body: string): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = addNoteSchema.safeParse({ body });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid note." };
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.request.findUniqueOrThrow({ where: { id } });
      await tx.note.create({
        data: {
          requestId: id,
          authorId: user.id,
          authorName: user.name,
          body: parsed.data.body,
        },
      });
      await tx.activityEvent.create({
        data: {
          requestId: id,
          type: "NOTE_ADDED",
          actorId: user.id,
          actorName: user.name,
        },
      });
    });
  } catch {
    return { ok: false, error: "Could not add note." };
  }

  revalidateRequest(id);
  return { ok: true };
}
