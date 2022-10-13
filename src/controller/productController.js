const productModel=require("../model/productModel")
const validation=require("../validation/validation")
const aws=require("./aws")

// ============================== register product ======================================

const createProduct = async function(req, res){ 
    try {
        const requestBody = req.body;
      
        if (!validation.isValidRequestBody(requestBody)) {
            return res.status(400).send({ status: false, message: 'Invalid params received in request body' })
        }
        if (requestBody.isDeleted && requestBody.isDeleted != "false") {
            return res.status(400).send({ status: false, message: "Product cannot be deleted while updation" })
        }
        const { title, description, price, currencyId,currencyFormat,isFreeShipping, style, availableSizes,installments } = requestBody;

       if (!title || title == "") {
            return res.status(400).send({ status: false, message: "Title  cannot be empty" })
        } else if (title) {
            if (!validation.isValid(title))
                return res.status(400).send({ status: false, message: "Title is invalid" })
            const isTitleAlreadyUsed = await productModel.findOne({ title });

            if (isTitleAlreadyUsed) {
                return res.status(400).send({ status: false, message: 'Title is already used.' })
            }
        }
        //========================================== validations for description ================================================  

        if (!description || description == "") {
            return res.status(400).send({ status: false, message: "Description  cannot be empty" })
        } else if (description) {
            if (!validation.isValid(description))
                return res.status(400).send({ status: false, message: "description is not in valid format" })
        }


        //========================================== validations for Price ================================================ 
        if (!validation.isValid(price)) {
            return res.status(400).send({ status: false, message: 'Price is required' })
        }
         if(!validation.isValidPrice(price)) return res.status(400).send({status:false,message:"price must be in number form"})
        if (price <= 0) {
            return res.status(400).send({ status: false, message: `Price cannot be Zero` })
        }
        //========================================== validations for currencyId ================================================ 
        if (!validation.isValid(currencyId)) {
            return res.status(400).send({ status: false, message: 'CurrencyId is required' })
        }

        if (currencyId != "INR") {
            return res.status(400).send({ status: false, message: 'currencyId should be INR' })
        }
        if(currencyFormat != "₹"){
            return res.status(400).send({status:false , message: "currencyformat should be ₹"})
        }
       
     //========================================== validations for file upload ================================================ 
        let files = req.files
        if (files && files.length > 0)  uploadedFileURL = await aws.uploadFile(files[0]) 
        else  return res.status(400).send({status:false,message:"productimage is required in file format"})



        //==========================================  structuring the data ================================================ 

        const newProductData = {

            title,
            description,
            price,
            currencyId,
            currencyFormat,
            availableSizes,
            isFreeShipping,
            style,
            installments,
            productImage: uploadedFileURL
        }

        //================================================= validations for availableSizes=====================================
        if (!validation.isValid(availableSizes)) {
            return res.status(400).send({ status: false, message: 'available Sizes is required' })
        }

        if (availableSizes) {
            let array = availableSizes.split(",").map(x => x.trim())

            for (let i = 0; i < array.length; i++) {
                if (!(["S", "XS", "M", "X", "L", "XXL", "XL"].includes(array[i]))) {
                    return res.status(400).send({ status: false, message: `Available Sizes must be among ${["S", "XS", "M", "X", "L", "XXL", "XL"]}` })
                }

            }

            if (Array.isArray(array)) {
                newProductData['availableSizes'] = array
            }
        }

        //======================================================= creating new product data ==============================

        const saveProductDetails = await productModel.create(newProductData)
        res.status(201).send({ status: true, message: "Product Successfully Created", data: saveProductDetails })

    } catch (error) {
        console.log(error)
        res.status(500).send({ status: false, error: error.message });
    }
}

module.exports={createProduct}