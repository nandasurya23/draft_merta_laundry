import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getCurrentSession } from '@/lib/auth';

function getPeriodDateRange(period: string): { startDate: Date; endDate: Date } {
  const now = new Date();
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  let startDate: Date;

  switch (period) {
    case 'today':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      break;
    case 'week': {
      const day = now.getDay();
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day, 0, 0, 0, 0);
      break;
    }
    case 'month':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      break;
    case 'all':
    default:
      startDate = new Date(0);
  }

  return { startDate, endDate: endOfDay };
}

export async function GET(req: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let period = (req.nextUrl.searchParams.get('period') || 'all') as
      | 'today'
      | 'week'
      | 'month'
      | 'all';

    // Non-owner employees are strictly restricted to 'today'
    if (session.role !== 'OWNER') {
      period = 'today';
    }

    const { startDate, endDate } = getPeriodDateRange(period);

    const result = await query(
      `SELECT 
        COUNT(*) as total_transactions,
        COALESCE(SUM(CASE WHEN payment_status = 'LUNAS' THEN grand_total ELSE 0 END), 0) as total_lunas,
        COALESCE(SUM(CASE WHEN payment_status = 'BELUM_BAYAR' THEN grand_total ELSE 0 END), 0) as total_belum_bayar,
        COALESCE(SUM(grand_total), 0) as total_omzet
       FROM transactions
       WHERE date >= $1 AND date <= $2`,
      [startDate, endDate]
    );

    const data = result.rows[0];

    return NextResponse.json({
      data: {
        period,
        totalTransactions: parseInt(data.total_transactions),
        totalOmzet: parseInt(data.total_omzet),
        totalLunas: parseInt(data.total_lunas),
        totalBelumBayar: parseInt(data.total_belum_bayar),
      },
    });
  } catch (error) {
    console.error('Get reports error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan' }, { status: 500 });
  }
}
