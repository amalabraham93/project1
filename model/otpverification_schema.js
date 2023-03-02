const mongoose = require('mongoose')

const schemaotpverification = new mongoose.Schema({
  userId: {
    type: String
  },
  otp: {
    type: String
  },
  createdAt:{type:Date},

  expiresAt:{
    type:Date}
   

});

const otpverification = mongoose.model('otpverification', schemaotpverification);


module.exports = otpverification;