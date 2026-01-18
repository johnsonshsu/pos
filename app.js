/*
   早餐系統的組合邏輯
   App.js - 主要應用程式邏輯
   資料定義請參考 data.js
*/

// ==========================================
// 1. 導航與初始化
// ==========================================

// Define navigateTo immediately in global scope
window.navigateTo = function(viewId) {
    console.log("Navigating to:", viewId);
    
    // Hide all views
    const views = document.querySelectorAll('.view-section');
    views.forEach(el => el.classList.add('d-none'));
    
    // Show target view
    const target = document.getElementById(`view-${viewId}`);
    if (target) {
        target.classList.remove('d-none');
    } else {
        console.error(`View element #view-${viewId} not found`);
        return;
    }

    // Lazy load / Refresh logic based on view
    if (viewId === 'order') {
        renderClientMenu();
    } else if (viewId === 'pos') {
        renderPOSCategories();
        renderPOSProducts('sandwich'); // default
        renderPOSKanban();
        updatePOSClock();
    }
};

function initApp() {
    console.log("App Initializing...");
    
    // Start with Home
    window.navigateTo('home');
    
    // Init POS interval for clock
    setInterval(updatePOSClock, 1000);
    
    // Setup Scanner Events once
    setupScannerEvents();
}

// ==========================================
// 2. 客戶端訂購邏輯
// ==========================================
let clientCart = {}; // { id: qty }

function renderClientMenu() {
    const container = document.getElementById('menu-container');
    if (!container) return;
    container.innerHTML = '';

    categories.forEach(cat => {
        const catHeader = document.createElement('div');
        catHeader.className = 'category-header';
        catHeader.textContent = cat.name;
        container.appendChild(catHeader);

        const items = menuItems.filter(item => item.cat === cat.id);
        items.forEach(item => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'menu-item';
            itemDiv.innerHTML = `
                <div class="info">
                    <h5>${item.name}</h5>
                    <div class="price">$${item.price}</div>
                </div>
                <button class="add-btn" type="button" onclick="window.clientAddToCart('${item.id}')">
                    <i class="fas fa-plus"></i>
                </button>
            `;
            container.appendChild(itemDiv);
        });
    });
    updateClientBottomBar();
}

window.clientAddToCart = function(id) {
    if (!clientCart[id]) clientCart[id] = 0;
    clientCart[id]++;
    updateClientBottomBar();
};

function updateClientBottomBar() {
    let total = 0;
    let count = 0;
    for (const [id, qty] of Object.entries(clientCart)) {
        const item = menuItems.find(i => i.id === id);
        if (item) {
            total += item.price * qty;
            count += qty;
        }
    }
    const priceEl = document.getElementById('total-price');
    const countEl = document.getElementById('total-count');
    if (priceEl) priceEl.textContent = `$${total}`;
    if (countEl) countEl.textContent = `(${count}樣)`;
}

window.showCartDetails = function() {
    const list = document.getElementById('cart-list');
    if (!list) return;
    
    list.innerHTML = '';
    let isEmpty = true;

    for (const [id, qty] of Object.entries(clientCart)) {
        if (qty > 0) {
            isEmpty = false;
            const item = menuItems.find(i => i.id === id);
            const li = document.createElement('li');
            li.className = 'list-group-item d-flex justify-content-between align-items-center';
            li.innerHTML = `
                <span>${item.name} x ${qty}</span>
                <span class="fw-bold">$${item.price * qty}</span>
            `;
            list.appendChild(li);
        }
    }
    if (isEmpty) list.innerHTML = '<li class="list-group-item text-center text-muted">購物車是空的</li>';
    
    const modalEl = document.getElementById('cartModal');
    if (modalEl && typeof bootstrap !== 'undefined') {
        new bootstrap.Modal(modalEl).show();
    } else {
        console.error("Bootstrap or Modal element not found");
    }
};

window.generateCheckoutQR = function() {
    const qrContainer = document.getElementById('qrcode');
    if (!qrContainer) return;
    
    qrContainer.innerHTML = ''; 

    const orderData = [];
    for (const [id, qty] of Object.entries(clientCart)) {
        if (qty > 0) orderData.push({ id: id, q: qty });
    }

    if (orderData.length === 0) {
        alert('請先點餐');
        return;
    }

    const payload = { t: Date.now(), d: orderData };
    
    try {
        if (typeof QRCode !== 'undefined') {
            new QRCode(qrContainer, {
                text: JSON.stringify(payload),
                width: 200,
                height: 200
            });
        } else {
            qrContainer.textContent = "Error: QRCode library not loaded.";
        }
    } catch(e) { console.error("QR Gen Error:", e); }

    const qrTotalEl = document.getElementById('qr-total');
    const totalPriceEl = document.getElementById('total-price');
    if (qrTotalEl && totalPriceEl) {
        qrTotalEl.textContent = totalPriceEl.textContent;
    }
    
    const modalEl = document.getElementById('qrModal');
    if (modalEl && typeof bootstrap !== 'undefined') {
        new bootstrap.Modal(modalEl).show();
    }
};

// ==========================================
// 3. POS System Logic
// ==========================================
let posCurrentOrder = {}; 
let posOrders = []; 
let posOrderIdCounter = 1;
let html5QrcodeScanner = null;

function updatePOSClock() {
    const now = new Date();
    const clockEl = document.getElementById('clock');
    if(clockEl) clockEl.textContent = now.toLocaleTimeString('zh-TW', { hour12: false });
}

function renderPOSCategories() {
    const container = document.getElementById('pos-categories');
    if (!container) return;
    container.innerHTML = '';
    categories.forEach((cat, index) => {
        const btn = document.createElement('button');
        btn.className = `btn pos-category-btn ${index === 0 ? 'active' : ''}`;
        btn.textContent = cat.name;
        btn.onclick = () => {
            document.querySelectorAll('.pos-category-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderPOSProducts(cat.id);
        };
        container.appendChild(btn);
    });
}

function renderPOSProducts(catId) {
    const container = document.getElementById('pos-products');
    if (!container) return;
    container.innerHTML = '';
    const items = catId === 'all' ? menuItems : menuItems.filter(i => i.cat === catId);
    items.forEach(item => {
        const col = document.createElement('div');
        col.className = 'col-6 col-md-4 col-lg-3 col-xl-2';
        col.innerHTML = `
            <div class="card product-card text-center p-2" onclick="window.posAddToOrder('${item.id}')">
                <div class="product-code">${item.id}</div>
                <div class="product-name my-1">${item.name}</div>
                <div class="product-price">$${item.price}</div>
            </div>
        `;
        container.appendChild(col);
    });
}

window.posAddToOrder = function(id, qty = 1) {
    if (!posCurrentOrder[id]) posCurrentOrder[id] = 0;
    posCurrentOrder[id] += qty;
    if (posCurrentOrder[id] <= 0) delete posCurrentOrder[id];
    renderPOSCurrentOrder();
};

function renderPOSCurrentOrder() {
    const list = document.getElementById('current-order-list');
    if (!list) return;
    list.innerHTML = '';
    let total = 0;
    for (const [id, qty] of Object.entries(posCurrentOrder)) {
        const item = menuItems.find(i => i.id === id);
        if (item) {
            const lineTotal = item.price * qty;
            total += lineTotal;
            const row = document.createElement('div');
            row.className = 'order-item';
            row.innerHTML = `
                <div style="flex:1"><div class="fw-bold">${item.name}</div></div>
                <div class="d-flex align-items-center gap-2">
                    <button class="btn btn-danger text-white qty-btn" onclick="window.posAddToOrder('${id}', -1)">-</button>
                    <span class="fw-bold" style="width:20px; text-align:center">${qty}</span>
                    <button class="btn btn-success text-white qty-btn" onclick="window.posAddToOrder('${id}', 1)">+</button>
                    <span class="fw-bold ms-2" style="width:40px; text-align:right">$${lineTotal}</span>
                </div>
            `;
            list.appendChild(row);
        }
    }
    const totalEl = document.getElementById('pos-total-price');
    if(totalEl) totalEl.textContent = `總計: $${total}`;
}

window.submitOrder = function() {
    if (Object.keys(posCurrentOrder).length === 0) return;
    const totalEl = document.getElementById('pos-total-price');
    const newOrder = {
        id: posOrderIdCounter++,
        time: new Date().toLocaleTimeString('zh-TW', {hour12:false, hour:'2-digit', minute:'2-digit'}),
        items: { ...posCurrentOrder },
        total: totalEl ? totalEl.textContent : '$0',
        status: 'new'
    };
    posOrders.push(newOrder);
    posCurrentOrder = {};
    renderPOSCurrentOrder();
    renderPOSKanban();
};

function renderPOSKanban() {
    ['new', 'making', 'done', 'history'].forEach(s => {
        const col = document.getElementById(`col-${s}`);
        if(col) col.innerHTML = '';
        const count = document.getElementById(`count-${s}`);
        if(count) count.textContent = '0';
    });

    const counts = { new:0, making:0, done:0, history:0 };
    posOrders.forEach(order => {
        counts[order.status]++;
        const card = document.createElement('div');
        card.className = 'kanban-card';
        let itemStr = '';
        for(const [id, qty] of Object.entries(order.items)) {
            const item = menuItems.find(i => i.id === id);
            if(item) itemStr += `<div>${item.name} x${qty}</div>`;
        }
        let actionBtn = '';
        if(order.status === 'new') {
            actionBtn = `<button class="btn btn-primary btn-sm w-100 mt-2" onclick="window.updatePOSStatus(${order.id}, 'making')">開始製作</button>`;
        } else if (order.status === 'making') {
            actionBtn = `<button class="btn btn-success btn-sm w-100 mt-2" onclick="window.updatePOSStatus(${order.id}, 'done')">完成</button>`;
        } else if (order.status === 'done') {
            actionBtn = `<button class="btn btn-secondary btn-sm w-100 mt-2" onclick="window.updatePOSStatus(${order.id}, 'history')">結帳歸檔</button>`;
        }

        card.innerHTML = `
            <div class="d-flex justify-content-between border-bottom pb-1 mb-1">
                <strong>#${order.id}</strong><small>${order.time}</small>
            </div>
            <div class="text-dark small">${itemStr}</div>
            <div class="text-end fw-bold mt-1 text-danger">${order.total}</div>
            ${actionBtn}
        `;
        const col = document.getElementById(`col-${order.status}`);
        if(col) col.appendChild(card);
    });
    for(const key in counts) {
        const countEl = document.getElementById(`count-${key}`);
        if(countEl) countEl.textContent = counts[key];
    }
}

window.updatePOSStatus = function(orderId, newStatus) {
    const order = posOrders.find(o => o.id === orderId);
    if(order) {
        order.status = newStatus;
        renderPOSKanban();
    }
};

// ==========================================
// 4. Scanner Logic (POS)
// ==========================================
function setupScannerEvents() {
    const scannerModalEl = document.getElementById('scannerModal');
    if (!scannerModalEl) return;

    scannerModalEl.addEventListener('shown.bs.modal', () => {
        if (!html5QrcodeScanner && typeof Html5QrcodeScanner !== 'undefined') {
            try {
                html5QrcodeScanner = new Html5QrcodeScanner("reader", { fps: 10, qrbox: { width: 250, height: 250 } }, false);
                html5QrcodeScanner.render(onScanSuccess, (err) => {});
            } catch(e) {
                console.error("Scanner init error", e);
            }
        } else if (typeof Html5QrcodeScanner === 'undefined') {
            const reader = document.getElementById('reader');
            if(reader) reader.textContent = "Scanner library not loaded.";
        }
    });
    scannerModalEl.addEventListener('hidden.bs.modal', () => {
        if (html5QrcodeScanner) {
            html5QrcodeScanner.clear().then(() => {
                html5QrcodeScanner = null;
                const reader = document.getElementById('reader');
                if(reader) reader.innerHTML = "";
            }).catch(console.error);
        }
    });
}

window.startScanner = function() {
    const modalEl = document.getElementById('scannerModal');
    if (modalEl && typeof bootstrap !== 'undefined') {
        new bootstrap.Modal(modalEl).show();
    }
};

function onScanSuccess(decodedText) {
    try {
        const payload = JSON.parse(decodedText);
        if (payload.d && Array.isArray(payload.d)) {
            payload.d.forEach(item => window.posAddToOrder(item.id, item.q));
            
            // Close modal
            const el = document.getElementById('scannerModal');
            const modal = bootstrap.Modal.getInstance(el);
            if(modal) modal.hide();

            setTimeout(() => alert('訂單讀取成功！'), 300);
        } else {
            alert('無效的 QR Code');
        }
    } catch (e) { console.error(e); }
}

// Start App when DOM is ready
document.addEventListener('DOMContentLoaded', initApp);
