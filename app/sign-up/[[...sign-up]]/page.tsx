import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <main style={{ display: "grid", placeItems: "center", minHeight: "100vh", padding: "1.5rem" }}>
      <SignUp />
    </main>
  );
}
