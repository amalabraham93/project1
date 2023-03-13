const mongoose = require('mongoose')
require('dotenv').config()


mongoose.connect(process.env.MONGOOSE_CONNECT,
  {
    useNewUrlParser: true,
    useUnifiedTopology: true
  }
).then(()=>{
    console.log('connection sucsessful')
}).catch((error)=>{
    console.log('somthing wrong',error)
})