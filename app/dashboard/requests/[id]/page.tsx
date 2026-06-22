import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { requireUser } from "@/lib/auth";
import { listAssignableUsers } from "@/lib/users";
import { getRequest } from "@/lib/requests/queries";
import { PrioritySelect, StatusSelect } from "@/components/requests/field-selects";
import { OwnerSelect } from "@/components/requests/owner-select";
import { AddNoteForm } from "@/components/requests/add-note-form";
import { Badge } from "@/components/ui/badge";
import { activityVerb, CATEGORY_LABEL, formatDateTime } from "@/lib/requests/display";

function humanizeValue(value: string): string {
  if (/^[A-Z_]+$/.test(value)) {
    return value.charAt(0) + value.slice(1).toLowerCase().replace(/_/g, " ");
  }
  return value;
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1">
      <div className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{label}</div>
      {children}
    </div>
  );
}

export default async function RequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const request = await getRequest(id);
  if (!request) notFound();

  const me = await requireUser();
  // Owner list is read live from Clerk (ADR 0003); degrade gracefully if it fails.
  const users = await listAssignableUsers().catch(() => []);

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Back to queue
      </Link>

      <div className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">{request.title}</h1>
            <p className="text-sm text-muted-foreground">
              Requested by {request.requester} · opened {formatDateTime(request.createdAt)}
            </p>
          </div>
          <Badge variant="outline">{CATEGORY_LABEL[request.category]}</Badge>
        </div>

        <div className="flex flex-wrap items-center gap-x-8 gap-y-3 rounded-lg border p-4">
          <Field label="Priority">
            <PrioritySelect id={request.id} value={request.priority} size="default" />
          </Field>
          <Field label="Status">
            <StatusSelect id={request.id} value={request.status} size="default" />
          </Field>
          <Field label="Owner">
            <OwnerSelect
              id={request.id}
              ownerId={request.ownerId}
              ownerName={request.ownerName}
              currentUser={me}
              users={users}
            />
          </Field>
        </div>
      </div>

      {request.description && (
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{request.description}</p>
      )}

      <div className="grid gap-8 md:grid-cols-2">
        <section className="space-y-3">
          <h2 className="text-sm font-semibold">Notes</h2>
          <AddNoteForm id={request.id} />
          <div className="space-y-3">
            {request.notes.length === 0 ? (
              <p className="text-sm text-muted-foreground">No notes yet.</p>
            ) : (
              request.notes.map((note) => (
                <div key={note.id} className="rounded-lg border p-3 text-sm">
                  <div className="mb-1 flex items-center justify-between gap-2 text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">{note.authorName}</span>
                    <span>{formatDateTime(note.createdAt)}</span>
                  </div>
                  <p className="whitespace-pre-wrap">{note.body}</p>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold">Activity</h2>
          <ol className="space-y-3 border-l pl-4">
            {request.activity.map((event) => (
              <li key={event.id} className="space-y-0.5 text-sm">
                <p>
                  <span className="font-medium">{event.actorName}</span> {activityVerb(event.type)}
                  {event.fromValue && event.toValue ? (
                    <>
                      {" "}
                      from <span className="font-medium">{humanizeValue(event.fromValue)}</span> to{" "}
                      <span className="font-medium">{humanizeValue(event.toValue)}</span>
                    </>
                  ) : null}
                  .
                </p>
                <p className="text-xs text-muted-foreground">{formatDateTime(event.createdAt)}</p>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </div>
  );
}
