import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getCurrentSession, hashPin, verifyPin } from '@/lib/auth';
import { CreateUserSchema } from '@/lib/validation';

export async function GET() {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.role !== 'OWNER') {
      return NextResponse.json(
        { error: 'Hanya Owner yang berhak melihat daftar akun karyawan.' },
        { status: 403 }
      );
    }

    const result = await query(
      'SELECT id, name, role, created_at FROM users ORDER BY created_at ASC'
    );

    return NextResponse.json({ data: result.rows }, { status: 200 });
  } catch (error) {
    console.error('Get users error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan pada server' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.role !== 'OWNER') {
      return NextResponse.json(
        { error: 'Hanya Owner yang berhak menambah akun karyawan.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const validation = CreateUserSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0]?.message || 'Data karyawan tidak valid' },
        { status: 400 }
      );
    }

    const { name, pin } = validation.data;

    // Check PIN uniqueness against all existing users
    const allUsers = await query('SELECT id, pin_hash FROM users');
    for (const u of allUsers.rows) {
      const isMatch = await verifyPin(pin, u.pin_hash);
      if (isMatch) {
        return NextResponse.json(
          { error: 'PIN ini sudah digunakan oleh akun lain. Gunakan 4 digit PIN yang berbeda.' },
          { status: 400 }
        );
      }
    }

    const pinHash = await hashPin(pin);
    const result = await query(
      'INSERT INTO users (name, pin_hash, role) VALUES ($1, $2, \'KARYAWAN\') RETURNING id, name, role, created_at',
      [name, pinHash]
    );

    return NextResponse.json(
      { data: result.rows[0], message: 'Karyawan berhasil ditambahkan' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create user error:', error);
    return NextResponse.json({ error: 'Gagal menambahkan karyawan' }, { status: 500 });
  }
}
