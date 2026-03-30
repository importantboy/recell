const mongoose = require('mongoose')

const timelineSchema = new mongoose.Schema(
  {
    at: { type: Date, required: true },
    status: { type: String, required: true },
    label: { type: String, required: true },
  },
  { _id: false }
)

const pickupSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true, default: null },
    quote: { type: Number, required: true },
    deviceName: { type: String, default: null },
    brand: { type: String, default: null },
    model: { type: String, default: null },
    condition: { type: String, default: null },
    storageGb: { type: Number, default: null },
    accessories: { type: Object, default: null },
    status: { type: String, default: 'requested' },
    timeline: { type: [timelineSchema], default: () => [] },
  },
  { timestamps: true }
)

module.exports = mongoose.model('Pickup', pickupSchema)

