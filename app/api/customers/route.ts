import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { CreateCustomerSchema } from '@/lib/validation';

export async function GET(req: NextRequest) {
  try {
    const search = req.nextUrl.searchParams.get('search') || '';
    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '50');
    const offset = parseInt(req.nextUrl.searchParams.get('offset') || '0');

    let sql = 'SELECT id, name, phone, custom_kiloan_price, custom_items, total_transactions, total_spent, created_at FROM customers';
    const params: unknown[] = [];

    if (search) {
      sql += ' WHERE name ILIKE $1 OR phone ILIKE $1';
      params.push(`%${search}%`);
    }

    const countSql = `SELECT COUNT(*) as count FROM customers ${search ? 'WHERE name ILIKE $1 OR phone ILIKE $1' : ''}`;
    const countParams = search ? [`%${search}%`] : [];

    const dataSql = `${sql} ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    const dataParams = [...params, limit, offset];

    const [countResult, result] = await Promise.all([
      query(countSql, countParams),
      query(dataSql, dataParams),
    ]);
    const total = parseInt(countResult.rows[0].count);

    return NextResponse.json(
      {
        data: result.rows,
        total,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get customers error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const validation = CreateCustomerSchema.safeParse(body);
    if (!validation.success) {
      console.error('Customer validation error:', validation.error);
      return NextResponse.json(
        { error: 'Data pelanggan tidak valid. Periksa kembali data yang diisi.' },
        { status: 400 }
      );
    }

    const { name, phone, customKiloanPrice, customItems } = validation.data;

    const result = await query(
      `INSERT INTO customers (name, phone, custom_kiloan_price, custom_items)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, phone, custom_kiloan_price, custom_items, total_transactions, total_spent, created_at`,
      [name, phone || null, customKiloanPrice || null, customItems ? JSON.stringify(customItems) : null]
    );

    const customer = result.rows[0];

    return NextResponse.json(
      { data: customer },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create customer error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan' },
      { status: 500 }
    );
  }
}

