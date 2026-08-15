// Navigation
document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        
        // Remove active class from all
        document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
        // Add active class to clicked
        e.currentTarget.classList.add('active');

        const viewId = e.currentTarget.dataset.view;
        const title = e.currentTarget.dataset.title;
        navigateTo(viewId, title);

        // Close sidebar on mobile
        document.querySelector('.sidebar').classList.remove('open');
        document.getElementById('sidebar-overlay').classList.remove('open');
    });
});

// Mobile Sidebar Toggle
document.getElementById('btn-sidebar-toggle').addEventListener('click', () => {
    document.querySelector('.sidebar').classList.add('open');
    document.getElementById('sidebar-overlay').classList.add('open');
});

document.getElementById('sidebar-overlay').addEventListener('click', () => {
    document.querySelector('.sidebar').classList.remove('open');
    document.getElementById('sidebar-overlay').classList.remove('open');
});

function navigateTo(viewId, title = '') {
    document.querySelectorAll('.view').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    
    document.getElementById(`view-${viewId}`).classList.add('active');
    
    // active nav
    const navItem = document.querySelector(`.nav-item[data-view="${viewId}"]`);
    if(navItem) navItem.classList.add('active');
    
    if(title) {
        document.getElementById('page-title').innerText = title;
    } else if(navItem) {
        document.getElementById('page-title').innerText = navItem.dataset.title;
    }

    // Call renderers based on view
    if (viewId === 'dashboard') renderDashboard();
    if (viewId === 'transaction-list') renderTransactionList();
    if (viewId === 'customers') renderCustomers();
    if (viewId === 'reports') renderReports();
    if (viewId === 'settings' || viewId === 'services') renderSettings();
    if (viewId === 'create-transaction') initCreateTransaction();
}

// --- Renderers ---
// Timer for Topbar clock
setInterval(() => {
    const d = new Date();
    document.getElementById('current-date').innerText = d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}, 1000);

