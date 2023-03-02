const mongoose = require('mongoose')

const schemaadmin1 = new mongoose.Schema({
    name: {
        type: String,
        require: true
    },
    email: {
        type: String,
        require: true
    },
    password: {
        type: String,
        require: true
    },
    phone:{
        type:String,
        require:true
    },
    super_admin:{
        type:Boolean,
        default:false
    },
    block:{
        type:Boolean,
        default:false
    },

},{timestamps:true});

const admin = mongoose.model('admin', schemaadmin1);
module.exports = admin;