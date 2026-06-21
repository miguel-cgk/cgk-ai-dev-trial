"use client";

import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { assignOwner } from "@/lib/requests/actions";

export function AssignButton({ id, isOwner }: { id: string; isOwner: boolean }) {
  const [pending, startTransition] = React.useTransition();

  return (
    <Button
      variant={isOwner ? "outline" : "default"}
      size="sm"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const result = await assignOwner(id, !isOwner);
          if (!result.ok) toast.error(result.error);
          else toast.success(isOwner ? "Unassigned" : "Assigned to you");
        })
      }
    >
      {isOwner ? "Unassign me" : "Assign to me"}
    </Button>
  );
}
