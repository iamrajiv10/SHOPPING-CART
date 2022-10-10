const express=require("express")

const router = express.Router();

router.get("/demo/:name",function(req,res){
    res.send(req.params.name)
})


module.exports=router;