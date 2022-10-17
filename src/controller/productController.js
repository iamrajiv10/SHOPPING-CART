const { get } = require("mongoose");
const productModel=require("../model/productModel");
const { db } = require("../model/userModel");
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
            return res.status(400).send({ status: false, message: "Product cannot be deleted while registor" })
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

         if(installments) {
            if(!validation.isValidDigit(installments)) return res.status(400).send({status:false,message:"installment must be in number"})
         }

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
        
        if (availableSizes) {
            if (!validation.isValid(availableSizes)) {
                return res.status(400).send({ status: false, message: 'available Sizes is required' })
            }
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



//====================================== getAllProduct ========================================
const getproduct = async function(req, res) {
    try {
        let filterQuery = req.query;
        let { size, name, priceGreaterThan, priceLessThan, priceSort } = filterQuery;
        

        let query = {}
        query['isDeleted'] = false;

        if (priceGreaterThan) {
            query['price'] = { $gt: priceGreaterThan }
        }
        if (priceLessThan) {
            query['price'] = { $lt: priceLessThan }
        }
        if (priceGreaterThan && priceLessThan) {
            query['price'] = { '$gt': priceGreaterThan, '$lt': priceLessThan }
        }
       
       // sorting data base on price
        if (priceSort) {
            if (priceSort == -1 || priceSort==1) {
                query['priceSort'] = priceSort
            } else {
                return res.status(400).send({ status: false, message: "only enter 1 for accending -1 for desendign" })
            }
        }

        let getAllProducts = await productModel.find(query).sort({ price: query.priceSort })
        if (!Object.keys(getAllProducts).length>0) return res.status(404).send({ status: false, msg: "No products found" })


        let outData=[]
        if (size) {
                // let arr= size.split(",").map(x => x.trim())
                getAllProducts.forEach(e1=>{
                   let sizeArr=e1.availableSizes
                    for(let i=0;i<sizeArr.length;i++){
                        if(size==sizeArr[i])
                        outData.push(e1)
                    }
                })
            }

       
        if(!size) outData=[...getAllProducts]
// filter by name
     const dataAfterName=[]
        if(name){
         outData.forEach((dataForTitle)=>{
            let title=dataForTitle.title
            if(title.includes(name)) dataAfterName.push(dataForTitle)
         })
        }

if(name) {
    if(dataAfterName.length==0) return res.status(400).send({status:false,message:"data not found"})
    outData=dataAfterName
}

        
        // success get data and return product
        return res.status(200).send({ status: true, message:"success", data:outData });

    } catch (err) {
        console.log(err)
        return res.status(500).send({ status: false, msg: err.message })

    }
}



//================================ GET /products/:productId ==========================================

const getProductList = async (req, res) => {
    try {
        let productId = req.params.productId

        if (!validation.isValidObjectId(productId)) { 
            return res.status(400).send({ status: false, message: "productId  is not valid" }) 
        }

        let checkbody = await productModel.findOne({ _id: productId });

        if (!checkbody) return res.status(404).send({ status: false, msg: "There is no product exist with this id" });

        if (checkbody.isDeleted == true) return res.status(404).send({ status: false, msg: "Product is already deleted" });

        return res.status(200).send({ status: true, message: 'Product profile details', body: checkbody });
    }
    catch (err) {
        return res.status(500).send({ status: false, msg: err.message });
    }
}

// ======================================== update product =======================================


const updateProduct = async function (req, res) {
    try {
        let productId = req.params.productId
        let body = req.body
        const files = req.files
        if (!validation.isValidObjectId(productId)) return res.status(400).send({ status: false, message: 'productId is not valid' })

        let product = await productModel.findById(productId)

        if (!product) return res.status(404).send({ status: false, messgage: 'product not found' })

        if (product.isDeleted == true) return res.status(400).send({ status: false, messgage: `Product is deleted` })

        // if (!validation.isValid(files)) return res.status(400).send({ status: false, message: "Please Enter data to update the product" })

const data = {}
// console.log(files)
if (files.length>0 ) {
    // if (!validation.isValid(body.productImage)) return res.status(400).send({ status: false, message: "please provide valid product Image" })
    if (files && files.length > 0)  uploadedFileURL = await aws.uploadFile(files[0]) 
    else  return res.status(400).send({status:false,message:"productimage is must in file format"})
}

let { title, description, price, currencyId, currencyFormat, isFreeShipping, style, availableSizes, installments } = body

if (title) {
    if (!validation.isValid(title)) return res.status(400).send({ status: false, message: "title must be valid " })
    if (await productModel.findOne({ title })) return res.status(400).send({ status: false, message: `This title ${title} is already present please Give another Title` })
  
    data.title = title
}

if (description) {
    if (!validation.isValid(description)) return res.status(400).send({ status: false, message: "description can not be empty" })
    data.description = description
}

if (price) {
    if (!validation.isValid(price)) return res.status(400).send({ status: false, message: "price can not be empty" })

    if (!priceValid.test(price)) return res.status(400).send({ status: false, message: "price should be in  valid Formate with Numbers || Decimals" })

    data.price = price
}

if (currencyId) {
    // if (!validation.isValid(currencyId)) return res.status(400).send({ status: false, message: "currencyId can not be empty" })
    if (currencyId!="INR") return res.status(400).send({ status: false, message: `currencyId Should be in this form 'INR' only` })
    data.currencyId = currencyId
}

if (currencyFormat) {
    // if (!validation.isValid(currencyFormat)) return res.status(400).send({ status: false, message: "currencyFormat can not be empty" })
    if (currencyFormat!="₹") return res.status(400).send({ status: false, message: `currencyFormat Should be in this form '₹' only` })
    data.currencyFormat = currencyFormat
}

if (isFreeShipping) {
    // if (!validation.isValid(isFreeShipping)) return res.status(400).send({ status: false, message: "isFreeShipping can not be empty" })

    if (!/^(true|false)$/.test(isFreeShipping)) return res.status(400).send({ status: false, message: `isFreeShipping Should be in boolean with small letters` })
    data.isFreeShipping = isFreeShipping
}

if (style) {
    if (!validation.isValid(style)) return res.status(400).send({ status: false, message: "style must be in valid " })
    data.style = style
}

if (availableSizes) {
    if (!validation.isValid(availableSizes)) return res.status(400).send({ status: false, message: "availableSizes must be in valid" })
    availableSizes = availableSizes.toUpperCase()
    let size = availableSizes.split(',').map(x => x.trim())

for (let i = 0; i < size.length; i++) {
    if (!(["S", "XS", "M", "X", "L", "XXL", "XL"].includes(size[i]))) return res.status(400).send({ status: false, message: `availableSizes should have only these Sizes ['S' || 'XS'  || 'M' || 'X' || 'L' || 'XXL' || 'XL']` })
}
   const dbSize=product.availableSizes
   for(let i=0;i<size.length;i++){
    for(let j=0;j<dbSize.length;j++){
        if(size[i]==dbSize[j]){
            dbSize.splice(j,1)
            size.splice(i,1)
            i--
            break
        }
    }
   }
 const size1=[...size,...dbSize] 
 data.availableSizes=size1

// data['$addToSet'] = {}
// data['$addToSet']['availableSizes'] = size1
}

if(installments) {
    if(!validation.isValidDigit(installments)) return res.status(400).send({status:false,message:"installment must be in number"})
    data.installments=installments
 }

const newProduct = await productModel.findByIdAndUpdate(productId, data, { new: true })

return res.status(200).send({ status: true, message: "Success", data: newProduct })

} catch (error) {
return res.status(500).send({ error: error.message})
}
}







//======================================= delete product ====================================

const deleteProduct = async function (req, res) {
    try {
        let productId = req.params.productId
        if(!validation.isValidObjectId(productId)){
            return res.status(400).send({status:false, message:"invalid objectid"})
        }
        let data = await productModel.findById(productId)
        if (!data) {
            return res.status(400).send({ status: false, message: "no product found" })
        }
        console.log(data.isDeleted)
        if (data.isDeleted == true) {
            return res.status(400).send({ status: false, message: "product already deleted" })
        }
        let result = await productModel.updateOne({ _id: productId }, { isDeleted: true,deletedAt:new Date() }, { new: true })
        return res.status(200).send({ status: true, message: "doccument deleted successfully" })

    }
    catch (err) {
        return res.status(500).send({ status: false, message: err.message })
    }

}

module.exports={createProduct , getproduct,getProductList,deleteProduct,updateProduct}