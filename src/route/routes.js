const express=require("express")
const usercontroller=require("../controller/userController")

const router = express.Router();


router.post("/register", usercontroller.createUser)
router.post("/login",usercontroller.loginUser)
router.get("/user/:userId/profile",usercontroller.getById)


router.all("/**", function (req, res) {         
    res.status(400).send({
        status: false,
        msg: "The api you request is not available"
    })
})




module.exports=router;