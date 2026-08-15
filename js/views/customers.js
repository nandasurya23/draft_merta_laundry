// --- Customers List ---
function renderCustomers() {
    const tbody = document.querySelector('#customer-list-table tbody');
    tbody.innerHTML = '';
    
    const searchVal = document.getElementById('search-customer').value.toLowerCase();
    let filtered = db.customers;
    if(searchVal) {
        filtered = filtered.filter(c => c.name.toLowerCase().includes(searchVal) || (c.phone && c.phone.toLowerCase().includes(searchVal)));
    }

    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" class="text-center text-gray py-4">Belum ada pelanggan ditemukan</td></tr>';
    }

    filtered.forEach(c => {
        tbody.innerHTML += `
            <tr>
                <td>${c.name}</td>
                <td>${c.phone || '-'}</td>
                <td>${c.totalTransactions} Transaksi (${formatCurrency(c.totalSpent)})</td>
            </tr>
        `;
    });
}

