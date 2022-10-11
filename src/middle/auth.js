const jwt=require("jsonwebtoken")
const authenticcation=function(req,res){
    try{
        
        const data=req.header('Authorization')
        if(!data) return res.status(400).send({status:false,messesge:"token must be in header"})
        const token=data.split(" ")[1]
        jwt.verify(token, "veryverysecuresecretkey",
        (error, response) => {
            if (error) {
                return res.status(400).send({ status: false, msg: error });
            }
            res.send(response)
            
        })
        
    }
    catch(error){
        return res.status(500).send({
            status:false, messesge:error.message
        })
    }
 }
module.exports=authenticcation