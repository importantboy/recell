require('dotenv').config()

const express = require('express')
const cors = require('cors')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const mongoose = require('mongoose')

const User = require('./models/User')
const Order = require('./models/Order')
const Pickup = require('./models/Pickup')
const Contact = require('./models/Contact')
const Product = require('./models/Product')
const SellPrice = require('./models/SellPrice')
const { seedDatabase } = require('./seed/seedDatabase')

const app = express()

const allowedOrigins = ['http://localhost:5174', 'http://localhost:5173', 'https://recell-1.onrender.com']

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
)

app.use(express.json({ limit: '2mb' }))

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me'
const MONGODB_URI = process.env.MONGODB_URI || ''

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

async function computeSellQuote({ brand, model, condition, storageGb, accessories }) {
  if (!brand || !model) return null
  const row = await SellPrice.findOne({ brand: String(brand).toLowerCase().trim(), model: String(model).trim() }).lean()
  if (!row) return null

  let basePrice = row.basePrice
  const storage = Number(storageGb)
  if (storage === 256) basePrice += 3000
  if (storage === 512) basePrice += 6000

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

function mapProductDoc(p) {
  return {
    id: p.sku,
    brand: p.brand,
    name: p.name,
    storage: p.storage,
    price: p.price,
    oldPrice: p.oldPrice,
    img: p.img,
    condition: p.condition,
  }
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true })
})

/** Products catalog — requires login */
app.get('/api/products', authMiddleware, async (_req, res) => {
  const rows = await Product.find().sort({ sku: 1 }).lean()
  res.json({ products: rows.map(mapProductDoc) })
})

/** Sell quote dropdown data — requires login */
app.get('/api/sell/catalog', authMiddleware, async (_req, res) => {
  const rows = await SellPrice.find().sort({ brand: 1, model: 1 }).lean()
  const byBrand = {}
  for (const r of rows) {
    if (!byBrand[r.brand]) byBrand[r.brand] = []
    byBrand[r.brand].push({ model: r.model, basePrice: r.basePrice })
  }
  res.json({ ok: true, byBrand })
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

app.post('/api/sell/quote', authMiddleware, async (req, res) => {
  const { brand, model, condition, storageGb, accessories } = req.body || {}
  const quote = await computeSellQuote({ brand, model, condition, storageGb, accessories })
  if (quote == null) return res.status(400).json({ error: 'Invalid brand/model' })
  res.json({ quote })
})

app.post('/api/sell/pickup', authMiddleware, async (req, res) => {
  const payload = req.body || {}
  if (typeof payload.quote !== 'number') return res.status(400).json({ error: 'Missing quote' })

  const pickup = await Pickup.create({
    userId: req.user.sub,
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

app.post('/api/checkout', authMiddleware, async (req, res) => {
  const { cartItems, shipping, paymentMethod } = req.body || {}
  if (!Array.isArray(cartItems) || cartItems.length === 0) return res.status(400).json({ error: 'Cart is empty' })

  const skus = cartItems.map((it) => Number(it.id)).filter((n) => !Number.isNaN(n))
  const dbProducts = await Product.find({ sku: { $in: skus } }).lean()
  const bySku = Object.fromEntries(dbProducts.map((p) => [p.sku, p]))

  const normalizedItems = cartItems
    .map((it) => {
      const sku = Number(it.id)
      const p = bySku[sku]
      if (!p) return null
      const qty = Math.max(1, Number(it.qty) || 1)
      return {
        id: p.sku,
        name: p.name,
        price: p.price,
        qty,
        storage: p.storage,
        img: p.img,
        condition: p.condition,
      }
    })
    .filter(Boolean)

  if (normalizedItems.length === 0) return res.status(400).json({ error: 'Invalid items' })

  const totals = computeCartTotals(normalizedItems)
  const order = await Order.create({
    userId: req.user.sub,
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

app.post('/api/contact', async (req, res) => {
  const { name, email, phone, company, message } = req.body || {}
  if (!name || !email || !message) return res.status(400).json({ error: 'Missing required fields' })

  await Contact.create({
    userId: null,
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

  await seedDatabase()

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
