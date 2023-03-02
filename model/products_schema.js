const mongoose = require('mongoose');

const products = new mongoose.Schema({
  Name: {
    type: String,
    required: true
},
Brand: {
    type: String,
    required: true
},
Quantity: {
    type: Number,
    required: true
},
categoryid: {
    type: mongoose.Schema.Types.ObjectId, 
    ref: "category" ,
    required: true
},
Price: {
    type: Number,
    required: true
},
archive: {
    type: Boolean,
    required: true
},
image : {
    type : Array,
    required : true
},
Description : {
    type : String,
    required : true
},
});
const product = mongoose.model('product', products);
module.exports = product;