function renderDashboard() {
    const today = new Date().toISOString().split('T')[0];
    const month = today.substring(0, 7);
    
    let omzetToday = 0;
    let omzetMonth = 0;
    let unpaid = 0;

    db.transactions.forEach(trx => {
        const trxDate = trx.date.split('T')[0];
        const trxMonth = trxDate.substring(0, 7);
        
        if (trx.paymentStatus === 'LUNAS') {
            if (trxDate === today) omzetToday += trx.grandTotal;
            if (trxMonth === month) omzetMonth += trx.grandTotal;
        } else {
            unpaid += 1;
        }
    });

    document.getElementById('dash-omzet-today').innerText = formatCurrency(omzetToday);
    document.getElementById('dash-omzet-month').innerText = formatCurrency(omzetMonth);
    document.getElementById('dash-total-trx').innerText = db.transactions.length;
    document.getElementById('dash-unpaid').innerText = unpaid;

    // Recent 5
    const tbody = document.querySelector('#dash-recent-table tbody');
    tbody.innerHTML = '';
    const recent = [...db.transactions].sort((a,b) => b.date.localeCompare(a.date)).slice(0, 5);
    
    if (recent.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center text-gray py-4">Belum ada transaksi</td></tr>';
    }

    recent.forEach(trx => {
        tbody.innerHTML += `
            <tr>
                <td><a href="#" onclick="viewTransactionDetail('${trx.id}')" class="text-primary font-medium">${trx.invoiceNumber}</a></td>
                <td>${trx.customerName}</td>
                <td>${formatCurrency(trx.grandTotal)}</td>
                <td>${getBadgeHTML(trx.paymentStatus, 'payment')}</td>
                <td>${getBadgeHTML(trx.laundryStatus, 'laundry')}</td>
            </tr>
        `;
    });
}
