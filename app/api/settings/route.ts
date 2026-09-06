import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getCurrentSession } from '@/lib/auth';
import { UpdateSettingsSchema } from '@/lib/validation';

export async function GET() {
  try {
    const result = await query('SELECT * FROM settings WHERE id = 1');

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Settings not found' }, { status: 404 });
    }

    const settings = result.rows[0];

    return NextResponse.json(
      { data: settings },
      {
        headers: {
          'Cache-Control': 'private, max-age=60, stale-while-revalidate=300',
        },
      }
    );
  } catch (error) {
    console.error('Get settings error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.role !== 'OWNER') {
      return NextResponse.json(
        { error: 'Hanya Owner yang memiliki izin untuk mengubah pengaturan laundry.' },
        { status: 403 }
      );
    }

    const body = await req.json();

    const validation = UpdateSettingsSchema.safeParse(body);
    if (!validation.success) {
      console.error('Settings validation error:', validation.error);
      return NextResponse.json(
        { error: 'Data yang dikirim tidak valid. Periksa kembali pengaturan Anda.' },
        { status: 400 }
      );
    }

    const { laundryName, address, phone, kiloanPrices, satuanPrices } = validation.data;

    const result = await query(
      `UPDATE settings SET 
        laundry_name = COALESCE($1, laundry_name),
        address = COALESCE($2, address),
        phone = COALESCE($3, phone),
        kiloan_prices = COALESCE($4, kiloan_prices),
        satuan_prices = COALESCE($5, satuan_prices),
        updated_at = CURRENT_TIMESTAMP
       WHERE id = 1
       RETURNING *`,
      [
        laundryName || null,
        address || null,
        phone || null,
        kiloanPrices ? JSON.stringify(kiloanPrices) : null,
        satuanPrices ? JSON.stringify(satuanPrices) : null,
      ]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Settings not found' }, { status: 404 });
    }

    const settings = result.rows[0];

    return NextResponse.json({ data: settings });
  } catch (error) {
    console.error('Update settings error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan' }, { status: 500 });
  }
}
