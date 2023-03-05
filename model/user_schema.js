const mongoose = require("mongoose");
const { v4: uuidv4 } = require('uuid');
// generate a UUID string
// const uuid = uuidv4();

// // create a custom ID by appending a prefix to the UUID string
// const customId = `order_${uuid}`;


const schemauser = new mongoose.Schema(
  {
    name: {
      type: String,
      require: true,
    },
    email: {
      type: String,
      require: true,
    },
    password: {
      type: String,
      require: true,
    },
    email_verification: {
      type: Boolean,
      required: true,
      default: false,
    },
    phone: { type: String },
    block: {
      type: Boolean,
      default: false,
    },

    address: [
      {
        street: { type: String, require: true },
        country: { type: String, require: true },
        state: { type: String, require: true },
        district: { type: String, require: true },
        pincode: { type: String, require: true },
        default: { type: Boolean, default: false },
      },
    ],

    status: {
      type: String,
    },
    last_login: {
      type: Date,
    },
    joined_at: {
      type: Date,
    },

    cart: [
      {
        productid: { type: mongoose.Schema.Types.ObjectId, ref: "product" },
        quantity: { type: Number, default: 1 },
        modifiedOn: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    wishlist: [{ type: String }],
    order: [
      {
        order_id: {
          type: String,
          unique: true
        },
        product:[{
          product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "product",
            required: true,
          },
          quantity: { type: Number, required: true },
          total: { type: Number, required: true },
          
        }],
       
        total: Number,
        delivery_address: String,
        bill_amount: Number,
        status: String,
        payment_method: String,
        payment_id: String,
        coupon: String,
        coupon_discount: Number,
        order_date: {type:Date,
                     default:Date.now()},
        delivery_date: Date,
        // created_on: Date.now(),
      },
    ],
  },
  { timestamps: true }
);


// define a pre-save hook to generate a customId for each order
schemauser.path('order').schema.pre('save', function(next) {
  const uuid = uuidv4();
  const customId = `order_${uuid}`;
  this.order_id = customId;
  next();
});

const user = mongoose.model("user", schemauser);

module.exports = user;
