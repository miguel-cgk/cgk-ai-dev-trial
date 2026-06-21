import type { Category, Priority, Status } from "@prisma/client";
import { CATEGORY_VALUES, PRIORITY_VALUES, STATUS_VALUES } from "./display";
import type { RequestFilters } from "./queries";

type SearchParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export function parseFilters(searchParams: SearchParams): RequestFilters {
  const q = first(searchParams.q)?.trim() || undefined;
  const statusRaw = first(searchParams.status);
  const priorityRaw = first(searchParams.priority);
  const categoryRaw = first(searchParams.category);

  return {
    q,
    status: STATUS_VALUES.includes(statusRaw as Status) ? (statusRaw as Status) : undefined,
    priority: PRIORITY_VALUES.includes(priorityRaw as Priority) ? (priorityRaw as Priority) : undefined,
    category: CATEGORY_VALUES.includes(categoryRaw as Category) ? (categoryRaw as Category) : undefined,
  };
}

export function hasActiveFilters(filters: RequestFilters): boolean {
  return Boolean(filters.q || filters.status || filters.priority || filters.category);
}
