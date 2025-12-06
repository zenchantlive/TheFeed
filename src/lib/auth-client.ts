import { createAuthClient } from "better-auth/react"

// Dynamically determine base URL for Better Auth
// In production (Vercel), use the current origin
// In development, use localhost
const getBaseURL = () => {
  // Server-side: use env var or fallback
  if (typeof window === "undefined") {
    return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  }

  // Client-side: use current origin (handles all Vercel deployments)
  // This ensures production uses https://thefeed-phi.vercel.app
  // and preview deployments use their respective URLs
  return window.location.origin;
};

export const authClient = createAuthClient({
  baseURL: getBaseURL(),
})

export const {
  signIn,
  signOut,
  signUp,
  useSession,
  getSession,
} = authClient