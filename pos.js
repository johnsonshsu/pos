// State
let currentOrder = {}; // cartKey -> { qty, note, itemId }
let orders = []; // Array of order objects {id, items:[], total, status, time}
let orderIdCounter = 1;
let html5QrcodeScanner = null;
let posCurrentNoteItemId = null; // 目前正在編輯備註的商品 ID
let posSelectedNotes = []; // 目前選取的常用備註

// Init
document.addEventListener('DOMContentLoaded', () => {
    updateClock();
    setInterval(updateClock, 1000);
    renderCategories();
    renderProducts('sandwich'); // Default cat
    renderKanban();

    // Initialize Scanner Modal Events
    setupScannerEvents();

    // 監聽自訂備註輸入，即時更新顯示
    document.getElementById('pos-custom-note').addEventListener('input', posUpdateSelectedNotesDisplay);

    // Initial check for table number visibility
    toggleTableNumberInput();
});

function updateClock() {
    const now = new Date();
    document.getElementById('clock').textContent = now.toLocaleTimeString('zh-TW', { hour12: false });
}

// ---------------- UI Rendering ----------------

function renderCategories() {
    const container = document.getElementById('pos-categories');
    container.innerHTML = '';
    categories.forEach((cat, index) => {
        const btn = document.createElement('button');
        btn.className = `btn pos-category-btn ${index === 0 ? 'active' : ''}`;
        btn.innerHTML = `<img src="images/category/${cat.id}.png" class="category-icon" alt="${cat.name}">${cat.name}`;
        btn.onclick = () => {
            document.querySelectorAll('.pos-category-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderProducts(cat.id);
        };
        container.appendChild(btn);
    });
}

function renderProducts(catId) {
    const container = document.getElementById('pos-products');
    container.innerHTML = '';
    
    const items = catId === 'all' ? menuItems : menuItems.filter(i => i.cat === catId);

    items.forEach(item => {
        const col = document.createElement('div');
        col.className = 'col-6 col-md-4 col-lg-3 col-xl-2'; // Responsive grid
        col.innerHTML = `
            <div class="card product-card p-2" onclick="addToOrder('${item.id}')">
                <div class="d-flex align-items-center">
                    <img src="images/product/${item.id}.png" class="pos-product-icon" alt="${item.name}">
                    <div class="product-info">
                        <div class="product-code">${item.id}</div>
                        <div class="product-name">${item.name}</div>
                        <div class="product-price">$${item.price}</div>
                    </div>
                </div>
            </div>
        `;
        container.appendChild(col);
    });
}

function toggleTableNumberInput() {
    const isDineIn = document.getElementById('posDineIn').checked;
    const container = document.getElementById('tableNumberContainer');
    if (container) {
        container.style.display = isDineIn ? 'block' : 'none';
    }
}

// ---------------- Order Logic ----------------

/// <summary>
/// 開啟備註視窗新增商品到訂單
/// </summary>
/// <param name="id">商品 ID</param>
function addToOrder(id) {
    posOpenNoteModal(id);
}

/// <summary>
/// 直接新增商品到訂單（含備註，用於 QR 掃描或內部呼叫）
/// </summary>
/// <param name="id">商品 ID</param>
/// <param name="qty">數量</param>
/// <param name="note">備註</param>
function addToOrderDirect(id, qty = 1, note = '') {
    const cartKey = note ? `${id}|${note}` : id;

    if (!currentOrder[cartKey]) {
        currentOrder[cartKey] = { qty: 0, note: note, itemId: id };
    }
    currentOrder[cartKey].qty += qty;
    if (currentOrder[cartKey].qty <= 0) delete currentOrder[cartKey];
    renderCurrentOrder();
}

/// <summary>
/// 更新訂單商品數量
/// </summary>
/// <param name="cartKey">購物車項目 key</param>
/// <param name="delta">數量變化</param>
function updateOrderQty(cartKey, delta) {
    if (!currentOrder[cartKey]) return;

    currentOrder[cartKey].qty += delta;
    if (currentOrder[cartKey].qty <= 0) delete currentOrder[cartKey];
    renderCurrentOrder();
}

/// <summary>
/// 開啟備註 Modal
/// </summary>
/// <param name="id">商品 ID</param>
function posOpenNoteModal(id) {
    posCurrentNoteItemId = id;
    posSelectedNotes = [];

    const item = menuItems.find(i => i.id === id);
    if (!item) return;

    // 設定商品資訊
    document.getElementById('pos-note-product-img').src = `images/product/${item.id}.png`;
    document.getElementById('pos-note-product-name').textContent = item.name;
    document.getElementById('pos-note-product-price').textContent = `$${item.price}`;

    // 渲染常用備註選項
    posRenderCommonNotes();

    // 清空自訂備註
    document.getElementById('pos-custom-note').value = '';

    // 更新已選備註顯示
    posUpdateSelectedNotesDisplay();

    // 開啟 Modal
    const modal = bootstrap.Modal.getOrCreateInstance(document.getElementById('posNoteModal'));
    modal.show();
}

/// <summary>
/// 渲染常用備註選項
/// </summary>
function posRenderCommonNotes() {
    const container = document.getElementById('pos-common-notes-container');
    container.innerHTML = '';

    commonNotes.forEach(note => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'btn btn-outline-secondary btn-sm note-btn';
        btn.textContent = note;
        btn.onclick = () => posToggleNote(note, btn);
        container.appendChild(btn);
    });
}

/// <summary>
/// 切換常用備註選取狀態
/// </summary>
/// <param name="note">備註文字</param>
/// <param name="btn">按鈕元素</param>
function posToggleNote(note, btn) {
    const index = posSelectedNotes.indexOf(note);
    if (index > -1) {
        posSelectedNotes.splice(index, 1);
        btn.classList.remove('active');
    } else {
        posSelectedNotes.push(note);
        btn.classList.add('active');
    }
    posUpdateSelectedNotesDisplay();
}

/// <summary>
/// 更新已選備註顯示
/// </summary>
function posUpdateSelectedNotesDisplay() {
    const display = document.getElementById('pos-selected-notes');
    const customNote = document.getElementById('pos-custom-note').value.trim();

    let allNotes = [...posSelectedNotes];
    if (customNote) {
        allNotes.push(customNote);
    }

    if (allNotes.length === 0) {
        display.textContent = '尚未選擇備註';
        display.className = 'selected-notes-display text-muted';
    } else {
        display.textContent = allNotes.join('、');
        display.className = 'selected-notes-display pos-selected-notes-text';
    }
}

/// <summary>
/// 儲存備註並新增商品到訂單
/// </summary>
function posSaveNote() {
    if (!posCurrentNoteItemId) return;

    const customNote = document.getElementById('pos-custom-note').value.trim();
    // Sort selected notes to ensure consistent key generation regardless of selection order
    let allNotes = [...posSelectedNotes].sort();
    
    if (customNote) {
        allNotes.push(customNote);
    }
    const noteText = allNotes.join('、');

    // 新增到訂單
    addToOrderDirect(posCurrentNoteItemId, 1, noteText);

    // 關閉 Modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('posNoteModal'));
    modal.hide();

    posCurrentNoteItemId = null;
    posSelectedNotes = [];
}

function renderCurrentOrder() {
    const list = document.getElementById('current-order-list');
    list.innerHTML = '';
    let total = 0;

    for (const [cartKey, cartItem] of Object.entries(currentOrder)) {
        const item = menuItems.find(i => i.id === cartItem.itemId);
        if (item) {
            const lineTotal = item.price * cartItem.qty;
            total += lineTotal;

            // 備註顯示
            const noteHtml = cartItem.note
                ? `<div class="pos-order-note"><i class="fas fa-sticky-note me-1"></i>${cartItem.note}</div>`
                : '';

            // 需要對 cartKey 進行編碼以避免特殊字元問題
            const encodedKey = encodeURIComponent(cartKey);

            const row = document.createElement('div');
            row.className = 'order-item';
            row.innerHTML = `
                <div style="flex:1">
                    <div class="fw-bold">${item.name}</div>
                    ${noteHtml}
                </div>
                <div class="d-flex align-items-center gap-2">
                    <button class="btn btn-danger text-white qty-btn" onclick="updateOrderQty(decodeURIComponent('${encodedKey}'), -1)">-</button>
                    <span class="fw-bold" style="width:20px; text-align:center">${cartItem.qty}</span>
                    <button class="btn btn-success text-white qty-btn" onclick="updateOrderQty(decodeURIComponent('${encodedKey}'), 1)">+</button>
                    <span class="fw-bold ms-2" style="width:40px; text-align:right">$${lineTotal}</span>
                </div>
            `;
            list.appendChild(row);
        }
    }
    document.getElementById('pos-total-price').textContent = `總計: $${total}`;
}

function submitOrder() {
    if (Object.keys(currentOrder).length === 0) return;

    // 取得內用/外帶選項
    const diningOption = document.querySelector('input[name="posDiningOption"]:checked').value;
    let tableNumber = null;

    if (diningOption === 'dineIn') {
        tableNumber = document.getElementById('posTableNumber').value.trim();
        if (!tableNumber) {
            alert('請輸入桌號');
            return;
        }
    }

    // Create Order Object
    const newOrder = {
        id: orderIdCounter++,
        time: new Date().toLocaleTimeString('zh-TW', {hour12:false, hour:'2-digit', minute:'2-digit'}),
        items: { ...currentOrder },
        total: document.getElementById('pos-total-price').textContent,
        type: diningOption, // 'dineIn' or 'takeOut'
        tableNumber: tableNumber,
        status: 'new' // new, making, done, history
    };

    orders.push(newOrder);
    
    // Clear Current
    currentOrder = {};
    document.getElementById('posTableNumber').value = ''; // Clear table number
    renderCurrentOrder();
    
    // Update Kanban
    renderKanban();
}

// ---------------- Kanban Board ----------------

function renderKanban() {
    // Clear cols
    ['new', 'making', 'done', 'history'].forEach(s => {
        document.getElementById(`col-${s}`).innerHTML = '';
        document.getElementById(`count-${s}`).textContent = '0';
    });

    const counts = { new:0, making:0, done:0, history:0 };

    orders.forEach(order => {
        counts[order.status]++;
        const card = document.createElement('div');
        card.className = 'kanban-card';

        // Build item summary string
        let itemStr = '';
        for(const [, orderItem] of Object.entries(order.items)) {
            const item = menuItems.find(i => i.id === orderItem.itemId);
            if(item) {
                itemStr += `<div>${item.name} x${orderItem.qty}`;
                if (orderItem.note) {
                    itemStr += ` <span class="kanban-note">(${orderItem.note})</span>`;
                }
                itemStr += `</div>`;
            }
        }

        // Action Buttons based on status
        let actionBtn = '';
        if(order.status === 'new') {
            actionBtn = `<button class="btn btn-primary btn-sm w-100 mt-2" onclick="updateStatus(${order.id}, 'making')">開始製作</button>`;
        } else if (order.status === 'making') {
            actionBtn = `<button class="btn btn-success btn-sm w-100 mt-2" onclick="updateStatus(${order.id}, 'done')">完成</button>`;
        } else if (order.status === 'done') {
            actionBtn = `<button class="btn btn-secondary btn-sm w-100 mt-2" onclick="updateStatus(${order.id}, 'history')">結帳歸檔</button>`;
        }

        // 內用/外帶標籤 (含桌號)
        let typeLabel = '';
        if (order.type === 'takeOut') {
            typeLabel = '<span class="badge bg-info">外帶</span>';
        } else {
            const tableInfo = order.tableNumber ? ` 桌號:${order.tableNumber}` : '';
            typeLabel = `<span class="badge bg-success">內用${tableInfo}</span>`;
        }

        card.innerHTML = `
            <div class="d-flex justify-content-between border-bottom pb-1 mb-1">
                <strong>#${order.id} ${typeLabel}</strong>
                <small>${order.time}</small>
            </div>
            <div class="text-dark small">${itemStr}</div>
            <div class="text-end fw-bold mt-1 text-danger">${order.total}</div>
            ${actionBtn}
        `;

        const colContainer = document.getElementById(`col-${order.status}`);
        if (order.status === 'history') {
            colContainer.prepend(card);
        } else {
            colContainer.appendChild(card);
        }
    });

    // Update Counts
    for(const key in counts) {
        document.getElementById(`count-${key}`).textContent = counts[key];
    }
}

function updateStatus(orderId, newStatus) {
    const order = orders.find(o => o.id === orderId);
    if(order) {
        order.status = newStatus;
        renderKanban();
    }
}

// ---------------- Scanner Logic ----------------

function setupScannerEvents() {
    const scannerModalEl = document.getElementById('scannerModal');
    
    // Init scanner when modal is fully shown to avoid UI issues
    scannerModalEl.addEventListener('shown.bs.modal', () => {
        if (!html5QrcodeScanner) {
            // Re-instantiate scanner
            html5QrcodeScanner = new Html5QrcodeScanner(
                "reader", 
                { fps: 10, qrbox: { width: 250, height: 250 } },
                /* verbose= */ false
            );
            html5QrcodeScanner.render(onScanSuccess, onScanFailure);
        }
    });

    // Stop scanner when modal is hidden
    scannerModalEl.addEventListener('hidden.bs.modal', () => {
        if (html5QrcodeScanner) {
            html5QrcodeScanner.clear().then(() => {
                html5QrcodeScanner = null;
                // Clean up any residual DOM elements from scanner
                document.getElementById('reader').innerHTML = "";
            }).catch(err => {
                console.error("Failed to clear scanner", err);
                html5QrcodeScanner = null;
            });
        }
    });
}

function startScanner() {
    const modal = new bootstrap.Modal(document.getElementById('scannerModal'));
    modal.show();
}

function stopScanner() {
    // This is now handled by hidden.bs.modal event
    const modalEl = document.getElementById('scannerModal');
    const modal = bootstrap.Modal.getInstance(modalEl);
    if (modal) {
        modal.hide();
    }
}

function onScanSuccess(decodedText, decodedResult) {
    try {
        const payload = JSON.parse(decodedText);
        // Payload structure: { t: timestamp, type: 'dineIn'|'takeOut', d: [ {id, q, n?}, ... ] }

        if (payload.d && Array.isArray(payload.d)) {
            // 設定內用/外帶選項
            if (payload.type) {
                const radioId = payload.type === 'takeOut' ? 'posTakeOut' : 'posDineIn';
                document.getElementById(radioId).checked = true;
                // Trigger change event manually to update table number visibility
                document.getElementById(radioId).dispatchEvent(new Event('change'));
                
                // Manually call toggle since dispatchEvent might not propagate if not listening directly (but we call it via onchange attribute)
                toggleTableNumberInput();
            }

            // Add items to current order (含備註)
            payload.d.forEach(item => {
                addToOrderDirect(item.id, item.q, item.n || '');
            });

            // Close modal
            stopScanner();

            // Short delay to allow modal to close before alerting
            const typeText = payload.type === 'takeOut' ? '外帶' : '內用';
            setTimeout(() => alert(`訂單讀取成功！(${typeText})`), 300);
        } else {
            alert('無效的 QR Code 格式');
        }
    } catch (e) {
        console.error(e);
    }
}

function onScanFailure(error) {
    // usually ignore
}