const jwt=require("jsonwebtoken")
// const userModel=require('../model/usermodel')



//================================= authentication
const authentication=function(req,res,next){
    try{
       
        const data=req.header('Authorization')
        if(!data) return res.status(400).send({status:false,messesge:"token must be in header"})
        const token=data.split(" ")[1]
        jwt.verify(token, "veryverysecuresecretkey",
        (error, response) => {
            if (error) {
                return res.status(400).send({ status: false, msg: error });
            }
            req.userId=response.userId
           next()
            
        })
        
    }
    catch(error){
        return res.status(500).send({
            status:false, messesge:error.message
        })
    }
 }


 //=========================================== Authorization ==========================================
const Authorization=async function(req,res,next){
    try{
        if(req.userId!=req.params.userId) return res.status(400).send({status:false,message:"you are not Authorization to do this task"})
        next()
    }
    catch(error){
              res.status(500).send({status:false,messesge:error.message})
    }
}


module.exports.authentication=authentication
module.exports.Authorization=Authorization