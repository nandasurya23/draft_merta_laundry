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

function escapeCSV(value: string | number | null): string {
  if (value === null) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
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
        invoice_number, date, customer_name, type, total_item,
        grand_total, payment_status, laundry_status
       FROM transactions
       WHERE date >= $1 AND date <= $2
       ORDER BY date DESC`,
      [startDate, endDate]
    );

    const transactions = result.rows;

    // Build CSV
    const headers = [
      'No Nota',
      'Tanggal',
      'Pelanggan',
      'Jenis',
      'Total Item',
      'Total (Rp)',
      'Pembayaran',
      'Status Laundry',
    ];

    const rows = transactions.map((t) => [
      escapeCSV(t.invoice_number),
      escapeCSV(new Date(t.date).toLocaleDateString('id-ID')),
      escapeCSV(t.customer_name),
      escapeCSV(t.type),
      escapeCSV(t.total_item),
      escapeCSV(t.grand_total),
      escapeCSV(t.payment_status === 'LUNAS' ? 'Lunas' : 'Belum Bayar'),
      escapeCSV(t.laundry_status),
    ]);

    const csv = [
      headers.join(','),
      ...rows.map((row) => row.join(',')),
    ].join('\n');

    const timestamp = new Date().toISOString().split('T')[0];

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="merta_laundry_report_${timestamp}.csv"`,
      },
    });
  } catch (error) {
    console.error('Export CSV error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan' }, { status: 500 });
  }
}
