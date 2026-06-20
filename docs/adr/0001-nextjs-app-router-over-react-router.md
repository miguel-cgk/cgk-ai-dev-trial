# Use Next.js App Router (over React Router v7) on Vercel

For a 2–3 hour take-home deploying to Vercel with Clerk auth, we chose Next.js App Router even though the author is more fluent in React Router v7 framework mode. Next.js is the most-paved Clerk + Vercel path — a mature `@clerk/nextjs` SDK and zero-config deploy — which de-risks the binary Deployment criterion. React Router v7's younger `@vercel/react-router` preset and Clerk SDK concentrated too much risk in the one place we cannot afford to fail.
