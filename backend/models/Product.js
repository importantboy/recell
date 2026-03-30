const mongoose = require('mongoose')

const productSchema = new mongoose.Schema(
  {
    sku: { type: Number, required: true, unique: true, index: true },
    brand: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    storage: { type: String, required: true },
    price: { type: Number, required: true },
    oldPrice: { type: Number, required: true },
    img: { type: String, required: true },
    condition: { type: String, required: true },
  },
  { timestamps: true }
)

module.exports = mongoose.model('Product', productSchema)
