import type { ReactNode } from "react";
import Link from "next/link";
import { SignedIn, SignedOut } from "@clerk/nextjs";
import { ClipboardList, Filter, Sparkles } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-6 py-16">
      <div className="space-y-6">
        <span className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs text-muted-foreground">
          <ClipboardList className="size-3.5" /> Operations Triage
        </span>

        <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
          Triage operational requests without the chaos.
        </h1>

        <p className="text-lg text-muted-foreground">
          Log incoming requests, prioritize and categorize them, and track each one to resolution —
          with a built-in helper that suggests a priority so nothing urgent slips through.
        </p>

        <div className="flex flex-wrap gap-3">
          <SignedOut>
            <Link href="/sign-in" className={buttonVariants({ size: "lg" })}>
              Sign in to start
            </Link>
          </SignedOut>
          <SignedIn>
            <Link href="/dashboard" className={buttonVariants({ size: "lg" })}>
              Go to dashboard
            </Link>
          </SignedIn>
        </div>

        <div className="grid gap-4 pt-8 sm:grid-cols-3">
          <Feature
            icon={<ClipboardList className="size-5" />}
            title="Shared queue"
            description="One place for every request, with requester, owner, and status."
          />
          <Feature
            icon={<Filter className="size-5" />}
            title="Fast filtering"
            description="Search and filter by status, priority, and category."
          />
          <Feature
            icon={<Sparkles className="size-5" />}
            title="Triage helper"
            description="Rule-based suggestions for priority — you stay in control."
          />
        </div>
      </div>
    </main>
  );
}

function Feature({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="space-y-2 rounded-lg border p-4">
      <div className="text-muted-foreground">{icon}</div>
      <h2 className="text-sm font-medium">{title}</h2>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
