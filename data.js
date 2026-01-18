// Categories
const categories = [
    { id: 'sandwich', name: '三明治系列' },
    { id: 'burger', name: '漢堡系列' },
    { id: 'omelet', name: '蛋餅系列' },
    { id: 'toast', name: '吐司/厚片' },
    { id: 'drink', name: '飲料' }
];

// Menu Items
const menuItems = [
    { id: 'A01', name: '煎蛋三明治', price: 25, cat: 'sandwich' },
    { id: 'A02', name: '起司蛋三明治', price: 35, cat: 'sandwich' },
    { id: 'A03', name: '肉鬆蛋三明治', price: 35, cat: 'sandwich' },
    { id: 'A04', name: '玉米蛋三明治', price: 35, cat: 'sandwich' },
    { id: 'A05', name: '火腿蛋三明治', price: 40, cat: 'sandwich' },
    { id: 'A06', name: '培根蛋三明治', price: 40, cat: 'sandwich' },
    { id: 'A07', name: '香雞蛋三明治', price: 40, cat: 'sandwich' },
    { id: 'A08', name: '燻雞蛋三明治', price: 40, cat: 'sandwich' },
    { id: 'B01', name: '豬肉漢堡', price: 40, cat: 'burger' },
    { id: 'B02', name: '香雞漢堡', price: 45, cat: 'burger' },
    { id: 'B03', name: '牛肉漢堡', price: 55, cat: 'burger' },
    { id: 'C01', name: '原味蛋餅', price: 25, cat: 'omelet' },
    { id: 'C02', name: '玉米蛋餅', price: 35, cat: 'omelet' },
    { id: 'C03', name: '火腿蛋餅', price: 35, cat: 'omelet' },
    { id: 'T01', name: '奶酥厚片', price: 25, cat: 'toast' },
    { id: 'T02', name: '花生厚片', price: 25, cat: 'toast' },
    { id: 'T03', name: '巧克力厚片', price: 25, cat: 'toast' },
    { id: 'T04', name: '草莓果醬厚片', price: 25, cat: 'toast' },
    { id: 'T05', name: '蒜香厚片', price: 30, cat: 'toast' },
    { id: 'T06', name: '起司肉鬆吐司', price: 35, cat: 'toast' },
    { id: 'T07', name: '火腿起司吐司', price: 40, cat: 'toast' },
    { id: 'T08', name: '培根起司吐司', price: 45, cat: 'toast' },
    { id: 'D01', name: '紅茶', price: 20, cat: 'drink' },
    { id: 'D02', name: '奶茶', price: 25, cat: 'drink' },
    { id: 'D03', name: '豆漿', price: 20, cat: 'drink' }
];

// 常用備註選項
const commonNotes = [
    '不要洋蔥',
    '不要蔥',
    '不要香菜',
    '少冰',
    '去冰',
    '微糖',
    '半糖',
    '無糖',
    '加辣',
    '不要辣',
    '蛋全熟',
    '加蛋',
    '切邊'
];

// Shared Utils
const formatCurrency = (num) => `$${num}`;
