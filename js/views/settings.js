// --- Settings ---
function renderSettings() {
    document.getElementById('set-name').value = db.settings.laundryProfile.name;
    document.getElementById('set-address').value = db.settings.laundryProfile.address;
    document.getElementById('set-phone').value = db.settings.laundryProfile.phone;

    renderSettingsPrices('set-kilo-prices', db.settings.kiloanPrices, 'kiloanPrices');
    renderSettingsPrices('set-unit-prices', db.settings.satuanPrices, 'satuanPrices');
}

function renderSettingsPrices(containerId, list, type) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    
    if (list.length === 0) {
        container.innerHTML = `<tr><td colspan="3" class="text-center text-gray py-4">Belum ada layanan.</td></tr>`;
        return;
    }

    list.forEach((item, index) => {
        container.innerHTML += `
            <tr class="hover-bg-light">
                <td class="p-0">
                    <input type="text" class="form-control input-seamless w-full" placeholder="Nama Layanan" value="${item.name}" onchange="updateSettingPrice('${type}', ${index}, 'name', this.value)">
                </td>
                <td class="p-0">
                    <input type="text" inputmode="numeric" class="form-control input-seamless w-full" placeholder="0" value="${item.price ? new Intl.NumberFormat('id-ID').format(item.price) : '0'}" oninput="formatCurrencyInput(this)" onchange="updateSettingPrice('${type}', ${index}, 'price', this.value)">
                </td>
                <td class="text-center p-0">
                    <button type="button" class="btn btn-sm text-gray hover:text-danger" style="background:transparent; border:none; box-shadow:none; padding: 0.5rem;" onclick="removeSettingPrice('${type}', ${index})" title="Hapus">
                        <span class="material-icons-outlined" style="font-size: 20px;">delete</span>
                    </button>
                </td>
            </tr>
        `;
    });
}

window.updateSettingPrice = (type, index, field, value) => {
    db.settings[type][index][field] = field === 'price' ? parseCurrencyValue(value) : value;
};

window.removeSettingPrice = (type, index) => {
    db.settings[type].splice(index, 1);
    renderSettings();
};

document.getElementById('btn-add-kilo-price').addEventListener('click', () => {
    db.settings.kiloanPrices.push({ id: generateId(), name: 'Baru', price: 0 });
    renderSettings();
});

document.getElementById('btn-add-unit-price').addEventListener('click', () => {
    db.settings.satuanPrices.push({ id: generateId(), name: 'Baru', price: 0 });
    renderSettings();
});

document.getElementById('form-settings').addEventListener('submit', (e) => {
    e.preventDefault();
    db.settings.laundryProfile.name = document.getElementById('set-name').value;
    db.settings.laundryProfile.address = document.getElementById('set-address').value;
    db.settings.laundryProfile.phone = document.getElementById('set-phone').value;
    saveDB();
    showToast('Pengaturan profil berhasil disimpan');
});

document.getElementById('form-services').addEventListener('submit', (e) => {
    e.preventDefault();
    saveDB();
    showToast('Daftar layanan & harga berhasil disimpan');
});

document.getElementById('btn-reset-settings').addEventListener('click', () => {
    showConfirm('Peringatan Reset', 'Anda yakin mereset seluruh database (Transaksi, Pelanggan, Pengaturan)? Ini tidak bisa dibatalkan.', () => {
        localStorage.removeItem(DB_KEY);
        location.reload();
    });
});


