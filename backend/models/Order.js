const mongoose = require('mongoose')

const orderItemSchema = new mongoose.Schema(
  {
    productId: { type: Number, required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    qty: { type: Number, required: true },
    storage: { type: String, default: null },
    img: { type: String, default: null },
    condition: { type: String, default: null },
  },
  { _id: false }
)

const timelineSchema = new mongoose.Schema(
  {
    at: { type: Date, required: true },
    status: { type: String, required: true },
    label: { type: String, required: true },
  },
  { _id: false }
)

const orderSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true, default: null },
    items: { type: [orderItemSchema], required: true },
    totals: {
      subtotal: { type: Number, required: true },
      tax: { type: Number, required: true },
      total: { type: Number, required: true },
    },
    shipping: { type: Object, default: null },
    paymentMethod: { type: String, default: 'upi' },
    status: { type: String, default: 'placed' },
    timeline: { type: [timelineSchema], default: () => [] },
  },
  { timestamps: true }
)

module.exports = mongoose.model('Order', orderSchema)

