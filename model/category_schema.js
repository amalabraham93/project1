const mongoose = require('mongoose')

const schemacategory = new mongoose.Schema({
    categoryname: {
    type: String,
    require: true
  },
  discription: {
    type: String,
    require: true
  },
  status: {
    type: String,
    require: true
  },
  category_verification: {
    type: Boolean
  },
  delete:{
    type:Boolean,
    default:false
  },

  created_date: {
    type: Date,
    default:Date.now()
  },
  
 


});

const category = mongoose.model('category', schemacategory);


module.exports = category;



