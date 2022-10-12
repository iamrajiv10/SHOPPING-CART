const express=require("express")
const usercontroller=require("../controller/userController")
const auth=require("../middle/auth")

const router = express.Router();


router.post("/register", usercontroller.createUser)
router.post("/login",usercontroller.loginUser)
router.get("/user/:userId/profile",auth.authentication, usercontroller.getById)
// router.put("/user/:userId/profile",usercontroller.updateUser)
router.put("/user/:userId/profile",auth.authentication,auth.Authorization,usercontroller.updateUser)


router.all("/**", function (req, res) {         
    res.status(400).send({
        status: false,
        msg: "The api you request is not available"
    })
})




module.exports=router;