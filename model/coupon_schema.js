const mongoose = require('mongoose');

const CouponSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
  },
  percentOff: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
  },
  maxDiscount: {
    type: Number,
    required: true,
    min: 0,
  },
  expirationDate: {
    type: Date,
    required: true,
  },
  startDate: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'inactive',
  },
  minimumPurchaseAmount: {
    type: Number,
    required: true,
    min: 0,
  },
  usersUsed: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user',
    },
  ],
});

const Coupon = mongoose.model('Coupon', CouponSchema);

module.exports = Coupon;