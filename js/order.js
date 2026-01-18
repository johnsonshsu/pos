// State
let cart = {}; // Object to store id -> { qty, note }
let currentCategory = null; // 目前選取的分類
let currentNoteItemId = null; // 目前正在編輯備註的商品 ID
let selectedNotes = []; // 目前選取的常用備註

// Init
// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('sys-name').textContent = systemInfo.name;
    renderCategoryNav();
    initCategoryNavDrag();
    renderMenuItems(categories[0].id); // Default to first category
    updateBottomBar();
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
        itemDiv.onclick = () => addToCart(item.id);
        itemDiv.innerHTML = `
            <img src="images/product/${item.id}.png" class="product-icon" alt="${item.name}">
            <div class="info">
                <h5>${item.name}</h5>
                <div class="price">$${item.price}</div>
            </div>
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
    // Sort selected notes to ensure consistent key generation regardless of selection order
    let allNotes = [...selectedNotes].sort();
    
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
            // 修正統計邏輯：計算品項數(筆數)，而非總數量
            count += 1;
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

/// <summary>
/// 同步桌號按鈕狀態
/// </summary>
function syncTableButtons(currentNum) {
    document.querySelectorAll('#qrTableButtons .btn').forEach(btn => {
        if (parseInt(btn.textContent) === parseInt(currentNum)) {
            btn.classList.remove('btn-outline-secondary');
            btn.classList.add('btn-primary', 'text-white');
        } else {
            btn.classList.remove('btn-primary', 'text-white');
            btn.classList.add('btn-outline-secondary');
        }
    });
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
        const qrModalEl = document.getElementById('qrModal');
        const tableNumContainer = document.getElementById('qrTableNumberContainer');
        const btnGenerate = document.getElementById('btnGenerateQR');
        const qrDiningOptions = document.querySelectorAll('input[name="qrDiningOption"]');
        const qrTableButtonsContainer = document.getElementById('qrTableButtons');
        const selectedTableInput = document.getElementById('qrSelectedTable');
        
        const qrDiningOptionContainer = document.getElementById('qrDiningOptionContainer');
        const qrGenerateBtnContainer = document.getElementById('qrGenerateBtnContainer');
        
        // 1. Default to Dine In
        document.getElementById('qrDineIn').checked = true;
        
        // Clear previous state and re-enable inputs/visibility
        qrContainer.innerHTML = '';
        selectedTableInput.value = '1'; // Default to 1
        qrDiningOptions.forEach(el => el.disabled = false);
        btnGenerate.disabled = false;
        
        // Reset Visibility
        qrDiningOptionContainer.style.display = '';
        qrGenerateBtnContainer.style.display = '';
        document.getElementById('qr-instruction').style.display = 'none';
        
        document.getElementById('qr-total').textContent = '';
        document.getElementById('qr-info').textContent = ''; // 清空資訊

        // Render Table Buttons
        qrTableButtonsContainer.innerHTML = '';
        if (typeof tableNumbers !== 'undefined') {
            tableNumbers.forEach(num => {
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'btn btn-outline-secondary table-btn'; // Custom class for styling if needed
                btn.textContent = num;
                btn.style.width = '45px'; // Fixed width for grid look
                btn.onclick = () => {
                    selectedTableInput.value = num;
                    syncTableButtons(num);
                };
                qrTableButtonsContainer.appendChild(btn);
            });
        }
        
        // Sync initial state
        syncTableButtons(1);

        // Bind input change
        selectedTableInput.oninput = () => syncTableButtons(selectedTableInput.value);

        // Enable buttons logic (if re-opening after lock)
        // Note: Re-rendering clears event listeners and state, so buttons are fresh and enabled.

        // UI Update Logic (Toggle Table Number)
        const updateUI = () => {
            const isDineIn = document.getElementById('qrDineIn').checked;
            tableNumContainer.style.display = isDineIn ? 'block' : 'none';
        };

        // Initialize UI
        updateUI();

        // Bind UI changes
        qrDiningOptions.forEach(el => {
            el.onchange = updateUI;
        });

        // 2. Define Generate Logic (Triggered by Button)
        const generate = () => {
            try {
                // Get CURRENT selection from MODAL
                const selectedOptionEl = document.querySelector('input[name="qrDiningOption"]:checked');
                if (!selectedOptionEl) {
                    throw new Error('未選擇用餐方式');
                }
                const selectedOption = selectedOptionEl.value;
                const isDineIn = selectedOption === 'dineIn';
                
                // Validation for Dine In
                let tableNum = null;
                if (isDineIn) {
                    tableNum = selectedTableInput.value;
                    if (!tableNum) {
                        alert('內用請選擇桌號');
                        return; // Stop generation
                    }
                }

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
                
                const payload = {
                    t: Date.now(),
                    type: selectedOption, // Use modal selection
                    tableNumber: tableNum, // Include table number
                    d: orderData
                };

                qrContainer.innerHTML = ''; 
                
                // Check if QRCode lib is ready
                if (typeof QRCode === 'undefined') {
                    throw new Error('QRCode library missing');
                }

                new QRCode(qrContainer, {
                    text: JSON.stringify(payload),
                    width: 200,
                    height: 200
                });
                
                // 顯示訂單資訊
                const infoText = isDineIn ? `內用 - 桌號: ${tableNum}` : '外帶';
                document.getElementById('qr-info').textContent = infoText;
                document.getElementById('qr-total').textContent = `總計: ${total}`;
                document.getElementById('qr-instruction').style.display = 'block';

                // 產生完畢後隱藏選項與按鈕，讓畫面更乾淨
                qrDiningOptionContainer.style.display = 'none';
                tableNumContainer.style.display = 'none';
                qrGenerateBtnContainer.style.display = 'none';

            } catch (qrError) {
                console.error('QR Gen Error', qrError);
                qrContainer.innerHTML = `<p class="text-danger">QR Code 產生失敗: ${qrError.message}</p>`;
            }
        };

        // Bind Generate Button
        btnGenerate.onclick = generate;

        // Show modal
        const modal = bootstrap.Modal.getOrCreateInstance(qrModalEl);
        modal.show();

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

    // Set default time to current time + 15 minutes
    const now = new Date();
    now.setMinutes(now.getMinutes() + 15);
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    document.getElementById('reservationTime').value = `${hours}:${minutes}`;

    // Show input modal
    const modal = bootstrap.Modal.getOrCreateInstance(document.getElementById('onlineReservationModal'));
    modal.show();
}

function confirmReservation() {
    const name = document.getElementById('reservationName').value.trim();
    const phone = document.getElementById('reservationPhone').value.trim();
    const time = document.getElementById('reservationTime').value;

    if (!name) {
        alert('請輸入姓名');
        return;
    }
    if (!time) {
        alert('請選擇預計取餐時間');
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
    document.getElementById('successTime').textContent = time;
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
    document.getElementById('reservationTime').value = '';
    
    // 清空購物車
    clearCart();
}
