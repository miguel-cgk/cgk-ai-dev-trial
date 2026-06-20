import { prisma } from "@/lib/db";
import type { Category, Priority, Status } from "@prisma/client";

export type RequestFilters = {
  q?: string;
  status?: Status;
  priority?: Priority;
  category?: Category;
};

export function listRequests(filters: RequestFilters = {}) {
  const { q, status, priority, category } = filters;

  return prisma.request.findMany({
    where: {
      status,
      priority,
      category,
      ...(q
        ? {
            OR: [
              { title: { contains: q, mode: "insensitive" } },
              { requester: { contains: q, mode: "insensitive" } },
              { description: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
  });
}

export function getRequest(id: string) {
  return prisma.request.findUnique({
    where: { id },
    include: {
      notes: { orderBy: { createdAt: "asc" } },
      activity: { orderBy: { createdAt: "desc" } },
    },
  });
}
