import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { requireUser } from "@/lib/auth";

export default async function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await requireUser();

  return (
    <div>
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "1rem 1.5rem",
          borderBottom: "1px solid rgba(0,0,0,0.1)",
        }}
      >
        <Link href="/dashboard" style={{ fontWeight: 600, textDecoration: "none", color: "inherit" }}>
          Operations Triage
        </Link>
        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          <span style={{ opacity: 0.7, fontSize: "0.9rem" }}>{user.name}</span>
          <UserButton />
        </div>
      </header>
      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "1.5rem" }}>{children}</main>
    </div>
  );
}
