
const express = require("express")
const mongoose = require("mongoose")
const multer = require("multer")
const route = require("./route/routes")
// require("dotenv").config()

const app = express()

app.use(express.json())
app.use(multer().any())

mongoose.connect("mongodb+srv://Ashish_Tripathi29:Ashish555@cluster0.bxcrqqa.mongodb.net/group17project5", { usenewUrlParser: true })
    .then(() => console.log("MongoDb is connected"))
    .catch(err => console.log(err))

app.use("/", route)


app.listen(process.env.PORT || 3000, function () {
    console.log('Express app running on port ' + (process.env.PORT || 3000))
});

//     console.log("Express app running on port 3000")
// });