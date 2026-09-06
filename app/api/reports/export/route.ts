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

function escapeCSV(value: string | number | null): string {
  if (value === null || value === undefined) return '';
  let str = String(value);

  // Neutralize CSV Formula Injection (CWE-1236)
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }

  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

interface ExportTransactionRow {
  invoice_number: string;
  date: string | Date;
  customer_name: string;
  type: string;
  total_item: number;
  grand_total: number;
  payment_status: string;
  laundry_status: string;
}

export async function GET(req: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.role !== 'OWNER') {
      return NextResponse.json(
        { error: 'Hanya Owner yang memiliki izin untuk mengekspor laporan.' },
        { status: 403 }
      );
    }

    const period = (req.nextUrl.searchParams.get('period') || 'all') as
      | 'today'
      | 'week'
      | 'month'
      | 'all';

    const { startDate, endDate } = getPeriodDateRange(period);

    const result = await query<ExportTransactionRow>(
      `SELECT 
        invoice_number, date, customer_name, type, total_item,
        grand_total, payment_status, laundry_status
       FROM transactions
       WHERE date >= $1 AND date <= $2
       ORDER BY date DESC`,
      [startDate, endDate]
    );

    const transactions = result.rows;

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

    const rows = transactions.map((t: ExportTransactionRow) => [
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
      ...rows.map((row: string[]) => row.join(',')),
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
