# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 專案概述

**幸福早餐點餐系統** - 純前端早餐店 POS 及顧客自助點餐系統

- **技術棧**: Vanilla HTML/CSS/JavaScript（無後端）
- **UI 框架**: Bootstrap 5.3.0 + Font Awesome 6.4.0
- **QR Code**: qrcode.js（生成）、html5-qrcode（掃描）

## 開發指令

本專案為純靜態網頁，開發時使用任一靜態伺服器：

```bash
# 使用 Python
python -m http.server 8000

# 使用 Node.js
npx http-server
# 或
npx serve
```

然後開啟瀏覽器訪問 `http://localhost:8000`

## 架構說明

### 頁面結構

| 檔案 | 用途 | 對應 JS |
|------|------|---------|
| index.html | 首頁/登入 | - |
| order.html | 顧客自助點餐 | js/order.js |
| pos.html | 店員 POS 系統 | js/pos.js |

### JavaScript 模組

- **js/data.js** - 共用資料定義（商品、分類、備註選項、桌號）
- **js/order.js** - 顧客點餐邏輯、購物車、QR Code 生成
- **js/pos.js** - POS 邏輯、訂單管理、看板、QR Code 掃描

### 資料結構

商品 ID 編碼：
- A01-A08: 三明治
- B01-B03: 漢堡
- C01-C03: 蛋餅
- T01-T08: 吐司/厚片
- D01-D03: 飲料

### 狀態管理

**order.js**:
- `cart`: 購物車物件 (cartKey → {qty, note, itemId})
- `currentCategory`: 目前選擇的分類

**pos.js**:
- `currentOrder`: 目前編輯中的訂單
- `orders`: 所有訂單陣列
- 看板流程: new → making → done → history

### QR Code 資料格式

```javascript
{ t: timestamp, d: [{id: productId, q: quantity}, ...] }
```

## 程式碼慣例

- 函式使用 `/// <summary>` XML 註解
- 變數使用 camelCase
- POS 相關函式加上 `pos` 前綴（如 `posAddToOrder`）
- 使用 Bootstrap Modal API 處理對話框

## 圖片資源

- `images/category/` - 分類圖示 PNG
- `images/product/` - 商品圖片 PNG（以商品 ID 命名）

## 注意事項

- 目前無資料持久化（重新整理會遺失資料）
- 登入為示範用固定帳密（admin / 00000）
- 所有運算皆在客戶端完成
