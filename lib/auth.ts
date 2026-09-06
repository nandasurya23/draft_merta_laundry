import { SignJWT, jwtVerify, JWTPayload } from 'jose';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';

const SESSION_COOKIE_NAME = 'session';
const SESSION_EXPIRY = 12 * 60 * 60 * 1000; // 12 hours

if (process.env.NODE_ENV === 'production' && !process.env.SESSION_SECRET) {
  console.warn('⚠️ CRITICAL SECURITY WARNING: SESSION_SECRET is not set in production! Please configure it in your environment variables.');
}

const key = new TextEncoder().encode(
  process.env.SESSION_SECRET || 'default-dev-secret-change-in-production'
);

export interface SessionPayload extends JWTPayload {
  userId: string;
  userName: string;
  role: 'OWNER' | 'KARYAWAN';
}

export async function hashPin(pin: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(pin, salt);
}

export async function verifyPin(pin: string, hash: string): Promise<boolean> {
  return bcrypt.compare(pin, hash);
}

export async function signSession(payload: SessionPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('12h')
    .sign(key);
}

export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const verified = await jwtVerify(token, key);
    return verified.payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_EXPIRY / 1000, // seconds
  });
}

export async function getSessionCookie(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE_NAME)?.value ?? null;
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function getCurrentSession(): Promise<SessionPayload | null> {
  const token = await getSessionCookie();
  if (!token) return null;
  return verifySession(token);
}
