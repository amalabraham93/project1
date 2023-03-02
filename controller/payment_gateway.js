const Razorpay = require('razorpay')


var instance = new Razorpay({
    key_id: 'rzp_test_g5RMF7tYWVvJgS',
    key_secret: 'rygNBsuv7VhbANu61bV29OHa',
  });

  
  
  module.exports={
   createrazorder: (orderid,total)=>{
     return new Promise ((resolve,reject)=>{

       var options = {
         amount: total*100,  // amount in the smallest currency unit
         currency: "INR",
         receipt: orderid
       };
       instance.orders.create(options, function(err, order) {
         console.log(order);
         resolve(order)
       });




       })
   }
  };