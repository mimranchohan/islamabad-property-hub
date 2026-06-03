/**
 * Security helpers — central place for auth checks, input sanitization, rate limits
 */
import "server-only";
import { auth } from "@/auth";
import { NextResponse } from "next/server";

type SessionUser = {
  id?: string;
  role?: string;
  isActive?: boolean;
  isSuperAdmin?: boolean;
};

// ─── Auth Guards ──────────────────────────────────────────────────────────────

import { prisma } from "@/lib/prisma";

const SUPER_ADMIN_EMAIL = "changeyurstyle@gmail.com";

/** Returns session user verified against the database or a 401/403 NextResponse */
export async function requireAuth(): Promise<SessionUser | NextResponse> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch fresh user data from database to prevent session desync
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true, isActive: true, isSuperAdmin: true, email: true },
  });

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Deactivated users cannot access APIs (only super admin email is always exempt)
  if (!user.isActive && user.email !== SUPER_ADMIN_EMAIL) {
    return NextResponse.json({ error: "Forbidden: Account is inactive" }, { status: 403 });
  }

  return {
    id: user.id,
    role: user.role,
    isActive: user.isActive,
    isSuperAdmin: user.isSuperAdmin || user.email === SUPER_ADMIN_EMAIL,
  };
}

/** Requires ADMIN role */
export async function requireAdmin(): Promise<SessionUser | NextResponse> {
  const user = await requireAuth();
  if (user instanceof NextResponse) return user;
  if (user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return user;
}

/** Requires Super Admin */
export async function requireSuperAdmin(): Promise<SessionUser | NextResponse> {
  const user = await requireAdmin();
  if (user instanceof NextResponse) return user;
  if (!user.isSuperAdmin) return NextResponse.json({ error: "Super Admin only" }, { status: 403 });
  return user;
}

// ─── Input Sanitization ───────────────────────────────────────────────────────

/** Strip HTML tags and trim */
export function sanitizeString(value: unknown, maxLen = 500): string {
  if (typeof value !== "string") return "";
  return value
    .replace(/<[^>]*>/g, "")          // strip HTML tags
    .replace(/[<>&"'`]/g, (c) => ({   // escape special chars
      "<": "&lt;", ">": "&gt;",
      "&": "&amp;", '"': "&quot;",
      "'": "&#x27;", "`": "&#x60;",
    }[c] ?? c))
    .trim()
    .slice(0, maxLen);
}

/** Safe integer parse — returns null if invalid */
export function safeInt(value: unknown): number | null {
  const n = parseInt(String(value));
  return isNaN(n) || !isFinite(n) ? null : n;
}

/** Safe float parse — returns null if invalid */
export function safeFloat(value: unknown): number | null {
  const n = parseFloat(String(value));
  return isNaN(n) || !isFinite(n) ? null : n;
}

/** Validate email format */
export function isValidEmail(email: unknown): boolean {
  if (typeof email !== "string") return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) && email.length <= 254;
}

/** Validate password strength */
export function isValidPassword(password: unknown): { ok: boolean; error?: string } {
  if (typeof password !== "string") return { ok: false, error: "Password must be a string" };
  if (password.length < 8) return { ok: false, error: "Password must be at least 8 characters" };
  if (password.length > 128) return { ok: false, error: "Password too long" };
  return { ok: true };
}

// ─── Cron Secret ─────────────────────────────────────────────────────────────

/** Verify Vercel Cron secret header */
export function verifyCronSecret(authHeader: string | null): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return false; // reject if secret not set
  return authHeader === `Bearer ${cronSecret}`;
}

// ─── Security Headers ─────────────────────────────────────────────────────────

export const SECURE_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
  "Referrer-Policy": "strict-origin-when-cross-origin",
};
