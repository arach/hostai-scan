import { cookies } from "next/headers";

// Cookie name for admin auth
const ADMIN_AUTH_COOKIE = "gethostai_admin_auth";

// Cookie max age: 7 days
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7;

/**
 * Gets the admin password from environment
 * Returns null if not configured (auth disabled)
 */
export function getAdminPassword(): string | null {
  return process.env.ADMIN_PASSWORD || null;
}

/**
 * Checks if admin auth is enabled
 */
export function isAdminAuthEnabled(): boolean {
  return !!getAdminPassword();
}

/**
 * Generates a simple auth token from the password
 * In production, consider using a proper JWT or signed token
 */
function generateAuthToken(password: string): string {
  // Simple hash - for MVP this is sufficient
  // The token is just base64(timestamp:hash)
  const timestamp = Date.now();
  const hash = Buffer.from(`${password}:${timestamp}`).toString("base64");
  return `${timestamp}:${hash}`;
}

/**
 * Validates an auth token
 */
function validateAuthToken(token: string, password: string): boolean {
  try {
    const [timestampStr, hash] = token.split(":");
    const timestamp = parseInt(timestampStr, 10);

    // Token expires after COOKIE_MAX_AGE
    if (Date.now() - timestamp > COOKIE_MAX_AGE * 1000) {
      return false;
    }

    // Verify hash matches
    const expectedHash = Buffer.from(`${password}:${timestamp}`).toString("base64");
    return hash === expectedHash;
  } catch {
    return false;
  }
}

/**
 * Checks if the current request is authenticated
 * For use in Server Components
 */
export async function isAdminAuthenticated(): Promise<boolean> {
  const password = getAdminPassword();

  // If no password configured, auth is disabled (allow access)
  if (!password) {
    return true;
  }

  const cookieStore = await cookies();
  const authCookie = cookieStore.get(ADMIN_AUTH_COOKIE);

  if (!authCookie?.value) {
    return false;
  }

  return validateAuthToken(authCookie.value, password);
}

/**
 * Verifies a password attempt and returns auth result
 */
export function verifyAdminPassword(attempt: string): {
  success: boolean;
  token?: string;
} {
  const password = getAdminPassword();

  if (!password) {
    return { success: true };
  }

  if (attempt === password) {
    return {
      success: true,
      token: generateAuthToken(password),
    };
  }

  return { success: false };
}

/**
 * Sets the admin auth cookie
 */
export async function setAdminAuthCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_AUTH_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });
}

/**
 * Clears the admin auth cookie (logout)
 */
export async function clearAdminAuthCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_AUTH_COOKIE);
}

/**
 * Cookie name export for client-side use
 */
export const ADMIN_COOKIE_NAME = ADMIN_AUTH_COOKIE;
