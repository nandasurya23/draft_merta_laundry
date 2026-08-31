import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyPin, signSession, setSessionCookie } from '@/lib/auth';
import { LoginSchema } from '@/lib/validation';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validate input
    const validation = LoginSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'PIN is required' },
        { status: 400 }
      );
    }

    const { pin } = validation.data;

    // Fetch all users to find PIN match
    const result = await query(
      'SELECT id, name, pin_hash, failed_attempts, locked_until, created_at FROM users'
    );
    const users = result.rows;

    let matchedUser = null;

    // Try to find user with matching PIN
    for (const user of users) {
      // Check if this user is currently locked
      if (user.locked_until) {
        const now = new Date();
        const lockedUntil = new Date(user.locked_until);
        if (now < lockedUntil) {
          // User is locked, but we can't know if this is the PIN they're trying
          // Return generic error to avoid timing attack
          continue;
        }
        // Lock expired, reset counter
        await query(
          'UPDATE users SET failed_attempts = 0, locked_until = NULL WHERE id = $1',
          [user.id]
        );
      }

      // Check if PIN matches
      const isValid = await verifyPin(pin, user.pin_hash);
      if (isValid) {
        matchedUser = user;
        break;
      }
    }

    // If PIN is wrong
    if (!matchedUser) {
      // Increment failed attempts on ALL users (doesn't matter which is attacked)
      // This prevents timing attacks from revealing which user exists
      for (const user of users) {
        const newFailedAttempts = user.failed_attempts + 1;
        let lockedUntil = user.locked_until;

        if (newFailedAttempts >= 5) {
          // Lock user for 5 minutes
          const now = new Date();
          lockedUntil = new Date(now.getTime() + 5 * 60 * 1000); // 5 minutes from now
        }

        await query(
          'UPDATE users SET failed_attempts = $1, locked_until = $2 WHERE id = $3',
          [newFailedAttempts, lockedUntil, user.id]
        );
      }

      return NextResponse.json(
        { error: 'PIN salah atau expired' },
        { status: 401 }
      );
    }

    // PIN is correct: reset failed attempts
    await query(
      'UPDATE users SET failed_attempts = 0, locked_until = NULL WHERE id = $1',
      [matchedUser.id]
    );

    // Create JWT session
    const token = await signSession({
      userId: matchedUser.id,
      userName: matchedUser.name,
    });

    // Set session cookie
    await setSessionCookie(token);

    return NextResponse.json(
      {
        success: true,
        user: {
          id: matchedUser.id,
          name: matchedUser.name,
          createdAt: matchedUser.created_at,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan' },
      { status: 500 }
    );
  }
}
