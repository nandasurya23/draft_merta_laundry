import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyPin, signSession, setSessionCookie } from '@/lib/auth';
import { LoginSchema } from '@/lib/validation';

interface RateLimitRecord {
  attempts: number;
  lockedUntil: number;
}

const rateLimitMap = new Map<string, RateLimitRecord>();

function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return '127.0.0.1';
}

function checkRateLimit(ip: string): { allowed: boolean; waitMinutes?: number } {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (record && record.lockedUntil > now) {
    const waitMinutes = Math.ceil((record.lockedUntil - now) / 60000);
    return { allowed: false, waitMinutes };
  }

  return { allowed: true };
}

function recordFailedAttempt(ip: string) {
  const now = Date.now();
  const record = rateLimitMap.get(ip) || { attempts: 0, lockedUntil: 0 };

  if (record.lockedUntil > 0 && record.lockedUntil <= now) {
    record.attempts = 0;
    record.lockedUntil = 0;
  }

  record.attempts += 1;
  if (record.attempts >= 5) {
    record.lockedUntil = now + 5 * 60 * 1000; // Lock for 5 minutes
    record.attempts = 0;
  }

  rateLimitMap.set(ip, record);

  // Periodic cleanup if map grows
  if (rateLimitMap.size > 1000) {
    for (const [key, val] of rateLimitMap.entries()) {
      if (val.lockedUntil < now && now - val.lockedUntil > 600000) {
        rateLimitMap.delete(key);
      }
    }
  }
}

function resetRateLimit(ip: string) {
  rateLimitMap.delete(ip);
}

export async function POST(req: NextRequest) {
  try {
    const clientIp = getClientIp(req);
    const rateCheck = checkRateLimit(clientIp);

    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: `Terlalu banyak percobaan PIN. Silakan coba lagi dalam ${rateCheck.waitMinutes} menit.` },
        { status: 429 }
      );
    }

    const body = await req.json();

    // Validate input
    const validation = LoginSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'PIN wajib diisi' },
        { status: 400 }
      );
    }

    const { pin } = validation.data;

    // Fetch all users to find PIN match
    const result = await query(
      'SELECT id, name, pin_hash, role, created_at FROM users'
    );
    const users = result.rows;

    let matchedUser = null;

    // Try to find user with matching PIN
    for (const user of users) {
      const isValid = await verifyPin(pin, user.pin_hash);
      if (isValid) {
        matchedUser = user;
        break;
      }
    }

    // If PIN is wrong
    if (!matchedUser) {
      recordFailedAttempt(clientIp);
      return NextResponse.json(
        { error: 'PIN salah atau tidak ditemukan' },
        { status: 401 }
      );
    }

    // Reset rate limit on success
    resetRateLimit(clientIp);

    const userRole: 'OWNER' | 'KARYAWAN' = matchedUser.role === 'OWNER' ? 'OWNER' : 'KARYAWAN';

    // Create JWT session
    const token = await signSession({
      userId: matchedUser.id,
      userName: matchedUser.name,
      role: userRole,
    });

    // Set session cookie
    await setSessionCookie(token);

    return NextResponse.json(
      {
        success: true,
        user: {
          id: matchedUser.id,
          name: matchedUser.name,
          role: userRole,
          createdAt: matchedUser.created_at,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}
