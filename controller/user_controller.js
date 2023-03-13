const User = require("../model/user_schema");
const bycrpt = require("bcrypt");
const productCollection = require("../model/products_schema");
const Category = require("../model/category_schema");
const Swal = require("sweetalert2");
const otpGenerator = require("otp-generator");
const Otpverification = require("../model/otpverification_schema");
const nodemailer = require("../controller/nodemailer");
const Coupon = require("../model/coupon_schema");
const Payment = require("../controller/payment_gateway");
const Razorpay = require("razorpay");
require('dotenv').config();
const Banner = require("../model/banner_schema");


var instance = new Razorpay({
  key_id: process.env.RAZORPAY_KEYID,
  key_secret: process.env.RAZORPAY_KEYSECRET,
});

// const otpverification = require('../model/otpverification_schema')
var session;

// const OTP = otpGenerator.generate(6, { upperCaseAlphabets: false, specialChars: false });
// let transporter = nodemailer.createTransport({
// host: " smtp.mail.yahoo.com",
//     auth: {
//         Server : "smtp.mail.yahoo.com",
//         Port : 465 ,
//         // RequiresSSL : Yes,
//         // RequiresTLS : Yes ,
//         // Requiresauthentication : Yes,

//          user: process.env.MAIL_EMAIL,
//          pass: process.env.MAIL_PASSWORD,
// }
// });

module.exports = {
  registerUser: async function (req, res, next) {
    console.log("reached server");
    const data1 = req.body;
    console.log(data1);
    let userdb = await User.findOne({ email: data1.email });
    if (userdb) {
      if (userdb.email == data1.email) {
        res.render("users/register", { layout: "layout" });
      }
    } else {
      data1.password = await bycrpt.hash(data1.password, 10);
      const user = new User(data1);
      user.save().then((user) => {
        nodemailer.sentotpverificationemail(user, res);
        res.status(201);
        // res.redirect('/verifyotp');
      });
    }
  },

  verifyotp: async (req, res) => {
    return new Promise(async (resolve, reject) => {
      userdata = req.body;
      console.log(userdata);
      let userD = await User.findOne({ email: userdata.email });
      let userotp = await Otpverification.findOne({ userId: userdata.id });
      console.log(userotp);
      if (userotp) {
        const expire = userotp.expireAt;
        const hashedOTP = userotp.otp;
        if (expire < Date.now()) {
          await Otpverification.deleteOne({ userId: userdata.id });
          throw new Error("code has expired. Please request again.");
        } else {
          const validOTP = await bycrpt.compare(userdata.otp, hashedOTP);
          console.log(validOTP);
          if (!validOTP) {
            throw new Error("Invalid code passed. Check your Inbox");
          } else {
            await User.updateOne(
              {
                email: userdata.email,
              },
              { email_verification: true }
            );
            await Otpverification.deleteOne({ userId: userdata.id });
            res.render("users/otpverify", {
              layout: "layout",
              message: "use email veerifiedd sucessfuly plese login",
            });
          }
        }
      } else {
        res.render("users/otpverifiy", { layout: "layout" });
      }
    });
  },

  // user profile
  profileload: async (req, res, next) => {
    try {
      if (req.session.userid) {
        const userdata = await User.find({ email: req.session.userid }).lean();
        console.log(userdata);

        res.render("users/profile", {
          layout: "layout",
          userdata,
          user: req.session.userid,
        });
        // console.log("tttttttt"+userdata);
      }
      // res.redirect("/login");
      res.render("users/profile", {
        layout: "layout",
        userdata,
        user: req.session.userid,
      });
    } catch (error) {
      next(error);
    }
  },

  editprofile: async (req, res, next) => {
    try {
      if (req.session.userid) {
        const userdata = await User.find({ _id: req.params.id }).lean();
        console.log(userdata);

        res.render("users/edit_profile", {
          layout: "layout",
          userdata,
          user: req.session.userid,
        });
        console.log(userdata);
      }
    } catch (error) {
      next(err);
    }
  },

  editedprofile: async (req, res, next) => {
    try {
      if (req.session.userid) {
        req.body;
        const address = [
          {
            street: req.body.street,
            country: req.body.country,
            state: req.body.state,
            district: req.body.district,
            pincode: req.body.pincode,
          },
        ];

        console.log(address);
        const userdata = await User.updateOne(
          { _id: req.params.id },
          {
            $set: {
              name: req.body.name,
              phone: req.body.phone,
              address: address,
            },
          }
        );

        console.log(userdata);

        res.render("users/edit_profile", {
          layout: "layout",

          user: req.session.userid,
        });
        console.log(userdata);
      }
    } catch (error) {
      next(error);
    }
  },

  addressCollection: async (req, res, next) => {
    try {
      if (req.session.userid) {
        const address = await User.findOne(
          { email: req.session.userid },
          { address: 1, _id: 0 }
        ).lean();
        console.log(address);
        res.render("users/address", {
          layout: "layout",
          user: req.session.userid,
          address,
        });
      }
    } catch (error) {
      next(error);
    }
  },

  addaddress: async (req, res, next) => {
    try {
      if (req.session.userid) {
        res.render("users/add_address", {
          layout: "layout",
          user: req.session.userid,
        });
      }
    } catch (error) {
      next(error);
    }
  },

  addnewaddress: async (req, res, next) => {
    try {
      if (req.session.userid) {
        req.body;

        const address = [
          {
            street: req.body.street,
            country: req.body.country,
            state: req.body.state,
            district: req.body.district,
            pincode: req.body.pincode,
          },
        ];

        console.log(address);
        const userdata = await User.updateOne(
          { email: req.session.userid },
          { $push: { address: address } }
        );

        console.log(userdata);

        res.redirect("/address");
      }
    } catch (error) {
      next(error);
    }
  },

  addresscheckout: async (req, res, next) => {
    try {
      if (req.session.userid) {
        req.body;

        const address = [
          {
            street: req.body.street,
            country: req.body.country,
            state: req.body.state,
            district: req.body.district,
            pincode: req.body.pincode,
          },
        ];

        console.log(address);
        const userdata = await User.updateOne(
          { email: req.session.userid },
          { $push: { address: address } }
        );

        console.log(userdata);

        res.json({ success: true });
      }
    } catch (error) {
      next(error);
    }
  },

  editaddress: async (req, res, next) => {
    try {
      if (req.session.userid) {
        id = req.params.id;
        const address = await User.findOne(
          { email: req.session.userid, "address._id": id },
          { "address.$": 1, _id: 0 }
        ).lean();
        console.log(address);
        res.render("users/edit_address", {
          layout: "layout",
          user: req.session.userid,
          address,
        });
      }
    } catch (error) {
      next(error);
    }
  },

  editedaddress: async (req, res, next) => {
    try {
      if (req.session.userid) {
        id = req.params.id;

        const address = [
          {
            street: req.body.street,
            country: req.body.country,
            state: req.body.state,
            district: req.body.district,
            pincode: req.body.pincode,
          },
        ];

        console.log(address);
        const userdata = await User.updateOne(
          { email: req.session.userid, "address._id": id },
          { $set: { "address.$": address } }
        );

        console.log(userdata);

        res.redirect("/address");
      }
    } catch (error) {
      next(error);
    }
  },

  deleteaddress: async (req, res, next) => {
    try {
      if (req.session.userid) {
        id = req.params.id;

        const userdata = await User.updateOne(
          { email: req.session.userid, "address._id": id },
          { $pull: { address: { _id: id } } }
        );

        console.log(userdata);

        res.redirect("/address");
      }
    } catch (error) {
      next(error);
    }
  },

  login: async (req, res) => {
    return new Promise(async (resolve, reject) => {
      userdata = req.body;
      console.log(userdata);
      let userD = await User.findOne({ email: userdata.email });
      console.log(userD);
      if (userD) {
        bycrpt.compare(userdata.password, userD.password).then((hi) => {
          if (hi) {
            if (userD.block == false && userD.email_verification == true) {
              session = req.session;
              session.userid = userD.email;
              id = userD._id;

              res.redirect("/");
            } else {
              res.render("users/login", { layout: "layout" });
            }
          } else {
            res.render("users/login", {
              layout: "layout",
              password: "The Email and Password does not match please check",
            });
          }
        });
      } else {
        res.render("users/login", { layout: "layout" });
      }
    });
  },

  //forgot password

  forgotpasswordemail: async (req, res, next) => {
    try {
      email = req.body.email;
      console.log(email);
      const user = await User.findOne({ email: email }).then((user) => {
        if (user) {
          nodemailer.sendforgotpasswordotpmail(user, res);
          res.status(201);
        } else {
          res.render("users/forgot_passwordotp", {
            layout: "layout",
            errorMessage:
              "The Email Address You entered does not exit please register for new account",
          });
        }
      });
    } catch (error) {
      next(error);
    }
  },

  forgotpasswordotpverify: async (req, res) => {
    return new Promise(async (resolve, reject) => {
      userdata = req.body;
      const userD = await User.findOne({ email: userdata.email });
      console.log(userD.email);
      let userotp = await Otpverification.findOne({ userId: userdata.id });
      console.log(userotp);
      if (userotp) {
        const expire = userotp.expireAt;
        const hashedOTP = userotp.otp;
        if (expire < Date.now()) {
          await Otpverification.deleteOne({ userId: userdata.id });
          throw new Error("code has expired. Please request again.");
        } else {
          const validOTP = await bycrpt.compare(userdata.otp, hashedOTP);
          console.log(validOTP);
          if (!validOTP) {
            throw new Error("Invalid code passed. Check your Inbox");
          } else {
            await Otpverification.deleteOne({ userId: userdata.id });
            res.render("users/forgot_passwordotp", {
              layout: "layout",
              showResetPasswordForm:
                "Enter the OTP has been succsesfuly Verified Please Enter the new Password",
              userdata,
            });
          }
        }
      } else {
        res.render("users/forgot_passwordotp", {
          layout: "layout",
          invalidotp: "Invalid  otp",
        });
      }
    });
  },

  resetpassword: async function (req, res, next) {
    try {
      const data1 = req.body;
      console.log(data1);
      let userdb = await User.findOne({ email: data1.email });
      if (userdb) {
        data1.password = await bycrpt.hash(data1.password, 10);

        const userdata = await User.updateOne(
          { email: data1.email },
          { $set: { password: data1.password } }
        );
        res.redirect("/login");
      } else {
        res.render("users/forgot_passwordotp", {
          layout: "layout",
          error:
            "The Email Address You entered does not exit please register for new account",
        });
      }
    } catch (error) {
      next(error);
    }
  },

  singleProduct: async (req, res, next) => {
    try {
      id = req.params.id;
      // user = req.session.user
      const product = await productCollection.findById(id).lean();
      // console.log(product.Name);
      res.render("users/product_details", {
        layout: "layout",
        product,
        user: req.session.userid,
      });
    } catch (error) {
      next(error);
    }
  },

  getAllProducts: async (req, res, next) => {
    try {
      let category = await Category.find({}).lean();
      let products = await productCollection.find({ archive: false }).lean();
      // let categorys = await Category.find({delete:false}).lean()
      console.log(products);
      // res.render('users/product_list',{ layout:'layout'})

      res.render("users/productlist", {
        layout: "layout",
        products,
        category,
        user: req.session.userid,
      });
    } catch (error) {
      next(error);
    }
  },

  categoryfiltter: async (req, res, next) => {
    try {
      let category_id = req.params.id;
      let category = await Category.find({}).lean();
      let products = await productCollection
        .find({ archive: false, categoryid: category_id })
        .populate("categoryid")
        .lean();
      // let categorys = await Category.find({delete:false}).lean()
      console.log(products);
      // res.render('users/product_list',{ layout:'layout'})

      res.render("users/productlist", {
        layout: "layout",
        category,
        products,
        user: req.session.userid,
      });
    } catch (error) {
      next(error);
    }
  },

  loaduser: async (req, res, next) => {
    try {
      let products = await productCollection
        .find({ archive: false })
        .limit(8)
        .lean();
        const banner1 = await Banner.find({}).lean()
      if (req.session.userid) {
        console.log(banner1)
        const user = await User.findOne({ email: req.session.userid }).populate('cart.productid');
        const cartItems = user.cart;
        const totalQuantity = cartItems.reduce((total, item) => total + item.quantity, 0);
        res.render("users/userhome", {
          layout: "layout",totalQuantity,
          user: req.session.userid,
          products,banner1
        });
      } else {
        res.render("users/userhome", { layout: "layout", products,banner1 });
      }
      // let user = session.userid
    } catch (error) {
      next(error);
    }
  },

  userlogout: async (req, res, next) => {
    try {
      req.session.destroy();
      res.redirect("/");
    } catch (error) {
      next(error);
    }
  },

  // wishlist
  addwishlist: async (req, res, next) => {
    try {
      if (req.session.userid) {
        console.log(req.session.userid);
        id = req.params.id;
        console.log(id);
        userdata = await User.find({ email: req.session.userid });
        productsdata = await productCollection.findById(id);

        if (userdata[0].wishlist.includes(id)) {
          console.log("Product already in wishlist");
          res.json({already:true,message:"Product already in wishlist"})
        } else {
          await User.updateOne(
            {
              email: req.session.userid,
            },
            {
              $push: {
                wishlist: [id],
              },
            }
          );
          res.json({success:true})
        }

        // res.render('users/wishlist',{layout:'layout',user:req.session.userid})
      }

    } catch (error) {
      next(error);
    }
  },

  loadwishlist: async (req, res, next) => {
    try {
      if (req.session.userid) {
        const wishlists = await User.find(
          {
            email: req.session.userid,
          },
          {
            wishlist: 1,
            _id: 0,
          }
        ).exec();
        const productIds = wishlists
          .map((wishlist) => wishlist.wishlist)
          .filter((id) => id !== null);
        console.log(productIds);
        const filteredValues = await productIds.reduce((acc, innerArr) => {
          acc.push(...innerArr.filter((value) => value !== null));
          return acc;
        }, []);
        console.log(filteredValues);

        const productsdata = await productCollection
          .find({
            _id: {
              $in: filteredValues,
            },
          })
          .lean();

        console.log(productsdata);

        res.render("users/wishlist", {
          layout: "layout",
          productsdata,
          user: req.session.userid,
        });
      } else {
        res.redirect("/login");
      }
    } catch (error) {
      next(error);
    }
  },

  removewishlist: async (req, res, next) => {
    try {
      if (req.session.userid) {
        const id = req.params.id;
        console.log(id);
        const userdata = await User.updateOne(
          {
            email: req.session.userid,
          },
          {
            $pull: {
              wishlist: id,
            },
          }
        );
        console.log(userdata);
        res.json({success:true})
      }
    } catch (error) {
      next(error);
    }
  },

  wishtocart: async (req, res, next) => {
    try {
      if (req.session.userid) {
        const id = req.params.id;
        console.log(id);

        userdata = await User.findOne({
          email: req.session.userid,
          "cart.productid": id,
        });

        if (userdata) {
          console.log("Product already in cart");
        } else {
          //addtocart
          await User.updateOne(
            {
              email: req.session.userid,
            },
            {
              $push: {
                cart: { productid: id },
              },
            }
          );
     //remove from wishlist
          const userdata1 = await User.updateOne(
            {
              email: req.session.userid,
            },
            {
              $pull: {
                wishlist: id,
              },
            }
          );
        }

        res.json({success:true})
        // res.redirect("/wishlist");
      }
    } catch (error) {
      next(error);
    }
  },

  // cart management

  addtocart: async (req, res, next) => {
    try {
      if (req.session.userid) {
        console.log(req.session.userid);
        const id = req.params.id;
        console.log(id);
        userdata = await User.findOne({
          email: req.session.userid,
          "cart.productid": id,
        });
        productsdata = await productCollection.findById(id);

        if (userdata) {
          console.log("Product already in cart");
          res.json({already:true,message:"Product already in cart"})

        } else {
          await User.updateOne(
            {
              email: req.session.userid,
            },
            {
              $push: {
                cart: { productid: id },
              },
            }
          );
        }
        // res.redirect("/product_list");
        res.json({success:true})
      } else {
        // res.redirect("/login");
      }
    } catch (error) {
      next(error);
    }
  },
  //CART
  loadcart: async (req, res, next) => {
    try {
      if (req.session.userid) {
        const cart1 = await User.findOne({ email: req.session.userid })
          .populate("cart.productid")
          .lean()
          .exec();
        console.log(cart1.cart);
        if (cart1.cart.length <= 0) {
          res.render("users/cart", {
            layout: "layout",
            cart1,
            user: req.session.userid,
            empty: "The cart is empty please fill it",
          });
        } else {
          res.render("users/cart", {
            layout: "layout",
            cart1,
            user: req.session.userid,
          });
        }
      } else {
        res.redirect("/login");
      }
    } catch (error) {
      next(error);
    }
  },

  removecartitem: async (req, res, next) => {
    try {
      if (req.session.userid) {
        const id = req.params.id;
        console.log(id);
        const userdata = await User.updateOne(
          {
            email: req.session.userid,
          },
          {
            $pull: {
              cart: { productid: id },
            },
          }
        );
        console.log(userdata);
        // res.redirect("/cart");
        res.json({success:true})
      }
    } catch (error) {
      next(error);
    }
  },




  inccartqty: async (req, res, next) => {
    try {
      if (req.session.userid) {
        const id = req.params.id;
        console.log(id);
        const userdata = await User.updateOne(
          { email: req.session.userid, "cart.productid": id },
          { $inc: { "cart.$.quantity": 1 } }
        ).then((response) => {
          res.json(response);
        });
        // res.send(response)
        console.log(userdata);
        // res.json({success:true})
        // res.redirect("/cart");
        res.json(response);
      }
    } catch (error) {
      next(error);
    }
  },




  deccartqty: async (req, res, next) => {
    try {
      if (req.session.userid) {
        const id = req.params.id;
        console.log(id);
        const userdata = await User.updateOne(
          { email: req.session.userid, "cart.productid": id },
          { $inc: { "cart.$.quantity": -1 } }
        );
        console.log(userdata);

        // Get updated cart data to check if quantity is zero
        const user = await User.findOne({ email: req.session.userid });
        const item = user.cart.find((item) => item.productid == id);

        // If quantity is zero or less, set it back to 1
        if (item.quantity <= 0) {
          await User.updateOne(
            { email: req.session.userid, "cart.productid": id },
            { $set: { "cart.$.quantity": 1 } }
          );
        }
          res.json({success:true})

        // res.redirect("/cart");
      }
    } catch (error) {
      next(error);
    }
  },





  //CHECKOUT
  checkout: async (req, res, next) => {
    try {
      if (req.session.userid) {
        subtotal = req.query.subtotal;
        console.log(req.query.subtotal);
        const address = await User.findOne(
          { email: req.session.userid },
          { address: 1, _id: 0 }
        ).lean();

        const cart1 = await User.findOne({ email: req.session.userid })
          .populate("cart.productid")
          .lean()
          .exec();
          console.log(cart1)

        res.render("users/checkout", {
          layout: "layout",
          address,
          cart1,
          user: req.session.userid,
        });
      }
    } catch (error) {
      next(error);
    }
  },



  buynow: async (req, res, next) => {
    try {
      if (req.session.userid) {
        const id = req.params.id
     
        const address = await User.findOne(
          { email: req.session.userid },
          { address: 1, _id: 0 }
        ).lean();

        const product = await productCollection.findOne({ _id: id })
        const cart1 = {
          cart:[{productid:{Name:product.Name,
              _id:product._id,
            Price:product.Price},
            quantity:1
          }]
        };
        
        res.render("users/checkout", {
          layout: "layout",
          address,
          cart1,
          user: req.session.userid,
        });
      }
    } catch (error) {
      next(error);
    }
  },



  //ORDER CONFIRMATION
  orderplaced: async (req, res, next) => {
    try {
      if (req.session.userid) {
        // console.log(req.body);
        orderData = req.body;
        console.log(orderData);

        // retrieve the user document by the user ID
        const user = await User.findOne({ email: req.session.userid });
        const product = [];
        // // create a new order object based on the orderData
        newOrder = {
          product: product,
          total: orderData.subtotal,
          bill_amount: orderData.Total,
          payment_method: orderData.payment_method,
          status: "Pending",
          delivery_address: orderData.address,
          coupon: orderData.coupon,
          coupon_discount: orderData.coupon_discount,
          payment_id: "",
          order_date: Date.now(),
          delivery_date: "",
        };

        if (!Array.isArray(orderData.product)) {
          orderData.product = [orderData.product];
        }
        if (!Array.isArray(orderData.quantity)) {
          orderData.quantity = [orderData.quantity];
        }
        if (!Array.isArray(orderData.total)) {
          orderData.total = [orderData.total];
        }

        // loop through the products and quantities and add them to the order object
        for (let i = 0; i < orderData.product.length; i++) {
          const productId = orderData.product[i];
          const quantity = orderData.quantity[i];
          const total = orderData.total[i];
          product.push({
            product: productId,
            quantity: quantity,
            total: total,
          });
        }

        // // add the new order object to the user's order array
        user.order.push(newOrder);

        // // save the updated user document
        await user.save();

        const userdata = await User.updateOne(
          { email: req.session.userid },
          { $pull: { cart: { productid: { $in: orderData.product } } } }
        );

        //quantity decrement
        for (let i = 0; i < orderData.product.length; i++) {
          try {
            const productId = orderData.product[i];
            const quantity = orderData.quantity[i];

            const updatedProduct = await productCollection.updateMany(
              { _id: productId },
              { $inc: { Quantity: -quantity } },
              { upsert: true, new: true }
            );

            console.log(updatedProduct); // log the result to the console
          } catch (error) {
            console.error(error.message); // log the error message to the console
            next(error); // pass the error to the next middleware
          }
        }

        // console.log(updatedProduct)
        const orderdata = await User.findOne({ email: req.session.userid })
          .populate("order.product.product")
          .lean();

        const latestorder = orderdata.order.sort(
          (a, b) => b.order_date - a.order_date
        )[0];

        if (req.body.payment_method == "cash_on_delivery") {
          res.json({ codstatus: true });
          console.log("jhadskhkasdhflsjkhaf");
        } else {
          let orderid = latestorder.order_id;
          console.log(latestorder.bill_amount);
          console.log(latestorder.order_id);
          let options = {
            amount: latestorder.bill_amount * 100, // amount in the smallest currency unit
            currency: "INR",
            receipt: "orderid124565451",
            payment_capture: true,
            notes: {},
          };
          instance.orders.create(options, function (err, order) {
            console.log(order);
            res.json(order);
          });
        }

        // console.log(orderdata);
        console.log(latestorder);
      } else {
        res.redirect("/login");
      }
      // let user = session.userid
    } catch (error) {
      next(error);
    }
  },

  orderconfirmation: async (req, res, next) => {
    try {
      if (req.session.userid) {
        const orderdata = await User.findOne({ email: req.session.userid })
          .populate("order.product.product")
          .lean();

        const latestorder = orderdata.order.sort(
          (a, b) => b.order_date - a.order_date
        )[0];

        console.log("fgnzdfbgsfghgzh", latestorder);

        // res.send(response)
        // console.log(orderdata);
        res.render("users/confirmation", {
          layout: "layout",
          user: req.session.userid,
          latestorder,
        });
      }
    } catch (error) {
      next(error);
    }
  },

  verifypay: async (req, res, next) => {
    try {
      if (req.session.userid) {
        console.log(req.body);
        // let payment = req.body.response
        // let order = req.body.order
        // console.log(req.body)
        console.log(req.body["response[razorpay_order_id]"]);

        const crypto = require("crypto");
        let hmac = crypto.createHmac("sha256", "rygNBsuv7VhbANu61bV29OHa");
        hmac.update(
          req.body["response[razorpay_order_id]"] +
            "|" +
            req.body["response[razorpay_payment_id]"]
        );
        hmac = hmac.digest("hex");
        console.log(hmac == req.body["response[razorpay_signature]"]);
        if (hmac === req.body["response[razorpay_signature]"]) {
          console.log("payment succesfull");
          // orderId = req.body['order[id]']
          // console.log(orderId);
          console.log("verifyied");

          const orderdata = await User.findOne({ email: req.session.userid });
          console.log("gdgkjdgfgfhdfhksdfghkgdhjdgsfh");
          console.log(orderdata);

          const latestorder = orderdata.order.sort(
            (a, b) => b.order_date - a.order_date
          )[0];

          console.log(latestorder);
          console.log("adssdfdfsddsssdfdsffdsfdsfdddh");

          const updatedOrder = await User.updateOne(
            {
              email: req.session.userid,
              "order.order_id": latestorder.order_id,
            },
            { $set: { "order.$.status": "Placed" } }
          );

          console.log(updatedOrder);

          res.json({ status: true });
        } else {
          console.log("payment failed");

          const orderdata = await User.findOne({ email: req.session.userid });

          const latestorder = orderdata.order.sort(
            (a, b) => b.order_date - a.order_date
          )[0];
          const updatedOrder = await User.updateOne(
            {
              email: req.session.userid,
              "order.order_id": latestorder.order_id,
            },
            { $set: { "order.$.status": "Payment Failed" } }
          );

          //   const orderdata = await User.findOne({ email: req.session.userid }, { order: { $slice: -1 } }).sort({ "order.order_date": -1 })
          //   .populate("order.product.product")
          //   .lean();

          console.log(orderdata);
          //  orderdata.order[0].status = "Payment Failed"
          // await orderdata.save();

          res.json({ status: false });
        }
      }
    } catch (error) {
      next(error);
    }
  },

  //USER PROFILE ORDER HISTORY

  orderhistory: async (req, res, next) => {
    try {
      if (req.session.userid) {
        // const orderdata = await User.aggregate([
        //   { $match: { email: req.session.userid } },
        //   { $unwind: "$order" },
        //   { $sort: { "order.order_date": -1 } },
        //   {
        //     $lookup: {
        //       from: "product",
        //       localField: "order.product.product",
        //       foreignField: "_id",
        //       as:"order.product.product",
        //     },
        //   },
        //   { $group: { _id: "$_id", order: { $push: "$order" } } },
        //   { $project: { _id: 0, order: 1 } },
        // ]).exec();

              
       console.log('jbhshjhahhbhjabhjcbss')


        const orderdata1 = await User.aggregate([
          { $match: { email: req.session.userid } },
          { $unwind: "$order" },
          { $sort: { "order.order_date": -1 } },
          { $group: { _id: "$_id", order: { $push: "$order" } } },
          // { $project: { _id: 0, order: 1 } },
       ])
     const orderdata = await User.populate(orderdata1,{path: 'order.product.product',model: 'product'})
        
       
        console.log(orderdata);
       
          
        // res.send(response)
        
       res.render("users/order_history", { layout: "layout", user: req.session.userid, orderdata });
      
      }
    } catch (error) {
      next(error);
    }
  },


  paymentfailed: async (req, res, next) => {
    try {
      if (req.session.userid) {
        const orderdata = await User.findOne({ email: req.session.userid });

        const latestorder = orderdata.order.sort(
          (a, b) => b.order_date - a.order_date
        )[0];
        const updatedOrder = await User.updateOne(
          {
            email: req.session.userid,
            "order.order_id": latestorder.order_id,
          },
          { $set: { "order.$.status": "Payment Failed" } }
        );
        res.json({success:true})
     
        // res.render("users/order_details", { layout: "layout", orderdata });
      }
    } catch (error) {
      next(error);
    }
  },





  orderdetails: async (req, res, next) => {
    try {
      if (req.session.userid) {
        const id = req.params.id;
        const orderdata = await User.find(
          { email: req.session.userid, "order.order_id": id },
          { "order.$": 1 }
        )
          .populate("order.product.product")
          .lean()
          .exec();
        console.log(orderdata);

        res.render("users/order_details", { layout: "layout", orderdata });
      }
    } catch (error) {
      next(error);
    }
  },

  cancelorder: async (req, res, next) => {
    try {
      if (req.session.userid) {
        const id = req.params.id;
        await User.updateOne(
          { "order.order_id": id },
          { $set: { "order.$.status": "Cancel" } }
        );

        res.redirect("/orderhistory");
      }
    } catch (error) {
      next(error);
    }
  },

  applycoupon: async (req, res, next) => {
    try {
      if (req.session.userid) {
        const code = req.body.code;
        const total = req.body.total;
        const coupon = await Coupon.findOne({ code: code });
        const user = await User.findOne({ email: req.session.userid });
        console.log(coupon);
        // Check if the coupon exists
        if (!coupon) {
          console.log("Invalid coupon code.");
          res.json({ notfound: true, message: "Invalid coupon code." });
        }

        // Check if the coupon is active
        if (coupon.status !== "active") {
          console.log("This coupon is inactive.");
          res.json({ inactive: true });
        }

        // Check if the coupon has expired
        if (coupon.expirationDate < new Date()) {
          console.log("This coupon has expired.");
          res.json({ expired: true });
        }

        // Check if the user has already used the coupon
        if (coupon.usersUsed.includes(user._id)) {
          console.log("This coupon can only be used once per user.");
          res.json({ used: true });
        }

        // Check if the user's total purchase amount meets the minimum requirement
        if (total < coupon.minimumPurchaseAmount) {
          console.log(
            `You must spend at least $${coupon.minimumPurchaseAmount} to use this coupon.`
          );
          res.json({
            minprice: true,
            message:
              "You must spend at least " +
              coupon.minimumPurchaseAmount +
              " to use this coupon.",
          });
        }
        console.log("FYFGFJGFYTFYFFYT");

        // Apply the coupon and update the user's total purchase amount and used coupon list
        const discount = Math.min(
          coupon.maxDiscount,
          (total * coupon.percentOff) / 100
        );
        const newTotalPurchaseAmount = total - discount;
        const newtotal = newTotalPurchaseAmount;
        console.log(newtotal - discount);
        coupon.usersUsed.push(user._id);
        await coupon.save();

        // Send the updated total purchase amount back to the client
        res.json({ success: true, discount });
      }
    } catch (error) {
      next(error);
    }
  },

  // addtocart: async (req,res)=>{
  // try {
  //    const productId = req.params.id
  //     await User.aggregate([
  //       {$lookup:{
  //         from:"products",
  //         localField: "email",
  //         foreignField: productId,
  //         as: "cart"
  //       }}
  //     ])
  // } catch (error) {

  // }
  // }
};
