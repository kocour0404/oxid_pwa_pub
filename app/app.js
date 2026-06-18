// Security: HTML Escaping to prevent XSS
function escapeHtml(unsafe) {
    if (unsafe === null || unsafe === undefined) return '';
    return String(unsafe)
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
}

// State
const state = {
    authenticated: false,
    csrfToken: '',
    user: null,
    orders: [],
    selectedOrder: null,
    customers: [],
    selectedCustomer: null,
    currentView: 'loading-view'
};

// DOM Elements
const views = {
    loading: document.getElementById('loading-view'),
    login: document.getElementById('login-view'),
    dashboard: document.getElementById('dashboard-view'),
    orders: document.getElementById('orders-view'),
    settings: document.getElementById('settings-view'),
    orderSearch: document.getElementById('order-search-view'),
    stats: document.getElementById('stats-view'),
    topseller: document.getElementById('topseller-view'),
    customerHistory: document.getElementById('customer-history-view'),
    customers: document.getElementById('customers-view')
};

// Nav & Sidebar
const mainLogo = document.getElementById('main-logo');
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
const tileStats = document.getElementById('tile-stats');
const tileTopseller = document.getElementById('tile-topseller');
const tileCustomers = document.getElementById('tile-customers');

// Init
function init() {
    state.authenticated = !!getCookie('pwa_sid');
    
    if (state.authenticated) {
        switchView('dashboard-view');
        loadDashboardStats();
    } else {
        switchView('login-view');
    }
}

// Stats Logic
async function loadStats() {
    const statsError = document.getElementById('stats-error');
    const statsLoading = document.getElementById('stats-loading');
    const statsContent = document.getElementById('stats-content');
    const statMonthTotal = document.getElementById('stat-month-total');
    const statYearChart = document.getElementById('stat-year-chart');
    const statMonthChart = document.getElementById('stat-month-chart');

    statsError.textContent = '';
    statsLoading.style.display = 'block';
    statsContent.style.display = 'none';

    try {
        const data = await apiGet('stats.get');
        if (data.ok) {
            // Render month total
            const total = Number(data.current_month).toFixed(2).replace('.', ',');
            statMonthTotal.innerHTML = `${total} &euro;`;
            
            const monthTitle = document.getElementById('stat-month-title');
            if (monthTitle) {
                const mName = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'][data.current_month_num - 1] || 'Laufender Monat';
                monthTitle.textContent = `${mName} ${data.current_year}`;
            }

            // Render Year chart
            statYearChart.innerHTML = '';
            const months = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
            const yearData = data.year_data || [];
            const historyData = data.history_data || [];
            
            const maxValYear = Math.max(...yearData, ...historyData, 1);

            months.forEach((monthName, index) => {
                const valYear = yearData[index] || 0;
                const valHist = historyData[index] || 0;
                
                const pctYear = Math.max((valYear / maxValYear) * 100, 1);
                const pctHist = Math.max((valHist / maxValYear) * 100, 1);
                
                const fmtYear = Number(valYear).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' });
                const fmtHist = Number(valHist).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' });
                
                const col = document.createElement('div');
                col.className = 'chart-col';
                col.title = `${monthName}\nAktuell: ${fmtYear}\nSchnitt Vorjahre: ${fmtHist}`;
                
                const barsContainer = document.createElement('div');
                barsContainer.className = 'chart-bars-container';
                
                const barHist = document.createElement('div');
                barHist.className = 'chart-bar chart-bar-history';
                barHist.style.height = `${pctHist}%`;

                const barYear = document.createElement('div');
                barYear.className = 'chart-bar';
                barYear.style.height = `${pctYear}%`;
                
                barsContainer.appendChild(barHist);
                barsContainer.appendChild(barYear);
                
                const label = document.createElement('div');
                label.className = 'chart-label';
                label.textContent = monthName;
                
                col.appendChild(barsContainer);
                col.appendChild(label);
                statYearChart.appendChild(col);
            });

            // Render Month Chart
            if (statMonthChart) {
                statMonthChart.innerHTML = '';
                const dailyData = data.month_daily_data || [];
                const movingAvg = data.month_moving_avg || [];
                
                const maxValMonth = Math.max(...dailyData, ...movingAvg, 1);
                
                const barsWrapper = document.createElement('div');
                barsWrapper.style.display = 'flex';
                barsWrapper.style.width = '100%';
                barsWrapper.style.height = '100%';
                barsWrapper.style.justifyContent = 'space-between';
                
                const daysCount = dailyData.length;
                
                dailyData.forEach((valDay, index) => {
                    const valAvg = movingAvg[index] || 0;
                    const pctDay = Math.max((valDay / maxValMonth) * 100, 1);
                    
                    const fmtDay = Number(valDay).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' });
                    const fmtAvg = Number(valAvg).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' });
                    const dayNum = index + 1;
                    
                    const col = document.createElement('div');
                    col.className = 'chart-col';
                    col.title = `Tag ${dayNum}\nUmsatz: ${fmtDay}\n30-Tage Ø: ${fmtAvg}`;
                    
                    const barsContainer = document.createElement('div');
                    barsContainer.className = 'chart-bars-container';
                    
                    const barDay = document.createElement('div');
                    barDay.className = 'chart-bar';
                    barDay.style.height = `${pctDay}%`;
                    barDay.style.maxWidth = '8px'; // Narrower bars for daily
                    
                    barsContainer.appendChild(barDay);
                    
                    const label = document.createElement('div');
                    label.className = 'chart-label';
                    label.style.fontSize = '0.6rem';
                    label.textContent = (dayNum % 5 === 0 || dayNum === 1) ? dayNum : '';
                    
                    col.appendChild(barsContainer);
                    col.appendChild(label);
                    barsWrapper.appendChild(col);
                });
                
                // SVG Overlay
                const svgOverlay = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                svgOverlay.setAttribute('class', 'chart-svg-overlay');
                svgOverlay.setAttribute('viewBox', '0 0 100 100');
                svgOverlay.setAttribute('preserveAspectRatio', 'none');
                svgOverlay.style.height = 'calc(100% - 24px)'; // Exclude labels
                
                let pathD = '';
                movingAvg.forEach((valAvg, index) => {
                    const x = (index + 0.5) / daysCount * 100;
                    let y = 100 - ((valAvg / maxValMonth) * 100);
                    if (y < 0) y = 0;
                    if (y > 100) y = 100;
                    
                    if (index === 0) {
                        pathD += `M ${x} ${y} `;
                    } else {
                        pathD += `L ${x} ${y} `;
                    }
                    
                    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                    circle.setAttribute('cx', x);
                    circle.setAttribute('cy', y);
                    circle.setAttribute('r', '0.6');
                    circle.setAttribute('class', 'chart-point');
                    circle.setAttribute('vector-effect', 'non-scaling-stroke');
                    svgOverlay.appendChild(circle);
                });
                
                const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                path.setAttribute('d', pathD);
                path.setAttribute('class', 'chart-line');
                path.setAttribute('vector-effect', 'non-scaling-stroke');
                svgOverlay.insertBefore(path, svgOverlay.firstChild);
                
                statMonthChart.appendChild(barsWrapper);
                statMonthChart.appendChild(svgOverlay);
            }

            statsLoading.style.display = 'none';
            statsContent.style.display = 'block';
        } else {
            statsError.textContent = 'Fehler: ' + data.error;
            statsLoading.style.display = 'none';
        }
    } catch(e) {
        statsError.textContent = 'Netzwerkfehler beim Laden der Statistiken.';
        statsLoading.style.display = 'none';
    }
}

// Top Seller Logic
let currentTsPeriod = 'month';

async function loadTopSellers(period = 'month') {
    currentTsPeriod = period;
    
    // Update active button
    document.querySelectorAll('[id^="btn-ts-"]').forEach(btn => btn.classList.remove('active'));
    const activeBtn = document.getElementById(`btn-ts-${period}`);
    if (activeBtn) activeBtn.classList.add('active');

    const errorEl = document.getElementById('topseller-error');
    const loadingEl = document.getElementById('topseller-loading');
    const listEl = document.getElementById('topseller-list');

    errorEl.textContent = '';
    loadingEl.style.display = 'block';
    listEl.style.display = 'none';

    try {
        const data = await apiGet('stats.topseller', { period });
        if (data.ok) {
            renderTopSellers(data.articles, data.total_top10_qty);
            loadingEl.style.display = 'none';
            listEl.style.display = 'flex';
        } else {
            errorEl.textContent = 'Fehler: ' + data.error;
            loadingEl.style.display = 'none';
        }
    } catch(e) {
        errorEl.textContent = 'Netzwerkfehler beim Laden der Top Seller.';
        loadingEl.style.display = 'none';
    }
}

function renderTopSellers(articles, totalQty) {
    const listEl = document.getElementById('topseller-list');
    listEl.innerHTML = '';

    if (!articles || articles.length === 0) {
        listEl.innerHTML = '<p class="text-muted" style="padding: 16px;">Keine Artikel in diesem Zeitraum verkauft.</p>';
        return;
    }

    articles.forEach((art, index) => {
        const div = document.createElement('div');
        div.className = 'order-item';
        div.style.cursor = 'default';

        const qty = Number(art.qty);
        const revenue = Number(art.revenue).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' });
        const unitPrice = Number(art.unit_price || 0).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' });
        const pct = totalQty > 0 ? (qty / totalQty) * 100 : 0;
        
        div.innerHTML = `
            <div class="order-item-header">
                <span>${index + 1}. ${escapeHtml(art.name)}</span>
                <span>${escapeHtml(qty)}x</span>
            </div>
            <div class="order-item-meta" style="margin-bottom: 8px;">
                Artikel-Nr: ${escapeHtml(art.sku)} &bull; Einzelpreis (Ø): ${unitPrice} &bull; Kumulierter Umsatz: ${revenue}
            </div>
            <div style="width: 100%; background: var(--border-color); height: 4px; border-radius: 2px; overflow: hidden;">
                <div style="width: ${pct}%; background: var(--primary-color); height: 100%;"></div>
            </div>
        `;
        listEl.appendChild(div);
    });
}

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

// Date Search & History DOM
const dateSearchForm = document.getElementById('date-search-form');
const dateSearchResults = document.getElementById('date-search-results');
const customerHistoryView = document.getElementById('customer-history-view');
const customerHistoryResults = document.getElementById('customer-history-results');
const customerHistoryTitle = document.getElementById('customer-history-title');
const customerHistoryError = document.getElementById('customer-history-error');
const customerHistoryBackBtn = document.getElementById('customer-history-back-btn');

// Customers DOM
const customersSearchForm = document.getElementById('customers-search-form');
const customersSearchQuery = document.getElementById('customers-search-query');
const customersError = document.getElementById('customers-error');
const customersLoading = document.getElementById('customers-loading');
const customersList = document.getElementById('customers-list');
const customerDetail = document.getElementById('customer-detail');
const customerDetailTitle = document.getElementById('customer-detail-title');
const customerDetailContent = document.getElementById('customer-detail-content');

// Settings
const settingsForm = document.getElementById('settings-form');
const settingsMsg = document.getElementById('settings-msg');
const cachePruneBtn = document.getElementById('cache-prune-btn');
const cachePruneMsg = document.getElementById('cache-prune-msg');

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
            if (settingsForm.shop_baselink) {
                settingsForm.shop_baselink.value = conf.shop_baselink || '';
            }
            settingsForm.privacy_url.value = conf.privacy_url || '';
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
        shop_db_name: settingsForm.shop_db_name.value,
        shop_baselink: settingsForm.shop_baselink ? settingsForm.shop_baselink.value : '',
        privacy_url: settingsForm.privacy_url.value
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
            const safeCustomer = escapeHtml(order.customer);
            const safeCustomerNr = escapeHtml(order.customer_nr || '-');
            const safeUserId = escapeHtml(order.user_id);
            const customerLink = order.user_id ? `<a href="#" data-userid="${safeUserId}" data-customer="${safeCustomer}" onclick="loadCustomerHistory(this.dataset.userid, this.dataset.customer); return false;">${safeCustomer}</a>` : safeCustomer;
            html += `<p><strong>Kunde:</strong> ${customerLink} (Nr. ${safeCustomerNr})</p>`;
            html += `<p><strong>Datum:</strong> ${escapeHtml(order.created_at)}</p>`;
            html += `<p><strong>Status:</strong> ${escapeHtml(order.status)}</p>`;
            
            const total = Number(order.total).toFixed(2).replace('.', ',');
            const shipping = Number(order.shipping).toFixed(2).replace('.', ',');
            html += `<p><strong>Summe:</strong> ${total} &euro; (inkl. ${shipping} &euro; Versand)</p>`;
            
            if (order.items && order.items.length > 0) {
                html += `<p><strong>Artikel:</strong></p><ul>`;
                order.items.forEach(item => {
                    const p = Number(item.price).toFixed(2).replace('.', ',');
                    const skuText = item.sku ? `[${escapeHtml(item.sku)}] ` : '';
                    html += `<li>${escapeHtml(item.qty)}x ${skuText}${escapeHtml(item.name)} (${p} &euro;)</li>`;
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
    if (viewId === 'stats-view') {
        loadStats();
    }
    if (viewId === 'topseller-view') {
        loadTopSellers('month');
    }
    if (viewId === 'order-search-view') {
        resetSearchView();
    }
    if (viewId === 'customers-view') {
        resetCustomersView();
    }
}

function resetSearchView() {
    const orderSearchForm = document.getElementById('order-search-form');
    if (orderSearchForm) orderSearchForm.reset();
    if (dateSearchForm) dateSearchForm.reset();
    searchError.textContent = '';
    searchResultContainer.style.display = 'none';
    dateSearchResults.style.display = 'none';
    dateSearchResults.innerHTML = '';
}

function renderOrders() {
    renderOrdersList(state.orders, document.getElementById('orders-list'), (order) => loadOrderDetail(order.id), state.selectedOrder ? state.selectedOrder.id : null);
}

function renderOrdersList(ordersArray, container, clickCallback, activeId = null) {
    container.innerHTML = '';
    if (!ordersArray || ordersArray.length === 0) {
        container.innerHTML = '<p class="text-muted" style="padding: 16px;">Keine Bestellungen gefunden.</p>';
        return;
    }
    ordersArray.forEach(order => {
        const div = document.createElement('div');
        div.className = 'order-item';
        div.id = `order-item-${order.id}`;
        if (activeId && activeId === order.id) {
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
                <span>#${escapeHtml(order.order_nr)}</span>
                <span>${price} &euro;</span>
            </div>
            ${badgesHtml ? `<div class="order-item-meta" style="margin-bottom: 4px;">${badgesHtml}</div>` : ''}
            <div class="order-item-meta">${escapeHtml(order.customer)} (Kdnr: ${escapeHtml(order.customer_nr || '-')})</div>
            <div class="order-item-meta" style="font-size: 0.75rem; color: #999;">${escapeHtml(order.created_at)} &bull; Versand: ${shipping} &euro;</div>
        `;
        div.onclick = () => {
            container.querySelectorAll('.order-item').forEach(el => el.classList.remove('active'));
            div.classList.add('active');
            clickCallback(order);
        };
        container.appendChild(div);
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
    const safeCustomer = escapeHtml(order.customer);
    const safeCustomerNr = escapeHtml(order.customer_nr || '-');
    const safeUserId = escapeHtml(order.user_id);
    const customerLink = order.user_id ? `<a href="#" data-userid="${safeUserId}" data-customer="${safeCustomer}" onclick="loadCustomerHistory(this.dataset.userid, this.dataset.customer); return false;">${safeCustomer}</a>` : safeCustomer;
    html += `<p><strong>Kunde:</strong> ${customerLink} (Kdnr: ${safeCustomerNr})</p>`;
    html += `<p><strong>Datum:</strong> ${escapeHtml(order.created_at)}</p>`;
    html += `<p><strong>Status:</strong> ${escapeHtml(order.status)}</p>`;
    
    const total = Number(order.total).toFixed(2).replace('.', ',');
    const shipping = Number(order.shipping).toFixed(2).replace('.', ',');
    html += `<p><strong>Summe:</strong> ${total} &euro; (Versand: ${shipping} &euro;)</p>`;
    
    if (order.items && order.items.length > 0) {
        html += `<p><strong>Artikel:</strong></p><ul>`;
        order.items.forEach(item => {
            const p = Number(item.price).toFixed(2).replace('.', ',');
            const skuText = item.sku ? `[${escapeHtml(item.sku)}] ` : '';
            html += `<li>${escapeHtml(item.qty)}x ${skuText}${escapeHtml(item.name)} (${p} &euro;)</li>`;
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

if (mainLogo) {
    const goHome = (e) => {
        if (state.authenticated && (e.type === 'click' || (e.type === 'keydown' && (e.key === 'Enter' || e.key === ' ')))) {
            e.preventDefault();
            switchView('dashboard-view');
        }
    };
    mainLogo.addEventListener('click', goHome);
    mainLogo.addEventListener('keydown', goHome);
}

const handleTileClick = (e, viewName) => {
    if (e.type === 'click' || (e.type === 'keydown' && (e.key === 'Enter' || e.key === ' '))) {
        e.preventDefault();
        switchView(viewName);
    }
};

tileOrders.addEventListener('click', (e) => handleTileClick(e, 'orders-view'));
tileOrders.addEventListener('keydown', (e) => handleTileClick(e, 'orders-view'));

tileSearch.addEventListener('click', (e) => handleTileClick(e, 'order-search-view'));
tileSearch.addEventListener('keydown', (e) => handleTileClick(e, 'order-search-view'));

tileSettings.addEventListener('click', (e) => handleTileClick(e, 'settings-view'));
tileSettings.addEventListener('keydown', (e) => handleTileClick(e, 'settings-view'));

tileStats.addEventListener('click', (e) => handleTileClick(e, 'stats-view'));
tileStats.addEventListener('keydown', (e) => handleTileClick(e, 'stats-view'));

tileTopseller.addEventListener('click', (e) => handleTileClick(e, 'topseller-view'));
tileTopseller.addEventListener('keydown', (e) => handleTileClick(e, 'topseller-view'));

if (tileCustomers) {
    tileCustomers.addEventListener('click', (e) => handleTileClick(e, 'customers-view'));
    tileCustomers.addEventListener('keydown', (e) => handleTileClick(e, 'customers-view'));
}

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

if (cachePruneBtn) {
    cachePruneBtn.addEventListener('click', async () => {
        cachePruneMsg.textContent = 'Leere Cache...';
        cachePruneMsg.style.color = 'var(--text-muted)';
        try {
            const data = await apiPost('cache.prune');
            if (data.ok) {
                cachePruneMsg.textContent = 'Cache erfolgreich geleert.';
                cachePruneMsg.style.color = 'var(--success-color)';
                setTimeout(() => cachePruneMsg.textContent = '', 3000);
            } else {
                cachePruneMsg.textContent = 'Fehler beim Leeren des Caches.';
                cachePruneMsg.style.color = 'var(--error-color)';
            }
        } catch(e) {
            cachePruneMsg.textContent = 'Netzwerkfehler.';
            cachePruneMsg.style.color = 'var(--error-color)';
        }
    });
}

document.getElementById('btn-ts-month').addEventListener('click', () => loadTopSellers('month'));
document.getElementById('btn-ts-year').addEventListener('click', () => loadTopSellers('year'));
document.getElementById('btn-ts-prev_year').addEventListener('click', () => loadTopSellers('prev_year'));
document.getElementById('btn-ts-all_time').addEventListener('click', () => loadTopSellers('all_time'));

orderSearchForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const nr = document.getElementById('search-order-nr').value;
    searchOrder(nr);
});

dateSearchForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const from = document.getElementById('search-date-from').value;
    const to = document.getElementById('search-date-to').value;
    const limit = document.getElementById('search-date-limit').value;
    
    searchError.textContent = '';
    searchResultContainer.style.display = 'none';
    dateSearchResults.style.display = 'block';
    dateSearchResults.innerHTML = '<div class="spinner" style="margin-top: 40px;"></div>';
    
    try {
        const data = await apiGet('orders.search_date', { from, to, limit });
        if (data.ok) {
            renderOrdersList(data.orders, dateSearchResults, (order) => {
                searchOrder(order.order_nr);
            });
        } else {
            searchError.textContent = 'Fehler: ' + data.error;
            dateSearchResults.innerHTML = '';
        }
    } catch (e) {
        searchError.textContent = 'Netzwerkfehler.';
        dateSearchResults.innerHTML = '';
    }
});

customerHistoryBackBtn.addEventListener('click', () => {
    switchView('order-search-view');
});

async function loadCustomerHistory(userId, customerName) {
    switchView('customer-history-view');
    customerHistoryTitle.textContent = `Historie für ${customerName}`;
    customerHistoryError.textContent = '';
    customerHistoryResults.innerHTML = '<div class="spinner" style="margin-top: 40px;"></div>';
    
    try {
        const data = await apiGet('orders.by_customer', { user_id: userId });
        if (data.ok) {
            renderOrdersList(data.orders, customerHistoryResults, (order) => {
                switchView('order-search-view');
                searchOrder(order.order_nr);
            });
        } else {
            customerHistoryError.textContent = 'Fehler: ' + data.error;
            customerHistoryResults.innerHTML = '';
        }
    } catch (e) {
        customerHistoryError.textContent = 'Netzwerkfehler.';
        customerHistoryResults.innerHTML = '';
    }
}

const footerPrivacyLink = document.getElementById('footer-privacy-link');
if (footerPrivacyLink) {
    footerPrivacyLink.addEventListener('click', async (e) => {
        e.preventDefault();
        try {
            const data = await fetch('../api/api.php?op=config.privacy').then(r => r.json());
            if (data.ok && data.privacy_url) {
                window.open(data.privacy_url, '_blank', 'noopener');
            } else {
                alert('Kein Datenschutz-Link in den Einstellungen konfiguriert.');
            }
        } catch(err) {
            alert('Netzwerkfehler beim Laden des Datenschutz-Links.');
        }
    });
}

// Customers Logic
function resetCustomersView() {
    if (customersSearchForm) customersSearchForm.reset();
    customersError.textContent = '';
    customersList.innerHTML = '';
    if (customerDetail) customerDetail.style.display = 'none';
    if (customersLoading) customersLoading.style.display = 'none';
}

if (customersSearchForm) {
    customersSearchForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const query = customersSearchQuery.value;
        customersError.textContent = '';
        customersList.innerHTML = '';
        customerDetail.style.display = 'none';
        customersLoading.style.display = 'block';

        try {
            const data = await apiGet('customers.search', { query });
            if (data.ok) {
                state.customers = data.customers;
                renderCustomersList();
            } else {
                customersError.textContent = 'Fehler: ' + data.error;
            }
        } catch (err) {
            customersError.textContent = 'Netzwerkfehler.';
        } finally {
            customersLoading.style.display = 'none';
        }
    });
}

function renderCustomersList() {
    customersList.innerHTML = '';
    if (!state.customers || state.customers.length === 0) {
        customersList.innerHTML = '<p class="text-muted" style="padding: 16px;">Keine Kunden gefunden.</p>';
        return;
    }

    state.customers.forEach(customer => {
        const div = document.createElement('div');
        div.className = 'order-item';
        div.id = `customer-item-${customer.id}`;
        
        let badgesHtml = '';
        if (customer.has_orders) badgesHtml += '<span class="badge badge-paid">Hat bestellt</span>';
        
        const custnr = customer.custnr ? customer.custnr : '-';
        const nameStr = escapeHtml((customer.fname + ' ' + customer.lname).trim());
        const companyStr = customer.company ? escapeHtml(customer.company) : '';
        const displayTitle = companyStr ? `${companyStr} (${nameStr})` : nameStr;

        div.innerHTML = `
            <div class="order-item-header">
                <span>${displayTitle}</span>
                <span>Kdnr: ${escapeHtml(custnr)}</span>
            </div>
            ${badgesHtml ? `<div class="order-item-meta" style="margin-bottom: 4px;">${badgesHtml}</div>` : ''}
            <div class="order-item-meta" style="font-size: 0.75rem; color: #999;">${escapeHtml(customer.city)} (${escapeHtml(customer.country)}) &bull; Username: ${escapeHtml(customer.username)}</div>
        `;
        div.onclick = () => {
            customersList.querySelectorAll('.order-item').forEach(el => el.classList.remove('active'));
            div.classList.add('active');
            loadCustomerDetail(customer);
        };
        customersList.appendChild(div);
    });
}

function loadCustomerDetail(customer) {
    state.selectedCustomer = customer;
    customerDetail.style.display = 'block';
    
    const nameStr = escapeHtml((customer.fname + ' ' + customer.lname).trim());
    const companyStr = customer.company ? escapeHtml(customer.company) : '';
    const displayTitle = companyStr ? `${companyStr} (${nameStr})` : nameStr;
    
    customerDetailTitle.textContent = displayTitle;

    let html = '';
    const safeUserId = escapeHtml(customer.id);
    const safeCustomerName = escapeHtml(nameStr || companyStr || customer.username);

    if (customer.has_orders) {
        html += `<div style="margin-bottom: 16px;">
            <button class="secondary-btn" onclick="loadCustomerHistory('${safeUserId}', '${safeCustomerName}'); return false;">
                <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                Bestellhistorie
            </button>
        </div>`;
    }

    html += `<p><strong>Adresse:</strong></p>
    <p>${companyStr ? companyStr + '<br>' : ''}${nameStr}<br>
    ${escapeHtml(customer.street)} ${escapeHtml(customer.streetnr)}<br>
    ${escapeHtml(customer.zip)} ${escapeHtml(customer.city)}<br>
    ${escapeHtml(customer.country)}</p>`;
    
    html += `<p><strong>Benutzername:</strong> ${escapeHtml(customer.username)}</p>`;
    html += `<p><strong>Kundennummer:</strong> ${escapeHtml(customer.custnr || '-')}</p>`;

    customerDetailContent.innerHTML = html;
}

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
