import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const SECRET_KEY = new TextEncoder().encode(
  process.env.JWT_SECRET || "gdgu-super-secret-jwt-key-2026-production-ready"
);

export type UserRole = "STUDENT" | "FACULTY" | "ADMIN" | "SPOC";

export interface SessionPayload {
  role: UserRole;
  id: string; // studentId, facultyId, adminId, or spocId
  email: string;
  name: string;
  enrollmentNumber?: string;
  isAdmin?: boolean;
  isSpoc?: boolean;
  spocDepartment?: string | null;
  department?: string;
}

const COOKIE_NAME = "gdgu_portal_session";

export async function signSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(SECRET_KEY);
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    return payload as unknown as SessionPayload;
  } catch (err) {
    return null;
  }
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export function setSessionCookie(response: NextResponse, token: string) {
  response.cookies.set({
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24, // 24 hours
  });
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set({
    name: COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}
