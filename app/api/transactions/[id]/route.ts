import { NextRequest, NextResponse } from 'next/server';
import { query, getClient } from '@/lib/db';
import { getCurrentSession } from '@/lib/auth';
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

    return NextResponse.json({ data: transaction });
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
      console.error('Transaction update validation error:', validation.error);
      return NextResponse.json(
        { error: 'Data yang dikirim tidak valid.' },
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

    return NextResponse.json({ data: transaction });
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
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.role !== 'OWNER') {
      return NextResponse.json(
        { error: 'Hanya Owner yang berhak menghapus transaksi.' },
        { status: 403 }
      );
    }

    const client = await getClient();
    try {
      const { id } = await params;

      await client.query('BEGIN');

    const txnResult = await client.query(
      'SELECT customer_id, grand_total FROM transactions WHERE id = $1 FOR UPDATE',
      [id]
    );

    if (txnResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    const { customer_id, grand_total } = txnResult.rows[0];

    await client.query('DELETE FROM transactions WHERE id = $1', [id]);

    if (customer_id) {
      await client.query(
        `UPDATE customers SET 
          total_transactions = GREATEST(0, total_transactions - 1),
          total_spent = GREATEST(0, total_spent - $1)
         WHERE id = $2`,
        [grand_total, customer_id]
      );
    }

    await client.query('COMMIT');

      return NextResponse.json({ success: true });
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Delete transaction error:', error);
      return NextResponse.json({ error: 'Terjadi kesalahan' }, { status: 500 });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Delete transaction session error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan pada server' }, { status: 500 });
  }
}
