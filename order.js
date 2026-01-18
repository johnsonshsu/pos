// State
let cart = {}; // Object to store id -> { qty, note }
let currentCategory = null; // 目前選取的分類
let currentNoteItemId = null; // 目前正在編輯備註的商品 ID
let selectedNotes = []; // 目前選取的常用備註

// Init
document.addEventListener('DOMContentLoaded', () => {
    renderCategoryNav();
    initCategoryNavDrag();
    // 預設選取第一個分類
    if (categories.length > 0) {
        selectCategory(categories[0].id);
    }

    // 監聽自訂備註輸入，即時更新顯示
    document.getElementById('custom-note').addEventListener('input', updateSelectedNotesDisplay);

    // 監聽 QR Code Modal 關閉事件，清空購物車
    const qrModal = document.getElementById('qrModal');
    if (qrModal) {
        qrModal.addEventListener('hidden.bs.modal', () => {
            clearCart();
        });
    }
});

/// <summary>
/// 清空購物車
/// </summary>
function clearCart() {
    cart = {};
    updateBottomBar();
    renderCartList();
}

/// <summary>
/// 初始化分類導航列的滑鼠拖曳滾動功能
/// </summary>
function initCategoryNavDrag() {
    const nav = document.getElementById('category-nav');
    let isDown = false;
    let isDragging = false;
    let startX;
    let scrollLeft;

    nav.addEventListener('mousedown', (e) => {
        isDown = true;
        isDragging = false;
        nav.style.cursor = 'grabbing';
        startX = e.pageX - nav.offsetLeft;
        scrollLeft = nav.scrollLeft;
    });

    nav.addEventListener('mouseleave', () => {
        isDown = false;
        nav.style.cursor = 'grab';
    });

    nav.addEventListener('mouseup', (e) => {
        isDown = false;
        nav.style.cursor = 'grab';
        // 如果有拖曳過，阻止點擊事件
        if (isDragging) {
            e.preventDefault();
            e.stopPropagation();
        }
    });

    nav.addEventListener('mousemove', (e) => {
        if (!isDown) return;
        const x = e.pageX - nav.offsetLeft;
        const walk = x - startX;
        // 移動超過 5px 才算拖曳
        if (Math.abs(walk) > 5) {
            isDragging = true;
            e.preventDefault();
            nav.scrollLeft = scrollLeft - walk;
        }
    });

    // 攔截分類按鈕的點擊，如果是拖曳則不觸發
    nav.addEventListener('click', (e) => {
        if (isDragging) {
            e.preventDefault();
            e.stopPropagation();
            isDragging = false;
        }
    }, true);

    // 設定預設游標樣式
    nav.style.cursor = 'grab';
}

/// <summary>
/// 渲染分類導航列
/// </summary>
function renderCategoryNav() {
    const nav = document.getElementById('category-nav');
    nav.innerHTML = '';

    categories.forEach(cat => {
        const tab = document.createElement('div');
        tab.className = 'category-tab';
        tab.innerHTML = `<img src="images/category/${cat.id}.png" class="category-icon" alt="${cat.name}">${cat.name}`;
        tab.dataset.catId = cat.id;
        tab.onclick = () => selectCategory(cat.id);
        nav.appendChild(tab);
    });
}

/// <summary>
/// 選取分類並顯示該分類的商品
/// </summary>
/// <param name="catId">分類 ID</param>
function selectCategory(catId) {
    currentCategory = catId;

    // 更新分類標籤的 active 狀態
    const nav = document.getElementById('category-nav');
    document.querySelectorAll('.category-tab').forEach(tab => {
        if (tab.dataset.catId === catId) {
            tab.classList.add('active');
            // 將選中的分類滾動到可視區域（使用容器內滾動）
            const tabLeft = tab.offsetLeft;
            const tabWidth = tab.offsetWidth;
            const navWidth = nav.offsetWidth;
            const scrollPos = tabLeft - (navWidth / 2) + (tabWidth / 2);
            nav.scrollTo({ left: scrollPos, behavior: 'smooth' });
        } else {
            tab.classList.remove('active');
        }
    });

    // 渲染該分類的商品
    renderMenuItems(catId);
}

/// <summary>
/// 渲染指定分類的商品列表
/// </summary>
/// <param name="catId">分類 ID</param>
function renderMenuItems(catId) {
    const container = document.getElementById('menu-container');
    container.innerHTML = '';

    // 取得分類名稱
    const category = categories.find(c => c.id === catId);
    if (category) {
        const catHeader = document.createElement('div');
        catHeader.className = 'category-header';
        catHeader.textContent = category.name;
        container.appendChild(catHeader);
    }

    // 過濾並顯示該分類的商品
    const items = menuItems.filter(item => item.cat === catId);

    items.forEach(item => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'menu-item';
        itemDiv.innerHTML = `
            <img src="images/product/${item.id}.png" class="product-icon" alt="${item.name}">
            <div class="info">
                <h5>${item.name}</h5>
                <div class="price">$${item.price}</div>
            </div>
            <button class="add-btn" onclick="addToCart('${item.id}')">
                <i class="fas fa-plus"></i>
            </button>
        `;
        container.appendChild(itemDiv);
    });
}

// Cart Logic
/// <summary>
/// 開啟備註視窗新增商品到購物車
/// </summary>
/// <param name="id">商品 ID</param>
function addToCart(id) {
    openNoteModal(id);
}

/// <summary>
/// 開啟備註 Modal
/// </summary>
/// <param name="id">商品 ID</param>
function openNoteModal(id) {
    currentNoteItemId = id;
    selectedNotes = [];

    const item = menuItems.find(i => i.id === id);
    if (!item) return;

    // 設定商品資訊
    document.getElementById('note-product-img').src = `images/product/${item.id}.png`;
    document.getElementById('note-product-name').textContent = item.name;
    document.getElementById('note-product-price').textContent = `$${item.price}`;

    // 渲染常用備註選項
    renderCommonNotes();

    // 清空自訂備註
    document.getElementById('custom-note').value = '';

    // 更新已選備註顯示
    updateSelectedNotesDisplay();

    // 開啟 Modal
    const modal = bootstrap.Modal.getOrCreateInstance(document.getElementById('noteModal'));
    modal.show();
}

/// <summary>
/// 渲染常用備註選項
/// </summary>
function renderCommonNotes() {
    const container = document.getElementById('common-notes-container');
    container.innerHTML = '';

    commonNotes.forEach(note => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'btn btn-outline-secondary btn-sm note-btn';
        btn.textContent = note;
        btn.onclick = () => toggleNote(note, btn);
        container.appendChild(btn);
    });
}

/// <summary>
/// 切換常用備註選取狀態
/// </summary>
/// <param name="note">備註文字</param>
/// <param name="btn">按鈕元素</param>
function toggleNote(note, btn) {
    const index = selectedNotes.indexOf(note);
    if (index > -1) {
        selectedNotes.splice(index, 1);
        btn.classList.remove('active');
    } else {
        selectedNotes.push(note);
        btn.classList.add('active');
    }
    updateSelectedNotesDisplay();
}

/// <summary>
/// 更新已選備註顯示
/// </summary>
function updateSelectedNotesDisplay() {
    const display = document.getElementById('selected-notes');
    const customNote = document.getElementById('custom-note').value.trim();

    let allNotes = [...selectedNotes];
    if (customNote) {
        allNotes.push(customNote);
    }

    if (allNotes.length === 0) {
        display.textContent = '尚未選擇備註';
        display.className = 'selected-notes-display text-muted';
    } else {
        display.textContent = allNotes.join('、');
        display.className = 'selected-notes-display text-primary';
    }
}

/// <summary>
/// 儲存備註並新增商品到購物車
/// </summary>
function saveNote() {
    if (!currentNoteItemId) return;

    const customNote = document.getElementById('custom-note').value.trim();
    let allNotes = [...selectedNotes];
    if (customNote) {
        allNotes.push(customNote);
    }
    const noteText = allNotes.join('、');

    // 產生唯一的購物車項目 key（商品ID + 備註）
    const cartKey = noteText ? `${currentNoteItemId}|${noteText}` : currentNoteItemId;

    if (!cart[cartKey]) {
        cart[cartKey] = { qty: 0, note: noteText, itemId: currentNoteItemId };
    }
    cart[cartKey].qty++;

    updateBottomBar();

    // 關閉 Modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('noteModal'));
    modal.hide();

    currentNoteItemId = null;
    selectedNotes = [];
}

/// <summary>
/// 更新購物車商品數量
/// </summary>
/// <param name="cartKey">購物車項目 key</param>
/// <param name="delta">數量變化 (+1 或 -1)</param>
function updateCartQty(cartKey, delta) {
    if (!cart[cartKey]) return;

    cart[cartKey].qty += delta;

    // 數量不能小於 1，若要移除請用刪除按鈕
    if (cart[cartKey].qty < 1) {
        cart[cartKey].qty = 1;
    }

    updateBottomBar();
    // 重新渲染購物車明細（不開新視窗）
    renderCartList();
}

/// <summary>
/// 從購物車移除商品
/// </summary>
/// <param name="cartKey">購物車項目 key</param>
function removeFromCart(cartKey) {
    delete cart[cartKey];
    updateBottomBar();
    // 重新渲染購物車明細（不開新視窗）
    renderCartList();
}

function updateBottomBar() {
    let total = 0;
    let count = 0;

    for (const [cartKey, cartItem] of Object.entries(cart)) {
        const item = menuItems.find(i => i.id === cartItem.itemId);
        if (item) {
            total += item.price * cartItem.qty;
            count += cartItem.qty;
        }
    }

    document.getElementById('total-price').textContent = `$${total}`;
    document.getElementById('total-count').textContent = `(${count}樣)`;
}

/// <summary>
/// 渲染購物車列表內容（不開啟視窗）
/// </summary>
function renderCartList() {
    const list = document.getElementById('cart-list');
    list.innerHTML = '';

    let isEmpty = true;

    for (const [cartKey, cartItem] of Object.entries(cart)) {
        if (cartItem.qty > 0) {
            isEmpty = false;
            const item = menuItems.find(i => i.id === cartItem.itemId);
            const li = document.createElement('li');
            li.className = 'list-group-item';

            // 備註顯示
            const noteHtml = cartItem.note
                ? `<div class="cart-item-note"><i class="fas fa-sticky-note me-1"></i>${cartItem.note}</div>`
                : '';

            // 需要對 cartKey 進行編碼以避免特殊字元問題
            const encodedKey = encodeURIComponent(cartKey);

            li.innerHTML = `
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <span class="cart-item-name">${item.name}</span>
                        ${noteHtml}
                    </div>
                    <span class="fw-bold text-danger">$${item.price * cartItem.qty}</span>
                </div>
                <div class="d-flex justify-content-between align-items-center mt-2">
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-outline-secondary" onclick="updateCartQty(decodeURIComponent('${encodedKey}'), -1)">
                            <i class="fas fa-minus"></i>
                        </button>
                        <span class="btn btn-light disabled cart-qty">${cartItem.qty}</span>
                        <button class="btn btn-outline-secondary" onclick="updateCartQty(decodeURIComponent('${encodedKey}'), 1)">
                            <i class="fas fa-plus"></i>
                        </button>
                    </div>
                    <button class="btn btn-sm btn-outline-danger" onclick="removeFromCart(decodeURIComponent('${encodedKey}'))">
                        <i class="fas fa-trash-alt"></i> 刪除
                    </button>
                </div>
            `;
            list.appendChild(li);
        }
    }

    if (isEmpty) {
        list.innerHTML = '<li class="list-group-item text-center text-muted">購物車是空的</li>';
    }
}

/// <summary>
/// 顯示購物車明細視窗
/// </summary>
function showCartDetails() {
    renderCartList();

    // 使用 getOrCreateInstance 避免重複建立 Modal
    const modalEl = document.getElementById('cartModal');
    const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
    modal.show();
}

// Generate QR Code
function generateCheckoutQR() {
    try {
        // Check cart first
        let hasItems = false;
        for (const key in cart) {
            if (cart[key].qty > 0) {
                hasItems = true;
                break;
            }
        }

        if (!hasItems) {
            alert('請先點餐');
            return;
        }

        if (typeof QRCode === 'undefined') {
            alert('QRCode library not loaded');
            return;
        }

        const total = document.getElementById('total-price').textContent;
        const qrContainer = document.getElementById('qrcode');
        qrContainer.innerHTML = ''; // Clear previous

        const orderData = [];
        for (const [, cartItem] of Object.entries(cart)) {
            if (cartItem.qty > 0) {
                const item = { id: cartItem.itemId, q: cartItem.qty };
                if (cartItem.note) {
                    item.n = cartItem.note; // 加入備註
                }
                orderData.push(item);
            }
        }

        // 取得內用/外帶選項
        const diningOption = document.querySelector('input[name="diningOption"]:checked').value;

        // Generate JSON string for QR
        const payload = {
            t: Date.now(),
            type: diningOption,
            d: orderData
        };

        // Show modal first to ensure container is ready (though QRCode usually works hidden)
        const modal = bootstrap.Modal.getOrCreateInstance(document.getElementById('qrModal'));
        modal.show();

        // Generate QR Code
        // setTimeout to ensure modal is rendering if that was the issue
        setTimeout(() => {
            try {
                qrContainer.innerHTML = ''; 
                new QRCode(qrContainer, {
                    text: JSON.stringify(payload),
                    width: 200,
                    height: 200,
                    correctLevel: QRCode.CorrectLevel.L
                });
            } catch (qrError) {
                console.error('QR Gen Error', qrError);
                qrContainer.innerHTML = '<p class="text-danger">QR Code 產生失敗</p>';
            }
        }, 100);

        document.getElementById('qr-total').textContent = `總計: ${total}`;

    } catch (e) {
        console.error(e);
        alert('結帳功能發生錯誤');
    }
}

// Online Reservation
function orderOnline() {
    // Check if cart is empty
    let hasItems = false;
    for (const key in cart) {
        if (cart[key].qty > 0) {
            hasItems = true;
            break;
        }
    }

    if (!hasItems) {
        alert('請先點餐');
        return;
    }

    // Show input modal
    const modal = bootstrap.Modal.getOrCreateInstance(document.getElementById('onlineReservationModal'));
    modal.show();
}

function confirmReservation() {
    const name = document.getElementById('reservationName').value.trim();
    const phone = document.getElementById('reservationPhone').value.trim();

    if (!name) {
        alert('請輸入姓名');
        return;
    }
    if (!phone || phone.length !== 3) {
        alert('請輸入電話號碼後3碼');
        return;
    }

    // Generate Order Number
    const timestamp = Date.now().toString();
    const orderNum = 'ORD' + timestamp.slice(-6);

    // Populate Success Modal
    document.getElementById('successOrderNumber').textContent = '#' + orderNum;
    document.getElementById('successName').textContent = name;
    document.getElementById('successPhone').textContent = phone;
    document.getElementById('successTotal').textContent = document.getElementById('total-price').textContent;

    const list = document.getElementById('successOrderList');
    list.innerHTML = '';

    for (const [cartKey, cartItem] of Object.entries(cart)) {
        if (cartItem.qty > 0) {
            const item = menuItems.find(i => i.id === cartItem.itemId);
            const li = document.createElement('li');
            li.className = 'list-group-item d-flex justify-content-between align-items-center';
            
            const noteHtml = cartItem.note ? `<div class="text-muted small">${cartItem.note}</div>` : '';
            
            li.innerHTML = `
                <div>
                    <div>${item.name} x ${cartItem.qty}</div>
                    ${noteHtml}
                </div>
                <span>$${item.price * cartItem.qty}</span>
            `;
            list.appendChild(li);
        }
    }

    // Hide input modal
    const inputModalEl = document.getElementById('onlineReservationModal');
    const inputModal = bootstrap.Modal.getInstance(inputModalEl);
    inputModal.hide();

    // Show success modal
    const successModal = bootstrap.Modal.getOrCreateInstance(document.getElementById('reservationSuccessModal'));
    successModal.show();
    
    // Clear inputs
    document.getElementById('reservationName').value = '';
    document.getElementById('reservationPhone').value = '';
    
    // 清空購物車
    clearCart();
}
