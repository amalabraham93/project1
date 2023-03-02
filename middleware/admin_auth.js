module.exports={

    adminlogin : async (req,res,next)=>{
     try {
        if(req.session.adminid){}
        else{
            res.redirect('/admin')
        }
        next()
     } catch (error) {
        console.log(error.message );
     }
    },
   

    adminlogout : async (req,res,next)=>{
        try {
           if(req.session.adminid){
            res.redirect('/admin/admin_dashboard')
           
           }
           next()
        } catch (error) {
           console.log(error.message );
        }
       },


}