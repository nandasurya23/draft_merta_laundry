// Utilities
window.debounce = function(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

function generateId() {
    return Math.random().toString(36).substr(2, 9);
}

function generateInvoiceNumber() {
    return 'TRX-' + Date.now().toString().slice(-6);
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
}

function formatDate(isoString) {
    const d = new Date(isoString);
    return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

function showToast(message, isError = false) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${isError ? 'error' : ''}`;
    toast.innerText = message;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.animation = 'fadeOut 0.3s ease forwards';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function parseCurrencyValue(str) {
    if (!str) return 0;
    return parseInt(str.toString().replace(/\D/g, ''), 10) || 0;
}

window.formatCurrencyInput = function(input) {
    let num = input.value.replace(/\D/g, '');
    if (num === '') {
        input.value = '';
        return;
    }
    input.value = new Intl.NumberFormat('id-ID').format(num);
};

// Global prevent negative, e, + on type="number"
document.addEventListener('keydown', function(e) {
    if (e.target.type === 'number') {
        if (e.key === '-' || e.key === 'e' || e.key === 'E' || e.key === '+') {
            e.preventDefault();
        }
    }
});

// --- Custom UI Utilities ---

window.showConfirm = function(title, message, onConfirm) {
    const modal = document.getElementById('custom-modal');
    document.getElementById('modal-title').innerText = title;
    document.getElementById('modal-message').innerText = message;
    
    const btnCancel = document.getElementById('btn-modal-cancel');
    const btnConfirm = document.getElementById('btn-modal-confirm');
    
    // Replace nodes to remove old event listeners
    const newBtnCancel = btnCancel.cloneNode(true);
    const newBtnConfirm = btnConfirm.cloneNode(true);
    btnCancel.parentNode.replaceChild(newBtnCancel, btnCancel);
    btnConfirm.parentNode.replaceChild(newBtnConfirm, btnConfirm);

    newBtnCancel.addEventListener('click', () => {
        modal.classList.add('hidden');
    });
    
    newBtnConfirm.addEventListener('click', () => {
        modal.classList.add('hidden');
        if(onConfirm) onConfirm();
    });

    modal.classList.remove('hidden');
};

window.initCustomDropdowns = function() {
    document.querySelectorAll('select').forEach(select => {
        if (select.nextElementSibling && select.nextElementSibling.classList.contains('custom-select-wrapper')) {
            select.nextElementSibling.remove();
        }
        select.style.display = 'none';

        const wrapper = document.createElement('div');
        wrapper.className = 'custom-select-wrapper';
        if (select.style.width) {
            wrapper.style.width = select.style.width;
        }

        const display = document.createElement('div');
        display.className = 'custom-select';
        
        const selectedOption = select.options[select.selectedIndex];
        display.innerHTML = `<span>${selectedOption ? selectedOption.text : 'Pilih...'}</span><span class="material-icons-outlined text-gray">expand_more</span>`;

        const optionsContainer = document.createElement('div');
        optionsContainer.className = 'custom-select-options';

        Array.from(select.options).forEach((opt, idx) => {
            const optionDiv = document.createElement('div');
            optionDiv.className = 'custom-option' + (idx === select.selectedIndex ? ' selected' : '');
            optionDiv.innerText = opt.text;
            optionDiv.addEventListener('click', (e) => {
                e.stopPropagation();
                select.selectedIndex = idx;
                display.querySelector('span').innerText = opt.text;
                wrapper.classList.remove('open');
                
                optionsContainer.querySelectorAll('.custom-option').forEach(o => o.classList.remove('selected'));
                optionDiv.classList.add('selected');

                const event = new Event('change', { bubbles: true });
                select.dispatchEvent(event);
            });
            optionsContainer.appendChild(optionDiv);
        });

        display.addEventListener('click', (e) => {
            e.stopPropagation();
            document.querySelectorAll('.custom-select-wrapper').forEach(w => {
                if (w !== wrapper) w.classList.remove('open');
            });
            wrapper.classList.toggle('open');
        });

        wrapper.appendChild(display);
        wrapper.appendChild(optionsContainer);
        select.parentNode.insertBefore(wrapper, select.nextSibling);
    });
};

document.addEventListener('click', () => {
    document.querySelectorAll('.custom-select-wrapper').forEach(w => w.classList.remove('open'));
});


function getBadgeHTML(status, type) {
    if (type === 'payment') {
        return status === 'LUNAS' ? '<span class="badge badge-success">Lunas</span>' : '<span class="badge badge-danger">Belum Bayar</span>';
    } else {
        const map = {
            'DITERIMA': 'badge-gray',
            'DIPROSES': 'badge-warning',
            'SELESAI': 'badge-info',
            'DIAMBIL': 'badge-success'
        };
        const textMap = { 'DITERIMA':'Diterima', 'DIPROSES':'Diproses', 'SELESAI':'Selesai', 'DIAMBIL':'Diambil' };
        return `<span class="badge ${map[status] || 'badge-gray'}">${textMap[status] || status}</span>`;
    }
}

