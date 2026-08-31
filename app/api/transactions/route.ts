import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { CreateTransactionSchema } from '@/lib/validation';
import { getCurrentSession } from '@/lib/auth';

function generateInvoiceNumber(): string {
  const timestamp = Date.now().toString().slice(-6);
  return `TRX-${timestamp}`;
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

    let sql = 'SELECT * FROM transactions WHERE 1=1';
    const params: unknown[] = [];
    let paramIndex = 1;

    if (search) {
      sql += ` AND (invoice_number ILIKE $${paramIndex} OR customer_name ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }
    if (paymentStatus) {
      sql += ` AND payment_status = $${paramIndex}`;
      params.push(paymentStatus);
      paramIndex++;
    }
    if (laundryStatus) {
      sql += ` AND laundry_status = $${paramIndex}`;
      params.push(laundryStatus);
      paramIndex++;
    }
    if (startDate) {
      sql += ` AND date >= $${paramIndex}`;
      params.push(startDate);
      paramIndex++;
    }
    if (endDate) {
      sql += ` AND date <= $${paramIndex}`;
      params.push(endDate);
      paramIndex++;
    }

    const countResult = await query(`SELECT COUNT(*) as count FROM (SELECT 1 FROM transactions WHERE 1=1 ${
      search ? `AND (invoice_number ILIKE $1 OR customer_name ILIKE $1)` : ''
    }${paymentStatus ? ` AND payment_status = $${search ? 2 : 1}` : ''}${
      laundryStatus ? ` AND laundry_status = $${search && paymentStatus ? 3 : paymentStatus ? 2 : 1}` : ''
    }) t`, params.length > 0 ? params.slice(0, 1) : []);
    
    const total = parseInt(countResult.rows[0].count);

    sql += ` ORDER BY date DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await query(sql, params);

    const transactions = result.rows.map(t => ({
      ...t,
      kilo_detail: t.kilo_detail ? JSON.parse(t.kilo_detail) : null,
      unit_detail: t.unit_detail ? JSON.parse(t.unit_detail) : null,
    }));

    return NextResponse.json({ data: transactions, total });
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
      return NextResponse.json(
        { error: validation.error.errors[0]?.message || 'Invalid input' },
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
      grandTotal += kiloDetail.subtotal || kiloDetail.weight * kiloDetail.pricePerKg;
      totalItem += kiloDetail.totalItemCount || 0;
    }

    if (unitDetail) {
      grandTotal += unitDetail.items.reduce((sum, item) => sum + (item.subtotal || 0), 0);
      totalItem += unitDetail.items.reduce((sum, item) => sum + item.qty, 0);
    }

    const result = await query(
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

    // Update customer stats if customer exists
    if (customerId) {
      await query(
        `UPDATE customers SET 
          total_transactions = total_transactions + 1,
          total_spent = total_spent + $1
         WHERE id = $2`,
        [grandTotal, customerId]
      );
    }

    return NextResponse.json(
      {
        data: {
          ...transaction,
          kilo_detail: transaction.kilo_detail ? JSON.parse(transaction.kilo_detail) : null,
          unit_detail: transaction.unit_detail ? JSON.parse(transaction.unit_detail) : null,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create transaction error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan' }, { status: 500 });
  }
}
