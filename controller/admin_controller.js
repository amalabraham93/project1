const bycrpt = require("bcrypt");
const Admin = require("../model/admin_schema");
const User = require("../model/user_schema");
const Category = require("../model/category_schema");
const productCollection = require("../model/products_schema");
const adminauth = require("../middleware/admin_auth");
const Coupon = require("../model/coupon_schema");
const app = require("../app");
const product = require("../model/products_schema");
const PDFDocument = require("pdfkit");
const { table } = require("pdfkit-table");
const fs = require("fs");
const Excel = require("exceljs");
const moment = require("moment");
const Banner = require("../model/banner_schema");
const category = require("../model/category_schema");
// const pdfMake = require("pdfmake");
let session;

module.exports = {
  loadadminlog: async (req, res) => {
    try {
      res.render("admin/admin_login", { layout: "admin_layout" });
    } catch (error) {
      console.log(error.message);
    }
  },

  loaddashboard: async (req, res, next) => {
    try {
      if (req.session) {
        console.log(req.session.adminid);

        const totalsold = await User.aggregate([
          { $unwind: "$order" }, // flatten the order array
          { $match: { "order.status": "Placed" } }, // filter only completed orders
          { $unwind: "$order.product" }, // flatten the product array
          {
            $group: {
              _id: null,
              totalQuantity: { $sum: "$order.product.quantity" },
            },
          }, // group by null and sum the quantity
        ]).exec();

        const profit = await User.aggregate([
          { $unwind: "$order" }, // flatten the order array
          { $match: { "order.status": "Placed" } }, // filter only completed orders
          {
            $group: { _id: null, totalProfit: { $sum: "$order.bill_amount" } },
          }, // group by null and sum the bill_amount
        ]).exec();
        const totalusers = await User.countDocuments({}).lean();
        console.log(totalusers);

        //chart
        const delivered = await User.aggregate([
          {
            $unwind: "$order",
          },
          {
            $match: {
              "order.status": "Placed",
            },
          },
          {
            $group: {
              _id: "$_id",
              name: {
                $first: "$name",
              },
              placedOrderCount: {
                $sum: 1,
              },
            },
          },
        ]);
        console.log(delivered);

        const revenueByDayOfWeek = await User.aggregate([
          {
            $unwind: "$order",
          },
          {
            $group: {
              _id: { $dayOfWeek: "$order.order_date" },
              totalRevenue: { $sum: "$order.bill_amount" },
            },
          },
          {
            $project: {
              dayOfWeek: "$_id",
              totalRevenue: 1,
              _id: 0,
            },
          },
          {
            $sort: {
              dayOfWeek: 1,
            },
          },
        ]);

        console.log(revenueByDayOfWeek);

        const revenueArray = revenueByDayOfWeek.map(
          (result) => result.totalRevenue
        );
        const dayOfWeekArray = revenueByDayOfWeek.map(
          (result) => result.dayOfWeek
        );

        console.log(revenueArray);

        // const numorder= await User.aggregate([
        //   // Filter orders with a non-null delivery_date
        //   { $match: { 'order.delivery_date': { $exists: true } } },
        //   // Group orders by week and count the number of orders
        //   {
        //     $group: {
        //       _id: { $week: '$order.delivery_date' },
        //       count: { $sum: 1 }
        //     }
        //   },
        //   // Sort by week in ascending order
        //   { $sort: { _id: 1 } }
        // ])
        //  console.log(numorder)

        const admindata = await Admin.find(
          { email: req.session.adminid },
          { super_admin: 1, _id: 0 }
        ).lean();
        console.log(admindata.super_admin);
        res.render("admin/admin_dashboard", {
          layout: "admin_layout",
          admin: req.session.adminid,
          totalsold,
          profit,
          totalusers,
          revenueArray,
          dayOfWeekArray,
        });
      }
    } catch (error) {
      next(error);
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
  addemployee: async (req, res, next) => {
    try {
      if (req.session) {
        res.render("admin/add_employee", {
          layout: "admin_layout",
          admin: req.session.adminid,
        });
      }
    } catch (error) {
      next(error);
    }
  },

  addnewEmployee: async (req, res, next) => {
    try {
      if (req.session) {
        const data = req.body;
        const admindata = new Admin(data);
        admindata.save();
        res.redirect("/admin/employee_list");
      }
    } catch (error) {
      next(error);
    }
  },

  loademployee: async (req, res, next) => {
    try {
      if (req.session) {
        const employee = await Admin.find({ super_admin: false }).lean();
        console.log(employee);
        res.render("admin/employee_list", {
          layout: "admin_layout",
          admin: req.session.adminid,
          employee,
        });
      }
    } catch (error) {
      next(error);
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
        console.log(users);

        res.render("admin/userlist", {
          layout: "admin_layout",
          users,
          admin: req.session.adminid,
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
            layout: "admin_layout",
            admin: req.session.adminid,
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
          errorToDisplay: error,
          admin: req.session.adminid,
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
            category,
            admin: req.session.adminid,
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
            category,
            admin: req.session.adminid,
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
            category,
            admin: req.session.adminid,
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
            categorystatus: "category already exist",
            admin: req.session.adminid,
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
              category,
              admin: req.session.adminid,
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
          .find()
          .populate("categoryid")
          .lean()
          .then((products) => {
            resolve(products);
            res.render("admin/product_list", {
              layout: "admin_layout",
              products,
              admin: req.session.adminid,
            });
          });
      });

      // } else {
      //     res.redirect('/admin')
      // }
    } catch (error) {
      next(error);
    }
  },

  productAdd: async (req, res, next) => {
    try {
      // if (req.session.adminLoggedIn) {
      let categorys = await Category.find({ delete: false }).lean();
      console.log(categorys);
      res.render("admin/add_products", {
        layout: "admin_layout",
        categorys,
        admin: req.session.adminid,
      });
      // } else {
      //     res.redirect('/admin')
      // }
    } catch (error) {
      next(err);
    }
  },

  productAdder: async (req, res, next) => {
    try {
      console.log(req.body);
      const imageName = [];
      console.log(req.files.filename);
      console.log(req.body);
      for (file of req.files) {
        imageName.push(file.filename);
      }
      const category = await Category.findOne({
        categoryname: req.body.categoryname,
      }).lean();

      const product = new productCollection({
        Name: req.body.Name,
        Brand: req.body.Brand,
        Quantity: req.body.Quantity,
        categoryid: category._id,
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
      console.log('hiii');
      let categorys = await category.find({ delete: false }).lean();
      let products = await product
        .findOne({ _id: req.params.id })
        .populate("categoryid")
        .lean();
      console.log(products);
      res.render("admin/edit_products", {
        layout: "admin_layout",
        products,
        admin: req.session.adminid,
        categorys,
      });
      // } else {
      //     res.redirect('/admin')
      // }
    } catch (error) {
      next(error);
    }
  },

  unlinkimage: async (req, res, next) => {
    try {
      // if (req.session.adminLoggedIn) {
      console.log(req.body);
      const proid = req.body.data1;
      const imgid = req.params.id;
      console.log("hkzhzjhcvkzhcvjkhzxkvjhzjhvkzjhvjzhvkjz" + proid, imgid);
      const imgurl = "./public/productImages/" + imgid;
      // let categorys = await category.find({ delete: false }).lean();
      fs.unlink(imgurl);

      let products = await product.updateOne(
        { _id: proid },
        { $pull: { image: imgid } }
      );
      console.log(products);
      res.json({ success: true });
      // } else {
      //     res.redirect('/admin')
      // }
    } catch (error) {
      next(error);
    }
  },

  productEditor: async (req, res, next) => {
    try {
      console.log(req.files.filename);
      // console.log(req.body);
      const imageName = [];
      for (file of req.files) {
        imageName.push(file.filename);
      }
      const Name = req.body.Name;
      const regname = new RegExp(Name, "i");
      proId = req.params.id;
      const product = await productCollection.findOne({ _id: proId });
      const category = await Category.findOne({
        categoryname: req.body.Category,
      }).lean();

      if (req.files) {
        await productCollection.updateOne(
          { _id: proId },
          {
            $set: {
              Name: req.body.Name,
              Brand: req.body.Brand,
              Quantity: req.body.Quantity,
              categoryid: category._id,
              Price: req.body.Price,
              Description: req.body.Description,
              image: imageName,
              archive: false,
            },
          }
        );
      } else {
        await productCollection.updateOne(
          { _id: proId },
          {
            $set: {
              Name: req.body.Name,
              Brand: req.body.Brand,
              Quantity: req.body.Quantity,
              categoryid: category._id,
              Price: req.body.Price,
              Description: req.body.Description,
              archive: false,
            },
          }
        );
      }

      res.redirect("/admin/productlist");
    } catch (error) {
      next(error);
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
      res.render("admin/order_list", {
        layout: "admin_layout",
        users,
        admin: req.session.adminid,
      });
    } catch (error) {
      next(error);
    }
  },

  orderstatus: async (req, res, next) => {
    try {
      const id = req.body.order_id;
      const status = req.body.new_status;
      console.log("dffgdfgdfgdfgdf" + id, status);
      const updatedOrder = await User.updateOne(
        {
          "order.order_id": id,
        },
        { $set: { "order.$.status": status } }
      );
      console.log(updatedOrder);
      res.json({ success: true });
      // res.render("admin/order_list", { layout: "admin_layout" ,users,admin:req.session.adminid});
    } catch (error) {
      next(error);
    }
  },

  orderdetails: async (req, res, next) => {
    try {
      const id = req.params.id;
      const orderdata = await User.find(
        { "order.order_id": id },
        { "order.$": 1 }
      )
        .populate("order.product.product")
        .lean()
        .exec();
      res.render("admin/order_details", {
        layout: "admin_layout",
        orderdata,
        admin: req.session.adminid,
      });
    } catch (error) {
      next(error);
    }
  },

  stocklist: async (req, res, next) => {
    try {
      const productdata = await productCollection
        .find({})
        .populate("categoryid")
        .lean();
      console.log(productdata);
      res.render("admin/stock_list", {
        layout: "admin_layout",
        productdata,
        admin: req.session.adminid,
      });
    } catch (error) {
      next(error);
    }
  },

  addcoupon: async (req, res, next) => {
    try {
      console.log(req.body);
      const {
        code,
        percentOff,
        maxDiscount,
        startDate,
        expirationDate,
        status,
        minimumPurchaseAmount,
      } = req.body;
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
      });
      coupon.save();

      res.redirect("/admin/coupon_list");
    } catch (error) {
      next(error);
      res.status(500).send("Server error");
    }
  },

  editcoupon: async (req, res, next) => {
    try {
      const id = req.params.id;
      // const updatedCoupon = req.body;

      const coupon = await Coupon.findOne({ _id: id }).lean();
      console.log(coupon);

      if (!coupon) {
        return res.status(404).json({ message: "Coupon not found" });
      } else {
        res.render("admin/edit_coupons", {
          layout: "admin_layout",
          coupon,
          admin: req.session.adminid,
        });
      }
      // res.json(coupon);
    } catch (error) {
      next(error);
    }
  },

  editedcoupon: async (req, res, next) => {
    try {
      const { id } = req.params;
      const updatedCoupon = req.body;
      console.log(updatedCoupon);
      const coupon = await Coupon.updateOne(
        { _id: id },
        { $set: updatedCoupon }
      );

      if (!coupon) {
        // return res.status(404).json({ message: 'Coupon not found' });
      }
      res.redirect("/admin/coupon_list");
      // res.json(coupon);
    } catch (error) {
      next(error);
    }
  },

  activecoupon: async (req, res, next) => {
    try {
      const { id } = req.params;

      const coupon = await Coupon.updateOne(
        { _id: id },
        { $set: { status: "active" } }
      );
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  },
  inactivecoupon: async (req, res, next) => {
    try {
      const { id } = req.params;

      const coupon = await Coupon.updateOne(
        { _id: id },
        { $set: { status: "inactive" } }
      );

      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  },

  couponlist: async (req, res, next) => {
    try {
      const coupon = await Coupon.find({}).lean();
      console.log(coupon);
      res.render("admin/coupon_list", { layout: "admin_layout", coupon });
    } catch (error) {
      next(error);
      res.status(500).send("Server error");
    }
  },

  salesreport: async (req, res, next) => {
    try {
      res.render("admin/sales_report", {
        layout: "admin_layout",
        admin: req.session.adminid,
      });
    } catch (error) {
      next(error);
    }
  },

  salesreportgen: async (req, res, next) => {
    try {
      console.log(req.body);
      const startDate = new Date(req.body["start-date"]);
      const endDate = new Date(req.body["end-date"]);
      console.log(startDate, endDate);

      const orders = await User.aggregate([
        // match orders within order date range
        {
          $match: {
            "order.order_date": {
              $gte: startDate,
              $lte: endDate,
            },
          },
        },
        // unwind orders array to get individual orders
        {
          $unwind: "$order",
        },
        // match individual order within order date range again (in case there are multiple orders for the same user)
        {
          $match: {
            "order.order_date": {
              $gte: startDate,
              $lte: endDate,
            },
          },
        },
        // join with user collection to get user name for each order
        {
          $lookup: {
            from: "users",
            localField: "_id",
            foreignField: "_id",
            as: "user",
          },
        },
        // unwind user array to get individual user
        {
          $unwind: "$user",
        },
        // project only the fields needed for the output
        {
          $project: {
            _id: "$order.order_id",
            order_date: "$order.order_date",
            user_name: "$user.name",
            total: "$order.total",
            delivery_address: "$order.delivery_address",
            bill_amount: "$order.bill_amount",
            status: "$order.status",
            payment_method: "$order.payment_method",
            payment_id: "$order.payment_id",
            coupon: "$order.coupon",
            coupon_discount: "$order.coupon_discount",
          },
        },
      ]);
      console.log(orders);
      res.render("admin/sales_report", {
        layout: "admin_layout",
        orders,
        startDate,
        endDate,
        admin: req.session.adminid,
      });
    } catch (error) {
      next(error);
    }
  },

  pdfdownlod: async (req, res, next) => {
    try {
      const startDate = new Date(req.query.startDate);
      const endDate = new Date(req.query.endDate);
      const startDate1 = startDate.toLocaleDateString();
      const endDate1 = endDate.toLocaleDateString();

      const orders = await User.aggregate([
        // match orders within order date range
        {
          $match: {
            "order.order_date": {
              $gte: startDate,
              $lte: endDate,
            },
          },
        },
        // unwind orders array to get individual orders
        {
          $unwind: "$order",
        },
        // match individual order within order date range again (in case there are multiple orders for the same user)
        {
          $match: {
            "order.order_date": {
              $gte: startDate,
              $lte: endDate,
            },
          },
        },
        // join with user collection to get user name for each order
        {
          $lookup: {
            from: "users",
            localField: "_id",
            foreignField: "_id",
            as: "user",
          },
        },
        // unwind user array to get individual user
        {
          $unwind: "$user",
        },
        // project only the fields needed for the output
        {
          $project: {
            _id: "$order.order_id",
            order_date: "$order.order_date",
            user_name: "$user.name",
            total: "$order.total",
            delivery_address: "$order.delivery_address",
            bill_amount: "$order.bill_amount",
            status: "$order.status",
            payment_method: "$order.payment_method",
            payment_id: "$order.payment_id",
            coupon: "$order.coupon",
            coupon_discount: "$order.coupon_discount",
          },
        },
      ]);
      console.log(orders);

      // Create a new PDF document
      const doc = new PDFDocument();

      // Set the PDF document headers and filename
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="sales-report.pdf"`
      );

      // Pipe the PDF document to the response stream
      doc.pipe(res);

      // Add the sales report data to the PDF document
      doc
        .fontSize(18)
        .text(`Sales Report: ${startDate1} - ${endDate1}`, { align: "center" });
      doc.moveDown();
      doc.fontSize(12);
      for (const order of orders) {
        doc.text(`Order ID: ${order._id}`);
        doc.text(`Date: ${new Date(order.order_date).toLocaleDateString()}`);
        doc.text(`Customer Name: ${order.user_name}`);
        doc.text(`Bill Amount: ${order.bill_amount}`);
        doc.text(`Status: ${order.status}`);
        doc.moveDown();
      }

      // End the PDF document stream
      doc.end();
    } catch (err) {
      console.log(err);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  exceldonload: async (req, res, next) => {
    try {
      const startDate = new Date(req.query.startDate);
      const endDate = new Date(req.query.endDate);

      const orders = await User.aggregate([
        // match orders within order date range
        {
          $match: {
            "order.order_date": {
              $gte: startDate,
              $lte: endDate,
            },
          },
        },
        // unwind orders array to get individual orders
        {
          $unwind: "$order",
        },
        // match individual order within order date range again (in case there are multiple orders for the same user)
        {
          $match: {
            "order.order_date": {
              $gte: startDate,
              $lte: endDate,
            },
          },
        },
        // join with user collection to get user name for each order
        {
          $lookup: {
            from: "users",
            localField: "_id",
            foreignField: "_id",
            as: "user",
          },
        },
        // unwind user array to get individual user
        {
          $unwind: "$user",
        },
        // project only the fields needed for the output
        {
          $project: {
            _id: "$order.order_id",
            order_date: "$order.order_date",
            user_name: "$user.name",
            total: "$order.total",
            delivery_address: "$order.delivery_address",
            bill_amount: "$order.bill_amount",
            status: "$order.status",
            payment_method: "$order.payment_method",
            payment_id: "$order.payment_id",
            coupon: "$order.coupon",
            coupon_discount: "$order.coupon_discount",
          },
        },
      ]);
      // Create a new Excel workbook
      const workbook = new Excel.Workbook();

      // Add a new worksheet to the workbook
      const worksheet = workbook.addWorksheet("Sales Report");

      // Add headers to the worksheet
      worksheet.addRow([
        "Order ID",
        "Date",
        "Customer Name",
        "Bill Amount",
        "Price",
      ]);

      // Add data to the worksheet
      for (const order of orders) {
        worksheet.addRow([
          order._id,
          new Date(order.order_date).toLocaleDateString(),
          order.user_name,
          order.bill_amount,
          order.status,
        ]);
      }

      // Set the response headers and filename
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="sales-report.xlsx"`
      );

      // Write the workbook to the response stream
      await workbook.xlsx.write(res);

      // End the response stream
      res.end();
    } catch (error) {
      next(error);
    }
  },

  // chartsales: async (req, res, next) => {
  //     try {

  // const revenueByDayOfWeek = await User.aggregate([
  //   {
  //     $unwind: "$order"
  //   },
  //   {
  //     $group: {
  //       _id: { $dayOfWeek: "$order.order_date" },
  //       totalRevenue: { $sum: "$order.bill_amount" }
  //     }
  //   },
  //   {
  //     $project: {
  //       dayOfWeek: "$_id",
  //       totalRevenue: 1,
  //       _id: 0
  //     }
  //   },
  //   {
  //     $sort: {
  //       dayOfWeek: 1
  //     }
  //   }
  // ]);

  // console.log(revenueByDayOfWeek);

  //     // conle.log(order)

  //        const salesData = [100, 200, 150, 300, 250, 800];

  //         res.json(salesData);

  //     } catch (error) {
  //       next(error);
  //     }
  //   },

  listbanner: async (req, res, next) => {
    try {
      const banner = await Banner.find({}).lean();
      console.log(banner)
      res.render("admin/list_banner", {
        layout: "admin_layout",
        banner,
        admin: req.session.adminid,
      });
    } catch (error) {
      next(error);
    }
  },

  bannercategory: async (req, res, next) => {
    try {
      const category1 = await Category.find({}).lean();

      res.json(category1);
    } catch (error) {
      next(error);
    }
  },

  bannerproduct: async (req, res, next) => {
    try {
      const product = await productCollection.find({}).lean();

      res.json(product);
    } catch (error) {
      next(error);
    }
  },

  addbanner: async (req, res, next) => {
    try {
      res.render("admin/add_banner", {
        layout: "admin_layout",
        admin: req.session.adminid,
      });
    } catch (error) {
      next(error);
    }
  },

  addedbanner: async (req, res) => {
    try {
      console.log(req.body)
     const data = req.body;
      const image1 = req.file.filename;
      const banner1 = new Banner({
        image: image1,
        link: data.link,
        target: data.target,
        discription: data.discription,
      });
      banner1.save();
      res.redirect("/admin/add-banner");
    } catch (err) {
      console.error(err);
      res.render("error", { message: "Something went wrong" });
    }
  },

  editbanner: async (req, res) => {
    const id = req.params.id;
    console.log(id)
    try {
      const banner = await Banner.findOne({ _id: id }).lean();
      console.log(banner)
      res.render("admin/edit_banners", {
        layout: "admin_layout",
        banner,
        admin: req.session.adminid,
      });
    } catch (err) {
      console.error(err);
      res.render("error", { message: "Something went wrong" });
    }
  },

  editedbanner: async (req, res) => {
    try {
      const banner = await Banner.findByIdAndUpdate(
        req.params.id,
        {
          image: req.body.image,
          link: req.body.link,
          target: req.body.target,
          description: req.body.description,
        },
        { new: true }
      );
      res.redirect("/banners");
    } catch (err) {
      console.error(err);
      res.status(500).send("Internal server error");
    }
  },
};
