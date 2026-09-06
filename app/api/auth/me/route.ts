import { NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const session = await getCurrentSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fetch user details from DB to get current info
    const result = await query(
      'SELECT id, name, role, created_at FROM users WHERE id = $1',
      [session.userId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const user = result.rows[0];

    return NextResponse.json(
      {
        user: {
          id: user.id,
          name: user.name,
          role: user.role || 'KARYAWAN',
          createdAt: user.created_at,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get me error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan' },
      { status: 500 }
    );
  }
}
