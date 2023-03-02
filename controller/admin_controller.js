const bycrpt = require("bcrypt");
const Admin = require("../model/admin_schema");
const User = require("../model/user_schema");
const Category = require("../model/category_schema");
const productCollection = require("../model/products_schema");
const adminauth = require("../middleware/admin_auth");
const Coupon = require('../model/coupon_schema')
const app = require("../app");
const category = require("../model/category_schema");
const product = require("../model/products_schema");
let session;

module.exports = {
  loadadminlog: async (req, res) => {
    try {
      res.render("admin/admin_login", { layout: "admin_layout" });
    } catch (error) {
      console.log(error.message);
    }
  },

  loaddashboard: async(req,res,next)=>{
     try {
      if(req.session){
        console.log(req.session.adminid)

       const totalsold = await User.aggregate([
          { $unwind: '$order' }, // flatten the order array
          { $match: { 'order.status': 'pending' } }, // filter only completed orders
          { $unwind: '$order.product' }, // flatten the product array
          { $group: { _id: null, totalQuantity: { $sum: '$order.product.quantity' } } } // group by null and sum the quantity
        ]).exec()


        const profit = await User.aggregate([
          { $unwind: '$order' }, // flatten the order array
          { $match: { 'order.status': 'pending' } }, // filter only completed orders
          { $group: { _id: null, totalProfit: { $sum: '$order.bill_amount' } } } // group by null and sum the bill_amount
        ]).exec()
        const totalusers = await User.countDocuments({}).lean()
        console.log(totalusers)
        

       const admindata = await Admin.find({email:req.session.adminid},{super_admin:1,_id:0}).lean()
       console.log(admindata.super_admin);
         res.render('admin/admin_dashboard',{layout:'admin_layout',admin:req.session.adminid,totalsold,profit,totalusers});
      }
     
     } catch (error) {
      next(error)
    }
     
  },

  adminlogin: async (req, res) => {
    try {
      userdata = req.body;
      let userDb = await Admin.findOne({ email: userdata.email });
      if (userDb) {
        if (
          userdata.password == userDb.password &&
          userdata.email == userDb.email
        ) {
          session = req.session;
          console.log("failsession");
          session.adminid = userDb;
          console.log(session.adminid);
          res.redirect("/admin/admin_dashboard");
        } else {
          console.log(" login 2 times error ");
          res.render("admin/admin_login", { layout: "admin_layout" });
        }
      } else {
        console.log(" login failed ");
        res.render("admin/admin_login", { layout: "admin_layout" });
      }
    } catch (error) {
      console.log(error.message);
    }
  },

//employee mangement
addemployee: async (req,res,next)=>{
  try {
if(req.session){

    res.render('admin/add_employee',{layout:'admin_layout',admin:req.session.adminid})}
  } catch (error) {
    next(error)
  }
},

addnewEmployee: async (req,res,next)=>{
  try {
if(req.session){
    const data = req.body
    const admindata = new Admin(data)
    admindata.save()
    res.redirect('/admin/employee_list')
  }
  } catch (error) {
    next(error)
  }
},

loademployee: async (req,res,next)=>{
  try {
if(req.session){
      const employee = await Admin.find({super_admin:false}).lean()
      console.log(employee);
    res.render('admin/employee_list',{layout:'admin_layout',admin:req.session.adminid,employee})}
  } catch (error) {
    next(error)
  }
},

blockEmployee: async (req, res) => {
  try {
    const id = req.params.id;
    console.log(id);
    const hi = await Admin.updateOne(
      {
        _id: id,
      },
      { block: true }
    );
    console.log(hi);

    res.redirect("/admin/employee_list");
  } catch (error) {
    console.log(error.message);
  }
},



unblockEmployee: async (req, res) => {
  try {
    const id = req.params.id;
    await Admin.updateOne(
      {
        _id: id,
      },
      { block: false }
    );

    res.redirect("/admin/employee_list");
  } catch (error) {
    console.log(error.message);
  }
},




  // user manegement
  readUser: async function (req, res, next) {
    User.find({})
      .lean()
      .then((users) => {
        // console.log(users);

        res.render("admin/userlist", {
          layout: "admin_layout",
          users,admin:req.session.adminid
        });
      })
      .catch((error) => {
        res.status(400).json({ messageError: error });

        res.render("admin/userlist", {
          data: "No data of this profile",
          errorToDisplay: error,
        });
      });
  },

  blockUser: async (req, res) => {
    try {
      const id = req.params.id;
      console.log(id);
      const hi = await User.updateOne(
        {
          _id: id,
        },
        { block: true }
      );
      console.log(hi);

      res.redirect("/admin/userslist");
    } catch (error) {
      console.log(error.message);
    }
  },

  unblockUser: async (req, res) => {
    try {
      const id = req.params.id;
      await User.updateOne(
        {
          _id: id,
        },
        { block: false }
      );

      res.redirect("/admin/userslist");
    } catch (error) {
      console.log(error.message);
    }
  },

  // category
  addcategory: async function (req, res, next) {
    sessionadmin = req.session;
    if (session.adminid) {
      console.log(session.adminid);
      const data1 = req.body;
      data1.categoryname = data1.categoryname
        .split(" ")
        .join("_")
        .toLowerCase();
      console.log(data1);
      let categorydb = await Category.findOne({
        categoryname: data1.categoryname,
      });
      if (categorydb) {
        if (categorydb.categoryname == data1.categoryname) {
          res.render("admin/add_category", {
            layout: "admin_layout",admin:req.session.adminid,
            categorystatus: "category already exist",
          });
        }
      } else {
        const user = new Category(data1);
        user.save().then((user) => {
          res.status(201);
          res.render("admin/add_category", { layout: "admin_layout" });
        });
      }
    } else {
      res.redirect("/admin/admin_login");
    }
  },
  readcategory: async function (req, res, next) {
    Category.find({})
      .lean()
      .then((category) => {
        console.log(category);

        res.render("admin/category_list", {
          layout: "admin_layout",
          category,
        });
      })
      .catch((error) => {
        res.status(400).json({ messageError: error });

        res.render("admin/category_list", {
          data: "No data of this profile",
          errorToDisplay: error,admin:req.session.adminid
        });
      });
  },

  disablecategory: async (req, res) => {
    try {
      const id = req.query.id;
      await Category.updateOne(
        {
          _id: id,
        },
        { delete: true }
      );
      await Category.find({})
        .lean()
        .then((category) => {
          res.render("admin/category_list", {
            layout: "admin_layout",
            category,admin:req.session.adminid
          });
        });
    } catch (error) {
      console.log(error.message);
    }
  },

  enablecategory: async (req, res) => {
    try {
      const id = req.query.id;
      await Category.updateOne(
        {
          _id: id,
        },
        { delete: false }
      );
      await Category.find({})
        .lean()
        .then((category) => {
          res.render("admin/category_list", {
            layout: "admin_layout",
            category,admin:req.session.adminid
          });
        });
    } catch (error) {
      console.log(error.message);
    }
  },

  editcategory: async (req, res) => {
    sessionadmin = req.session;
    if (session.adminid) {
      try {
        const id = req.query.id;
        const category = await Category.findById({ _id: id }).lean();
        if (category) {
          res.render("admin/edit_category", {
            layout: "admin_layout",
            category,admin:req.session.adminid
          });
        }
      } catch (error) {
        console.log(error.message);
      }
    } else {
      res.redirect("/admin/admin_login");
    }
  },

  updatecategory: async (req, res) => {
    try {
      console.log(req.body.id);
      const data1 = req.body;
      data1.categoryname = data1.categoryname
        .split(" ")
        .join("_")
        .toLowerCase();
      console.log(data1);
      let categorydb = await Category.findOne({
        $and: [
          { _id: { $ne: req.body.id } },
          { categoryname: data1.categoryname },
        ],
      });
      if (categorydb) {
        if (categorydb.categoryname == data1.categoryname) {
          res.render("admin/add_category", {
            layout: "admin_layout",
            categorystatus: "category already exist",admin:req.session.adminid
          });
        }
      } else {
        await Category.updateOne(
          {
            _id: req.body.id,
          },
          {
            $set: {
              categoryname: req.body.categoryname,
              discription: req.body.discription,
              status: req.body.status,
            },
          }
        );
        await Category.find({})
          .lean()
          .then((category) => {
            res.render("admin/category_list", {
              layout: "admin_layout",
              category,admin:req.session.adminid
            });
          });
      }
    } catch (error) {
      console.log(error.message);
    }
  },

  // Product management

  productManager: (req, res, next) => {
    try {
      return new Promise(async (resolve, reject) => {
        await productCollection
          .find().populate('categoryid')
          .lean()
          .then((products) => {
            resolve(products);
            res.render("admin/product_list", {
              layout: "admin_layout",
              products,admin:req.session.adminid
            });
          });
      });

      // } else {
      //     res.redirect('/admin')
      // }
    } catch (error) {
      next(err);
    }
  },

  productAdd: async (req, res, next) => {
    try {
      // if (req.session.adminLoggedIn) {
      let categorys = await Category.find({ delete: false }).lean();
      console.log(categorys);
      res.render("admin/add_products", {
        layout: "admin_layout",
        categorys,admin:req.session.adminid
      });
      // } else {
      //     res.redirect('/admin')
      // }
    } catch (error) {
      next(err);
    }
  },

  productAdder: async(req, res, next) => {
    try {
      console.log(req.body);
      const imageName = [];
      console.log(req.files.filename);
      console.log(req.body);
      for (file of req.files) {
        imageName.push(file.filename);
      }
      const category = await Category.findOne({categoryname:req.body.categoryname}).lean()
     

      const product = new productCollection({
        Name: req.body.Name,
        Brand: req.body.Brand,
        Quantity: req.body.Quantity,
        categoryid:category._id,
        Price: req.body.Price,
        archive: false,
        image: imageName,
        Description: req.body.Description,
      });
      // console.log(product);
      product.save();

      res.redirect("/admin/productlist");
    } catch (error) {
      next(err);
    }
  },

  productEdit: async (req, res, next) => {
    try {
      // if (req.session.adminLoggedIn) {
      
      let categorys = await category.find({ delete: false }).lean();
      let products = await product.findOne({ _id: req.params.id }).populate('categoryid').lean();
       console.log(products);
      res.render("admin/edit_products", {
        layout: "admin_layout",
        products,
        admin:req.session.adminid,categorys
      });
      // } else {
      //     res.redirect('/admin')
      // }
    } catch (error) {
      next(err);
    }
  },

  productEditor: async (req, res, next) => {
    try {
      // console.log(req.body);
      const Name = req.body.Name
      const regname = new RegExp(Name,'i')
      proId = req.params.id;
      const product = await productCollection.findOne({ _id: proId });
      const category = await Category.findOne({categoryname:req.body.Category}).lean()

      product.Name = req.body.Name;
      product.Brand = req.body.Brand;
      product.Quantity = req.body.Quantity;
      product.categoryid = category._id;
      product.Price = req.body.Price;
      product.Description = req.body.Description;
      product.archive = false;
      await product.save();
      res.redirect("/admin/productlist");

      if (req.files.Image) {
        let image = req.files.Image;
        let proid = req.params.id;
        image.mv("./public/productImages/" + product.proid + ".jpg");
      }
    } catch (error) {
      next(err);
    }
  },

  deleteProduct: async (req, res, next) => {
    try {
      console.log("delete operation");
      const productId = req.params.id;
      let products = await productCollection.findById(productId);
      console.log(products);
      products.archive = true;
      products.save();
      res.redirect("/admin/productlist");
    } catch (error) {
      next(err);
    }
  },

  unhideProduct: async (req, res, next) => {
    try {
      console.log("its undo");
      const productId = req.params.id;
      let products = await productCollection.findById(productId);
      products.archive = false;
      products.save();
      res.redirect("/admin/productlist");
    } catch (error) {
      next(error);
    }
  },

  orderlist: async (req, res, next) => {
    try {
      const users = await User.find({ "order.0": { $exists: true } })
        .populate("order.product.product")
        .lean()
        .exec();
      console.log(users);
      res.render("admin/order_list", { layout: "admin_layout" ,users,admin:req.session.adminid});
    } catch (error) {
      next(error);
    }
  },

  orderdetails: async (req, res, next) => {
    try {
      const id = req.params.id
      const orderdata = await User.find({"order.order_id": id},{'order.$': 1})
      .populate("order.product.product")
      .lean()
      .exec();
      res.render("admin/order_details", { layout: "admin_layout" ,orderdata,admin:req.session.adminid});
    } catch (error) {
      next(error);
    }
  },

  stocklist: async (req, res, next) => {
    try {
      const productdata = await productCollection.find({}).populate('categoryid')
        .lean()
      console.log(productdata);
      res.render("admin/stock_list", { layout: "admin_layout" ,productdata,admin:req.session.adminid});
    } catch (error) {
      next(error);
    }
  },

  addcoupon: async (req, res,next) => {
    try {
      console.log(req.body);
      const { code, percentOff, maxDiscount, startDate, expirationDate, status,minimumPurchaseAmount } = req.body;
      // const coupon = await Coupon.create({
      //   code,
      //   percentOff,
      //   maxDiscount,
      //   startDate,
      //   expirationDate,
      //   status,
      //   minimumPurchaseAmount,
      // });
      
      const coupon = new Coupon({ 
        code,
        percentOff,
        maxDiscount,
        startDate,
        expirationDate,
        status,
        minimumPurchaseAmount,
      })
      coupon.save()

      res.redirect('/admin/coupon_list');
    } catch (error) {
      next(error)
      res.status(500).send('Server error');
    }
  },

  editcoupon: async (req, res, next) => {
    try {
      const { id } = req.params;
      const updatedCoupon = req.body;
  
      const coupon = await Coupon.findone({_id:id});
  
      if (!coupon) {
        // return res.status(404).json({ message: 'Coupon not found' });

      }
      res.rednder('admin/edit_coupon',{ layout: "admin_layout" ,coupon,admin:req.session.adminid});
      // res.json(coupon);
    } catch (error) {
      next(error);
    }
  },

  editedcoupon :  async (req, res, next) => {
    try {
      const { id } = req.params;
      const updatedCoupon = req.body;
  
      const coupon = await Coupon.findByIdAndUpdate(id, updatedCoupon, { new: true });
  
      if (!coupon) {
        // return res.status(404).json({ message: 'Coupon not found' });

      }
      res.redirect('/admin/coupon_list');
      // res.json(coupon);
    } catch (error) {
      next(error);
    }
  },





  couponlist: async (req, res,next) => {
    
    try {
      const coupon = await Coupon.find({}).lean()
       console.log(coupon);
      res.render('admin/coupon_list',{layout:"admin_layout",coupon});
    } catch (error) {
      next(error)
      res.status(500).send('Server error');
    }
  },



};
