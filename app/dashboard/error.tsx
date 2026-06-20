"use client";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div style={{ padding: "2rem 0" }}>
      <h2 style={{ fontWeight: 600 }}>Something went wrong</h2>
      <p style={{ opacity: 0.7, marginTop: "0.5rem" }}>{error.message}</p>
      <button
        onClick={() => reset()}
        style={{ marginTop: "1rem", padding: "0.5rem 1rem", borderRadius: 8, cursor: "pointer" }}
      >
        Try again
      </button>
    </div>
  );
}
