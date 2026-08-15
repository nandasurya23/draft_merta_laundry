// Initialization
document.querySelectorAll('.nav-item').forEach(el => {
    el.addEventListener('click', (e) => {
        e.preventDefault();
        navigateTo(e.target.dataset.view);
    });
});

document.getElementById('btn-create-trx-dash').addEventListener('click', () => navigateTo('create-transaction'));
document.getElementById('btn-create-trx-list').addEventListener('click', () => navigateTo('create-transaction'));

document.getElementById('filter-date').addEventListener('change', renderTransactionList);
document.getElementById('filter-payment').addEventListener('change', renderTransactionList);
document.getElementById('filter-status').addEventListener('change', renderTransactionList);

document.getElementById('search-trx').addEventListener('input', window.debounce(renderTransactionList, 300));
document.getElementById('search-customer').addEventListener('input', window.debounce(renderCustomers, 300));

// Init specific UI
initCustomDropdowns();

// App Start
loadDB();
navigateTo('dashboard');
