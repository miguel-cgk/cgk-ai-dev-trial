import Link from "next/link";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";

export default function LandingPage() {
  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "5rem 1.5rem" }}>
      <h1 style={{ fontSize: "2.25rem", fontWeight: 700, letterSpacing: "-0.02em" }}>
        Operations Triage
      </h1>
      <p style={{ marginTop: "1rem", fontSize: "1.125rem", opacity: 0.8, lineHeight: 1.6 }}>
        Log incoming operational requests, triage them by priority and category,
        and track each one to resolution — with a built-in helper that suggests a
        priority so nothing urgent slips through.
      </p>

      <div style={{ marginTop: "2.5rem", display: "flex", gap: "1rem", alignItems: "center" }}>
        <SignedOut>
          <SignInButton mode="modal">
            <button
              style={{
                padding: "0.6rem 1.25rem",
                borderRadius: 8,
                border: "none",
                background: "#0a0a0a",
                color: "#fff",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Sign in
            </button>
          </SignInButton>
        </SignedOut>

        <SignedIn>
          <Link
            href="/dashboard"
            style={{
              padding: "0.6rem 1.25rem",
              borderRadius: 8,
              background: "#0a0a0a",
              color: "#fff",
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            Go to dashboard
          </Link>
          <UserButton />
        </SignedIn>
      </div>
    </main>
  );
}
