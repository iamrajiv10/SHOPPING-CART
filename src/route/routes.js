const express=require("express")
const usercontroller=require("../controller/userController")

const router = express.Router();


router.post("/register", usercontroller.createUser)
router.get("/demo/:name",function(req,res){
    res.send(req.params.name)
})


module.exports=router;