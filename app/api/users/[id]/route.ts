import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getCurrentSession, hashPin, verifyPin } from '@/lib/auth';
import { UpdateUserSchema } from '@/lib/validation';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.role !== 'OWNER') {
      return NextResponse.json(
        { error: 'Hanya Owner yang berhak mengubah data karyawan.' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await req.json();
    const validation = UpdateUserSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0]?.message || 'Data tidak valid' },
        { status: 400 }
      );
    }

    const { name, pin } = validation.data;

    if (!name && !pin) {
      return NextResponse.json({ error: 'Tidak ada perubahan data' }, { status: 400 });
    }

    // If PIN is being updated, check PIN uniqueness against other users
    let pinHash: string | undefined = undefined;
    if (pin) {
      const otherUsers = await query('SELECT id, pin_hash FROM users WHERE id != $1', [id]);
      for (const u of otherUsers.rows) {
        const isMatch = await verifyPin(pin, u.pin_hash);
        if (isMatch) {
          return NextResponse.json(
            { error: 'PIN ini sudah digunakan oleh akun lain. Gunakan 4 digit PIN yang berbeda.' },
            { status: 400 }
          );
        }
      }
      pinHash = await hashPin(pin);
    }

    const updates: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      values.push(name);
    }

    if (pinHash !== undefined) {
      updates.push(`pin_hash = $${paramIndex++}`);
      values.push(pinHash);
    }

    values.push(id);

    const result = await query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING id, name, role, created_at`,
      values
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Karyawan tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json(
      { data: result.rows[0], message: 'Data karyawan berhasil diperbarui' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json({ error: 'Gagal memperbarui data karyawan' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.role !== 'OWNER') {
      return NextResponse.json(
        { error: 'Hanya Owner yang berhak menghapus akun karyawan.' },
        { status: 403 }
      );
    }

    const { id } = await params;

    // Prevent deleting oneself
    if (session.userId === id) {
      return NextResponse.json(
        { error: 'Tidak dapat menghapus akun Anda sendiri yang sedang aktif digunakan.' },
        { status: 400 }
      );
    }

    // Prevent deleting the last remaining user
    const countResult = await query('SELECT COUNT(*) as count FROM users');
    const totalUsers = parseInt(countResult.rows[0].count);
    if (totalUsers <= 1) {
      return NextResponse.json(
        { error: 'Tidak dapat menghapus karyawan terakhir dalam sistem.' },
        { status: 400 }
      );
    }

    const result = await query(
      'DELETE FROM users WHERE id = $1 RETURNING id, name',
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Karyawan tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json(
      { success: true, message: `Akun ${result.rows[0].name} berhasil dihapus` },
      { status: 200 }
    );
  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json({ error: 'Gagal menghapus karyawan' }, { status: 500 });
  }
}
