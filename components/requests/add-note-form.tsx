"use client";

import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { addNote } from "@/lib/requests/actions";

export function AddNoteForm({ id }: { id: string }) {
  const [body, setBody] = React.useState("");
  const [pending, startTransition] = React.useTransition();

  return (
    <form
      className="space-y-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (!body.trim()) return;
        startTransition(async () => {
          const result = await addNote(id, body);
          if (!result.ok) {
            toast.error(result.error);
          } else {
            setBody("");
            toast.success("Note added");
          }
        });
      }}
    >
      <Textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Add a note…"
        rows={3}
        aria-label="New note"
      />
      <div className="flex justify-end">
        <Button type="submit" size="sm" disabled={pending || !body.trim()}>
          {pending ? "Adding…" : "Add note"}
        </Button>
      </div>
    </form>
  );
}
