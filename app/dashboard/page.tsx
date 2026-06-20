import { listRequests } from "@/lib/requests/queries";

export default async function DashboardPage() {
  const requests = await listRequests({});

  return (
    <section>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "1rem" }}>
        Request queue
      </h1>

      {requests.length === 0 ? (
        <p style={{ opacity: 0.7 }}>
          No requests yet. The full queue UI (table, filters, search, create) arrives in Phase 1.
        </p>
      ) : (
        <ul style={{ display: "grid", gap: "0.5rem", listStyle: "none", padding: 0 }}>
          {requests.map((r) => (
            <li key={r.id} style={{ padding: "0.75rem", border: "1px solid rgba(0,0,0,0.1)", borderRadius: 8 }}>
              <strong>{r.title}</strong> — {r.status} / {r.priority} · {r.category}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
