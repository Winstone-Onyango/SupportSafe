'use client';

/**
 * Client-side auth helpers backed by the Django backend's /auth endpoints
 * (proxied through the Next.js API routes in src/app/api/auth).
 */

// Shape of the user object shared across the app
export interface AuthUser {
  // MongoDB document id as a string
  id: string;
  // Display name
  name: string;
  // Email address (may be empty for username-only accounts)
  email: string;
  // "user" or "admin" — controls access to the dashboard
  role: 'user' | 'admin';
}

// localStorage key holding the signed bearer token
const TOKEN_KEY = 'supportsafe_token';
// localStorage key holding the cached public user profile (JSON string)
const USER_KEY = 'supportsafe_user';

// Persist a fresh session and notify every listening component
export function saveSession(token: string, user: AuthUser): void {
  // Store the token under its key
  localStorage.setItem(TOKEN_KEY, token);
  // Store the serialized user profile under its key
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  // Fire a custom event so Navbar/Header refresh without a page reload
  window.dispatchEvent(new Event('supportsafe-auth-changed'));
}

// Read the bearer token, or null when there is no session
export function getToken(): string | null {
  // During server-side rendering there is no window/localStorage
  if (typeof window === 'undefined') return null;
  // Return whatever token is currently stored
  return localStorage.getItem(TOKEN_KEY);
}

// Read the cached user profile, or null when absent/corrupt
export function getCurrentUser(): AuthUser | null {
  // Guard against SSR where localStorage doesn't exist
  if (typeof window === 'undefined') return null;
  // Read the raw JSON string from storage
  const raw = localStorage.getItem(USER_KEY);
  // No stored profile means "not signed in"
  if (!raw) return null;
  // Parsing can fail if the stored value is malformed — treat that as signed out
  try {
    // Deserialize and return the user object
    return JSON.parse(raw) as AuthUser;
  } catch {
    // Corrupt data — fall back to "not signed in"
    return null;
  }
}

// Clear the session and notify listeners (used by the Sign Out button)
export function logout(): void {
  // Remove the token
  localStorage.removeItem(TOKEN_KEY);
  // Remove the cached profile
  localStorage.removeItem(USER_KEY);
  // Let every listening component know auth state changed
  window.dispatchEvent(new Event('supportsafe-auth-changed'));
}

// Sign in via the Next.js proxy -> Django /auth/login, then persist the session
export async function login(
  username: string,
  password: string
): Promise<AuthUser> {
  // POST credentials to the login proxy route
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  // Parse the JSON response (success or error)
  const data = await res.json();
  // Non-2xx means invalid credentials or a backend problem
  if (!res.ok) {
    // Surface the backend's message (or a generic fallback)
    throw new Error(data.detail || 'Login failed');
  }
  // Persist the returned token + user and notify listeners
  saveSession(data.token, data.user);
  // Hand the user object back to the caller (e.g. for role-based redirects)
  return data.user as AuthUser;
}

// Create a new account via the register proxy and sign the user in
export async function register(
  name: string,
  username: string,
  password: string,
  role: 'user' | 'admin' = 'user'
): Promise<AuthUser> {
  // POST the registration fields to the register proxy route
  const res = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, username, password, role }),
  });
  // Parse the JSON response
  const data = await res.json();
  // 4xx/5xx responses carry a human-readable detail message
  if (!res.ok) {
    // Throw so the calling form can display the reason
    throw new Error(data.detail || 'Registration failed');
  }
  // Auto sign-in: persist the session issued at registration time
  saveSession(data.token, data.user);
  // Return the fresh user profile
  return data.user as AuthUser;
}

// Verify the stored token against the backend (/auth/me); null when invalid
export async function fetchCurrentUser(): Promise<AuthUser | null> {
  // No token means there is nothing to verify
  const token = getToken();
  if (!token) return null;
  // Ask the backend who this token belongs to
  const res = await fetch('/api/auth/me', {
    headers: { Authorization: `Bearer ${token}` },
  });
  // 401 (expired/forged) or any other failure means "not authenticated"
  if (!res.ok) return null;
  // Parse and return the verified profile
  const data = await res.json();
  // Defensive: return null when the payload lacks a user object
  return (data.user as AuthUser) ?? null;
}

