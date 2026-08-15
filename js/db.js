// Constants & Init
const DB_KEY = 'merta_laundry_db';
let db = {
    transactions: [],
    customers: [],
    settings: {
        laundryProfile: { name: 'Merta Laundry', address: 'Jl. Raya Sudirman No. 88', phone: '081234567890' },
        kiloanPrices: [
            { id: generateId(), name: 'Cuci Kering', price: 6000 },
            { id: generateId(), name: 'Cuci + Setrika', price: 8000 },
            { id: generateId(), name: 'Setrika Saja', price: 5000 },
            { id: generateId(), name: 'Express 24 Jam', price: 12000 }
        ],
        satuanPrices: [
            { id: generateId(), name: 'Selimut Tipis', price: 15000 },
            { id: generateId(), name: 'Bed Cover Besar', price: 35000 },
            { id: generateId(), name: 'Jas / Safari', price: 25000 },
            { id: generateId(), name: 'Sepatu Sneaker', price: 30000 },
            { id: generateId(), name: 'Karpet / Meter', price: 15000 }
        ]
    }
};

// LocalStorage DB
function loadDB() {
    const data = localStorage.getItem(DB_KEY);
    if (data) {
        db = JSON.parse(data);
        
        // Auto-fix legacy data (e.g. if older mock data used createdAt instead of date)
        if (db.transactions && db.transactions.length > 0 && !db.transactions[0].date) {
            generateMockData();
            saveDB();
        } else if (db.transactions.length === 0 && db.customers.length === 0) {
            generateMockData();
            saveDB();
        }
    } else {
        generateMockData();
        saveDB(); // Save defaults
    }
}

function generateMockData() {
    db.customers = [
        { id: generateId(), name: 'Bapak Budi', phone: '0811111111', totalTransactions: 2, totalSpent: 75000, joinedAt: new Date(Date.now() - 86400000 * 5).toISOString() },
        { id: generateId(), name: 'Ibu Siti', phone: '0822222222', totalTransactions: 1, totalSpent: 35000, joinedAt: new Date(Date.now() - 86400000 * 2).toISOString() },
        { id: generateId(), name: 'Andi', phone: '0833333333', totalTransactions: 1, totalSpent: 120000, joinedAt: new Date(Date.now() - 86400000 * 1).toISOString() }
    ];

    const today = new Date().toISOString();
    const yesterday = new Date(Date.now() - 86400000).toISOString();
    const twoDaysAgo = new Date(Date.now() - 86400000 * 2).toISOString();

    db.transactions = [
        {
            id: generateId(),
            invoiceNumber: 'TRX-918273',
            date: twoDaysAgo,
            customerId: db.customers[0].id,
            customerName: db.customers[0].name,
            customerPhone: db.customers[0].phone,
            type: 'KILOAN',
            grandTotal: 40000,
            totalItem: 15,
            paymentStatus: 'LUNAS',
            laundryStatus: 'SELESAI',
            kiloDetail: {
                weight: 5, pricePerKg: 8000, subtotal: 40000, totalItemCount: 15,
                items: [{ id: generateId(), name: 'Kemeja', qty: 5 }, { id: generateId(), name: 'Kaos', qty: 10 }]
            }
        },
        {
            id: generateId(),
            invoiceNumber: 'TRX-192837',
            date: yesterday,
            customerId: db.customers[1].id,
            customerName: db.customers[1].name,
            customerPhone: db.customers[1].phone,
            type: 'SATUAN',
            grandTotal: 35000,
            totalItem: 1,
            paymentStatus: 'BELUM_BAYAR',
            laundryStatus: 'DIPROSES',
            unitDetail: {
                items: [{ name: 'Bed Cover Besar', qty: 1, unitPrice: 35000, subtotal: 35000 }],
                subtotal: 35000
            }
        },
        {
            id: generateId(),
            invoiceNumber: 'TRX-564738',
            date: today,
            customerId: db.customers[2].id,
            customerName: db.customers[2].name,
            customerPhone: db.customers[2].phone,
            type: 'KILOAN_SATUAN',
            grandTotal: 54000,
            totalItem: 11,
            paymentStatus: 'LUNAS',
            laundryStatus: 'DITERIMA',
            kiloDetail: {
                weight: 3, pricePerKg: 8000, subtotal: 24000, totalItemCount: 10,
                items: [{ id: generateId(), name: 'Baju campur', qty: 10 }]
            },
            unitDetail: {
                items: [{ name: 'Sepatu Sneaker', qty: 1, unitPrice: 30000, subtotal: 30000 }],
                subtotal: 30000
            }
        }
    ];
}

function saveDB() {
    localStorage.setItem(DB_KEY, JSON.stringify(db));
}

