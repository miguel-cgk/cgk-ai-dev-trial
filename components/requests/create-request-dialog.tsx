"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Sparkles } from "lucide-react";
import type { Category, Priority } from "@prisma/client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createRequest } from "@/lib/requests/actions";
import {
  CATEGORY_LABEL,
  CATEGORY_VALUES,
  PRIORITY_BADGE,
  PRIORITY_LABEL,
  PRIORITY_VALUES,
} from "@/lib/requests/display";
import { suggestTriage } from "@/lib/triage/rules";

export function CreateRequestDialog() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [pending, startTransition] = React.useTransition();

  const [title, setTitle] = React.useState("");
  const [requester, setRequester] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [category, setCategory] = React.useState<Category>("OTHER");
  const [priority, setPriority] = React.useState<Priority>("MEDIUM");

  const suggestion = React.useMemo(() => {
    if (title.trim().length < 3) return null;
    return suggestTriage({ title, description });
  }, [title, description]);

  function reset() {
    setTitle("");
    setRequester("");
    setDescription("");
    setCategory("OTHER");
    setPriority("MEDIUM");
  }

  function submit() {
    startTransition(async () => {
      const result = await createRequest({
        title,
        requester,
        description: description || undefined,
        category,
        priority,
      });
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success("Request created");
      setOpen(false);
      reset();
      router.push(`/dashboard/requests/${result.id}`);
    });
  }

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        <Plus />
        New request
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>New request</DialogTitle>
            <DialogDescription>
              Log an incoming operational request. The triage helper suggests a priority.
            </DialogDescription>
          </DialogHeader>

          <form
            className="grid gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
          >
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Short summary of the request"
                autoFocus
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="requester">Requester</Label>
              <Input
                id="requester"
                value={requester}
                onChange={(e) => setRequester(e.target.value)}
                placeholder="Who needs this? (name or email)"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Any details that help triage"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label>Category</Label>
                <Select value={category} onValueChange={(v) => setCategory(v as Category)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORY_VALUES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {CATEGORY_LABEL[c]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label>Priority</Label>
                <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITY_VALUES.map((p) => (
                      <SelectItem key={p} value={p}>
                        {PRIORITY_LABEL[p]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {suggestion && (
              <div className="rounded-lg border bg-muted/40 p-3 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 font-medium">
                    <Sparkles className="size-4 text-muted-foreground" />
                    Triage suggestion
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Badge variant="outline">{CATEGORY_LABEL[suggestion.category]}</Badge>
                    <Badge variant={PRIORITY_BADGE[suggestion.priority]}>
                      {PRIORITY_LABEL[suggestion.priority]}
                    </Badge>
                  </div>
                </div>
                <ul className="mt-2 list-disc space-y-0.5 pl-5 text-xs text-muted-foreground">
                  {suggestion.reasons.map((reason, i) => (
                    <li key={i}>{reason}</li>
                  ))}
                </ul>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => {
                    setCategory(suggestion.category);
                    setPriority(suggestion.priority);
                  }}
                >
                  Apply suggestion
                </Button>
              </div>
            )}

            <DialogFooter>
              <Button type="submit" disabled={pending || !title.trim() || !requester.trim()}>
                {pending ? "Creating…" : "Create request"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
