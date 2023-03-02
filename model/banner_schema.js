const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const BannerSchema = new Schema({
  name: { type: String, required: true },
  image: { type: String, required: true },
  position: { type: String, enum: ['top', 'bottom', 'left', 'right'], required: true },
  isActive: { type: Boolean, default: true },
  startDate: { type: Date },
  endDate: { type: Date }
});

module.exports = mongoose.model('Banner', BannerSchema);