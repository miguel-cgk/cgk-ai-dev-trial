# Use Clerk for authentication

Authentication is a gated 20% of the evaluation, so we chose Clerk over a hand-rolled Auth.js setup to satisfy every requirement (server-side route protection, signed-out/loading/error states, safe secret handling, an easy reviewer sign-in) with minimal time — freeing hours for product and code-quality polish. The tradeoff is a third-party SaaS dependency and two environment keys, accepted because the alternative (Auth.js + OAuth) would spend scarce time on wiring and production-callback footguns without improving the score.
