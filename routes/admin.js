var express = require("express");
const upload = require("../multer");
var admin_router = express.Router();
const app = require("../app");
const adminController = require("../controller/admin_controller");
const adminauth = require("../middleware/admin_auth");
const admin_auth = require("../middleware/admin_auth");

var session;

/* GET users listing. */
admin_router.get("/", admin_auth.adminlogout, adminController.loadadminlog);

admin_router.post("/admin_login", adminController.adminlogin);

// router.get ('/admin_login',adminauth.adminlogout,(req,res)=>{
//   res.render('admin/admin_login',{layout:'admin_layout'})
// })

admin_router.get("/admin_dashboard", adminController.loaddashboard);

admin_router.get("/adminlogout", (req, res) => {
  req.session.destroy();
  res.redirect("/admin");
});
//User Management
admin_router.get("/userslist", adminauth.adminlogin, adminController.readUser);

admin_router.get("/blockuser/:id", adminController.blockUser);

admin_router.get("/unblockuser/:id", adminController.unblockUser);

//Employee Managemeny
admin_router.get(
  "/employee_list",
  adminauth.adminlogin,
  adminController.loademployee
);

admin_router.get(
  "/add_employee",
  adminauth.adminlogin,
  adminController.addemployee
);

admin_router.post(
  "/addnew_employee",
  adminauth.adminlogin,
  adminController.addnewEmployee
);

admin_router.get("/blockemployee/:id", adminController.blockEmployee);

admin_router.get("/unblockemployee/:id", adminController.unblockEmployee);

//Category Management

admin_router.get("/addcategory", adminauth.adminlogin, (req, res) => {
  res.render("admin/add_category", { layout: "admin_layout" });
});

admin_router.post("/addnewcategory", adminController.addcategory);

admin_router.get(
  "/category",
  adminauth.adminlogin,
  adminController.readcategory
);

admin_router.get("/disablecategory", adminController.disablecategory);

admin_router.get("/enablecategory", adminController.enablecategory);

admin_router.get(
  "/editcategory",
  adminauth.adminlogin,
  adminController.editcategory
);

admin_router.post("/updatecategory", adminController.updatecategory);

//product management

admin_router.get(
  "/productlist",
  adminauth.adminlogin,
  adminController.productManager
);

admin_router.get(
  "/add_product",
  adminauth.adminlogin,
  adminController.productAdd
);

admin_router.post(
  "/add_product",
  upload.array("productImage", 3),
  adminController.productAdder
);

admin_router.get(
  "/edit_products/:id",
  adminauth.adminlogin,
  adminController.productEdit
);

admin_router.post(
  "/edited_product/:id",
  upload.array("productImage", 3),
  adminController.productEditor
);

admin_router.post("/delete-product/:id", adminController.deleteProduct);
// undo delete
admin_router.post("/undoDelete-product/:id", adminController.unhideProduct);

//coupon management

admin_router.get("/coupon_list",admin_auth.adminlogin, adminController.couponlist);

admin_router.get("/add_coupons",admin_auth.adminlogin ,(req, res) => {
  res.render("admin/add_coupons", { layout: "admin_layout" });
});

admin_router.post('/add_newcoupon',admin_auth.adminlogin,adminController.addcoupon)

admin_router.get("/edit_coupons/:id",admin_auth.adminlogin, adminController.editcoupon);

admin_router.get("/edited_coupon/:id",admin_auth.adminlogin, adminController.editedcoupon)
//order management

admin_router.get(
  "/order_list",
  adminauth.adminlogin,
  adminController.orderlist
);
admin_router.get("/order_details/:id", adminController.orderdetails);

//stock management

admin_router.get(
  "/stock_list",
  adminauth.adminlogin,
  adminController.stocklist
);

// /*404 page*/
// admin_router.get('/admin/*', (req,res)=>{
//   res.render('users/404error',{layout:'layout'})
// })

// router.use(function (req, res, next) {
//   next(createError(404));
// });

// router.use(function (err, req, res, next) {
//   res.status(err.status || 500);
//   res.render('users/404error',{layout:'layout'});
// });

module.exports = admin_router;
