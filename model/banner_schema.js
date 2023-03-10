const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const bannerSchema = new mongoose.Schema({
  image: {
    type: String,
    required: true
  },
  // link: {
  //   type: String,
  //   required: true
  // },
  // target: {
  //   type: String,
  //   enum: ['cart', 'category'],
  //   required: true
  // },
  discription:{
    type: String,
    required:true,
  }
});

module.exports = mongoose.model('Banner', bannerSchema);