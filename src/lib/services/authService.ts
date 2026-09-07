/**
 * Authentication service contract.
 *
 * There is no authentication backend in this project, and there cannot be one
 * in a static front end: sessions, password hashing and token issuing all
 * require a server you control.
 *
 * So this follows the same pattern as `pdfService.ts` — the UI is real, the
 * validation is real, and the actual credential check is delegated. Until
 * `NEXT_PUBLIC_AUTH_API_URL` points at a real service, every call fails with a
 * clear message instead of pretending someone signed in.
 *
 * ---------------------------------------------------------------------------
 * IF YOU ARE BUILDING THIS FOR REAL, READ THIS FIRST
 * ---------------------------------------------------------------------------
 * Do not implement your own authentication backend against this interface
 * unless you know what you are doing. Password storage, session rotation,
 * timing-safe comparison, rate limiting and account recovery are all easy to
 * get subtly wrong, and the failure mode is everyone's credentials.
 *
 * Use an established provider instead. Any of these replace this file entirely:
 *
 *   - Auth.js (next-auth)  — open source, runs in your own Next.js app
 *   - Clerk                — hosted, fastest to integrate
 *   - Supabase Auth        — hosted, includes a database
 *   - WorkOS               — if you need SSO for the Business plan
 *
 * ---------------------------------------------------------------------------
 * SESSION HANDLING
 * ---------------------------------------------------------------------------
 * If you do connect a backend: the session token must be set by the server as
 * an httpOnly, Secure, SameSite=Lax cookie. Never store a session token in
 * localStorage or sessionStorage — any script on the page can read it, which
 * turns a single XSS bug into full account takeover. That is why nothing in
 * this file touches browser storage, and `credentials: "include"` is set so the
 * browser handles the cookie itself.
 */

export const AUTH_ENDPOINT = process.env.NEXT_PUBLIC_AUTH_API_URL ?? "";

export function isAuthConfigured(): boolean {
  return AUTH_ENDPOINT.length > 0;
}

export class AuthUnavailableError extends Error {
  constructor() {
    super("Accounts are not available in this build — no authentication service is connected.");
    this.name = "AuthUnavailableError";
  }
}

/** A failed sign-in attempt, safe to show to the person. */
export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthError";
  }
}

export type SessionUser = {
  id: string;
  email: string;
  name?: string;
  plan?: "free" | "pro" | "business";
};

type Credentials = { email: string; password: string; name?: string };

async function post(path: string, body: Record<string, string>): Promise<SessionUser> {
  if (!isAuthConfigured()) throw new AuthUnavailableError();

  const response = await fetch(`${AUTH_ENDPOINT.replace(/\/$/, "")}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    // The server sets an httpOnly session cookie; the browser stores it.
    credentials: "include",
    body: JSON.stringify(body),
  });

  if (response.status === 401 || response.status === 403) {
    // Deliberately vague: saying "no such email" tells an attacker which
    // addresses are registered.
    throw new AuthError("That email and password combination is not correct.");
  }

  if (response.status === 429) {
    throw new AuthError("Too many attempts. Wait a few minutes and try again.");
  }

  if (!response.ok) {
    throw new AuthError("We could not reach the account service. Please try again.");
  }

  return (await response.json()) as SessionUser;
}

export async function signIn({ email, password }: Credentials): Promise<SessionUser> {
  return post("/sign-in", { email, password });
}

export async function signUp({ email, password, name }: Credentials): Promise<SessionUser> {
  return post("/sign-up", { email, password, name: name ?? "" });
}

export async function signOut(): Promise<void> {
  if (!isAuthConfigured()) return;
  await fetch(`${AUTH_ENDPOINT.replace(/\/$/, "")}/sign-out`, {
    method: "POST",
    credentials: "include",
  });
}

export async function getSession(): Promise<SessionUser | null> {
  if (!isAuthConfigured()) return null;
  try {
    const response = await fetch(`${AUTH_ENDPOINT.replace(/\/$/, "")}/session`, {
      credentials: "include",
    });
    if (!response.ok) return null;
    return (await response.json()) as SessionUser;
  } catch {
    return null;
  }
}

/**
 * Password rules. Length is what actually matters — composition rules push
 * people towards predictable substitutions like "Passw0rd!".
 */
export function checkPassword(password: string): string | null {
  if (password.length < 10) return "Use at least 10 characters.";
  if (password.length > 200) return "That password is too long.";
  if (/^\d+$/.test(password)) return "Use more than just numbers.";
  const common = ["password", "12345678", "qwerty", "letmein", "pdfflow"];
  if (common.some((entry) => password.toLowerCase().includes(entry))) {
    return "That password is too easy to guess.";
  }
  return null;
}

export function checkEmail(email: string): string | null {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) {
    return "Enter a valid email address.";
  }
  return null;
}
