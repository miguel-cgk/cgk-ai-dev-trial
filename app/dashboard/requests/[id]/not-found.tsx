import Link from "next/link";

export default function RequestNotFound() {
  return (
    <div className="space-y-3 py-16 text-center">
      <p className="font-medium">Request not found</p>
      <p className="text-sm text-muted-foreground">
        It may have been removed, or the link is incorrect.
      </p>
      <Link href="/dashboard" className="inline-block text-sm hover:underline">
        ← Back to queue
      </Link>
    </div>
  );
}
