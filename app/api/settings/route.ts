import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { UpdateSettingsSchema } from '@/lib/validation';

export async function GET(req: NextRequest) {
  try {
    const result = await query('SELECT * FROM settings WHERE id = 1');

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Settings not found' }, { status: 404 });
    }

    const settings = result.rows[0];

    return NextResponse.json({
      data: {
        ...settings,
        kiloan_prices: settings.kiloan_prices ? JSON.parse(settings.kiloan_prices) : [],
        satuan_prices: settings.satuan_prices ? JSON.parse(settings.satuan_prices) : [],
      },
    });
  } catch (error) {
    console.error('Get settings error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();

    const validation = UpdateSettingsSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0]?.message || 'Invalid input' },
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

    return NextResponse.json({
      data: {
        ...settings,
        kiloan_prices: settings.kiloan_prices ? JSON.parse(settings.kiloan_prices) : [],
        satuan_prices: settings.satuan_prices ? JSON.parse(settings.satuan_prices) : [],
      },
    });
  } catch (error) {
    console.error('Update settings error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan' }, { status: 500 });
  }
}
