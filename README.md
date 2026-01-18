# 幸福早餐點餐系統

早餐店專用的 POS 及顧客自助點餐系統，採用純前端技術實現。

## 功能特色

### 顧客自助點餐 (order.html)

- 依分類瀏覽商品（三明治、漢堡、蛋餅、吐司/厚片、飲料）
- 購物車管理（新增、修改數量、刪除）
- 商品備註功能（常用備註快選 + 自訂備註）
- 內用/外帶選擇，內用可指定桌號
- 結帳時產生 QR Code，供 POS 掃描匯入訂單

### POS 系統 (pos.html)

- 快速點餐介面，依分類篩選商品
- 訂單編輯與備註功能
- QR Code 掃描器，匯入顧客自助點餐的訂單
- 訂單看板管理：
  - **新訂單** - 剛送出的訂單
  - **製作中** - 正在準備的訂單
  - **已完成** - 等待取餐的訂單
  - **歷史** - 已結案的訂單
- 即時時鐘與訂單數量統計

## 技術規格

- HTML5 / CSS3 / JavaScript (ES6+)
- Bootstrap 5.3.0
- Font Awesome 6.4.0
- QRCode.js（QR Code 生成）
- Html5-Qrcode（QR Code 掃描）

## 快速開始

1. 使用靜態伺服器啟動專案：

   ```bash
   # Python
   python -m http.server 8000

   # Node.js
   npx http-server
   ```

2. 開啟瀏覽器訪問 `http://localhost:8000`

3. 首頁提供兩個入口：
   - **開始點餐** - 進入顧客自助點餐頁面
   - **POS 系統** - 登入後進入 POS 管理介面（帳號: admin / 密碼: 00000）

## 專案結構

```
pos/
├── index.html          # 首頁/登入
├── order.html          # 顧客自助點餐
├── pos.html            # POS 系統
├── css/
│   └── style.css       # 自訂樣式
├── js/
│   ├── data.js         # 商品與分類資料
│   ├── order.js        # 點餐頁邏輯
│   └── pos.js          # POS 頁邏輯
└── images/
    ├── category/       # 分類圖示
    └── product/        # 商品圖片
```

## 授權

此專案僅供學習與展示用途。

---

開發者：Johnson Hsu
