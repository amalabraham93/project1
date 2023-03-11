const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema({
  image: {
    type: String,
    required: true
  },
  link: {
    type: String,
    required: true
  },
  target: {
    type: String,
    enum: ['cart', 'category'],
    required: true
  },
  discription:{
    type: String,
    required:true,
  }
});

const banner = mongoose.model('Banner', bannerSchema);
module.exports = banner;