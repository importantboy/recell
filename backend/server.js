require('dotenv').config()

const crypto = require('crypto')

const express = require('express')
const cors = require('cors')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const mongoose = require('mongoose')

const User = require('./models/User')
const Order = require('./models/Order')
const Pickup = require('./models/Pickup')
const Contact = require('./models/Contact')

const app = express()

const allowedOrigins = [
  "http://localhost:5174", // Vite default
  "http://localhost:5173", // Vite default
  "https://recell-1.onrender.com",
];

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));


app.use(express.json({ limit: '2mb' }))

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me'
const MONGODB_URI = process.env.MONGODB_URI || ''

// app.use(cors())

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
  {
    id: 7,
    brand: 'Apple',
    name: 'iPhone 13',
    storage: '128GB',
    price: 39999,
    oldPrice: 69900,
    img: 'https://images.unsplash.com/photo-1632728722507-3f3c20b8b7f8?auto=format&fit=crop&q=80&w=400',
    condition: 'Good',
  },
  {
    id: 8,
    brand: 'Apple',
    name: 'iPhone 14 Pro',
    storage: '256GB',
    price: 76999,
    oldPrice: 129900,
    img: 'https://images.unsplash.com/photo-1663499482525-1e0c8c0c7f3b?auto=format&fit=crop&q=80&w=400',
    condition: 'Excellent',
  },
  {
    id: 9,
    brand: 'Samsung',
    name: 'Galaxy S23 Ultra',
    storage: '256GB',
    price: 79999,
    oldPrice: 124999,
    img: 'https://images.unsplash.com/photo-1673117273342-1c75b07bf988?auto=format&fit=crop&q=80&w=400',
    condition: 'Excellent',
  },
  {
    id: 10,
    brand: 'Samsung',
    name: 'Galaxy S21 FE',
    storage: '128GB',
    price: 25999,
    oldPrice: 49999,
    img: 'https://images.unsplash.com/photo-1616348436168-de43ad0db179?auto=format&fit=crop&q=80&w=400',
    condition: 'Good',
  },
  {
    id: 11,
    brand: 'OnePlus',
    name: 'OnePlus 11 5G',
    storage: '256GB',
    price: 41999,
    oldPrice: 61999,
    img: 'https://images.unsplash.com/photo-1661961112953-1c9a09852ffb?auto=format&fit=crop&q=80&w=400',
    condition: 'Excellent',
  },
  {
    id: 12,
    brand: 'OnePlus',
    name: 'OnePlus 9R',
    storage: '128GB',
    price: 18999,
    oldPrice: 39999,
    img: 'https://images.unsplash.com/photo-1626078293453-4b5d4798365a?auto=format&fit=crop&q=80&w=400',
    condition: 'Fair',
  },
  {
    id: 13,
    brand: 'Xiaomi',
    name: 'Redmi Note 12 Pro',
    storage: '128GB',
    price: 16999,
    oldPrice: 24999,
    img: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&q=80&w=400',
    condition: 'Good',
  },
  {
    id: 14,
    brand: 'Xiaomi',
    name: 'Mi 11X',
    storage: '128GB',
    price: 13999,
    oldPrice: 29999,
    img: 'https://images.unsplash.com/photo-1589492477829-5e65395b66cc?auto=format&fit=crop&q=80&w=400',
    condition: 'Fair',
  },
  {
    id: 15,
    brand: 'Google',
    name: 'Pixel 7',
    storage: '128GB',
    price: 34999,
    oldPrice: 59999,
    img: 'https://images.unsplash.com/photo-1661794437649-9e8bd2d96ffb?auto=format&fit=crop&q=80&w=400',
    condition: 'Excellent',
  },
  {
    id: 16,
    brand: 'Google',
    name: 'Pixel 6a',
    storage: '128GB',
    price: 22999,
    oldPrice: 43999,
    img: 'https://images.unsplash.com/photo-1658756397407-2d9968436d5a?auto=format&fit=crop&q=80&w=400',
    condition: 'Good',
  },
  {
    id: 17,
    brand: 'Nothing',
    name: 'Phone (1)',
    storage: '128GB',
    price: 21999,
    oldPrice: 32999,
    img: 'https://images.unsplash.com/photo-1658240085048-18b1a0c0b2a6?auto=format&fit=crop&q=80&w=400',
    condition: 'Good',
  },
  {
    id: 18,
    brand: 'Motorola',
    name: 'Edge 30',
    storage: '128GB',
    price: 19999,
    oldPrice: 29999,
    img: 'https://images.unsplash.com/photo-1556656793-08538906a9f8?auto=format&fit=crop&q=80&w=400',
    condition: 'Good',
  },
  {
    id: 19,
    brand: 'Realme',
    name: 'Realme GT Neo 3',
    storage: '256GB',
    price: 24999,
    oldPrice: 39999,
    img: 'https://images.unsplash.com/photo-1603899124185-3736bd0b96f0?auto=format&fit=crop&q=80&w=400',
    condition: 'Excellent',
  },
  {
    id: 20,
    brand: 'Apple',
    name: 'iPhone 11',
    storage: '64GB',
    price: 21999,
    oldPrice: 49900,
    img: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&q=80&w=400',
    condition: 'Fair',
  },
]

const sellBasePrices = {
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

function createId(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`
}

function authMiddleware(req, res, next) {
  const header = req.headers.authorization || ''
  const [type, token] = header.split(' ')
  if (type !== 'Bearer' || !token) return res.status(401).json({ error: 'Unauthorized' })
  try {
    const payload = jwt.verify(token, JWT_SECRET)
    req.user = payload
    return next()
  } catch {
    return res.status(401).json({ error: 'Unauthorized' })
  }
}

function optionalAuth(req, _res, next) {
  const header = req.headers.authorization || ''
  const [type, token] = header.split(' ')
  if (type !== 'Bearer' || !token) {
    req.user = null
    return next()
  }
  try {
    req.user = jwt.verify(token, JWT_SECRET)
    return next()
  } catch {
    req.user = null
    return next()
  }
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

app.post('/api/auth/signup', async (req, res) => {
  const { name, email, password } = req.body || {}
  if (!email || !password) return res.status(400).json({ error: 'Missing email/password' })
  if (typeof password !== 'string' || password.length < 6) return res.status(400).json({ error: 'Password too short' })

  const normalizedEmail = String(email).trim().toLowerCase()
  const existing = await User.findOne({ email: normalizedEmail }).lean()
  if (existing) return res.status(409).json({ error: 'Email already in use' })

  const passwordHash = await bcrypt.hash(password, 12)
  const user = await User.create({
    name: name ? String(name).trim() : null,
    email: normalizedEmail,
    passwordHash,
  })

  const token = jwt.sign({ sub: String(user._id), email: user.email, name: user.name }, JWT_SECRET, { expiresIn: '7d' })
  res.json({ ok: true, token, user: { id: String(user._id), email: user.email, name: user.name } })
})

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body || {}
  if (!email || !password) return res.status(400).json({ error: 'Missing email/password' })
  const normalizedEmail = String(email).trim().toLowerCase()
  const user = await User.findOne({ email: normalizedEmail })
  if (!user) return res.status(401).json({ error: 'Invalid credentials' })

  const ok = await bcrypt.compare(String(password), user.passwordHash)
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' })

  const token = jwt.sign({ sub: String(user._id), email: user.email, name: user.name }, JWT_SECRET, { expiresIn: '7d' })
  res.json({ ok: true, token, user: { id: String(user._id), email: user.email, name: user.name } })
})

app.get('/api/me', authMiddleware, async (req, res) => {
  res.json({ ok: true, user: { id: req.user.sub, email: req.user.email, name: req.user.name } })
})

app.post('/api/sell/quote', async (req, res) => {
  const { brand, model, condition, storageGb, accessories } = req.body || {}
  const quote = computeSellQuote({ brand, model, condition, storageGb, accessories })
  if (quote == null) return res.status(400).json({ error: 'Invalid brand/model' })
  res.json({ quote })
})

app.post('/api/sell/pickup', optionalAuth, async (req, res) => {
  const payload = req.body || {}
  if (typeof payload.quote !== 'number') return res.status(400).json({ error: 'Missing quote' })

  const pickup = await Pickup.create({
    userId: req.user?.sub || null,
    quote: payload.quote,
    deviceName: payload.deviceName || null,
    brand: payload.brand || null,
    model: payload.model || null,
    condition: payload.condition || null,
    storageGb: payload.storageGb || null,
    accessories: payload.accessories || null,
    status: 'requested',
    timeline: [{ at: new Date(), status: 'requested', label: 'Pickup requested' }],
  })

  res.json({ ok: true, pickup: { ...pickup.toObject(), id: String(pickup._id) } })
})

app.post('/api/checkout', optionalAuth, async (req, res) => {
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
  const order = await Order.create({
    userId: req.user?.sub || null,
    items: normalizedItems.map((i) => ({
      productId: i.id,
      name: i.name,
      price: i.price,
      qty: i.qty,
      storage: i.storage || null,
      img: i.img || null,
      condition: i.condition || null,
    })),
    totals,
    shipping: shipping || null,
    paymentMethod: paymentMethod || 'upi',
    status: 'placed',
    timeline: [{ at: new Date(), status: 'placed', label: 'Order placed' }],
  })

  res.json({ ok: true, order: { ...order.toObject(), id: String(order._id) } })
})

app.get('/api/track/orders', authMiddleware, async (req, res) => {
  const orders = await Order.find({ userId: req.user.sub }).sort({ createdAt: -1 }).lean()
  res.json({
    ok: true,
    orders: orders.map((o) => ({ ...o, id: String(o._id), userId: o.userId ? String(o.userId) : null })),
  })
})

app.get('/api/track/pickups', authMiddleware, async (req, res) => {
  const pickups = await Pickup.find({ userId: req.user.sub }).sort({ createdAt: -1 }).lean()
  res.json({
    ok: true,
    pickups: pickups.map((p) => ({ ...p, id: String(p._id), userId: p.userId ? String(p.userId) : null })),
  })
})

app.post('/api/contact', optionalAuth, async (req, res) => {
  const { name, email, phone, company, message } = req.body || {}
  if (!name || !email || !message) return res.status(400).json({ error: 'Missing required fields' })

  await Contact.create({
    userId: req.user?.sub || null,
    name,
    email,
    phone: phone || null,
    company: company || null,
    message,
  })
  res.json({ ok: true })
})

const PORT = process.env.PORT ? Number(process.env.PORT) : 5175
async function start() {
  if (!MONGODB_URI) {
    // eslint-disable-next-line no-console
    console.error('Missing MONGODB_URI. Create backend/.env from backend/.env.example')
    process.exit(1)
  }

  await mongoose.connect(MONGODB_URI)
  // eslint-disable-next-line no-console
  console.log('MongoDB connected')

  app.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`Backend listening on http://localhost:${PORT}`)
  })
}

start().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Failed to start backend', err)
  process.exit(1)
})

