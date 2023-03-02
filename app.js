var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var flash = require("connect-flash");
const toastr = require("express-toastr");
const fs = require("fs");


var logger = require("morgan");
const dotenv = require("dotenv").config();
const sessions = require("express-session");
var exphbs = require("express-handlebars");
const nocache = require("nocache");
require("./config/connection");
var indexRouter = require("./routes/index");
var adminRouter = require("./routes/admin");
var Handlebars = require("handlebars");
const Swal = require("sweetalert2");
const router = require("./routes/index");
var app = express();
const Razorpay = require('razorpay')

// const jquery = require('jquery');
// global.jQuery = jquery;
// const $ = jquery;





//handlebars inc
Handlebars.registerHelper("inc", function (value, options) {
  return parseInt(value) + 1;
});

Handlebars.registerHelper("total", function (qty, price) {
  return qty*price;
});


Handlebars.registerHelper('calculateTotal', function(cart) {
  let total = 0;
  cart.forEach(function(item) {
    total += item.quantity * item.productid.Price;
  });
  return total;
});


Handlebars.registerHelper('cartTotal', function(cart,ship) {
  let total = 0;
  let carttotal = 0;
  cart.forEach(function(item) {
    total += item.quantity * item.productid.Price;
  });
  carttotal = total + ship
  return carttotal.toFixed(2);
});

Handlebars.registerHelper('formatDate', function(date) {
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
});



// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "hbs");
app.engine(
  "hbs",
  exphbs.engine({
    extname: "hbs",
    defaultView: "layout",
    layoutsDir: __dirname + "/views/layouts/",
    partialsDir: __dirname + "/views/partials/",
  })
);

app.use(nocache());

//sesions
app.use(
  sessions({
    secret: "asdfadfad",
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 1000000 },
  })
);

var instance = new Razorpay({
  key_id: 'rzp_test_g5RMF7tYWVvJgS',
  key_secret: 'rygNBsuv7VhbANu61bV29OHa',
});


app.use(flash());
// app.use(toastr());

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use("/", indexRouter);
app.use("/admin", adminRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("users/404error", { layout: "layout" });
});

module.exports = app;
