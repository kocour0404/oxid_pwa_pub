// State
const state = {
    authenticated: false,
    csrfToken: '',
    user: null,
    orders: [],
    selectedOrder: null,
    currentView: 'loading-view'
};

// DOM Elements
const views = {
    loading: document.getElementById('loading-view'),
    login: document.getElementById('login-view'),
    dashboard: document.getElementById('dashboard-view'),
    orders: document.getElementById('orders-view'),
    settings: document.getElementById('settings-view'),
    orderSearch: document.getElementById('order-search-view')
};

// Nav & Sidebar
const headerLogoutBtn = document.getElementById('header-logout-btn');
const burgerBtn = document.getElementById('burger-btn');
const sidebar = document.getElementById('sidebar');
const closeSidebarBtn = document.getElementById('close-sidebar-btn');
const sidebarOverlay = document.getElementById('sidebar-overlay');
const navLinks = document.querySelectorAll('.nav-link');
const userNameDisplay = document.getElementById('user-name-display');

// Login
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');
const logoutBtn = document.getElementById('logout-btn');

// Dashboard
const tileOrders = document.getElementById('tile-orders');
const tileSearch = document.getElementById('tile-search');
const tileSettings = document.getElementById('tile-settings');

// Orders
const refreshOrdersBtn = document.getElementById('refresh-orders-btn');
const ordersList = document.getElementById('orders-list');
const orderDetail = document.getElementById('order-detail');
const detailTitle = document.getElementById('detail-title');
const detailContent = document.getElementById('detail-content');
const errorMessage = document.getElementById('error-message');

// Order Search
const orderSearchForm = document.getElementById('order-search-form');
const searchError = document.getElementById('search-error');
const searchResultContainer = document.getElementById('search-result-container');
const searchDetailTitle = document.getElementById('search-detail-title');
const searchDetailContent = document.getElementById('search-detail-content');

// Settings
const settingsForm = document.getElementById('settings-form');
const settingsMsg = document.getElementById('settings-msg');

// API Helpers
async function apiGet(op, params = {}) {
    const url = new URL('../api/api.php', window.location.href);
    url.searchParams.append('op', op);
    for (const [key, value] of Object.entries(params)) {
        url.searchParams.append(key, value);
    }
    const response = await fetch(url, {
        method: 'GET',
        credentials: 'same-origin',
        headers: { 'Accept': 'application/json' }
    });
    return response.json();
}

async function apiPost(op, payload = {}) {
    const url = new URL('../api/api.php', window.location.href);
    url.searchParams.append('op', op);
    const response = await fetch(url, {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'X-CSRF-Token': state.csrfToken
        },
        body: JSON.stringify(payload)
    });
    return response.json();
}

// Logic
async function checkSession() {
    try {
        const data = await apiGet('session');
        if (data.ok && data.authenticated) {
            state.authenticated = true;
            state.user = data.user;
            state.csrfToken = data.csrf;
            userNameDisplay.textContent = state.user.name;
            switchView('dashboard-view');
        } else {
            switchView('login-view');
        }
    } catch (e) {
        switchView('login-view');
    }
}

async function login(username, password) {
    try {
        const data = await apiPost('login', { username, password });
        if (data.ok) {
            state.authenticated = true;
            state.user = data.user;
            state.csrfToken = data.csrf;
            userNameDisplay.textContent = state.user.name;
            loginError.textContent = '';
            switchView('dashboard-view');
        } else {
            loginError.textContent = 'Login fehlgeschlagen: ' + (data.error || 'Unbekannt');
        }
    } catch (e) {
        loginError.textContent = 'Netzwerkfehler beim Login.';
    }
}

async function logout() {
    try {
        await apiPost('logout');
        state.authenticated = false;
        state.user = null;
        state.csrfToken = '';
        state.orders = [];
        state.selectedOrder = null;
        closeSidebar();
        switchView('login-view');
    } catch (e) {
        alert('Fehler beim Logout.');
    }
}

async function loadNewOrders(page = 1) {
    errorMessage.textContent = '';
    ordersList.innerHTML = '<div class="spinner" style="margin-top: 40px;"></div>';
    orderDetail.style.display = 'none';
    const paginationControls = document.getElementById('pagination-controls');
    if (paginationControls) paginationControls.style.display = 'none';
    
    try {
        const data = await apiGet('orders.new', { page });
        if (data.ok) {
            state.orders = data.orders;
            renderOrders();
            renderPagination(page, Math.ceil(data.total / 10));
        } else {
            errorMessage.textContent = 'Fehler beim Laden: ' + data.error;
            ordersList.innerHTML = '';
        }
    } catch (e) {
        errorMessage.textContent = 'Netzwerkfehler beim Laden der Bestellungen.';
        ordersList.innerHTML = '';
    }
}

async function loadOrderDetail(id) {
    errorMessage.textContent = '';
    orderDetail.style.display = 'block';
    detailContent.innerHTML = '<div class="spinner" style="margin-top: 20px;"></div>';
    
    document.querySelectorAll('.order-item').forEach(el => el.classList.remove('active'));
    const activeEl = document.getElementById(`order-item-${id}`);
    if (activeEl) activeEl.classList.add('active');

    const order = state.orders.find(o => o.id === id);
    if (order) {
        state.selectedOrder = order;
        renderOrderDetail();
    }
}

async function loadConfig() {
    settingsMsg.textContent = 'Lade Einstellungen...';
    settingsMsg.className = 'success-msg';
    try {
        const data = await apiGet('config.get');
        if (data.ok) {
            const conf = data.config;
            settingsForm.shop_db_host.value = conf.shop_db_host || '';
            settingsForm.shop_db_user.value = conf.shop_db_user || '';
            settingsForm.shop_db_pass.value = conf.shop_db_pass || '';
            settingsForm.shop_db_name.value = conf.shop_db_name || '';
            settingsMsg.textContent = '';
        } else {
            settingsMsg.className = 'error-msg';
            settingsMsg.textContent = 'Fehler beim Laden der Einstellungen.';
        }
    } catch (e) {
        settingsMsg.className = 'error-msg';
        settingsMsg.textContent = 'Netzwerkfehler.';
    }
}

async function saveConfig() {
    settingsMsg.textContent = 'Speichere...';
    settingsMsg.className = 'success-msg';
    const payload = {
        shop_db_host: settingsForm.shop_db_host.value,
        shop_db_user: settingsForm.shop_db_user.value,
        shop_db_pass: settingsForm.shop_db_pass.value,
        shop_db_name: settingsForm.shop_db_name.value
    };
    try {
        const data = await apiPost('config.set', payload);
        if (data.ok) {
            settingsMsg.textContent = 'Erfolgreich gespeichert!';
        } else {
            settingsMsg.className = 'error-msg';
            settingsMsg.textContent = 'Fehler beim Speichern.';
        }
    } catch (e) {
        settingsMsg.className = 'error-msg';
        settingsMsg.textContent = 'Netzwerkfehler.';
    }
}

async function searchOrder(orderNr) {
    searchError.textContent = '';
    searchResultContainer.style.display = 'block';
    searchDetailContent.innerHTML = '<div class="spinner"></div>';
    searchDetailTitle.textContent = 'Suche läuft...';

    try {
        const data = await apiGet('order.search', { order_nr: orderNr });
        if (data.ok && data.order) {
            const order = data.order;
            searchDetailTitle.textContent = `Gefunden: Bestellung #${order.order_nr}`;
            
            let badgesHtml = '';
            const isStorno = order.storno == 1;
            const isPaid = order.paid && order.paid !== '0000-00-00 00:00:00';
            const isShipped = order.senddate && order.senddate !== '0000-00-00 00:00:00';
            if (isStorno) badgesHtml += '<span class="badge badge-storno">Storno</span>';
            if (isPaid) badgesHtml += '<span class="badge badge-paid">Bezahlt</span>';
            if (isShipped) badgesHtml += '<span class="badge badge-shipped">Versendet</span>';
            
            let html = badgesHtml ? `<p>${badgesHtml}</p>` : '';
            html += `<p><strong>Kunde:</strong> ${order.customer} (Nr. ${order.customer_nr || '-'})</p>`;
            html += `<p><strong>Datum:</strong> ${order.created_at}</p>`;
            html += `<p><strong>Status:</strong> ${order.status}</p>`;
            
            const total = Number(order.total).toFixed(2).replace('.', ',');
            const shipping = Number(order.shipping).toFixed(2).replace('.', ',');
            html += `<p><strong>Summe:</strong> ${total} &euro; (inkl. ${shipping} &euro; Versand)</p>`;
            
            if (order.items && order.items.length > 0) {
                html += `<p><strong>Artikel:</strong></p><ul>`;
                order.items.forEach(item => {
                    const p = Number(item.price).toFixed(2).replace('.', ',');
                    html += `<li>${item.qty}x ${item.name} (${p} &euro;)</li>`;
                });
                html += `</ul>`;
            }
            searchDetailContent.innerHTML = html;
        } else {
            searchDetailTitle.textContent = 'Nicht gefunden';
            searchDetailContent.innerHTML = '<p>Die Bestellung wurde nicht gefunden.</p>';
        }
    } catch (e) {
        searchDetailTitle.textContent = 'Fehler';
        searchDetailContent.innerHTML = '<p class="error-msg">Netzwerkfehler oder Datenbankfehler.</p>';
    }
}

// Render Helpers
function switchView(viewId) {
    state.currentView = viewId;
    Object.values(views).forEach(v => {
        if (v) v.style.display = 'none';
    });
    const activeView = views[viewId.replace('-view', '')] || document.getElementById(viewId);
    if (activeView) activeView.style.display = 'block';
    
    navLinks.forEach(link => {
        link.classList.toggle('active', link.dataset.target === viewId);
    });

    if (headerLogoutBtn) {
        headerLogoutBtn.style.display = state.authenticated ? 'flex' : 'none';
    }

    if (viewId === 'orders-view' && state.orders.length === 0) {
        loadNewOrders();
    }
    if (viewId === 'settings-view') {
        loadConfig();
    }
}

function renderOrders() {
    ordersList.innerHTML = '';
    if (state.orders.length === 0) {
        ordersList.innerHTML = '<p class="text-muted" style="padding: 16px;">Keine neuen Bestellungen gefunden.</p>';
        return;
    }
    state.orders.forEach(order => {
        const div = document.createElement('div');
        div.className = 'order-item';
        div.id = `order-item-${order.id}`;
        if (state.selectedOrder && state.selectedOrder.id === order.id) {
            div.classList.add('active');
        }
        
        const price = Number(order.total).toFixed(2).replace('.', ',');
        const shipping = Number(order.shipping || 0).toFixed(2).replace('.', ',');
        
        let badgesHtml = '';
        const isStorno = order.storno == 1;
        const isPaid = order.paid && order.paid !== '0000-00-00 00:00:00';
        const isShipped = order.senddate && order.senddate !== '0000-00-00 00:00:00';

        if (isStorno) badgesHtml += '<span class="badge badge-storno">Storno</span>';
        if (isPaid) badgesHtml += '<span class="badge badge-paid">Bezahlt</span>';
        if (isShipped) badgesHtml += '<span class="badge badge-shipped">Versendet</span>';
        
        div.innerHTML = `
            <div class="order-item-header">
                <span>#${order.order_nr}</span>
                <span>${price} &euro;</span>
            </div>
            ${badgesHtml ? `<div class="order-item-meta" style="margin-bottom: 4px;">${badgesHtml}</div>` : ''}
            <div class="order-item-meta">${order.customer} (Kdnr: ${order.customer_nr || '-'})</div>
            <div class="order-item-meta" style="font-size: 0.75rem; color: #999;">${order.created_at} &bull; Versand: ${shipping} &euro;</div>
        `;
        div.onclick = () => loadOrderDetail(order.id);
        ordersList.appendChild(div);
    });
}

function renderPagination(currentPage, totalPages) {
    const container = document.getElementById('pagination-controls');
    if (!container) return;
    container.innerHTML = '';
    if (totalPages <= 1) {
        container.style.display = 'none';
        return;
    }
    container.style.display = 'flex';

    const prevBtn = document.createElement('button');
    prevBtn.className = 'page-btn';
    prevBtn.textContent = 'Zurück';
    prevBtn.disabled = currentPage === 1;
    prevBtn.onclick = () => loadNewOrders(currentPage - 1);
    container.appendChild(prevBtn);

    const info = document.createElement('span');
    info.style.fontSize = '0.875rem';
    info.style.color = 'var(--text-muted)';
    info.textContent = `Seite ${currentPage} von ${totalPages}`;
    container.appendChild(info);

    const nextBtn = document.createElement('button');
    nextBtn.className = 'page-btn';
    nextBtn.textContent = 'Weiter';
    nextBtn.disabled = currentPage === totalPages;
    nextBtn.onclick = () => loadNewOrders(currentPage + 1);
    container.appendChild(nextBtn);
}

function renderOrderDetail() {
    if (!state.selectedOrder) return;
    const order = state.selectedOrder;
    detailTitle.textContent = `Bestellung #${order.order_nr}`;
    
    let badgesHtml = '';
    const isStorno = order.storno == 1;
    const isPaid = order.paid && order.paid !== '0000-00-00 00:00:00';
    const isShipped = order.senddate && order.senddate !== '0000-00-00 00:00:00';
    if (isStorno) badgesHtml += '<span class="badge badge-storno">Storno</span>';
    if (isPaid) badgesHtml += '<span class="badge badge-paid">Bezahlt</span>';
    if (isShipped) badgesHtml += '<span class="badge badge-shipped">Versendet</span>';
    
    let html = badgesHtml ? `<p>${badgesHtml}</p>` : '';
    html += `<p><strong>Kunde:</strong> ${order.customer} (Kdnr: ${order.customer_nr || '-'})</p>`;
    html += `<p><strong>Datum:</strong> ${order.created_at}</p>`;
    html += `<p><strong>Status:</strong> ${order.status}</p>`;
    
    const total = Number(order.total).toFixed(2).replace('.', ',');
    const shipping = Number(order.shipping).toFixed(2).replace('.', ',');
    html += `<p><strong>Summe:</strong> ${total} &euro; (Versand: ${shipping} &euro;)</p>`;
    
    if (order.items && order.items.length > 0) {
        html += `<p><strong>Artikel:</strong></p><ul>`;
        order.items.forEach(item => {
            const p = Number(item.price).toFixed(2).replace('.', ',');
            html += `<li>${item.qty}x ${item.name} (${p} &euro;)</li>`;
        });
        html += `</ul>`;
    }
    detailContent.innerHTML = html;
}

// Sidebar Logic
function openSidebar() {
    if (!state.authenticated) return;
    sidebar.classList.add('open');
    sidebarOverlay.classList.add('open');
}
function closeSidebar() {
    sidebar.classList.remove('open');
    sidebarOverlay.classList.remove('open');
}

burgerBtn.addEventListener('click', openSidebar);
closeSidebarBtn.addEventListener('click', closeSidebar);
sidebarOverlay.addEventListener('click', closeSidebar);

navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const target = e.currentTarget.dataset.target;
        switchView(target);
        closeSidebar();
    });
});

tileOrders.addEventListener('click', () => switchView('orders-view'));
tileSearch.addEventListener('click', () => switchView('order-search-view'));
tileSettings.addEventListener('click', () => switchView('settings-view'));

// Event Listeners
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const username = loginForm.username.value;
    const password = loginForm.password.value;
    login(username, password);
});

logoutBtn.addEventListener('click', logout);
if (headerLogoutBtn) headerLogoutBtn.addEventListener('click', logout);
refreshOrdersBtn.addEventListener('click', loadNewOrders);

settingsForm.addEventListener('submit', (e) => {
    e.preventDefault();
    saveConfig();
});

orderSearchForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const nr = document.getElementById('search-order-nr').value;
    searchOrder(nr);
});

// Register Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js').catch(err => {
            console.error('SW registration failed:', err);
        });
    });
}

// Init
checkSession();
