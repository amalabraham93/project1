module.exports={

    userlogin : async (req,res,next)=>{
     try {
        if(req.session.userid ){
          user = req.session.userid
        
        }else{
         user = false
            // res.redirect('/')
        }
        next()
     } catch (error) {
        console.log(error.message );
     }
    },
   

    userlogout : async (req,res,next)=>{
        try {
           if(req.session.userid ){

            
            res.redirect('/')

           
           }
           next()
        } catch (error) {
           console.log(error.message );
        }
       },


}