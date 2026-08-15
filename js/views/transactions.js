function renderTransactionList() {
    const filterDate = document.getElementById('filter-date') ? document.getElementById('filter-date').value : 'ALL';
    const filterPayment = document.getElementById('filter-payment').value;
    const filterStatus = document.getElementById('filter-status').value;
    const searchVal = document.getElementById('search-trx').value.toLowerCase();
    
    const tbody = document.querySelector('#trx-list-table tbody');
    tbody.innerHTML = '';

    let filtered = [...db.transactions].sort((a,b) => b.date.localeCompare(a.date));

    if (filterDate !== 'ALL') {
        const today = new Date();
        const month = today.toISOString().slice(0, 7); // YYYY-MM
        const day = today.toISOString().slice(0, 10); // YYYY-MM-DD
        
        filtered = filtered.filter(t => {
            const tDate = t.date.slice(0, 10);
            const tMonth = t.date.slice(0, 7);
            if (filterDate === 'TODAY') return tDate === day;
            if (filterDate === 'MONTH') return tMonth === month;
            return true;
        });
    }

    if (filterPayment !== 'ALL') {
        filtered = filtered.filter(t => t.paymentStatus === filterPayment);
    }
    if (filterStatus !== 'ALL') {
        filtered = filtered.filter(t => t.laundryStatus === filterStatus);
    }
    if (searchVal) {
        filtered = filtered.filter(t => t.invoiceNumber.toLowerCase().includes(searchVal) || t.customerName.toLowerCase().includes(searchVal));
    }

    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" class="text-center text-gray py-4">Tidak ada transaksi ditemukan</td></tr>';
    }

    filtered.forEach(trx => {
        let typeStr = trx.type === 'KILOAN_SATUAN' ? 'Kiloan + Satuan' : (trx.type === 'KILOAN' ? 'Kiloan' : 'Satuan');
        tbody.innerHTML += `
            <tr>
                <td><a href="#" onclick="viewTransactionDetail('${trx.id}')" class="text-primary font-medium">${trx.invoiceNumber}</a></td>
                <td>${formatDate(trx.date)}</td>
                <td>${trx.customerName}</td>
                <td>${typeStr}</td>
                <td>${trx.totalItem} pcs</td>
                <td>${formatCurrency(trx.grandTotal)}</td>
                <td>${getBadgeHTML(trx.paymentStatus, 'payment')}</td>
                <td>${getBadgeHTML(trx.laundryStatus, 'laundry')}</td>
                <td>
                    <button class="btn btn-sm btn-secondary" onclick="viewTransactionDetail('${trx.id}')">Detail</button>
                </td>
            </tr>
        `;
    });
}

// --- Create Transaction Logic ---

let currentSatuanItems = [];
let currentKiloDetails = [];

function initCreateTransaction() {
    document.getElementById('form-transaction').reset();
    currentSatuanItems = [];
    currentKiloDetails = [];
    
    // populate kilo prices
    const kpSelect = document.getElementById('kilo-price-select');
    kpSelect.innerHTML = '<option value="0">Pilih Harga Kiloan</option>';
    db.settings.kiloanPrices.forEach(p => {
        kpSelect.innerHTML += `<option value="${p.price}">${p.name} (${formatCurrency(p.price)})</option>`;
    });

    renderKiloDetailsList();
    renderSatuanItemsList();
    updateFormVisibility();
    calculateGrandTotal();
    initCustomDropdowns();
}

function updateFormVisibility() {
    const type = document.querySelector('input[name="trx-type"]:checked').value;
    const secKilo = document.getElementById('section-kiloan');
    const secSatuan = document.getElementById('section-satuan');

    if (type === 'KILOAN') {
        secKilo.classList.remove('hidden');
        secSatuan.classList.add('hidden');
    } else if (type === 'SATUAN') {
        secKilo.classList.add('hidden');
        secSatuan.classList.remove('hidden');
    } else { // KILOAN_SATUAN
        secKilo.classList.remove('hidden');
        secSatuan.classList.remove('hidden');
    }
}

function addKiloDetail() {
    currentKiloDetails.push({ id: generateId(), name: '', qty: 1 });
    renderKiloDetailsList();
}

function renderKiloDetailsList() {
    const container = document.getElementById('kilo-details-list');
    container.innerHTML = '';
    currentKiloDetails.forEach(item => {
        container.innerHTML += `
            <div class="form-row mb-2 align-center">
                <input type="text" class="form-control mr-2" placeholder="Nama pakaian (misal: Kemeja)" value="${item.name}" onchange="updateKiloDetail('${item.id}', 'name', this.value)">
                <input type="number" class="form-control mr-2 w-1/4" placeholder="Qty" value="${item.qty}" min="1" onchange="updateKiloDetail('${item.id}', 'qty', this.value)">
                <button type="button" class="btn btn-danger btn-sm" onclick="removeKiloDetail('${item.id}')">X</button>
            </div>
        `;
    });
}

window.updateKiloDetail = (id, field, value) => {
    const item = currentKiloDetails.find(i => i.id === id);
    if (item) item[field] = field === 'qty' ? parseInt(value) || 1 : value;
};
window.removeKiloDetail = (id) => {
    currentKiloDetails = currentKiloDetails.filter(i => i.id !== id);
    renderKiloDetailsList();
};

function addSatuanItem() {
    // default price from first settings item if exists
    const defPrice = db.settings.satuanPrices.length > 0 ? db.settings.satuanPrices[0].price : 0;
    const defName = db.settings.satuanPrices.length > 0 ? db.settings.satuanPrices[0].name : '';
    
    currentSatuanItems.push({ id: generateId(), name: defName, qty: 1, unitPrice: defPrice });
    renderSatuanItemsList();
    calculateGrandTotal();
}

function renderSatuanItemsList() {
    const tbody = document.getElementById('satuan-items-list');
    tbody.innerHTML = '';
    
    let optionsHtml = '';
    db.settings.satuanPrices.forEach(p => {
        optionsHtml += `<option value="${p.price}|${p.name}">${p.name} - ${formatCurrency(p.price)}</option>`;
    });

    currentSatuanItems.forEach(item => {
        const subtotal = item.qty * item.unitPrice;
        tbody.innerHTML += `
            <tr>
                <td>
                    <select class="form-control" onchange="updateSatuanItemFromSelect('${item.id}', this.value)">
                        <option value="">Pilih / Custom</option>
                        ${optionsHtml}
                    </select>
                    <input type="text" class="form-control mt-1" placeholder="Nama Custom" value="${item.name}" onchange="updateSatuanItem('${item.id}', 'name', this.value)">
                </td>
                <td><input type="number" class="form-control" value="${item.qty}" min="1" onchange="updateSatuanItem('${item.id}', 'qty', this.value)"></td>
                <td><input type="text" inputmode="numeric" class="form-control" value="${item.unitPrice ? new Intl.NumberFormat('id-ID').format(item.unitPrice) : '0'}" oninput="formatCurrencyInput(this)" onchange="updateSatuanItem('${item.id}', 'unitPrice', this.value)"></td>
                <td class="font-medium">${formatCurrency(subtotal)}</td>
                <td><button type="button" class="btn btn-danger btn-sm" onclick="removeSatuanItem('${item.id}')">X</button></td>
            </tr>
        `;
        
        // Try to set select value if matches
        const lastRowSelect = tbody.lastElementChild.querySelector('select');
        const matchVal = `${item.unitPrice}|${item.name}`;
        Array.from(lastRowSelect.options).forEach(opt => {
            if(opt.value === matchVal) opt.selected = true;
        });
    });
    initCustomDropdowns();
}

window.updateSatuanItemFromSelect = (id, combinedValue) => {
    if(!combinedValue) return;
    const [priceStr, name] = combinedValue.split('|');
    updateSatuanItem(id, 'name', name);
    updateSatuanItem(id, 'unitPrice', parseInt(priceStr));
};

window.updateSatuanItem = (id, field, value) => {
    const item = currentSatuanItems.find(i => i.id === id);
    if (item) {
        item[field] = (field === 'qty') ? (parseInt(value) || 0) : ((field === 'unitPrice') ? parseCurrencyValue(value) : value);
        renderSatuanItemsList();
        calculateGrandTotal();
    }
};

window.removeSatuanItem = (id) => {
    currentSatuanItems = currentSatuanItems.filter(i => i.id !== id);
    renderSatuanItemsList();
    calculateGrandTotal();
};

function calculateGrandTotal() {
    const type = document.querySelector('input[name="trx-type"]:checked').value;
    let gTotal = 0;

    if (type === 'KILOAN' || type === 'KILOAN_SATUAN') {
        const w = parseFloat(document.getElementById('kilo-weight').value) || 0;
        const p = parseFloat(document.getElementById('kilo-price-select').value) || 0;
        gTotal += (w * p);
    }

    if (type === 'SATUAN' || type === 'KILOAN_SATUAN') {
        currentSatuanItems.forEach(i => gTotal += (i.qty * i.unitPrice));
    }

    document.getElementById('trx-grand-total').innerText = formatCurrency(gTotal);
}

// Event Listeners for Create TRX
document.querySelectorAll('input[name="trx-type"]').forEach(el => {
    el.addEventListener('change', () => {
        updateFormVisibility();
        calculateGrandTotal();
    });
});

document.querySelectorAll('.input-calc').forEach(el => {
    el.addEventListener('input', calculateGrandTotal);
    el.addEventListener('change', calculateGrandTotal);
});

document.getElementById('btn-toggle-kilo-details').addEventListener('click', () => {
    document.getElementById('kilo-details-container').classList.toggle('hidden');
});

document.getElementById('btn-add-kilo-detail').addEventListener('click', addKiloDetail);
document.getElementById('btn-add-satuan-item').addEventListener('click', addSatuanItem);
document.getElementById('btn-cancel-trx').addEventListener('click', () => navigateTo('dashboard'));

let isSubmitting = false;

document.getElementById('form-transaction').addEventListener('submit', (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    
    const type = document.querySelector('input[name="trx-type"]:checked').value;
    const name = document.getElementById('trx-customer-name').value.trim();
    const phone = document.getElementById('trx-customer-phone').value.trim();
    
    // validate customer
    if (!name) return showToast('Nama pelanggan wajib diisi', true);

    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;

    const resetBtn = () => {
        isSubmitting = false;
        if(submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
    };

    isSubmitting = true;
    if(submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="material-icons-outlined mr-2">hourglass_empty</span> Menyimpan...';
    }

    let customer = db.customers.find(c => c.phone === phone && phone !== '');
    if (!customer) {
        customer = { id: generateId(), name, phone, totalTransactions: 0, totalSpent: 0 };
        db.customers.push(customer);
    }

    const trx = {
        id: generateId(),
        invoiceNumber: generateInvoiceNumber(),
        date: new Date().toISOString(),
        customerId: customer.id,
        customerName: name,
        customerPhone: phone,
        type: type,
        grandTotal: 0,
        totalItem: 0,
        paymentStatus: document.getElementById('trx-payment-status').value,
        laundryStatus: 'DITERIMA'
    };

    if (type === 'KILOAN' || type === 'KILOAN_SATUAN') {
        const weight = parseFloat(document.getElementById('kilo-weight').value) || 0;
        const pricePerKg = parseFloat(document.getElementById('kilo-price-select').value) || 0;
        const totalItemCount = parseInt(document.getElementById('kilo-total-item').value) || 0;
        
        if (weight <= 0 || pricePerKg <= 0) {
            resetBtn();
            return showToast('Berat dan Harga/Kg Kiloan harus diisi', true);
        }
        if (totalItemCount <= 0) {
            resetBtn();
            return showToast('Total item Kiloan harus > 0', true);
        }

        trx.kiloDetail = {
            weight, pricePerKg, subtotal: weight * pricePerKg,
            totalItemCount,
            items: currentKiloDetails.filter(i => i.name.trim() !== '') // filter empty names
        };
        trx.grandTotal += trx.kiloDetail.subtotal;
        trx.totalItem += totalItemCount;
    }

    if (type === 'SATUAN' || type === 'KILOAN_SATUAN') {
        if (currentSatuanItems.length === 0) {
            resetBtn();
            return showToast('Tambahkan minimal 1 item satuan', true);
        }
        
        let sub = 0;
        let tItem = 0;
        const items = currentSatuanItems.map(i => {
            sub += i.qty * i.unitPrice;
            tItem += i.qty;
            return { name: i.name || 'Item', qty: i.qty, unitPrice: i.unitPrice, subtotal: i.qty * i.unitPrice };
        });

        trx.unitDetail = { items, subtotal: sub };
        trx.grandTotal += sub;
        trx.totalItem += (type === 'SATUAN' ? tItem : 0); // If KILOAN_SATUAN, totalItem is aggregate? Let's say yes.
        if(type === 'KILOAN_SATUAN') trx.totalItem += tItem;
    }

    // update customer stats
    customer.totalTransactions += 1;
    customer.totalSpent += trx.grandTotal;

    db.transactions.push(trx);
    saveDB();
    
    // Simulasikan delay sedikit agar UI "Menyimpan..." terlihat sebentar untuk UX yang baik
    setTimeout(() => {
        resetBtn();
        showToast('Transaksi berhasil disimpan!');
        viewTransactionDetail(trx.id);
    }, 300);
});


// --- Transaction Detail ---

let currentViewedTrxId = null;

window.viewTransactionDetail = (id) => {
    currentViewedTrxId = id;
    const trx = db.transactions.find(t => t.id === id);
    if (!trx) return showToast('Transaksi tidak ditemukan', true);

    navigateTo('transaction-detail', `Detail: ${trx.invoiceNumber}`);

    document.getElementById('detail-laundry-status').value = trx.laundryStatus;
    initCustomDropdowns();
    
    const btnMarkPaid = document.getElementById('btn-mark-paid');
    if (trx.paymentStatus === 'LUNAS') {
        btnMarkPaid.style.display = 'none';
    } else {
        btnMarkPaid.style.display = '';
    }

    const container = document.getElementById('detail-invoice-content');
    
    let html = `
        <div class="receipt-paper">
            <div class="receipt-header">
                <h2>${db.settings.laundryProfile.name}</h2>
                <p>${db.settings.laundryProfile.address}<br>${db.settings.laundryProfile.phone}</p>
            </div>
            
            <div class="flex justify-between align-center mb-2">
                <div>
                    <div class="text-xs text-gray font-bold uppercase">No. Nota</div>
                    <div class="font-medium">${trx.invoiceNumber}</div>
                </div>
                <div class="text-right">
                    <div class="text-xs text-gray font-bold uppercase">Tanggal</div>
                    <div class="font-medium">${formatDate(trx.date)}</div>
                </div>
            </div>
            <div class="flex justify-between align-center mb-4">
                <div>
                    <div class="text-xs text-gray font-bold uppercase">Pelanggan</div>
                    <div class="font-medium">${trx.customerName}</div>
                </div>
                <div class="text-right">
                    ${getBadgeHTML(trx.paymentStatus, 'payment')}
                </div>
            </div>

            <div class="dashed-divider"></div>
    `;

    if (trx.type === 'KILOAN' || trx.type === 'KILOAN_SATUAN') {
        html += `
            <div class="mb-4">
                <div class="text-xs text-gray font-bold uppercase mb-2">Layanan Kiloan</div>
                <div class="receipt-item-row font-medium">
                    ${trx.type === 'KILOAN_SATUAN' ? `
                        <span>Berat Kiloan</span>
                        <span>${trx.kiloDetail.weight} Kg</span>
                    ` : `
                        <span>${trx.kiloDetail.weight} Kg &times; ${formatCurrency(trx.kiloDetail.pricePerKg)}</span>
                        <span>${formatCurrency(trx.kiloDetail.subtotal)}</span>
                    `}
                </div>
        `;
        if (trx.kiloDetail.items && trx.kiloDetail.items.length > 0) {
            html += `<div class="text-gray text-xs mt-1">Detail Pakaian (${trx.kiloDetail.totalItemCount} pcs):</div>`;
            html += `<ul class="text-gray text-xs ml-4 mb-0">`;
            trx.kiloDetail.items.forEach(i => {
                html += `<li>${i.name} &times; ${i.qty}</li>`;
            });
            html += `</ul>`;
        }
        html += `</div>`;
    }

    if (trx.type === 'SATUAN' || trx.type === 'KILOAN_SATUAN') {
        if (trx.type === 'KILOAN_SATUAN') html += `<div class="dashed-divider" style="opacity:0.5; margin:1rem 0;"></div>`;
        html += `
            <div class="mb-4">
                <div class="text-xs text-gray font-bold uppercase mb-2">Layanan Satuan</div>
        `;
        trx.unitDetail.items.forEach(i => {
            if (trx.type === 'KILOAN_SATUAN') {
                html += `
                    <div class="receipt-item-row">
                        <span>${i.name} &times; ${i.qty}</span>
                        <span></span>
                    </div>
                `;
            } else {
                html += `
                    <div class="receipt-item-row" style="margin-bottom: 0.5rem;">
                        <div>
                            <div>${i.name}</div>
                            <div class="text-xs text-gray">${i.qty} x ${formatCurrency(i.unitPrice)}</div>
                        </div>
                        <span>${formatCurrency(i.subtotal)}</span>
                    </div>
                `;
            }
        });
        html += `</div>`;
    }

    html += `
            <div class="dashed-divider"></div>
            
            <div class="flex justify-between align-center mt-2">
                <span class="text-gray text-sm">Total Item: ${trx.totalItem} pcs</span>
                <div class="text-right">
                    <div class="text-xs text-gray font-bold uppercase">Total Keseluruhan</div>
                    <div class="text-primary font-bold" style="font-size: 1.5rem; letter-spacing: -0.025em;">${formatCurrency(trx.grandTotal)}</div>
                </div>
            </div>
        </div>
    `;

    container.innerHTML = html;
};

document.getElementById('btn-back-detail').addEventListener('click', () => navigateTo('transaction-list'));

document.getElementById('btn-delete-trx').addEventListener('click', () => {
    if(!currentViewedTrxId) return;
    const trx = db.transactions.find(t => t.id === currentViewedTrxId);
    showConfirm('Hapus Transaksi', `Anda yakin ingin menghapus transaksi ${trx.invoiceNumber} secara permanen?`, () => {
        // Kurangi statistik pelanggan
        const customer = db.customers.find(c => c.id === trx.customerId);
        if (customer) {
            customer.totalTransactions = Math.max(0, customer.totalTransactions - 1);
            customer.totalSpent = Math.max(0, customer.totalSpent - trx.grandTotal);
        }
        
        // Hapus transaksi
        db.transactions = db.transactions.filter(t => t.id !== currentViewedTrxId);
        saveDB();
        showToast('Transaksi berhasil dihapus');
        navigateTo('transaction-list');
    });
});

document.getElementById('btn-mark-paid').addEventListener('click', () => {
    if(!currentViewedTrxId) return;
    const trx = db.transactions.find(t => t.id === currentViewedTrxId);
    showConfirm('Konfirmasi Pembayaran', 'Tandai transaksi ini Lunas?', () => {
        trx.paymentStatus = 'LUNAS';
        saveDB();
        showToast('Status Pembayaran diupdate');
        viewTransactionDetail(currentViewedTrxId); // reload view
    });
});

document.getElementById('detail-laundry-status').addEventListener('change', (e) => {
    if(!currentViewedTrxId) return;
    const trx = db.transactions.find(t => t.id === currentViewedTrxId);
    trx.laundryStatus = e.target.value;
    saveDB();
    showToast('Status Laundry diupdate');
    viewTransactionDetail(currentViewedTrxId);
});

// --- Print Logic ---
document.getElementById('btn-print-trx').addEventListener('click', () => {
    if(!currentViewedTrxId) return;
    const trx = db.transactions.find(t => t.id === currentViewedTrxId);
    
    const container = document.getElementById('print-container');
    
    // Generate 3 copies
    const copies = [
        { label: 'SALINAN PELANGGAN', class: 'copy-cust' },
        { label: 'SALINAN LAUNDRY', class: 'copy-laundry' },
        { label: 'SALINAN ARSIP', class: 'copy-archive' }
    ];

    let content = `<div class="print-layout">`;
    
    copies.forEach((copy, index) => {
        let copyHtml = `
            <div class="print-copy ${copy.class}">
                <div class="copy-label">${copy.label}</div>
                <h2>${db.settings.laundryProfile.name}</h2>
                <div style="text-align:center; font-size:10px; margin-bottom:10px;">
                    ${db.settings.laundryProfile.address}<br>
                    Telp: ${db.settings.laundryProfile.phone}
                </div>
                
                <div class="print-row"><span>Nota:</span><span>${trx.invoiceNumber}</span></div>
                <div class="print-row"><span>Tgl:</span><span>${formatDate(trx.date)}</span></div>
                <div class="print-row"><span>Plgn:</span><span>${trx.customerName}</span></div>
                
                <div class="print-divider"></div>
        `;

        if (trx.type === 'KILOAN' || trx.type === 'KILOAN_SATUAN') {
            copyHtml += `
                <div style="font-weight:bold;">KILOAN</div>
                <div class="print-row">
                    ${trx.type === 'KILOAN_SATUAN' ? `
                        <span>Berat Kiloan</span>
                        <span>${trx.kiloDetail.weight} Kg</span>
                    ` : `
                        <span>${trx.kiloDetail.weight} Kg x ${formatCurrency(trx.kiloDetail.pricePerKg)}</span>
                        <span>${formatCurrency(trx.kiloDetail.subtotal)}</span>
                    `}
                </div>
                <div style="font-size:10px;">Total Pakaian: ${trx.kiloDetail.totalItemCount} pcs</div>
            `;
            if (trx.kiloDetail.items && trx.kiloDetail.items.length > 0) {
                copyHtml += `<div style="font-size:10px; margin-top:2px;">Detail Pakaian:`;
                trx.kiloDetail.items.forEach(i => {
                    copyHtml += `<div>- ${i.name} (${i.qty} pcs)</div>`;
                });
                copyHtml += `</div>`;
            }
            if(trx.type === 'KILOAN_SATUAN') copyHtml += `<div class="print-divider"></div>`;
        }

        if (trx.type === 'SATUAN' || trx.type === 'KILOAN_SATUAN') {
            copyHtml += `<div style="font-weight:bold;">SATUAN</div>`;
            copyHtml += `<table class="print-items">`;
            trx.unitDetail.items.forEach(i => {
                if (trx.type === 'KILOAN_SATUAN') {
                    copyHtml += `
                        <tr>
                            <td>- ${i.name}</td>
                            <td style="text-align:right;">${i.qty} pcs</td>
                        </tr>
                    `;
                } else {
                    copyHtml += `
                        <tr>
                            <td colspan="2">- ${i.name}</td>
                        </tr>
                        <tr>
                            <td style="padding-left:10px; color:#555;">${i.qty} x ${formatCurrency(i.unitPrice)}</td>
                            <td style="text-align:right;">${formatCurrency(i.subtotal)}</td>
                        </tr>
                    `;
                }
            });
            copyHtml += `</table>`;
        }

        copyHtml += `
                <div class="print-divider"></div>
                <div class="print-row print-total-section">
                    <span>TOTAL</span>
                    <span>${formatCurrency(trx.grandTotal)}</span>
                </div>
                
                <div class="print-status">
                    ${trx.paymentStatus}
                </div>
                <div style="text-align:center; font-size:10px; margin-top:10px;">
                    Terima Kasih
                </div>
            </div>
        `;
        
        content += copyHtml;
    });

    content += `</div>`;
    container.innerHTML = content;
    
    window.print();
});

