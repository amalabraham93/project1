const mongoose = require('mongoose')

mongoose.connect('mongodb://127.0.0.1:27017/ecart',
  {
    useNewUrlParser: true,
    useUnifiedTopology: true
  }
).then(()=>{
    console.log('connection sucsessful')
}).catch((error)=>{
    console.log('somthing wrong',error)
})