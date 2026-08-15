// --- Reports ---
function renderReports() {
    const period = document.getElementById('report-period').value;
    const now = new Date();
    
    let filtered = db.transactions;
    if (period === 'today') {
        const todayStr = now.toISOString().split('T')[0];
        filtered = filtered.filter(t => t.date.startsWith(todayStr));
    } else if (period === 'month') {
        const monthStr = now.toISOString().substring(0, 7);
        filtered = filtered.filter(t => t.date.startsWith(monthStr));
    } else if (period === 'week') {
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        filtered = filtered.filter(t => new Date(t.date) >= oneWeekAgo);
    }

    let tTrx = filtered.length;
    let omzet = 0;
    let lunas = 0;
    let blm = 0;

    filtered.forEach(t => {
        omzet += t.grandTotal;
        if(t.paymentStatus === 'LUNAS') lunas += t.grandTotal;
        else blm += t.grandTotal;
    });

    document.getElementById('rep-total-trx').innerText = tTrx;
    document.getElementById('rep-omzet').innerText = formatCurrency(omzet);
    document.getElementById('rep-lunas').innerText = formatCurrency(lunas);
    document.getElementById('rep-belum-bayar').innerText = formatCurrency(blm);
}

document.getElementById('report-period').addEventListener('change', renderReports);

document.getElementById('btn-export-csv').addEventListener('click', () => {
    // Generate CSV
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "No Nota,Tanggal,Pelanggan,Jenis Transaksi,Total Barang,Total,Status Pembayaran,Status Laundry\n";
    
    db.transactions.forEach(t => {
        let typeStr = t.type === 'KILOAN_SATUAN' ? 'Kiloan + Satuan' : (t.type === 'KILOAN' ? 'Kiloan' : 'Satuan');
        let row = `${t.invoiceNumber},${t.date.split('T')[0]},"${t.customerName}",${typeStr},${t.totalItem},${t.grandTotal},${t.paymentStatus},${t.laundryStatus}`;
        csvContent += row + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `merta_laundry_report_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
});

