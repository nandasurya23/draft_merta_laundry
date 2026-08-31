import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

function getPeriodDateRange(period: string): { startDate: Date; endDate: Date } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let startDate = new Date(today);

  switch (period) {
    case 'today':
      break;
    case 'week':
      startDate = new Date(today);
      startDate.setDate(today.getDate() - today.getDay());
      break;
    case 'month':
      startDate = new Date(today.getFullYear(), today.getMonth(), 1);
      break;
    case 'all':
    default:
      startDate = new Date(0);
  }

  return { startDate, endDate: today };
}

export async function GET(req: NextRequest) {
  try {
    const period = (req.nextUrl.searchParams.get('period') || 'all') as
      | 'today'
      | 'week'
      | 'month'
      | 'all';

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
