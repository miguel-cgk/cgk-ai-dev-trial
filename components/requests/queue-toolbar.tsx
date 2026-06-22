"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CreateRequestDialog } from "./create-request-dialog";
import {
  CATEGORY_FILTER_LABEL,
  CATEGORY_LABEL,
  CATEGORY_VALUES,
  PRIORITY_FILTER_LABEL,
  PRIORITY_LABEL,
  PRIORITY_VALUES,
  STATUS_FILTER_LABEL,
  STATUS_LABEL,
  STATUS_VALUES,
} from "@/lib/requests/display";

const ALL = "ALL";

function normalizeFilter<T extends string>(value: string | null, allowed: readonly T[]): string {
  return value && (allowed as readonly string[]).includes(value) ? value : ALL;
}

export function QueueToolbar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = React.useTransition();

  const urlQ = searchParams.get("q") ?? "";
  const [q, setQ] = React.useState(urlQ);
  const lastPushedRef = React.useRef(urlQ);

  const setParam = React.useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value === null || value === "") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
      const query = params.toString();
      startTransition(() => router.push(query ? `${pathname}?${query}` : pathname, { scroll: false }));
    },
    [pathname, router, searchParams],
  );

  // Re-sync the input when the URL `q` changes externally (back/forward, link nav),
  // ignoring the URL updates this component itself pushed.
  React.useEffect(() => {
    if (urlQ !== lastPushedRef.current) {
      lastPushedRef.current = urlQ;
      setQ(urlQ);
    }
  }, [urlQ]);

  React.useEffect(() => {
    if (q === urlQ) return;
    const timer = setTimeout(() => {
      lastPushedRef.current = q;
      setParam("q", q || null);
    }, 300);
    return () => clearTimeout(timer);
  }, [q, urlQ, setParam]);

  const status = normalizeFilter(searchParams.get("status"), STATUS_VALUES);
  const priority = normalizeFilter(searchParams.get("priority"), PRIORITY_VALUES);
  const category = normalizeFilter(searchParams.get("category"), CATEGORY_VALUES);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative sm:max-w-xs sm:flex-1">
          <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search title, requester…"
            className="pl-8"
            aria-label="Search requests"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <Select items={STATUS_FILTER_LABEL} value={status} onValueChange={(v) => setParam("status", v === ALL ? null : String(v))}>
            <SelectTrigger aria-label="Filter by status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All statuses</SelectItem>
              {STATUS_VALUES.map((s) => (
                <SelectItem key={s} value={s}>
                  {STATUS_LABEL[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select items={PRIORITY_FILTER_LABEL} value={priority} onValueChange={(v) => setParam("priority", v === ALL ? null : String(v))}>
            <SelectTrigger aria-label="Filter by priority">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All priorities</SelectItem>
              {PRIORITY_VALUES.map((p) => (
                <SelectItem key={p} value={p}>
                  {PRIORITY_LABEL[p]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select items={CATEGORY_FILTER_LABEL} value={category} onValueChange={(v) => setParam("category", v === ALL ? null : String(v))}>
            <SelectTrigger aria-label="Filter by category">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All categories</SelectItem>
              {CATEGORY_VALUES.map((c) => (
                <SelectItem key={c} value={c}>
                  {CATEGORY_LABEL[c]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <CreateRequestDialog />
    </div>
  );
}
