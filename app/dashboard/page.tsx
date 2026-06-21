import Link from "next/link";
import { Inbox } from "lucide-react";

import { listRequests } from "@/lib/requests/queries";
import { hasActiveFilters, parseFilters } from "@/lib/requests/filters";
import { QueueToolbar } from "@/components/requests/queue-toolbar";
import { PrioritySelect, StatusSelect } from "@/components/requests/field-selects";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CATEGORY_LABEL, formatDate } from "@/lib/requests/display";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const filters = parseFilters(await searchParams);
  const requests = await listRequests(filters);
  const active = hasActiveFilters(filters);

  return (
    <section className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Request queue</h1>
        <p className="text-sm text-muted-foreground">
          {requests.length} {requests.length === 1 ? "request" : "requests"}
          {active ? " matching filters" : ""}
        </p>
      </div>

      <QueueToolbar />

      {requests.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed py-16 text-center">
          <Inbox className="size-8 text-muted-foreground" />
          <p className="font-medium">{active ? "No matching requests" : "No requests yet"}</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            {active
              ? "Try clearing a filter or adjusting your search."
              : "Create the first request to start triaging."}
          </p>
        </div>
      ) : (
        <>
          <div className="hidden overflow-hidden rounded-lg border md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Requester</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="font-medium">
                      <Link href={`/dashboard/requests/${request.id}`} className="hover:underline">
                        {request.title}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{request.requester}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{CATEGORY_LABEL[request.category]}</Badge>
                    </TableCell>
                    <TableCell>
                      <PrioritySelect id={request.id} value={request.priority} />
                    </TableCell>
                    <TableCell>
                      <StatusSelect id={request.id} value={request.status} />
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {request.ownerName ?? "—"}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {formatDate(request.createdAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="grid gap-3 md:hidden">
            {requests.map((request) => (
              <div key={request.id} className="space-y-3 rounded-lg border p-3">
                <div className="flex items-start justify-between gap-2">
                  <Link
                    href={`/dashboard/requests/${request.id}`}
                    className="font-medium hover:underline"
                  >
                    {request.title}
                  </Link>
                  <Badge variant="outline">{CATEGORY_LABEL[request.category]}</Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  {request.requester} · {formatDate(request.createdAt)}
                  {request.ownerName ? ` · ${request.ownerName}` : ""}
                </div>
                <div className="flex gap-2">
                  <PrioritySelect id={request.id} value={request.priority} />
                  <StatusSelect id={request.id} value={request.status} />
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
