import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { UpdateTransactionSchema } from '@/lib/validation';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await query('SELECT * FROM transactions WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    const transaction = result.rows[0];

    return NextResponse.json({
      data: {
        ...transaction,
        kilo_detail: transaction.kilo_detail ? JSON.parse(transaction.kilo_detail) : null,
        unit_detail: transaction.unit_detail ? JSON.parse(transaction.unit_detail) : null,
      },
    });
  } catch (error) {
    console.error('Get transaction error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const validation = UpdateTransactionSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0]?.message || 'Invalid input' },
        { status: 400 }
      );
    }

    const { paymentStatus, laundryStatus } = validation.data;

    const updates: string[] = ['updated_at = CURRENT_TIMESTAMP'];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (paymentStatus) {
      updates.push(`payment_status = $${paramIndex++}`);
      values.push(paymentStatus);
    }
    if (laundryStatus) {
      updates.push(`laundry_status = $${paramIndex++}`);
      values.push(laundryStatus);
    }

    values.push(id);

    const result = await query(
      `UPDATE transactions SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    const transaction = result.rows[0];

    return NextResponse.json({
      data: {
        ...transaction,
        kilo_detail: transaction.kilo_detail ? JSON.parse(transaction.kilo_detail) : null,
        unit_detail: transaction.unit_detail ? JSON.parse(transaction.unit_detail) : null,
      },
    });
  } catch (error) {
    console.error('Update transaction error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const txnResult = await query('SELECT customer_id, grand_total FROM transactions WHERE id = $1', [
      id,
    ]);

    if (txnResult.rows.length === 0) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    const { customer_id, grand_total } = txnResult.rows[0];

    await query('DELETE FROM transactions WHERE id = $1', [id]);

    if (customer_id) {
      await query(
        `UPDATE customers SET 
          total_transactions = total_transactions - 1,
          total_spent = total_spent - $1
         WHERE id = $2`,
        [grand_total, customer_id]
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete transaction error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan' }, { status: 500 });
  }
}
