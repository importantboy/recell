const Product = require('../models/Product')
const SellPrice = require('../models/SellPrice')

const PRODUCTS = [
  { sku: 1, brand: 'Apple', name: 'iPhone 13 Pro', storage: '128GB', price: 45000, oldPrice: 119900, img: 'https://images.unsplash.com/photo-1632661674596-df8be070a5c5?auto=format&fit=crop&q=80&w=400', condition: 'Excellent' },
  { sku: 2, brand: 'Samsung', name: 'Galaxy S22 Ultra', storage: '256GB', price: 52000, oldPrice: 109999, img: 'https://images.unsplash.com/photo-1644982647844-5ee1bdc5b114?auto=format&fit=crop&q=80&w=400', condition: 'Good' },
  { sku: 3, brand: 'Apple', name: 'iPhone 12', storage: '64GB', price: 25000, oldPrice: 65900, img: 'https://images.unsplash.com/photo-1605236453806-6ff36851218e?auto=format&fit=crop&q=80&w=400', condition: 'Fair' },
  { sku: 4, brand: 'OnePlus', name: 'OnePlus 10 Pro', storage: '128GB', price: 35000, oldPrice: 66999, img: 'https://images.unsplash.com/photo-1678911820864-e2c567c655d7?auto=format&fit=crop&q=80&w=400', condition: 'Excellent' },
  { sku: 5, brand: 'Apple', name: 'iPhone 14', storage: '128GB', price: 58000, oldPrice: 79900, img: 'https://images.unsplash.com/photo-1663465374413-83c700ef5c88?auto=format&fit=crop&q=80&w=400', condition: 'Excellent' },
  { sku: 6, brand: 'Samsung', name: 'Galaxy Z Flip 3', storage: '128GB', price: 32000, oldPrice: 84999, img: 'https://images.unsplash.com/photo-1633511090164-b490e6669c27?auto=format&fit=crop&q=80&w=400', condition: 'Good' },
  { sku: 7, brand: 'Apple', name: 'iPhone 13', storage: '128GB', price: 39999, oldPrice: 69900, img: 'https://images.unsplash.com/photo-1632728722507-3f3c20b8b7f8?auto=format&fit=crop&q=80&w=400', condition: 'Good' },
  { sku: 8, brand: 'Apple', name: 'iPhone 14 Pro', storage: '256GB', price: 76999, oldPrice: 129900, img: 'https://images.unsplash.com/photo-1663499482525-1e0c8c0c7f3b?auto=format&fit=crop&q=80&w=400', condition: 'Excellent' },
  { sku: 9, brand: 'Samsung', name: 'Galaxy S23 Ultra', storage: '256GB', price: 79999, oldPrice: 124999, img: 'https://images.unsplash.com/photo-1673117273342-1c75b07bf988?auto=format&fit=crop&q=80&w=400', condition: 'Excellent' },
  { sku: 10, brand: 'Samsung', name: 'Galaxy S21 FE', storage: '128GB', price: 25999, oldPrice: 49999, img: 'https://images.unsplash.com/photo-1616348436168-de43ad0db179?auto=format&fit=crop&q=80&w=400', condition: 'Good' },
  { sku: 11, brand: 'OnePlus', name: 'OnePlus 11 5G', storage: '256GB', price: 41999, oldPrice: 61999, img: 'https://images.unsplash.com/photo-1661961112953-1c9a09852ffb?auto=format&fit=crop&q=80&w=400', condition: 'Excellent' },
  { sku: 12, brand: 'OnePlus', name: 'OnePlus 9R', storage: '128GB', price: 18999, oldPrice: 39999, img: 'https://images.unsplash.com/photo-1626078293453-4b5d4798365a?auto=format&fit=crop&q=80&w=400', condition: 'Fair' },
  { sku: 13, brand: 'Xiaomi', name: 'Redmi Note 12 Pro', storage: '128GB', price: 16999, oldPrice: 24999, img: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&q=80&w=400', condition: 'Good' },
  { sku: 14, brand: 'Xiaomi', name: 'Mi 11X', storage: '128GB', price: 13999, oldPrice: 29999, img: 'https://images.unsplash.com/photo-1589492477829-5e65395b66cc?auto=format&fit=crop&q=80&w=400', condition: 'Fair' },
  { sku: 15, brand: 'Google', name: 'Pixel 7', storage: '128GB', price: 34999, oldPrice: 59999, img: 'https://images.unsplash.com/photo-1661794437649-9e8bd2d96ffb?auto=format&fit=crop&q=80&w=400', condition: 'Excellent' },
  { sku: 16, brand: 'Google', name: 'Pixel 6a', storage: '128GB', price: 22999, oldPrice: 43999, img: 'https://images.unsplash.com/photo-1658756397407-2d9968436d5a?auto=format&fit=crop&q=80&w=400', condition: 'Good' },
  { sku: 17, brand: 'Nothing', name: 'Phone (1)', storage: '128GB', price: 21999, oldPrice: 32999, img: 'https://images.unsplash.com/photo-1658240085048-18b1a0c0b2a6?auto=format&fit=crop&q=80&w=400', condition: 'Good' },
  { sku: 18, brand: 'Motorola', name: 'Edge 30', storage: '128GB', price: 19999, oldPrice: 29999, img: 'https://images.unsplash.com/photo-1556656793-08538906a9f8?auto=format&fit=crop&q=80&w=400', condition: 'Good' },
  { sku: 19, brand: 'Realme', name: 'Realme GT Neo 3', storage: '256GB', price: 24999, oldPrice: 39999, img: 'https://images.unsplash.com/photo-1603899124185-3736bd0b96f0?auto=format&fit=crop&q=80&w=400', condition: 'Excellent' },
  { sku: 20, brand: 'Apple', name: 'iPhone 11', storage: '64GB', price: 21999, oldPrice: 49900, img: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&q=80&w=400', condition: 'Fair' },
]

const SELL_BASE_PRICES = {
  apple: {
    'iPhone 14 Pro': 65000,
    'iPhone 14': 40000,
    'iPhone 13 Pro': 36000,
    'iPhone 13': 30000,
    'iPhone 12': 20000,
    'iPhone 11': 15000,
  },
  samsung: {
    'S23 Ultra': 55000,
    'S22 Ultra': 40000,
    'S21 FE': 15000,
    'Z Flip 3': 22000,
  },
  oneplus: {
    '11 5G': 35000,
    '10 Pro': 25000,
    '9R': 12000,
  },
  google: {
    'Pixel 7': 28000,
    'Pixel 6a': 16000,
  },
  xiaomi: {
    'Redmi Note 12 Pro': 12000,
    'Mi 11X': 9000,
  },
  motorola: {
    'Edge 30': 12000,
  },
  nothing: {
    'Phone (1)': 15000,
  },
  realme: {
    'GT Neo 3': 14000,
  },
}

function flattenSellPrices() {
  const rows = []
  for (const [brand, models] of Object.entries(SELL_BASE_PRICES)) {
    for (const [model, basePrice] of Object.entries(models)) {
      rows.push({ brand, model, basePrice })
    }
  }
  return rows
}

async function seedDatabase() {
  const productCount = await Product.countDocuments()
  if (productCount === 0) {
    await Product.insertMany(PRODUCTS)
    // eslint-disable-next-line no-console
    console.log(`Seeded ${PRODUCTS.length} products`)
  }

  const sellCount = await SellPrice.countDocuments()
  if (sellCount === 0) {
    const rows = flattenSellPrices()
    await SellPrice.insertMany(rows)
    // eslint-disable-next-line no-console
    console.log(`Seeded ${rows.length} sell price rows`)
  }
}

module.exports = { seedDatabase, PRODUCTS, SELL_BASE_PRICES }
