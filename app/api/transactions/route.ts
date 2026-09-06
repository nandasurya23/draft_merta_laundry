import { NextRequest, NextResponse } from 'next/server';
import { query, getClient } from '@/lib/db';
import { CreateTransactionSchema } from '@/lib/validation';
import { getCurrentSession } from '@/lib/auth';
import crypto from 'crypto';

function generateInvoiceNumber(): string {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const randomHex = crypto.randomBytes(3).toString('hex').toUpperCase(); // 6 chars
  return `TRX-${yy}${mm}${dd}-${randomHex}`; // Length: 17 chars (fits in VARCHAR(20))
}

export async function GET(req: NextRequest) {
  try {
    const search = req.nextUrl.searchParams.get('search') || '';
    const paymentStatus = req.nextUrl.searchParams.get('paymentStatus') || '';
    const laundryStatus = req.nextUrl.searchParams.get('laundryStatus') || '';
    const startDate = req.nextUrl.searchParams.get('startDate') || '';
    const endDate = req.nextUrl.searchParams.get('endDate') || '';
    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '50');
    const offset = parseInt(req.nextUrl.searchParams.get('offset') || '0');

    let whereSql = ' WHERE 1=1';
    const params: unknown[] = [];
    let paramIndex = 1;

    if (search) {
      whereSql += ` AND (invoice_number ILIKE $${paramIndex} OR customer_name ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }
    if (paymentStatus) {
      whereSql += ` AND payment_status = $${paramIndex}`;
      params.push(paymentStatus);
      paramIndex++;
    }
    if (laundryStatus) {
      whereSql += ` AND laundry_status = $${paramIndex}`;
      params.push(laundryStatus);
      paramIndex++;
    }
    if (startDate) {
      whereSql += ` AND date >= $${paramIndex}`;
      params.push(startDate);
      paramIndex++;
    }
    if (endDate) {
      whereSql += ` AND date <= $${paramIndex}`;
      params.push(endDate);
      paramIndex++;
    }

    const countResult = await query(
      `SELECT COUNT(*) as count FROM transactions${whereSql}`,
      [...params]
    );
    const total = parseInt(countResult.rows[0].count);

    const queryParams = [...params, limit, offset];
    const sql = `SELECT * FROM transactions${whereSql} ORDER BY date DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;

    const result = await query(sql, queryParams);

    return NextResponse.json({ data: result.rows, total });
  } catch (error) {
    console.error('Get transactions error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const validation = CreateTransactionSchema.safeParse(body);
    if (!validation.success) {
      console.error('Transaction validation error:', validation.error);
      return NextResponse.json(
        { error: 'Data transaksi tidak valid. Periksa kembali data yang diisi.' },
        { status: 400 }
      );
    }

    const {
      date,
      customerId,
      customerName,
      customerPhone,
      type,
      kiloDetail,
      unitDetail,
      paymentStatus,
    } = validation.data;

    const invoiceNumber = generateInvoiceNumber();
    const transactionDate = date ? new Date(date) : new Date();

    let grandTotal = 0;
    let totalItem = 0;

    if (kiloDetail) {
      const subtotal = kiloDetail.weight * kiloDetail.pricePerKg;
      grandTotal += subtotal;
      totalItem += kiloDetail.totalItemCount || 0;
    }

    if (unitDetail) {
      grandTotal += unitDetail.items.reduce((sum: number, item: { qty: number; unitPrice: number }) => {
        const itemSubtotal = item.qty * item.unitPrice;
        return sum + itemSubtotal;
      }, 0);
      totalItem += unitDetail.items.reduce((sum: number, item: { qty: number }) => sum + item.qty, 0);
    }

    const client = await getClient();

    try {
      await client.query('BEGIN');

      const result = await client.query(
        `INSERT INTO transactions (
          invoice_number, date, customer_id, customer_name, customer_phone,
          type, kilo_detail, unit_detail, grand_total, total_item,
          payment_status, laundry_status, created_by_user_id, created_by_name
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING *`,
        [
          invoiceNumber,
          transactionDate,
          customerId || null,
          customerName,
          customerPhone || null,
          type,
          kiloDetail ? JSON.stringify(kiloDetail) : null,
          unitDetail ? JSON.stringify(unitDetail) : null,
          grandTotal,
          totalItem,
          paymentStatus,
          'DITERIMA',
          session.userId,
          session.userName,
        ]
      );

      const transaction = result.rows[0];

      if (customerId) {
        await client.query(
          `UPDATE customers SET
            total_transactions = total_transactions + 1,
            total_spent = total_spent + $1
           WHERE id = $2`,
          [grandTotal, customerId]
        );
      }

      await client.query('COMMIT');

      return NextResponse.json(
        { data: transaction },
        { status: 201 }
      );
    } catch (dbError) {
      await client.query('ROLLBACK');
      throw dbError;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Create transaction error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan' }, { status: 500 });
  }
}
