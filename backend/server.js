const path = require('path')
const fs = require('fs/promises')

const express = require('express')
const cors = require('cors')

const app = express()

app.use(cors({ origin: true }))
app.use(express.json({ limit: '2mb' }))

const DATA_DIR = path.join(__dirname, 'data')
const CONTACTS_PATH = path.join(DATA_DIR, 'contacts.json')
const ORDERS_PATH = path.join(DATA_DIR, 'orders.json')
const PICKUPS_PATH = path.join(DATA_DIR, 'pickups.json')

const products = [
  {
    id: 1,
    brand: 'Apple',
    name: 'iPhone 13 Pro',
    storage: '128GB',
    price: 45000,
    oldPrice: 119900,
    img: 'https://images.unsplash.com/photo-1632661674596-df8be070a5c5?auto=format&fit=crop&q=80&w=400',
    condition: 'Excellent',
  },
  {
    id: 2,
    brand: 'Samsung',
    name: 'Galaxy S22 Ultra',
    storage: '256GB',
    price: 52000,
    oldPrice: 109999,
    img: 'https://images.unsplash.com/photo-1644982647844-5ee1bdc5b114?auto=format&fit=crop&q=80&w=400',
    condition: 'Good',
  },
  {
    id: 3,
    brand: 'Apple',
    name: 'iPhone 12',
    storage: '64GB',
    price: 25000,
    oldPrice: 65900,
    img: 'https://images.unsplash.com/photo-1605236453806-6ff36851218e?auto=format&fit=crop&q=80&w=400',
    condition: 'Fair',
  },
  {
    id: 4,
    brand: 'OnePlus',
    name: 'OnePlus 10 Pro',
    storage: '128GB',
    price: 35000,
    oldPrice: 66999,
    img: 'https://images.unsplash.com/photo-1678911820864-e2c567c655d7?auto=format&fit=crop&q=80&w=400',
    condition: 'Excellent',
  },
  {
    id: 5,
    brand: 'Apple',
    name: 'iPhone 14',
    storage: '128GB',
    price: 58000,
    oldPrice: 79900,
    img: 'https://images.unsplash.com/photo-1663465374413-83c700ef5c88?auto=format&fit=crop&q=80&w=400',
    condition: 'Excellent',
  },
  {
    id: 6,
    brand: 'Samsung',
    name: 'Galaxy Z Flip 3',
    storage: '128GB',
    price: 32000,
    oldPrice: 84999,
    img: 'https://images.unsplash.com/photo-1633511090164-b490e6669c27?auto=format&fit=crop&q=80&w=400',
    condition: 'Good',
  },
]

const sellBasePrices = {
  apple: { 'iPhone 14': 40000, 'iPhone 13': 30000, 'iPhone 12': 20000 },
  samsung: { 'S23 Ultra': 55000, 'S22 Ultra': 40000, 'S21 FE': 15000 },
  oneplus: { '11 5G': 35000, '10 Pro': 25000, '9R': 12000 },
}

async function ensureDataFile(filePath) {
  await fs.mkdir(DATA_DIR, { recursive: true })
  try {
    await fs.access(filePath)
  } catch {
    await fs.writeFile(filePath, '[]', 'utf8')
  }
}

async function readJsonArray(filePath) {
  await ensureDataFile(filePath)
  const raw = await fs.readFile(filePath, 'utf8')
  try {
    const data = JSON.parse(raw)
    return Array.isArray(data) ? data : []
  } catch {
    return []
  }
}

async function appendJsonArray(filePath, item) {
  const arr = await readJsonArray(filePath)
  arr.push(item)
  await fs.writeFile(filePath, JSON.stringify(arr, null, 2), 'utf8')
}

function computeSellQuote({ brand, model, condition, storageGb, accessories }) {
  if (!brand || !model) return null
  if (!sellBasePrices[brand] || sellBasePrices[brand][model] == null) return null

  let basePrice = sellBasePrices[brand][model]
  if (storageGb === 256) basePrice += 3000
  if (storageGb === 512) basePrice += 6000

  const multiplier = condition === 'excellent' ? 1.1 : condition === 'good' ? 0.9 : 0.7

  if (accessories && accessories.box === false) basePrice -= 500
  if (accessories && accessories.charger === false) basePrice -= 1000

  return Math.round(basePrice * multiplier)
}

function computeCartTotals(items) {
  const subtotal = items.reduce((sum, it) => sum + it.price * it.qty, 0)
  const tax = subtotal * 0.18
  const total = subtotal + tax
  return { subtotal, tax, total }
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true })
})

app.get('/api/products', (_req, res) => {
  res.json({ products })
})

app.post('/api/sell/quote', async (req, res) => {
  const { brand, model, condition, storageGb, accessories } = req.body || {}
  const quote = computeSellQuote({ brand, model, condition, storageGb, accessories })
  if (quote == null) return res.status(400).json({ error: 'Invalid brand/model' })
  res.json({ quote })
})

app.post('/api/sell/pickup', async (req, res) => {
  const payload = req.body || {}
  const pickup = {
    id: `pickup_${Date.now()}_${Math.random().toString(16).slice(2)}`,
    createdAt: new Date().toISOString(),
    ...payload,
  }
  await appendJsonArray(PICKUPS_PATH, pickup)
  res.json({ ok: true, pickup })
})

app.post('/api/checkout', async (req, res) => {
  const { cartItems, shipping, paymentMethod } = req.body || {}
  if (!Array.isArray(cartItems) || cartItems.length === 0) return res.status(400).json({ error: 'Cart is empty' })

  // Minimal sanity check: id must exist and price must match current catalog (basic protection)
  const normalizedItems = cartItems.map((it) => {
    const p = products.find((x) => x.id === it.id)
    return p
      ? { id: p.id, name: p.name, price: p.price, qty: Math.max(1, Number(it.qty) || 1), storage: p.storage, img: p.img, condition: p.condition }
      : null
  }).filter(Boolean)

  if (normalizedItems.length === 0) return res.status(400).json({ error: 'Invalid items' })

  const totals = computeCartTotals(normalizedItems)
  const order = {
    id: `order_${Date.now()}_${Math.random().toString(16).slice(2)}`,
    createdAt: new Date().toISOString(),
    items: normalizedItems,
    totals,
    shipping: shipping || null,
    paymentMethod: paymentMethod || 'upi',
    status: 'placed',
  }

  await appendJsonArray(ORDERS_PATH, order)
  res.json({ ok: true, order })
})

app.post('/api/contact', async (req, res) => {
  const { name, email, phone, company, message } = req.body || {}
  if (!name || !email || !message) return res.status(400).json({ error: 'Missing required fields' })

  const contact = {
    id: `contact_${Date.now()}_${Math.random().toString(16).slice(2)}`,
    createdAt: new Date().toISOString(),
    name,
    email,
    phone: phone || null,
    company: company || null,
    message,
  }
  await appendJsonArray(CONTACTS_PATH, contact)
  res.json({ ok: true })
})

const PORT = process.env.PORT ? Number(process.env.PORT) : 5175
app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Backend listening on http://localhost:${PORT}`)
})

