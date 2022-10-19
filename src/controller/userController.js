const userModel = require("../model/userModel")
const bcrypt = require("bcrypt")
const validation = require("../validation/validation")

const jwt = require("jsonwebtoken")
const aws = require("./aws")
const { findByIdAndUpdate } = require("../model/userModel")
const { json } = require("express")


const createUser = async function (req, res) {
    try {
        let data = req.body
        console.log(data)
        if (!validation.isValidRequestBody(data))
            return res.status(400).send({ status: false, msg: "please provide  details" })

        let { fname, lname, email, password, phone,address} = data
      
        if (!validation.isString(fname))
            return res.status(400).send({ status: false, message: "first name is required or not valid" })

        if (!validation.isString(lname))
            return res.status(400).send({ status: false, message: "last name is required or not valid" })


        //============================================EMAIL====================================================
        if (!validation.isValid(email))
            return res.status(400).send({ status: false, message: "email is required or not valid" })

        if (!validation.isValidEmail(email))
            return res.status(400).send({ status: false, message: "email is not valid" })

        let checkEmail = await userModel.findOne({ email: email })

        if (checkEmail) return res.status(409).send({ status: false, msg: "email already exist" })


        //==========================================PASSWORD================================================
        if (!validation.isValid(password))
            return res.status(400).send({ status: false, message: "Pasworrd is required or not valid" })

        if (!validation.isValidPassword(password))
            return res.status(400).send({ status: false, message: "Password length should be 8 to 15 digits and enter atleast one uppercase or lowercase" })
        const saltRounds = 10
        const hash = bcrypt.hashSync(password, saltRounds)
        data.password = hash

        //===========================================PHONE=================================================
        if (!validation.isValid(phone))
            return res.status(400).send({ status: false, message: "phone is required or not valid" })

        if (!validation.isValidNumber(phone))
            return res.status(400).send({ status: false, message: "phone number is not valid" })

        let checkPhone = await userModel.findOne({ phone: phone })

        if (checkPhone) return res.status(409).send({ status: false, msg: "Phone already exist" })

        //===========================================ADDRESS==============================================
        // if (!address) return res.status(400).send({ status: false, msg: "address requried" })
        if(!address) return res.status(400).send({status:false,message:"address is required"})

        address = JSON.parse(data.address)

        if(!address.shipping) return res.status(400).send({status:false,message:"shipping is required"})
        if(!address.billing) return res.status(400).send({status:false,message:"billing is required"})

            data.address=address


            if (!validation.isValid(address.shipping.street))
                return res.status(400).send({ status: false, message: "street field is required or not valid" })
    
            if (!validation.isValid(address.shipping.city))
                return res.status(400).send({ status: false, message: "city field is required or not valid" })
    
            if (!validation.isValid(address.shipping.pincode))
                return res.status(400).send({ status: false, message: "in shipping pincode field is required or not valid" })
    
            if (!validation.isValidPincode(address.shipping.pincode))
                return res.status(400).send({ status: false, message: "PIN code should contain 6 digits only " })
    
            if (!validation.isValid(address.billing.street))
                return res.status(400).send({ status: false, message: "street field is required or not valid" })
    
            if (!validation.isValid(address.billing.city))
                return res.status(400).send({ status: false, message: "city field is required or not valid" })
    
            if (!validation.isValid(address.billing.pincode))
                return res.status(400).send({ status: false, message: "in billing pincode field is required or not valid" })
    
            if (!validation.isValidPincode(address.billing.pincode))
                return res.status(400).send({ status: false, message: "PIN code should contain 6 digits only" })
        


        //=================================================AWS============================================


        let files = req.files
        if (files && files.length > 0) {
            //upload to s3 and get the uploaded link
            // res.send the link back to frontend/postman
            
            uploadedFileURL = await aws.uploadFile(files[0])
            data.profileImage = uploadedFileURL
 
        }
        else {
            return res.status(400).send({ msg: "No file found" })
        }
        
        let createUser = await userModel.create(data)

        return res.status(201).send({ status: true, message: "User created successfully", data: createUser })
    }
    catch (err) {
        console.log("This is the error :", err.message)
        res.status(500).send({ msg: "Error", error: err.message })
    }
}




//======================================== login ================================================

let loginUser = async function (req, res) {
    try {
        let { email, password } = req.body;
        
        if (Object.keys(req.body).length == 0) return res.status(400).send({ status: false, msg: "Request Body Cant Be Empty" });
        if (!email) return res.status(400).send({ status: false, msg: "Please Enter Your Email" });
        if (!password) return res.status(400).send({ status: false, msg: "Please Enter Your Password" });


        let hash = await userModel.findOne({ email: email }).select({ password: 1 });
        if(!hash) return res.status(400).send({status:false,message:"no data with this email or password"})
                const result = await new Promise(function (resolve, reject) {
            bcrypt.compare(password, hash.password, (err, result) => {
                console.log(result)
                return resolve(result)
            })
        });
        console.log(result)
        if (result == false) return res.status(400).send({ status: false, message: "password is wrong" })
      

        let token = jwt.sign({ userId: hash._id.toString() }, "veryverysecuresecretkey", { expiresIn: '1h' });

        return res.status(201).send({ status: true, message: "success", data: { userId: hash._id, token: token } });
    }
    catch (error) {
        res.status(500).send({ status: false, msg: "try block insdie error ", message: error.message });
    }
};



// ====================================================== get api =============================================

let getById = async (req, res) => {
    try {
        const UserIdData = req.params.userId

        if (!validation.isValidObjectId(UserIdData)) return res.status(400).send({ status: false, message: 'userId is not valid' })

        let user = await userModel.findById(UserIdData)

        if (!user) return res.status(400).send({ status: false, messgage: ' user does not exists' })

        return res.status(200).send({ status: true, message: 'User pfofile details', data: user })
    }
    catch (error) {
        return res.status(500).send({ status: false, error: error.message })
    }
}


//============================================ put api =========================================

const updateUser=async function(req,res,){
    try{
    const userId=req.params.userId
    const reqData=req.body
    let { fname, lname, email, password, phone, address } = reqData


    if(fname){
        if(!validation.isValid(fname)) return res.status(400).send({status:false,message:"fname is not valid"})
    }
    if(lname){
        if(!validation.isValid(lname)) return res.status(400).send({status:false,message:"lname is not valid"})
    }
    if(email){
 if(!validation.isValidEmail(email)) return  res.status(400).send({status:false,message:"email is not valid"})
   const dbEmail=await userModel.findOne({email:email})
   if(dbEmail) return res.status(400).send({status:false,message:"email already used"})
    }
    if(password){
        if(!validation.isValidPassword(password)) return res.status(400).send({status:false,message:"password is not valid"})
    }
    if(phone){
        if(!validation.isValidNumber(phone)) return res.status(400).send({status:false,message:"phone number is not valid"})
        const dbphone=await userModel.findOne({phone:phone})
   if(dbphone) return res.status(400).send({status:false,message:"phone number already used"})
    }
    
    // const userdoc=await userModel.findById(userId)
    // reqData.address=userdoc.address



    if(address){
        let addressData=await userModel.findById(userId).select({_id:0,address:1})
        addressData=addressData.toObject()
        address = JSON.parse(address)
        // console.log(addressData)
            if(address.shipping){
             if(address.shipping.street){
                if (!validation.isValid(address.shipping.street)) {
                 return res.status(400).send({ status: false, message: "street field is  not valid" })
                }
                addressData.address.shipping.street=address.shipping.street
             }
             if(address.shipping.city){
                 if (!validation.isValid(address.shipping.city))
                     return res.status(400).send({ status: false, message: "city field is  not valid" })
                addressData.address.shipping.city=address.shipping.city
             }
            
             if(address.shipping.pincode){
                 if (!validation.isValidPincode(address.shipping.pincode))
                     return res.status(400).send({ status: false, message: "PIN code should contain 6 digits only " })
            addressData.address.shipping.pincode=address.shipping.pincode
             }
            }
            
            if(address.billing){

                if(address.billing.street){
                    if (!validation.isValid(address.billing.street))
                        return res.status(400).send({ status: false, message: "street field is  not valid" })
                addressData.address.billing.street=address.billing.street
                }
                if(address.billing.city){
                    if (!validation.isValid(address.billing.city))
                        return res.status(400).send({ status: false, message: "city field is  not valid" })
                        addressData.address.billing.city=address.billing.city
                }
                
                if(address.billing.pincode){
                    if (!validation.isValidPincode(address.billing.pincode))
                        return res.status(400).send({ status: false, message: "PIN code should contain 6 digits only" })
                        addressData.address.billing.pincode=address.billing.pincode
                }
            }
            address=addressData.address
    }
    let files = req.files
    let profileImage
    if (files && files.length > 0) {
        uploadedFileURL = await aws.uploadFile(files[0])
        profileImage = uploadedFileURL
    }
 

    const updateData=await userModel.findByIdAndUpdate(userId,{ fname, lname, email, password, phone,address,profileImage },{new:true})
    res.status(200).send({status:true,message:"user profile update",data:updateData})
}
catch(error){
    return res.status(500).send({status:false,message:error.message})
}
}


module.exports = { createUser, getById, loginUser , updateUser }


