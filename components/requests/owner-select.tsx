"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { assignOwner } from "@/lib/requests/actions";
import type { AssignableUser } from "@/lib/users";

const UNASSIGNED = "UNASSIGNED";

type Size = "sm" | "default";

export function OwnerSelect({
  id,
  ownerId,
  ownerName,
  currentUser,
  users,
  size = "default",
  className,
}: {
  id: string;
  ownerId: string | null;
  ownerName: string | null;
  currentUser: { id: string; name: string };
  users: AssignableUser[];
  size?: Size;
  className?: string;
}) {
  const [current, setCurrent] = React.useState<string | null>(ownerId);
  const [pending, startTransition] = React.useTransition();

  React.useEffect(() => setCurrent(ownerId), [ownerId]);

  // Trigger labels. Seed "me" and the current owner so the trigger always shows
  // a name even if the user list is capped or the Clerk fetch failed.
  const items = React.useMemo(() => {
    const map: Record<string, string> = {
      [UNASSIGNED]: "Unassigned",
      [currentUser.id]: currentUser.name,
    };
    for (const user of users) map[user.id] = user.name;
    if (ownerId && ownerName && !map[ownerId]) map[ownerId] = ownerName;
    return map;
  }, [users, currentUser.id, currentUser.name, ownerId, ownerName]);

  const others = users.filter((user) => user.id !== currentUser.id);

  return (
    <Select
      items={items}
      value={current ?? UNASSIGNED}
      onValueChange={(next) => {
        const nextOwnerId = next === UNASSIGNED ? null : (next as string);
        const previous = current;
        setCurrent(nextOwnerId);
        startTransition(async () => {
          const result = await assignOwner(id, nextOwnerId);
          if (!result.ok) {
            toast.error(result.error);
            setCurrent(previous);
          } else {
            toast.success(
              nextOwnerId === null
                ? "Unassigned"
                : `Assigned to ${items[nextOwnerId] ?? "user"}`,
            );
          }
        });
      }}
      disabled={pending}
    >
      <SelectTrigger size={size} className={className} aria-label="Owner">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={UNASSIGNED}>Unassigned</SelectItem>
        <SelectSeparator />
        <SelectItem value={currentUser.id}>Me ({currentUser.name})</SelectItem>
        {others.map((user) => (
          <SelectItem key={user.id} value={user.id}>
            {user.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
