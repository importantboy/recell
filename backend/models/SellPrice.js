const mongoose = require('mongoose')

/** Demo base prices for sell quote (brand key matches select value: apple, samsung, …) */
const sellPriceSchema = new mongoose.Schema(
  {
    brand: { type: String, required: true, lowercase: true, trim: true, index: true },
    model: { type: String, required: true, trim: true },
    basePrice: { type: Number, required: true },
  },
  { timestamps: true }
)

sellPriceSchema.index({ brand: 1, model: 1 }, { unique: true })

module.exports = mongoose.model('SellPrice', sellPriceSchema)
