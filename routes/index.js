var express = require('express');
var router = express.Router();
const app = require('../app')
var session;
const userController = require('../controller/user_controller')
const userauth = require('../middleware/user_auth')
const adminRouter = require('./admin');



/* GET home page. */
router.get('/',userController.loaduser);


// router.get('/:id', function(req, res, next) {

//   res.render('users/userhome', { layout:'layout' , user });
// });


router.get('/login',userauth.userlogout, function(req, res, next) {
  res.render('users/login',{layout:'layout'});
});

router.post('/logedin', userController.login)


router.get('/logout',userController.userlogout)

router.get('/forgotpasword',userauth.userlogout, function(req, res, next) {
  res.render('users/forgot_passwordotp',{layout:'layout'});
});

router.post('/password_reset',userauth.userlogout,userController.forgotpasswordemail);

router.post('/password_reset_verify_otp',userauth.userlogout,userController.forgotpasswordotpverify);

router.post("/reset_password",userauth.userlogout,userController.resetpassword);



router.get('/register',userauth.userlogout, function(req, res, next) {
  res.render('users/register',{layout:'layout'});
});

router.post('/register',userController.registerUser );

router.post('/verifyotp',userController.verifyotp)


router.get('/verifyotp',userauth.userlogout,(req,res)=>{
  res.render('users/otpverify',{layout:'layout'})
})
//profile management
router.get('/profile',userauth.userlogin,userController.profileload)
router.get('/edit_profile/:id',userauth.userlogin,userController.editprofile)

router.post('/edited_profile/:id',userauth.userlogin,userController.editedprofile)

//order history
router.get('/orderhistory',userauth.userlogin,userController.orderhistory);
router.get('/order_details/:id',userauth.userlogin,userController.orderdetails);
router.get('/order_cancel/:id',userauth.userlogin,userController.cancelorder);

//address
router.get('/address',userauth.userlogin,userController.addressCollection)

router.get('/add_address',userauth.userlogin,userController. addaddress)
router.post('/add_newaddress',userauth.userlogin,userController. addnewaddress)
router.get('/edit_address/:id',userauth.userlogin,userController.editaddress)
router.post('/edited_address/:id',userauth.userlogin,userController.editedaddress)
router.get('/delete_address/:id',userauth.userlogin,userController.deleteaddress)

//products

 router.get('/product_list',userauth.userlogin, userController.getAllProducts);

 router.get('/category/:id',userauth.userlogin, userController.categoryfiltter);

router.get('/product_details/:id',userauth.userlogin, userController.singleProduct);


//cart management


router.get('/addtocart/:id',userauth.userlogin ,userController.addtocart)

router.get('/incqty/:id',userauth.userlogin,userController.inccartqty)
router.get('/decqty/:id',userauth.userlogin,userController.deccartqty)

router.get('/cart',userauth.userlogin,userController.loadcart)
router.get('/remove_from_cart/:id',userauth.userlogin,userController.removecartitem)

// checkout
router.get('/checkout',userauth.userlogin,userController.checkout)
router.post('/add_addresscheckout',userauth.userlogin,userController.addresscheckout)
// add coupon
router.post('/apply_coupon',userauth.userlogin,userController.applycoupon)


//payment page

//order confirmation
router.post('/proceedtopay',userauth.userlogin,userController.orderplaced)

router.post('/verify-payment',userauth.userlogin,userController.verifypay)


router.get('/order_confirmation',userauth.userlogin,userController.orderconfirmation)


// wishlist management

router.get('/wishlistadd/:id',userauth.userlogin ,userController.addwishlist)

router.get('/wishlist',userauth.userlogin,userController.loadwishlist)

router.get('/remove_from_wishlist/:id',userauth.userlogin,userController.removewishlist)

router.get('/wishtocart/:id',userauth.userlogin,userController.wishtocart)






// /*404 page*/
// router.get('/*', (req,res)=>{
//   res.render('users/404error',{layout:'layout'})
// })




module.exports = router;
