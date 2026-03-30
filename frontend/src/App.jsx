import { useEffect, useMemo, useRef, useState } from 'react'

const CART_KEY = 'web-app-0da18758-cart'
const AUTH_KEY = 'recell-auth'

const productsSeed = [
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

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}

function classNames(...xs) {
  return xs.filter(Boolean).join(' ')
}

export default function App() {
  const apiBase = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')
  const [section, setSection] = useState('home') // home | shop | sell | cart | checkout
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [toast, setToast] = useState({ open: false, message: 'Item added to cart' })
  const toastTimerRef = useRef(null)

  const [auth, setAuth] = useState(() => {
    try {
      const raw = localStorage.getItem(AUTH_KEY)
      return raw ? JSON.parse(raw) : { token: null, user: null }
    } catch {
      return { token: null, user: null }
    }
  })

  const [products, setProducts] = useState(productsSeed)
  const [cart, setCart] = useState(() => {
    try {
      const raw = localStorage.getItem(CART_KEY)
      return raw ? JSON.parse(raw) : []
    } catch {
      return []
    }
  })

  const cartCount = useMemo(() => cart.reduce((sum, item) => sum + item.qty, 0), [cart])
  const subtotal = useMemo(() => cart.reduce((sum, item) => sum + item.price * item.qty, 0), [cart])
  const tax = useMemo(() => subtotal * 0.18, [subtotal])
  const total = useMemo(() => subtotal + tax, [subtotal, tax])

  // Sell flow state
  const [sellStep, setSellStep] = useState(1)
  const [sellBrand, setSellBrand] = useState('')
  const [sellModel, setSellModel] = useState('')
  const [sellCondition, setSellCondition] = useState('excellent')
  const [sellStorage, setSellStorage] = useState('128')
  const [accBox, setAccBox] = useState(true)
  const [accCharger, setAccCharger] = useState(true)
  const [accBill, setAccBill] = useState(false)
  const [finalQuote, setFinalQuote] = useState(0)
  const [quoteDeviceName, setQuoteDeviceName] = useState('')

  const [successModal, setSuccessModal] = useState({ open: false, title: '', message: '' })
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [authLoading, setAuthLoading] = useState(false)
  const [authError, setAuthError] = useState('')

  const [trackLoading, setTrackLoading] = useState(false)
  const [myOrders, setMyOrders] = useState([])
  const [myPickups, setMyPickups] = useState([])

  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(cart))
  }, [cart])

  useEffect(() => {
    localStorage.setItem(AUTH_KEY, JSON.stringify(auth))
  }, [auth])

  useEffect(() => {
    let ignore = false
    ;(async () => {
      try {
        const res = await fetch(`${apiBase}/api/products`)
        if (!res.ok) return
        const data = await res.json()
        if (!ignore && data && Array.isArray(data.products)) setProducts(data.products)
      } catch {
        // If backend is down, we keep seeded products.
      }
    })()
    return () => {
      ignore = true
    }
  }, [apiBase])

  useEffect(() => {
    const onScroll = () => {
      const nav = document.getElementById('navbar')
      if (!nav) return
      if (window.scrollY > 10) nav.classList.add('shadow-md')
      else nav.classList.remove('shadow-md')
    }
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (!toast.open) return
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current)
    toastTimerRef.current = window.setTimeout(() => setToast((t) => ({ ...t, open: false })), 3000)
    return () => {
      if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current)
    }
  }, [toast.open])

  const navigate = (next) => {
    setMobileMenuOpen(false)
    setSection(next)
    window.scrollTo(0, 0)
  }

  const authedFetch = async (url, init = {}) => {
    const headers = new Headers(init.headers || {})
    if (auth?.token) headers.set('authorization', `Bearer ${auth.token}`)
    return fetch(url, { ...init, headers })
  }

  const refreshTracking = async () => {
    if (!auth?.token) return
    setTrackLoading(true)
    try {
      const [oRes, pRes] = await Promise.all([
        authedFetch(`${apiBase}/api/track/orders`),
        authedFetch(`${apiBase}/api/track/pickups`),
      ])
      const o = oRes.ok ? await oRes.json() : { orders: [] }
      const p = pRes.ok ? await pRes.json() : { pickups: [] }
      setMyOrders(Array.isArray(o.orders) ? o.orders : [])
      setMyPickups(Array.isArray(p.pickups) ? p.pickups : [])
    } finally {
      setTrackLoading(false)
    }
  }

  const logout = () => {
    setAuth({ token: null, user: null })
    setToast({ open: true, message: 'Logged out' })
    navigate('home')
  }

  const addToCart = (productId) => {
    const product = products.find((p) => p.id === productId)
    if (!product) return
    setCart((prev) => {
      const existing = prev.find((i) => i.id === productId)
      if (existing) return prev.map((i) => (i.id === productId ? { ...i, qty: i.qty + 1 } : i))
      return [...prev, { ...product, qty: 1 }]
    })
    setToast({ open: true, message: `${product.name} added to cart!` })
  }

  const updateQty = (id, change) => {
    setCart((prev) => {
      const next = prev
        .map((i) => (i.id === id ? { ...i, qty: i.qty + change } : i))
        .filter((i) => i.qty > 0)
      return next
    })
  }

  const removeFromCart = (id) => {
    setCart((prev) => prev.filter((i) => i.id !== id))
    setToast({ open: true, message: 'Item removed from cart' })
  }

  const modelsForBrand = useMemo(() => {
    if (!sellBrand || !sellBasePrices[sellBrand]) return []
    return Object.keys(sellBasePrices[sellBrand])
  }, [sellBrand])

  const nextSellStep = (step) => {
    if (sellStep === 1 && step === 2) {
      if (!sellBrand || !sellModel) {
        window.alert('Please select brand and model.')
        return
      }
    }
    setSellStep(step)
  }

  const generateQuote = () => {
    if (!sellBrand || !sellModel) return
    let basePrice = sellBasePrices[sellBrand][sellModel]

    if (sellStorage === '256') basePrice += 3000
    if (sellStorage === '512') basePrice += 6000

    const multiplier = sellCondition === 'excellent' ? 1.1 : sellCondition === 'good' ? 0.9 : 0.7

    if (!accBox) basePrice -= 500
    if (!accCharger) basePrice -= 1000

    const final = Math.round(basePrice * multiplier)
    const brandLabel = sellBrand.charAt(0).toUpperCase() + sellBrand.slice(1)
    const condLabel = sellCondition.charAt(0).toUpperCase() + sellCondition.slice(1)
    setQuoteDeviceName(`${brandLabel} ${sellModel} (${sellStorage}GB) - ${condLabel}`)
    setFinalQuote(final)
    nextSellStep(4)
  }

  const resetSellForm = () => {
    setSellBrand('')
    setSellModel('')
    setSellCondition('excellent')
    setSellStorage('128')
    setAccBox(true)
    setAccCharger(true)
    setAccBill(false)
    setFinalQuote(0)
    setQuoteDeviceName('')
    setSellStep(1)
  }

  const schedulePickup = async () => {
    try {
      await authedFetch(`${apiBase}/api/sell/pickup`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          quote: finalQuote,
          deviceName: quoteDeviceName,
          brand: sellBrand,
          model: sellModel,
          condition: sellCondition,
          storageGb: Number(sellStorage),
          accessories: { box: accBox, charger: accCharger, bill: accBill },
        }),
      })
    } catch {
      // Still show success UX even if backend is down.
    }
    setSuccessModal({
      open: true,
      title: 'Pickup Scheduled!',
      message: 'Our executive will contact you shortly to confirm the pickup time for your device.',
    })
    resetSellForm()
  }

  const processCheckout = async (e) => {
    e.preventDefault()
    if (cart.length === 0) return
    setCheckoutLoading(true)
    try {
      const form = e.target
      const formData = new FormData(form)
      const shipping = {
        fullName: formData.get('fullName') || '',
        address1: formData.get('address1') || '',
        city: formData.get('city') || '',
        pinCode: formData.get('pinCode') || '',
        phone: formData.get('phone') || '',
      }
      const paymentMethod = formData.get('payment') || 'upi'

      const res = await authedFetch(`${apiBase}/api/checkout`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          cartItems: cart.map((i) => ({ id: i.id, qty: i.qty })),
          shipping,
          paymentMethod,
        }),
      })
      if (!res.ok) throw new Error('Checkout failed')

      setCart([])
      setSuccessModal({
        open: true,
        title: 'Order Placed Successfully!',
        message: 'Thank you for shopping with ReCell. Your order details have been sent to your email.',
      })
      e.target.reset()
      navigate('home')
    } finally {
      setCheckoutLoading(false)
    }
  }

  const closeSuccessModal = () => setSuccessModal({ open: false, title: '', message: '' })

  return (
    <div className="text-slate-800 antialiased flex flex-col min-h-screen">
      {/* Navigation */}
      <nav className="fixed w-full z-50 glass-nav transition-all duration-300" id="navbar">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <button
              className="flex-shrink-0 flex items-center cursor-pointer"
              onClick={() => navigate('home')}
            >
              <i className="fa-solid fa-mobile-screen-button text-brand-500 text-2xl mr-2"></i>
              <span className="font-bold text-xl tracking-tight text-slate-900">
                Re<span className="text-brand-500">Cell</span>
              </span>
            </button>

            {/* Desktop menu */}
            <div className="hidden md:flex space-x-8 items-center">
              <button onClick={() => navigate('home')} className="text-slate-600 hover:text-brand-500 font-medium transition-colors">
                Home
              </button>
              <button onClick={() => navigate('shop')} className="text-slate-600 hover:text-brand-500 font-medium transition-colors">
                Buy Phone
              </button>
              <button onClick={() => navigate('sell')} className="text-brand-500 font-semibold hover:text-brand-600 transition-colors">
                Sell Phone
              </button>
              <button onClick={() => navigate('track')} className="text-slate-600 hover:text-brand-500 font-medium transition-colors">
                Track
              </button>

              {auth?.token ? (
                <div className="flex items-center gap-3">
                  <div className="text-sm font-semibold text-slate-600">
                    Hi{auth.user?.name ? `, ${auth.user.name}` : ''}!
                  </div>
                  <button onClick={logout} className="px-3 py-2 rounded-lg bg-slate-100 text-slate-700 font-semibold hover:bg-slate-200 transition-colors">
                    Logout
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <button onClick={() => navigate('login')} className="px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-700 font-semibold hover:border-brand-400 hover:text-brand-600 transition-colors">
                    Login
                  </button>
                  <button onClick={() => navigate('signup')} className="px-3 py-2 rounded-lg bg-slate-900 text-white font-semibold hover:bg-slate-800 transition-colors">
                    Sign up
                  </button>
                </div>
              )}

              <button onClick={() => navigate('cart')} className="relative p-2 text-slate-600 hover:text-brand-500 transition-colors group" aria-label="Cart">
                <i className="fa-solid fa-cart-shopping text-xl group-hover:scale-110 transition-transform"></i>
                {cartCount > 0 ? (
                  <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-red-500 rounded-full">
                    {cartCount}
                  </span>
                ) : null}
              </button>
            </div>

            {/* Mobile */}
            <div className="md:hidden flex items-center space-x-4">
              <button onClick={() => navigate('cart')} className="relative p-2 text-slate-600" aria-label="Cart">
                <i className="fa-solid fa-cart-shopping text-xl"></i>
                {cartCount > 0 ? (
                  <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-red-500 rounded-full">
                    {cartCount}
                  </span>
                ) : null}
              </button>
              <button
                onClick={() => setMobileMenuOpen((v) => !v)}
                className="text-slate-600 hover:text-slate-900 focus:outline-none"
                aria-label="Menu"
              >
                <i className="fa-solid fa-bars text-2xl"></i>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu panel */}
        <div className={classNames(mobileMenuOpen ? '' : 'hidden', 'md:hidden bg-white border-t border-slate-100 absolute w-full shadow-lg')}>
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <button onClick={() => navigate('home')} className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:text-brand-500 hover:bg-slate-50">
              Home
            </button>
            <button onClick={() => navigate('shop')} className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:text-brand-500 hover:bg-slate-50">
              Buy Phone
            </button>
            <button onClick={() => navigate('sell')} className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-brand-500 hover:bg-brand-50">
              Sell Phone
            </button>
            <button onClick={() => navigate('track')} className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:text-brand-500 hover:bg-slate-50">
              Track
            </button>
            {auth?.token ? (
              <button onClick={logout} className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:text-red-600 hover:bg-slate-50">
                Logout
              </button>
            ) : (
              <div className="pt-2 grid grid-cols-2 gap-2">
                <button onClick={() => navigate('login')} className="px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-700 font-semibold hover:border-brand-400 hover:text-brand-600 transition-colors">
                  Login
                </button>
                <button onClick={() => navigate('signup')} className="px-3 py-2 rounded-lg bg-slate-900 text-white font-semibold hover:bg-slate-800 transition-colors">
                  Sign up
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Main */}
      <main className="flex-grow pt-16">
        {/* HOME */}
        {section === 'home' ? (
          <section className="relative overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 bg-gradient-to-b from-white via-slate-50 to-white"></div>
            <div className="absolute -top-24 -left-24 w-[28rem] h-[28rem] bg-brand-100 rounded-full blur-3xl opacity-70"></div>
            <div className="absolute -bottom-24 -right-24 w-[28rem] h-[28rem] bg-accent-100 rounded-full blur-3xl opacity-70"></div>
            <div className="absolute top-24 right-1/3 w-72 h-72 bg-brand-50 rounded-full blur-3xl opacity-80"></div>

            <div className="relative z-10">
              {/* Hero */}
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-12">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
                  <div className="animate-slide-up">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/70 border border-slate-200 text-sm font-semibold text-slate-700 shadow-sm">
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-brand-500 text-white">
                        <i className="fa-solid fa-bolt text-xs"></i>
                      </span>
                      Instant quotes, verified buyers, secure payouts
                    </div>

                    <h1 className="mt-5 text-5xl md:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.05]">
                      The smarter way to{' '}
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 via-brand-500 to-accent-500">
                        buy & sell
                      </span>{' '}
                      phones in India.
                    </h1>

                    <p className="mt-5 text-lg text-slate-600 max-w-xl">
                      Buy certified refurbished phones with warranty, or sell your old device in minutes.
                      Transparent pricing, doorstep pickup, and real-time tracking.
                    </p>

                    <div className="mt-7 flex flex-col sm:flex-row gap-3">
                      <button
                        onClick={() => navigate('shop')}
                        className="px-8 py-4 bg-slate-900 text-white rounded-xl font-bold text-lg hover:bg-slate-800 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center"
                      >
                        Shop Refurbished <i className="fa-solid fa-arrow-right ml-2 text-sm"></i>
                      </button>
                      <button
                        onClick={() => navigate('sell')}
                        className="px-8 py-4 bg-white text-slate-800 border-2 border-slate-200 rounded-xl font-bold text-lg hover:border-brand-500 hover:text-brand-600 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center"
                      >
                        Sell & Get Quote <i className="fa-solid fa-tags ml-2 text-sm"></i>
                      </button>
                    </div>

                    <div className="mt-7 grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {[
                        { icon: 'fa-shield-halved', title: 'Secure', desc: 'Protected checkout & pickups' },
                        { icon: 'fa-clock', title: 'Fast', desc: 'Quote in minutes, pickup in 24-48h' },
                        { icon: 'fa-location-dot', title: 'Doorstep', desc: 'Free pickup & delivery' },
                      ].map((f) => (
                        <div key={f.title} className="bg-white/70 border border-slate-200 rounded-2xl p-4 shadow-sm">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
                              <i className={classNames('fa-solid', f.icon)}></i>
                            </div>
                            <div>
                              <div className="font-bold text-slate-900">{f.title}</div>
                              <div className="text-sm text-slate-600">{f.desc}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-7 flex flex-wrap items-center gap-4 text-xs text-slate-500 font-semibold">
                      <span className="inline-flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-brand-500"></span> 6-month warranty
                      </span>
                      <span className="inline-flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-accent-500"></span> 100% quality checked
                      </span>
                      <span className="inline-flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-slate-400"></span> Transparent pricing
                      </span>
                    </div>
                  </div>

                  {/* Hero visual */}
                  <div className="relative animate-fade-in">
                    <div className="absolute inset-0 bg-gradient-to-tr from-brand-400 to-accent-400 rounded-[2.5rem] rotate-6 scale-105 opacity-20 blur-xl"></div>
                    <div className="relative bg-white/80 border border-slate-200 rounded-[2.5rem] shadow-2xl overflow-hidden">
                      <div className="p-6 sm:p-8">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center">
                              <i className="fa-solid fa-mobile-screen-button"></i>
                            </div>
                            <div>
                              <div className="font-extrabold text-slate-900 leading-tight">ReCell</div>
                              <div className="text-xs text-slate-500 font-semibold">Smart marketplace</div>
                            </div>
                          </div>
                          <div className="text-xs font-bold text-brand-600 bg-brand-50 border border-brand-100 px-3 py-1.5 rounded-full">
                            Live Tracking
                          </div>
                        </div>

                        <div className="mt-6 grid grid-cols-1 gap-4">
                          <div className="bg-gradient-to-r from-brand-600 to-accent-500 rounded-2xl p-5 text-white shadow-inner">
                            <div className="text-sm opacity-90 font-semibold">Sell quote</div>
                            <div className="mt-1 text-3xl font-extrabold">₹ 27,500</div>
                            <div className="mt-4 h-2.5 bg-white/25 rounded-full overflow-hidden">
                              <div className="w-4/5 h-full bg-white rounded-full"></div>
                            </div>
                            <div className="mt-2 text-xs opacity-90">Quote locked • Pickup scheduled</div>
                          </div>

                          <div className="bg-white rounded-2xl border border-slate-200 p-5">
                            <div className="flex items-center justify-between">
                              <div className="font-bold text-slate-900">Order status</div>
                              <div className="text-xs font-bold text-slate-500">#RC-1024</div>
                            </div>
                            <div className="mt-4 space-y-3">
                              {[
                                { label: 'Placed', done: true },
                                { label: 'QC Verified', done: true },
                                { label: 'Shipped', done: false },
                                { label: 'Delivered', done: false },
                              ].map((s) => (
                                <div key={s.label} className="flex items-center gap-3">
                                  <div className={classNames('w-6 h-6 rounded-full flex items-center justify-center', s.done ? 'bg-brand-500 text-white' : 'bg-slate-100 text-slate-400')}>
                                    <i className={classNames('fa-solid', s.done ? 'fa-check' : 'fa-minus')} />
                                  </div>
                                  <div className="flex-1">
                                    <div className="text-sm font-semibold text-slate-800">{s.label}</div>
                                    <div className="h-2 mt-2 bg-slate-100 rounded-full overflow-hidden">
                                      <div className={classNames('h-full rounded-full', s.done ? 'w-full bg-brand-500' : 'w-1/4 bg-slate-300')} />
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Social proof */}
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10">
                <div className="bg-white/70 border border-slate-200 rounded-3xl shadow-sm p-6 md:p-8">
                  <div className="flex flex-col md:flex-row gap-6 md:items-center md:justify-between">
                    <div>
                      <div className="text-sm font-bold text-slate-500">Trusted by</div>
                      <div className="mt-1 text-2xl font-extrabold text-slate-900">
                        50,000+ buyers & sellers
                      </div>
                      <div className="mt-2 text-slate-600">
                        Real photos, verified device checks, and clear pricing.
                      </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full md:w-auto">
                      {['Quality Checked', 'Warranty Included', 'Instant Quote', 'Doorstep Service'].map((t) => (
                        <div key={t} className="bg-white border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold text-slate-800 text-center">
                          {t}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* How it works */}
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8">
                    <div className="text-sm font-bold text-brand-600">Sell in 3 steps</div>
                    <div className="mt-2 text-2xl font-extrabold text-slate-900">Get paid fast, without bargaining</div>
                    <div className="mt-6 space-y-4">
                      {[
                        { n: 1, title: 'Select device', desc: 'Choose brand, model, condition & accessories.' },
                        { n: 2, title: 'Get instant quote', desc: 'Transparent pricing locked for 7 days.' },
                        { n: 3, title: 'Free pickup', desc: 'Doorstep pickup, secure payout after verification.' },
                      ].map((s) => (
                        <div key={s.n} className="flex gap-4">
                          <div className="w-10 h-10 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center font-extrabold text-brand-700">
                            {s.n}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900">{s.title}</div>
                            <div className="text-slate-600 text-sm">{s.desc}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-6">
                      <button onClick={() => navigate('sell')} className="w-full sm:w-auto px-6 py-3 bg-brand-500 text-white rounded-xl font-bold hover:bg-brand-600 transition-colors">
                        Start Selling
                      </button>
                    </div>
                  </div>

                  <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8">
                    <div className="text-sm font-bold text-accent-600">Buy with confidence</div>
                    <div className="mt-2 text-2xl font-extrabold text-slate-900">Refurbished, not “used”</div>
                    <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {[
                        { icon: 'fa-microscope', title: '30-point QC', desc: 'Every device is tested.' },
                        { icon: 'fa-arrows-rotate', title: 'Easy returns', desc: 'Simple support process.' },
                        { icon: 'fa-certificate', title: 'Warranty', desc: '6 months included.' },
                        { icon: 'fa-truck', title: 'Fast shipping', desc: 'Packed & shipped safely.' },
                      ].map((c) => (
                        <div key={c.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                          <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-slate-800 flex items-center justify-center">
                            <i className={classNames('fa-solid', c.icon)} />
                          </div>
                          <div className="mt-3 font-bold text-slate-900">{c.title}</div>
                          <div className="text-sm text-slate-600">{c.desc}</div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-6">
                      <button onClick={() => navigate('shop')} className="w-full sm:w-auto px-6 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors">
                        Browse Phones
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Testimonials */}
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
                <div className="text-center">
                  <div className="text-sm font-bold text-slate-500">Loved by customers</div>
                  <div className="mt-2 text-3xl md:text-4xl font-extrabold text-slate-900">
                    A smoother upgrade every time
                  </div>
                </div>
                <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[
                    { name: 'Ananya', text: 'Sold my phone in 10 minutes. Pickup was on time and payment was smooth.' },
                    { name: 'Rohit', text: 'Bought a refurbished device—looked brand new. Warranty gave real peace of mind.' },
                    { name: 'Meera', text: 'Clear pricing and tracking made the whole process super transparent.' },
                  ].map((t) => (
                    <div key={t.name} className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
                      <div className="flex items-center gap-2 text-yellow-500">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <i key={n} className="fa-solid fa-star text-sm"></i>
                        ))}
                      </div>
                      <div className="mt-4 text-slate-700">{t.text}</div>
                      <div className="mt-5 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-500 to-accent-500"></div>
                        <div>
                          <div className="font-extrabold text-slate-900">{t.name}</div>
                          <div className="text-xs text-slate-500 font-semibold">Verified customer</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Final CTA */}
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
                <div className="bg-slate-900 rounded-3xl overflow-hidden relative">
                  <div className="absolute inset-0 opacity-30 bg-gradient-to-r from-brand-500 to-accent-500"></div>
                  <div className="relative p-8 md:p-12 flex flex-col md:flex-row gap-8 md:items-center md:justify-between">
                    <div>
                      <div className="text-sm font-bold text-white/80">Ready to upgrade?</div>
                      <div className="mt-2 text-3xl md:text-4xl font-extrabold text-white">Buy smarter. Sell faster.</div>
                      <div className="mt-3 text-white/80 max-w-xl">
                        Create an account to track every step of your buy order or sell pickup in one place.
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <button onClick={() => navigate('shop')} className="px-6 py-3 rounded-xl font-extrabold bg-white text-slate-900 hover:bg-slate-100 transition-colors">
                        Shop Now
                      </button>
                      <button onClick={() => navigate('sell')} className="px-6 py-3 rounded-xl font-extrabold bg-white/10 text-white border border-white/20 hover:bg-white/15 transition-colors">
                        Get Sell Quote
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        ) : null}

        {/* SHOP */}
        {section === 'shop' ? (
          <section className="py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-12 animate-slide-up">
                <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Certified Refurbished Phones</h2>
                <p className="text-slate-600 max-w-2xl mx-auto">
                  Quality checked, professionally restored, and backed by our 6-month warranty. Save money and the
                  planet.
                </p>
              </div>

              <div className="flex flex-wrap gap-2 justify-center mb-10 animate-fade-in">
                <button className="px-4 py-2 bg-brand-500 text-white rounded-full text-sm font-medium shadow-md">
                  All Brands
                </button>
                <button className="px-4 py-2 bg-white text-slate-600 border border-slate-200 rounded-full text-sm font-medium hover:bg-slate-50 transition-colors">
                  Apple
                </button>
                <button className="px-4 py-2 bg-white text-slate-600 border border-slate-200 rounded-full text-sm font-medium hover:bg-slate-50 transition-colors">
                  Samsung
                </button>
                <button className="px-4 py-2 bg-white text-slate-600 border border-slate-200 rounded-full text-sm font-medium hover:bg-slate-50 transition-colors">
                  OnePlus
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {products.map((p) => {
                  const discount = Math.round(((p.oldPrice - p.price) / p.oldPrice) * 100)
                  return (
                    <div key={p.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-xl transition-all duration-300 group">
                      <div className="relative h-48 overflow-hidden bg-slate-50 flex items-center justify-center p-4">
                        <span className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                          -{discount}%
                        </span>
                        <span className="absolute top-3 right-3 bg-slate-800 text-white text-xs font-medium px-2 py-1 rounded-full">
                          {p.condition}
                        </span>
                        <img src={p.img} alt={p.name} className="h-full object-contain group-hover:scale-110 transition-transform duration-500" />
                      </div>
                      <div className="p-5">
                        <div className="text-xs text-slate-500 mb-1">
                          {p.brand} • {p.storage}
                        </div>
                        <h3 className="font-bold text-lg text-slate-900 mb-2 truncate">{p.name}</h3>
                        <div className="flex items-end justify-between mb-4">
                          <div>
                            <span className="text-xl font-extrabold text-slate-900">{formatCurrency(p.price)}</span>
                            <span className="text-sm text-slate-400 line-through block">{formatCurrency(p.oldPrice)}</span>
                          </div>
                        </div>
                        <button onClick={() => addToCart(p.id)} className="w-full py-2.5 bg-slate-100 text-brand-600 font-semibold rounded-lg hover:bg-brand-500 hover:text-white transition-colors flex justify-center items-center">
                          Add to Cart <i className="fa-solid fa-cart-plus ml-2"></i>
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </section>
        ) : null}

        {/* SELL */}
        {section === 'sell' ? (
          <section className="py-12 bg-slate-50 min-h-[calc(100vh-4rem)]">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-8 animate-slide-up">
                <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">Sell Your Phone</h2>
                <p className="text-slate-600">Get an instant quote in 4 easy steps.</p>
              </div>

              <div className="mb-8 relative">
                <div className="overflow-hidden h-2 mb-4 text-xs flex rounded-full bg-slate-200">
                  <div
                    style={{ width: `${(sellStep / 4) * 100}%` }}
                    className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-brand-500 transition-all duration-500"
                  ></div>
                </div>
                <div className="flex justify-between text-xs font-medium text-slate-500">
                  <span className="text-brand-600">Device</span>
                  <span className={sellStep >= 2 ? 'text-brand-600' : ''}>Condition</span>
                  <span className={sellStep >= 3 ? 'text-brand-600' : ''}>Details</span>
                  <span className={sellStep >= 4 ? 'text-brand-600' : ''}>Quote</span>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-6 md:p-8 relative overflow-hidden">
                {sellStep === 1 ? (
                  <div className="animate-fade-in">
                    <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center">
                      <span className="bg-brand-100 text-brand-600 w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm">1</span>
                      Select Your Device
                    </h3>
                    <div className="space-y-5">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Brand</label>
                        <select
                          value={sellBrand}
                          onChange={(e) => {
                            setSellBrand(e.target.value)
                            setSellModel('')
                          }}
                          className="w-full border-slate-300 rounded-lg shadow-sm focus:border-brand-500 focus:ring-brand-500 p-3 border bg-white"
                        >
                          <option value="">Select Brand</option>
                          <option value="apple">Apple</option>
                          <option value="samsung">Samsung</option>
                          <option value="oneplus">OnePlus</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Model</label>
                        <select
                          value={sellModel}
                          onChange={(e) => setSellModel(e.target.value)}
                          disabled={!sellBrand}
                          className="w-full border-slate-300 rounded-lg shadow-sm focus:border-brand-500 focus:ring-brand-500 p-3 border bg-white disabled:bg-slate-100"
                        >
                          <option value="">{sellBrand ? 'Select Model' : 'Select Model first'}</option>
                          {modelsForBrand.map((m) => (
                            <option key={m} value={m}>
                              {m}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="mt-8 flex justify-end">
                      <button onClick={() => nextSellStep(2)} className="px-6 py-3 bg-brand-500 text-white rounded-lg font-medium hover:bg-brand-600 transition-colors">
                        Next Step <i className="fa-solid fa-arrow-right ml-2"></i>
                      </button>
                    </div>
                  </div>
                ) : null}

                {sellStep === 2 ? (
                  <div className="animate-fade-in">
                    <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center">
                      <span className="bg-brand-100 text-brand-600 w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm">2</span>
                      Assess Condition
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      {[
                        { id: 'excellent', icon: 'fa-star', title: 'Excellent', desc: 'Flawless, looks new' },
                        { id: 'good', icon: 'fa-thumbs-up', title: 'Good', desc: 'Minor scratches' },
                        { id: 'fair', icon: 'fa-wrench', title: 'Fair', desc: 'Dents, heavy wear' },
                      ].map((c) => (
                        <div className="relative" key={c.id}>
                          <input
                            type="radio"
                            name="condition"
                            id={`cond-${c.id}`}
                            value={c.id}
                            className="radio-card-input peer sr-only"
                            checked={sellCondition === c.id}
                            onChange={() => setSellCondition(c.id)}
                          />
                          <label htmlFor={`cond-${c.id}`} className="radio-card-label flex flex-col items-center justify-center p-4 border-2 border-slate-200 rounded-xl cursor-pointer transition-all hover:bg-slate-50">
                            <i className={classNames('fa-solid', c.icon, 'text-3xl mb-2 radio-icon text-slate-400 transition-colors')}></i>
                            <span className="font-bold text-slate-800">{c.title}</span>
                            <span className="text-xs text-slate-500 text-center mt-1">{c.desc}</span>
                          </label>
                        </div>
                      ))}
                    </div>

                    <div className="mb-6">
                      <label className="block text-sm font-medium text-slate-700 mb-2">Upload Photos (Optional)</label>
                      <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 border-dashed rounded-lg hover:border-brand-500 transition-colors bg-slate-50">
                        <div className="space-y-1 text-center">
                          <i className="fa-solid fa-cloud-arrow-up text-3xl text-slate-400 mb-2"></i>
                          <div className="flex text-sm text-slate-600 justify-center">
                            <label className="relative cursor-pointer bg-white rounded-md font-medium text-brand-600 hover:text-brand-500 focus-within:outline-none">
                              <span>Upload a file</span>
                              <input name="file-upload" type="file" className="sr-only" accept="image/*" multiple />
                            </label>
                            <p className="pl-1">or drag and drop</p>
                          </div>
                          <p className="text-xs text-slate-500">PNG, JPG up to 10MB</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between mt-8">
                      <button onClick={() => nextSellStep(1)} className="px-6 py-3 bg-slate-100 text-slate-700 rounded-lg font-medium hover:bg-slate-200 transition-colors">
                        Back
                      </button>
                      <button onClick={() => nextSellStep(3)} className="px-6 py-3 bg-brand-500 text-white rounded-lg font-medium hover:bg-brand-600 transition-colors">
                        Next Step <i className="fa-solid fa-arrow-right ml-2"></i>
                      </button>
                    </div>
                  </div>
                ) : null}

                {sellStep === 3 ? (
                  <div className="animate-fade-in">
                    <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center">
                      <span className="bg-brand-100 text-brand-600 w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm">3</span>
                      Device Details
                    </h3>

                    <div className="space-y-5">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Storage Capacity</label>
                        <select value={sellStorage} onChange={(e) => setSellStorage(e.target.value)} className="w-full border-slate-300 rounded-lg shadow-sm focus:border-brand-500 focus:ring-brand-500 p-3 border bg-white">
                          <option value="64">64 GB</option>
                          <option value="128">128 GB</option>
                          <option value="256">256 GB</option>
                          <option value="512">512 GB</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-3">Included Accessories</label>
                        <div className="space-y-2">
                          <div className="flex items-start">
                            <div className="flex items-center h-5">
                              <input id="acc-box" type="checkbox" className="focus:ring-brand-500 h-4 w-4 text-brand-600 border-slate-300 rounded" checked={accBox} onChange={(e) => setAccBox(e.target.checked)} />
                            </div>
                            <div className="ml-3 text-sm">
                              <label htmlFor="acc-box" className="font-medium text-slate-700">
                                Original Box
                              </label>
                            </div>
                          </div>
                          <div className="flex items-start">
                            <div className="flex items-center h-5">
                              <input id="acc-charger" type="checkbox" className="focus:ring-brand-500 h-4 w-4 text-brand-600 border-slate-300 rounded" checked={accCharger} onChange={(e) => setAccCharger(e.target.checked)} />
                            </div>
                            <div className="ml-3 text-sm">
                              <label htmlFor="acc-charger" className="font-medium text-slate-700">
                                Original Charger
                              </label>
                            </div>
                          </div>
                          <div className="flex items-start">
                            <div className="flex items-center h-5">
                              <input id="acc-bill" type="checkbox" className="focus:ring-brand-500 h-4 w-4 text-brand-600 border-slate-300 rounded" checked={accBill} onChange={(e) => setAccBill(e.target.checked)} />
                            </div>
                            <div className="ml-3 text-sm">
                              <label htmlFor="acc-bill" className="font-medium text-slate-700">
                                Valid Bill/Invoice
                              </label>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">IMEI Number (Optional for now)</label>
                        <input type="text" placeholder="Enter 15-digit IMEI" className="w-full border-slate-300 rounded-lg shadow-sm focus:border-brand-500 focus:ring-brand-500 p-3 border bg-white" />
                        <p className="text-xs text-slate-500 mt-1">Dial *#06# to find your IMEI.</p>
                      </div>
                    </div>

                    <div className="flex justify-between mt-8">
                      <button onClick={() => nextSellStep(2)} className="px-6 py-3 bg-slate-100 text-slate-700 rounded-lg font-medium hover:bg-slate-200 transition-colors">
                        Back
                      </button>
                      <button onClick={generateQuote} className="px-6 py-3 bg-brand-500 text-white rounded-lg font-medium hover:bg-brand-600 transition-colors shadow-lg shadow-brand-500/30">
                        Get Quote <i className="fa-solid fa-wand-magic-sparkles ml-2"></i>
                      </button>
                    </div>
                  </div>
                ) : null}

                {sellStep === 4 ? (
                  <div className="animate-slide-up text-center py-8">
                    <div className="w-20 h-20 bg-brand-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <i className="fa-solid fa-check text-4xl text-brand-500"></i>
                    </div>
                    <h3 className="text-2xl font-bold text-slate-800 mb-2">Your Estimated Quote</h3>
                    <p className="text-slate-500 mb-6">{quoteDeviceName || 'Your device quote'}</p>

                    <div className="bg-slate-50 rounded-2xl p-8 mb-8 border border-slate-200 inline-block min-w-[300px]">
                      <p className="text-sm text-slate-500 uppercase tracking-wide font-semibold mb-2">We Pay You</p>
                      <div className="text-5xl font-extrabold text-slate-900 mb-2">{formatCurrency(finalQuote)}</div>
                      <p className="text-sm text-brand-600 font-medium">
                        <i className="fa-solid fa-bolt mr-1"></i> Price locked for 7 days
                      </p>
                    </div>

                    <div className="space-y-4 max-w-sm mx-auto">
                      <button onClick={schedulePickup} className="w-full px-6 py-4 bg-slate-900 text-white rounded-xl font-bold text-lg hover:bg-slate-800 transition-all shadow-lg hover:-translate-y-1">
                        Schedule Free Pickup
                      </button>
                      <button onClick={resetSellForm} className="w-full px-6 py-3 bg-white text-slate-600 border border-slate-200 rounded-xl font-medium hover:bg-slate-50 transition-colors">
                        Recalculate
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </section>
        ) : null}

        {/* CART */}
        {section === 'cart' ? (
          <section className="py-12 bg-slate-50 min-h-[calc(100vh-4rem)]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <h2 className="text-3xl font-bold text-slate-900 mb-8">Your Cart</h2>

              {cart.length === 0 ? (
                <div className="text-center py-20">
                  <div className="w-24 h-24 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-6">
                    <i className="fa-solid fa-cart-shopping text-4xl text-slate-400"></i>
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-2">Your cart is empty</h3>
                  <p className="text-slate-500 mb-6">Looks like you haven't added any phones yet.</p>
                  <button onClick={() => navigate('shop')} className="px-8 py-3 bg-brand-500 text-white rounded-lg font-medium hover:bg-brand-600 transition-colors">
                    Start Shopping
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 space-y-4">
                    {cart.map((item, index) => {
                      const itemTotal = item.price * item.qty
                      return (
                        <div key={item.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex flex-col sm:flex-row items-center gap-4 animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                          <div className="w-24 h-24 bg-slate-50 rounded-lg p-2 flex-shrink-0">
                            <img src={item.img} alt={item.name} className="w-full h-full object-contain" />
                          </div>
                          <div className="flex-grow text-center sm:text-left">
                            <h4 className="font-bold text-slate-900">{item.name}</h4>
                            <p className="text-sm text-slate-500 mb-2">
                              {item.storage} • Condition: {item.condition}
                            </p>
                            <div className="font-bold text-brand-600">{formatCurrency(item.price)}</div>
                          </div>
                          <div className="flex items-center space-x-3 bg-slate-50 rounded-lg p-1 border border-slate-200">
                            <button onClick={() => updateQty(item.id, -1)} className="w-8 h-8 flex items-center justify-center text-slate-500 hover:bg-white hover:shadow-sm rounded transition-all">
                              -
                            </button>
                            <span className="w-6 text-center font-medium">{item.qty}</span>
                            <button onClick={() => updateQty(item.id, 1)} className="w-8 h-8 flex items-center justify-center text-slate-500 hover:bg-white hover:shadow-sm rounded transition-all">
                              +
                            </button>
                          </div>
                          <div className="text-right ml-auto hidden sm:block w-24">
                            <div className="font-bold text-slate-900">{formatCurrency(itemTotal)}</div>
                          </div>
                          <button onClick={() => removeFromCart(item.id)} className="p-2 text-slate-400 hover:text-red-500 transition-colors" title="Remove" aria-label="Remove">
                            <i className="fa-solid fa-trash"></i>
                          </button>
                        </div>
                      )
                    })}
                  </div>

                  <div className="lg:col-span-1">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sticky top-24">
                      <h3 className="text-lg font-bold text-slate-800 mb-4 pb-4 border-b border-slate-100">Order Summary</h3>

                      <div className="space-y-3 mb-6">
                        <div className="flex justify-between text-slate-600">
                          <span>Subtotal</span>
                          <span className="font-medium text-slate-800">{formatCurrency(subtotal)}</span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span>GST (18%)</span>
                          <span className="font-medium text-slate-800">{formatCurrency(tax)}</span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span>Shipping</span>
                          <span className="font-medium text-brand-600">Free</span>
                        </div>
                      </div>

                      <div className="flex justify-between items-center pt-4 border-t border-slate-100 mb-6">
                        <span className="text-lg font-bold text-slate-800">Total</span>
                        <span className="text-2xl font-extrabold text-slate-900">{formatCurrency(total)}</span>
                      </div>

                      <button onClick={() => navigate('checkout')} className="w-full px-6 py-4 bg-brand-500 text-white rounded-xl font-bold text-lg hover:bg-brand-600 transition-all shadow-lg hover:-translate-y-1 flex justify-center items-center">
                        Proceed to Checkout <i className="fa-solid fa-lock ml-2 text-sm"></i>
                      </button>

                      <div className="mt-4 flex items-center justify-center text-xs text-slate-500 space-x-4">
                        <span>
                          <i className="fa-brands fa-cc-visa text-lg"></i>
                        </span>
                        <span>
                          <i className="fa-brands fa-cc-mastercard text-lg"></i>
                        </span>
                        <span>
                          <i className="fa-solid fa-building-columns text-lg"></i> UPI
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>
        ) : null}

        {/* CHECKOUT */}
        {section === 'checkout' ? (
          <section className="py-12 bg-slate-50 min-h-[calc(100vh-4rem)]">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
              <button onClick={() => navigate('cart')} className="text-slate-500 hover:text-brand-500 mb-6 flex items-center text-sm font-medium transition-colors">
                <i className="fa-solid fa-arrow-left mr-2"></i> Back to Cart
              </button>

              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 md:p-8">
                  <h2 className="text-2xl font-bold text-slate-900 mb-8">Checkout</h2>

                  <form onSubmit={processCheckout}>
                    <div className="mb-8">
                      <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
                        <i className="fa-solid fa-location-dot mr-2 text-brand-500"></i> Shipping Address
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                          <input name="fullName" type="text" required className="w-full border-slate-300 rounded-lg shadow-sm focus:border-brand-500 focus:ring-brand-500 p-3 border bg-slate-50" />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-slate-700 mb-1">Address Line 1</label>
                          <input name="address1" type="text" required className="w-full border-slate-300 rounded-lg shadow-sm focus:border-brand-500 focus:ring-brand-500 p-3 border bg-slate-50" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">City</label>
                          <input name="city" type="text" required className="w-full border-slate-300 rounded-lg shadow-sm focus:border-brand-500 focus:ring-brand-500 p-3 border bg-slate-50" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">PIN Code</label>
                          <input name="pinCode" type="text" pattern="[0-9]{6}" title="6 digit PIN code" required className="w-full border-slate-300 rounded-lg shadow-sm focus:border-brand-500 focus:ring-brand-500 p-3 border bg-slate-50" />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
                          <input name="phone" type="tel" pattern="[0-9]{10}" title="10 digit mobile number" required className="w-full border-slate-300 rounded-lg shadow-sm focus:border-brand-500 focus:ring-brand-500 p-3 border bg-slate-50" />
                        </div>
                      </div>
                    </div>

                    <hr className="border-slate-100 mb-8" />

                    <div className="mb-8">
                      <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
                        <i className="fa-solid fa-credit-card mr-2 text-brand-500"></i> Payment Method
                      </h3>
                      <div className="space-y-3">
                        <label className="flex items-center p-4 border border-brand-500 bg-brand-50 rounded-xl cursor-pointer">
                          <input type="radio" name="payment" value="upi" defaultChecked className="h-4 w-4 text-brand-600 focus:ring-brand-500 border-slate-300" />
                          <span className="ml-3 font-medium text-slate-900">UPI (GPay, PhonePe, Paytm)</span>
                          <i className="fa-solid fa-qrcode ml-auto text-slate-400"></i>
                        </label>
                        <label className="flex items-center p-4 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50">
                          <input type="radio" name="payment" value="card" className="h-4 w-4 text-brand-600 focus:ring-brand-500 border-slate-300" />
                          <span className="ml-3 font-medium text-slate-900">Credit / Debit Card</span>
                          <i className="fa-regular fa-credit-card ml-auto text-slate-400"></i>
                        </label>
                        <label className="flex items-center p-4 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50">
                          <input type="radio" name="payment" value="cod" className="h-4 w-4 text-brand-600 focus:ring-brand-500 border-slate-300" />
                          <span className="ml-3 font-medium text-slate-900">Cash on Delivery</span>
                          <i className="fa-solid fa-indian-rupee-sign ml-auto text-slate-400"></i>
                        </label>
                      </div>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-xl mb-8 flex justify-between items-center border border-slate-200">
                      <span className="font-medium text-slate-700">Amount to Pay:</span>
                      <span className="text-2xl font-bold text-slate-900">{formatCurrency(total)}</span>
                    </div>

                    <button type="submit" disabled={checkoutLoading} className="w-full px-6 py-4 bg-slate-900 text-white rounded-xl font-bold text-lg hover:bg-slate-800 transition-all shadow-lg hover:-translate-y-1 disabled:opacity-60 disabled:cursor-not-allowed">
                      {checkoutLoading ? (
                        <>
                          <i className="fa-solid fa-circle-notch fa-spin"></i> Processing...
                        </>
                      ) : (
                        'Pay Now & Place Order'
                      )}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </section>
        ) : null}

        {/* LOGIN */}
        {section === 'login' ? (
          <section className="py-12 bg-slate-50 min-h-[calc(100vh-4rem)]">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8">
                  <div className="text-sm font-bold text-brand-600">Welcome back</div>
                  <h2 className="mt-2 text-3xl font-extrabold text-slate-900">Login to track everything</h2>
                  <p className="mt-2 text-slate-600">
                    See your buy order progress and sell pickup timeline in one dashboard.
                  </p>

                  {authError ? (
                    <div className="mt-4 rounded-xl border border-red-200 bg-red-50 text-red-700 px-4 py-3 text-sm font-semibold">
                      {authError}
                    </div>
                  ) : null}

                  <form
                    className="mt-6 space-y-4"
                    onSubmit={async (e) => {
                      e.preventDefault()
                      setAuthError('')
                      setAuthLoading(true)
                      try {
                        const form = e.target
                        const formData = new FormData(form)
                        const payload = Object.fromEntries(formData.entries())
                        const res = await fetch(`${apiBase}/api/auth/login`, {
                          method: 'POST',
                          headers: { 'content-type': 'application/json' },
                          body: JSON.stringify(payload),
                        })
                        const data = await res.json().catch(() => ({}))
                        if (!res.ok) throw new Error(data?.error || 'Login failed')
                        setAuth({ token: data.token, user: data.user })
                        form.reset()
                        setToast({ open: true, message: 'Logged in' })
                        navigate('track')
                        await refreshTracking()
                      } catch (err) {
                        setAuthError(err?.message || 'Login failed')
                      } finally {
                        setAuthLoading(false)
                      }
                    }}
                  >
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1">Email</label>
                      <input name="email" type="email" required className="w-full border-slate-300 rounded-xl shadow-sm focus:border-brand-500 focus:ring-brand-500 p-3 border bg-white" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1">Password</label>
                      <input name="password" type="password" required className="w-full border-slate-300 rounded-xl shadow-sm focus:border-brand-500 focus:ring-brand-500 p-3 border bg-white" />
                      <div className="mt-2 text-xs text-slate-500">Minimum 6 characters.</div>
                    </div>
                    <button
                      type="submit"
                      disabled={authLoading}
                      className="w-full px-6 py-4 bg-slate-900 text-white rounded-xl font-extrabold text-lg hover:bg-slate-800 transition-all shadow-lg hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {authLoading ? 'Signing in...' : 'Login'}
                    </button>
                    <div className="text-sm text-slate-600 text-center">
                      New here?{' '}
                      <button type="button" onClick={() => navigate('signup')} className="font-extrabold text-brand-600 hover:text-brand-700">
                        Create an account
                      </button>
                    </div>
                  </form>
                </div>

                <div className="rounded-3xl overflow-hidden border border-slate-200 shadow-sm bg-gradient-to-br from-slate-900 via-slate-900 to-brand-900 p-8 text-white relative">
                  <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-brand-500/20 blur-3xl"></div>
                  <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-accent-500/20 blur-3xl"></div>
                  <div className="relative">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/10 text-sm font-semibold">
                      <i className="fa-solid fa-chart-line"></i> Progress tracking
                    </div>
                    <div className="mt-4 text-3xl font-extrabold">Track every step</div>
                    <div className="mt-2 text-white/80">
                      Orders, pickups, and updates—always visible, always simple.
                    </div>
                    <div className="mt-6 space-y-3">
                      {[
                        { icon: 'fa-truck', text: 'Delivery & pickup status updates' },
                        { icon: 'fa-bell', text: 'Clear milestones and timeline' },
                        { icon: 'fa-shield-halved', text: 'Secure access to your history' },
                      ].map((x) => (
                        <div key={x.text} className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl p-4">
                          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                            <i className={classNames('fa-solid', x.icon)}></i>
                          </div>
                          <div className="font-semibold">{x.text}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        ) : null}

        {/* SIGNUP */}
        {section === 'signup' ? (
          <section className="py-12 bg-slate-50 min-h-[calc(100vh-4rem)]">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden grid grid-cols-1 lg:grid-cols-2">
                <div className="p-8">
                  <div className="text-sm font-bold text-brand-600">Create account</div>
                  <h2 className="mt-2 text-3xl font-extrabold text-slate-900">Sign up for ReCell</h2>
                  <p className="mt-2 text-slate-600">Track orders and pickups, and keep your history safe.</p>

                  {authError ? (
                    <div className="mt-4 rounded-xl border border-red-200 bg-red-50 text-red-700 px-4 py-3 text-sm font-semibold">
                      {authError}
                    </div>
                  ) : null}

                  <form
                    className="mt-6 space-y-4"
                    onSubmit={async (e) => {
                      e.preventDefault()
                      setAuthError('')
                      setAuthLoading(true)
                      try {
                        const form = e.target
                        const formData = new FormData(form)
                        const payload = Object.fromEntries(formData.entries())
                        const res = await fetch(`${apiBase}/api/auth/signup`, {
                          method: 'POST',
                          headers: { 'content-type': 'application/json' },
                          body: JSON.stringify(payload),
                        })
                        const data = await res.json().catch(() => ({}))
                        if (!res.ok) throw new Error(data?.error || 'Signup failed')
                        setAuth({ token: data.token, user: data.user })
                        form.reset()
                        setToast({ open: true, message: 'Account created' })
                        navigate('track')
                        await refreshTracking()
                      } catch (err) {
                        setAuthError(err?.message || 'Signup failed')
                      } finally {
                        setAuthLoading(false)
                      }
                    }}
                  >
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1">Name (optional)</label>
                      <input name="name" type="text" className="w-full border-slate-300 rounded-xl shadow-sm focus:border-brand-500 focus:ring-brand-500 p-3 border bg-white" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1">Email</label>
                      <input name="email" type="email" required className="w-full border-slate-300 rounded-xl shadow-sm focus:border-brand-500 focus:ring-brand-500 p-3 border bg-white" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1">Password</label>
                      <input name="password" type="password" required className="w-full border-slate-300 rounded-xl shadow-sm focus:border-brand-500 focus:ring-brand-500 p-3 border bg-white" />
                      <div className="mt-2 text-xs text-slate-500">Minimum 6 characters.</div>
                    </div>
                    <button
                      type="submit"
                      disabled={authLoading}
                      className="w-full px-6 py-4 bg-brand-500 text-white rounded-xl font-extrabold text-lg hover:bg-brand-600 transition-all shadow-lg hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {authLoading ? 'Creating...' : 'Sign up'}
                    </button>
                    <div className="text-sm text-slate-600 text-center">
                      Already have an account?{' '}
                      <button type="button" onClick={() => navigate('login')} className="font-extrabold text-brand-600 hover:text-brand-700">
                        Login
                      </button>
                    </div>
                  </form>
                </div>

                <div className="p-8 bg-gradient-to-br from-brand-600 to-accent-500 text-white">
                  <div className="text-sm font-bold text-white/90">What you get</div>
                  <div className="mt-2 text-3xl font-extrabold">One dashboard</div>
                  <div className="mt-2 text-white/90">Buy & sell progress in a single view.</div>
                  <div className="mt-6 space-y-3">
                    {[
                      { icon: 'fa-list-check', text: 'Order timeline with milestones' },
                      { icon: 'fa-truck-fast', text: 'Pickup & delivery tracking' },
                      { icon: 'fa-clock', text: 'History of every transaction' },
                    ].map((x) => (
                      <div key={x.text} className="flex items-center gap-3 bg-white/10 border border-white/15 rounded-2xl p-4">
                        <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
                          <i className={classNames('fa-solid', x.icon)}></i>
                        </div>
                        <div className="font-semibold">{x.text}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>
        ) : null}

        {/* TRACK */}
        {section === 'track' ? (
          <section className="py-12 bg-slate-50 min-h-[calc(100vh-4rem)]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                <div>
                  <div className="text-sm font-bold text-slate-500">Tracking</div>
                  <h2 className="mt-1 text-3xl md:text-4xl font-extrabold text-slate-900">Your buy & sell progress</h2>
                  <p className="mt-2 text-slate-600">See current status and past updates for your orders and pickups.</p>
                </div>
                <div className="flex gap-2">
                  {!auth?.token ? (
                    <>
                      <button onClick={() => navigate('login')} className="px-4 py-3 rounded-xl bg-white border border-slate-200 font-bold text-slate-700 hover:border-brand-400 hover:text-brand-600 transition-colors">
                        Login
                      </button>
                      <button onClick={() => navigate('signup')} className="px-4 py-3 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 transition-colors">
                        Sign up
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={refreshTracking}
                      disabled={trackLoading}
                      className="px-4 py-3 rounded-xl bg-white border border-slate-200 font-bold text-slate-700 hover:border-brand-400 hover:text-brand-600 transition-colors disabled:opacity-60"
                    >
                      {trackLoading ? 'Refreshing...' : 'Refresh'}
                    </button>
                  )}
                </div>
              </div>

              {!auth?.token ? (
                <div className="mt-8 bg-white rounded-3xl border border-slate-200 shadow-sm p-8">
                  <div className="text-2xl font-extrabold text-slate-900">Login required</div>
                  <div className="mt-2 text-slate-600">
                    Create an account to track your orders and pickups. (For new orders/pickups, we’ll automatically link them to your account.)
                  </div>
                  <div className="mt-6 flex flex-col sm:flex-row gap-3">
                    <button onClick={() => navigate('login')} className="px-6 py-3 rounded-xl bg-slate-900 text-white font-extrabold hover:bg-slate-800 transition-colors">
                      Login
                    </button>
                    <button onClick={() => navigate('signup')} className="px-6 py-3 rounded-xl bg-brand-500 text-white font-extrabold hover:bg-brand-600 transition-colors">
                      Sign up
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
                    <div className="flex items-center justify-between">
                      <div className="text-lg font-extrabold text-slate-900">Buy orders</div>
                      <div className="text-sm font-bold text-slate-500">{myOrders.length} total</div>
                    </div>
                    <div className="mt-4 space-y-4">
                      {myOrders.length === 0 ? (
                        <div className="text-slate-600">
                          No orders yet.{' '}
                          <button onClick={() => navigate('shop')} className="font-extrabold text-brand-600 hover:text-brand-700">
                            Shop phones
                          </button>
                        </div>
                      ) : (
                        myOrders
                          .slice()
                          .reverse()
                          .map((o) => (
                            <div key={o.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                              <div className="flex items-start justify-between gap-4">
                                <div>
                                  <div className="font-extrabold text-slate-900">{o.id}</div>
                                  <div className="text-sm text-slate-600">
                                    {o.items?.length || 0} items • {formatCurrency(o.totals?.total || 0)}
                                  </div>
                                </div>
                                <div className="text-xs font-extrabold px-3 py-1.5 rounded-full bg-white border border-slate-200 text-slate-700">
                                  {o.status}
                                </div>
                              </div>
                              <div className="mt-4 space-y-2">
                                {(o.timeline || []).slice(-4).map((t, idx) => (
                                  <div key={`${t.at}_${idx}`} className="flex items-center gap-3">
                                    <div className="w-2.5 h-2.5 rounded-full bg-brand-500"></div>
                                    <div className="text-sm font-semibold text-slate-800">{t.label || t.status}</div>
                                    <div className="ml-auto text-xs text-slate-500 font-semibold">
                                      {new Date(t.at).toLocaleString()}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))
                      )}
                    </div>
                  </div>

                  <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
                    <div className="flex items-center justify-between">
                      <div className="text-lg font-extrabold text-slate-900">Sell pickups</div>
                      <div className="text-sm font-bold text-slate-500">{myPickups.length} total</div>
                    </div>
                    <div className="mt-4 space-y-4">
                      {myPickups.length === 0 ? (
                        <div className="text-slate-600">
                          No pickups yet.{' '}
                          <button onClick={() => navigate('sell')} className="font-extrabold text-brand-600 hover:text-brand-700">
                            Get a quote
                          </button>
                        </div>
                      ) : (
                        myPickups
                          .slice()
                          .reverse()
                          .map((p) => (
                            <div key={p.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                              <div className="flex items-start justify-between gap-4">
                                <div>
                                  <div className="font-extrabold text-slate-900">{p.id}</div>
                                  <div className="text-sm text-slate-600">
                                    {p.deviceName || `${p.brand || ''} ${p.model || ''}`.trim() || 'Device'} •{' '}
                                    {formatCurrency(p.quote || 0)}
                                  </div>
                                </div>
                                <div className="text-xs font-extrabold px-3 py-1.5 rounded-full bg-white border border-slate-200 text-slate-700">
                                  {p.status}
                                </div>
                              </div>
                              <div className="mt-4 space-y-2">
                                {(p.timeline || []).slice(-4).map((t, idx) => (
                                  <div key={`${t.at}_${idx}`} className="flex items-center gap-3">
                                    <div className="w-2.5 h-2.5 rounded-full bg-accent-500"></div>
                                    <div className="text-sm font-semibold text-slate-800">{t.label || t.status}</div>
                                    <div className="ml-auto text-xs text-slate-500 font-semibold">
                                      {new Date(t.at).toLocaleString()}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>
        ) : null}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-300 pt-16 pb-8 border-t border-slate-800 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
            <div>
              <div className="flex items-center mb-4">
                <i className="fa-solid fa-mobile-screen-button text-brand-500 text-2xl mr-2"></i>
                <span className="font-bold text-2xl tracking-tight text-white">
                  Re<span className="text-brand-500">Cell</span>
                </span>
              </div>
              <p className="text-slate-400 text-sm mb-6">
                India's most trusted platform to buy refurbished smartphones and sell your old devices for instant cash.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-slate-400 hover:text-white transition-colors" aria-label="Twitter">
                  <i className="fa-brands fa-twitter text-xl"></i>
                </a>
                <a href="#" className="text-slate-400 hover:text-white transition-colors" aria-label="Facebook">
                  <i className="fa-brands fa-facebook text-xl"></i>
                </a>
                <a href="#" className="text-slate-400 hover:text-white transition-colors" aria-label="Instagram">
                  <i className="fa-brands fa-instagram text-xl"></i>
                </a>
              </div>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" onClick={(e) => (e.preventDefault(), navigate('shop'))} className="hover:text-brand-400 transition-colors">
                    Buy Phones
                  </a>
                </li>
                <li>
                  <a href="#" onClick={(e) => (e.preventDefault(), navigate('sell'))} className="hover:text-brand-400 transition-colors">
                    Sell Phone
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-brand-400 transition-colors">
                    About Us
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-brand-400 transition-colors">
                    Warranty Policy
                  </a>
                </li>
              </ul>
            </div>

            <div className="lg:col-span-2">
              <h4 className="text-white font-semibold mb-4">Contact Us</h4>
              <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                <form
                  className="space-y-4"
                  onSubmit={async (e) => {
                    e.preventDefault()
                    const form = e.target
                    const formData = new FormData(form)
                    const payload = Object.fromEntries(formData.entries())
                    try {
                      const res = await authedFetch(`${apiBase}/api/contact`, {
                        method: 'POST',
                        headers: { 'content-type': 'application/json' },
                        body: JSON.stringify(payload),
                      })
                      if (!res.ok) throw new Error('Contact failed')
                      setToast({ open: true, message: 'Message sent successfully' })
                      form.reset()
                    } catch {
                      setToast({ open: true, message: 'Could not send. Is backend running?' })
                    }
                  }}
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <input type="text" name="name" placeholder="Full Name" required className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-sm text-white focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none transition-colors" />
                    </div>
                    <div>
                      <input type="email" name="email" placeholder="Email Address" required className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-sm text-white focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none transition-colors" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <input type="tel" name="phone" placeholder="Phone Number (Optional)" className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-sm text-white focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none transition-colors" />
                    </div>
                    <div>
                      <input type="text" name="company" placeholder="Company (Optional)" className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-sm text-white focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none transition-colors" />
                    </div>
                  </div>
                  <div>
                    <textarea name="message" rows="3" placeholder="How can we help you?" required className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-sm text-white focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none transition-colors resize-none"></textarea>
                  </div>

                  <button type="submit" className="w-full bg-brand-600 hover:bg-brand-500 text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm">
                    Send Message
                  </button>
                </form>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-xs text-slate-500 mb-4 md:mb-0">&copy; 2026 ReCell Marketplace. All rights reserved. Prices in INR (₹).</p>
            <img src="https://make0-public.s3.us-east-1.amazonaws.com/attribution.png" alt="Make0.ai Attribution" className="h-6 opacity-50 hover:opacity-100 transition-opacity" />
          </div>
        </div>
      </footer>

      {/* Toast */}
      <div id="toast" className={toast.open ? 'show' : ''}>
        <i className="fa-solid fa-circle-check text-brand-500 mr-2"></i> <span>{toast.message}</span>
      </div>

      {/* Success modal */}
      {successModal.open ? (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <i className="fa-solid fa-check text-4xl text-green-500"></i>
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-2">{successModal.title}</h3>
            <p className="text-slate-600 mb-8">{successModal.message}</p>
            <button
              onClick={() => {
                closeSuccessModal()
                if (section !== 'home') navigate('home')
              }}
              className="w-full px-6 py-3 bg-brand-500 text-white rounded-xl font-medium hover:bg-brand-600 transition-colors"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
