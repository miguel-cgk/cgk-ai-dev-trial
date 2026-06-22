"use client";

import * as React from "react";
import { toast } from "sonner";
import type { Priority, Status } from "@prisma/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updatePriority, updateStatus } from "@/lib/requests/actions";
import {
  PRIORITY_LABEL,
  PRIORITY_VALUES,
  STATUS_LABEL,
  STATUS_VALUES,
} from "@/lib/requests/display";

type Size = "sm" | "default";

export function StatusSelect({
  id,
  value,
  size = "sm",
  className,
}: {
  id: string;
  value: Status;
  size?: Size;
  className?: string;
}) {
  const [current, setCurrent] = React.useState<Status>(value);
  const [pending, startTransition] = React.useTransition();

  React.useEffect(() => setCurrent(value), [value]);

  return (
    <Select
      items={STATUS_LABEL}
      value={current}
      onValueChange={(next) => {
        const status = next as Status;
        setCurrent(status);
        startTransition(async () => {
          const result = await updateStatus(id, status);
          if (!result.ok) {
            toast.error(result.error);
            setCurrent(value);
          } else {
            toast.success(`Status → ${STATUS_LABEL[status]}`);
          }
        });
      }}
      disabled={pending}
    >
      <SelectTrigger size={size} className={className} aria-label="Status">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {STATUS_VALUES.map((status) => (
          <SelectItem key={status} value={status}>
            {STATUS_LABEL[status]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function PrioritySelect({
  id,
  value,
  size = "sm",
  className,
}: {
  id: string;
  value: Priority;
  size?: Size;
  className?: string;
}) {
  const [current, setCurrent] = React.useState<Priority>(value);
  const [pending, startTransition] = React.useTransition();

  React.useEffect(() => setCurrent(value), [value]);

  return (
    <Select
      items={PRIORITY_LABEL}
      value={current}
      onValueChange={(next) => {
        const priority = next as Priority;
        setCurrent(priority);
        startTransition(async () => {
          const result = await updatePriority(id, priority);
          if (!result.ok) {
            toast.error(result.error);
            setCurrent(value);
          } else {
            toast.success(`Priority → ${PRIORITY_LABEL[priority]}`);
          }
        });
      }}
      disabled={pending}
    >
      <SelectTrigger size={size} className={className} aria-label="Priority">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {PRIORITY_VALUES.map((priority) => (
          <SelectItem key={priority} value={priority}>
            {PRIORITY_LABEL[priority]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
