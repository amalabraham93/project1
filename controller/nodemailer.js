

const nodemailer = require('nodemailer');
// const transporter = nodemailer.createTransport( MAIL_SETTINGS);
const Otpverification = require('../model/otpverification_schema')
const otpGenerator = require('otp-generator')
const bycrpt = require('bcrypt')

// const OTP = otpGenerator.generate(6, { upperCaseAlphabets: false, specialChars: false });
// let transporter = nodemailer.createTransport({
//   host: " smtp.mail.yahoo.com",
//     auth: {
//         // Server : "smtp.mail.yahoo.com",
//         // Port : 465 ,
//         smtp: { host: "smtp.mail.yahoo.com", port: 465, secure: true },

//          user: process.env.MAIL_EMAIL,
//          pass: process.env.MAIL_PASSWORD,
// }
// });

// var transporter = nodemailer.createTransport({
//     host: "sandbox.smtp.mailtrap.io",
//     port: 2525,
//     auth: {
//       user: "dd8f175f464fca",
//       pass: "77364be1ea5b7d"
//     }
//   });


var transporter = nodemailer.createTransport({
        host: "smtp-relay.sendinblue.com",
        port: 587,
        auth: {
          user: "amalabraham93@gmail.com",
          pass: "QJbVx4hH7dRK3FX6"
        }
      });




module.exports={
    sentotpverificationemail:async ({_id,email},res)=>{
        try {
          const otp = otpGenerator.generate(6, { upperCaseAlphabets: false, specialChars: false });
             console.log("sent mail reached");
             
          const mailoption = {
            from: process.env.MAIL_EMAIL,
            to: email, 
            subject: 'Hello ✔',
            html: `
            <div
              class="container"
              style="max-width: 90%; margin: auto; padding-top: 20px"
            >
              <h2>Hi.</h2>
              <h4>You are officially In ✔</h4>
              <p style="margin-bottom: 30px;">Pleas enter the sign up OTP to get started</p>
              <h1 style="font-size: 40px; letter-spacing: 2px; text-align:center;">${otp}</h1>
         </div>`
         ,
        };
        console.log(otp);
        const hachedotp= await bycrpt.hash(otp,10);

        const newotpverification=await new Otpverification({
          userId:_id,
          otp: hachedotp,
          createdAt: Date.now(),
          expiresAt:Date.now() + 360000,
          
        })
             
          await newotpverification.save();
          await transporter.sendMail(mailoption);
        //   res.json({
        //     status: "pending",
        //     message: "verification otp has been sent to email",
        //     data:{
        //       userId: _id,
        //       email,
        //     }
        //   })
          data= {userId:_id,email}
         res.render('users/otpverify',{layout:'layout',data})

        } catch (error) {
            console.log(error.message);
        }
      },

      sendforgotpasswordotpmail:async ({_id,email},res)=>{
        try {
          const otp = otpGenerator.generate(6, { upperCaseAlphabets: false, specialChars: false });
             console.log("sent mail reached");
             
          const mailoption = {
            from: process.env.MAIL_EMAIL,
            to: email, 
            subject: 'Hello ✔',
            html: `
            <div
              class="container"
              style="max-width: 90%; margin: auto; padding-top: 20px"
            >
              <h2>Welcome to the club.</h2>
              <h4>Forgot your passworrd </h4>
              <p style="margin-bottom: 30px;">Pleas Enter this  OTP to reset the password</p>
              <h1 style="font-size: 40px; letter-spacing: 2px; text-align:center;">${otp}</h1>
         </div>`
         ,
        };
        console.log(otp);
        const hachedotp= await bycrpt.hash(otp,10);

        const newotpverification=await new Otpverification({
          userId:_id,
          otp: hachedotp,
          createdAt: Date.now(),
          expiresAt:Date.now() + 60000,
          
        })
             
          await newotpverification.save();
          await transporter.sendMail(mailoption);
          // res.json({
          //   status: "pending",
          //   message: "verification otp has been sent to email",
          //   data:{
          //     userId: _id,
          //     email,
          //   }
          // })
          data= {userId:_id,email}
       
          res.render('users/forgot_passwordotp',{layout:'layout',successMessage:'The OTP has been succesfuly sent to your email',data});
        } catch (error) {
            console.log(error.message);
        }
      }


   













// sendMail = async ({_id,email}) => {
//   try {
//     let info = await transporter.sendMail({
//       from: MAIL_SETTINGS.auth.user,
//       to: email, 
//       subject: 'Hello ✔',
//       html: `
//       <div
//         class="container"
//         style="max-width: 90%; margin: auto; padding-top: 20px"
//       >
//         <h2>Welcome to the club.</h2>
//         <h4>You are officially In ✔</h4>
//         <p style="margin-bottom: 30px;">Pleas enter the sign up OTP to get started</p>
//         <h1 style="font-size: 40px; letter-spacing: 2px; text-align:center;">${params.otp}</h1>
//    </div>
//     `,
//     });
//     return info;
//   } catch (error) {
//     console.log(error);
//     return false;
//   }
};