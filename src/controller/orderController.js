const cartModel = require('../model/cartModel');
const productModel = require('../model/productModel');
const orderModel = require('../model/orderModel');
const userModel = require('../model/userModel');
const validation = require("../validation/validation")


const createOreder = async function (req, res){
    try{
        let data = req.body
        let userId = req.params.userId

        let{cartId, cancellable , status} = data

        if (!validation.isValidRequestBody(data)) return res.status(400).send({status:false, message: "please provide data"})
        
        if (!validation.isValidObjectId(cartId)) return res.status(400).send({status:false, message:"invalid cart id"})
                  
        if (!validation.isValidObjectId(userId)) return res.status(400).send({status:false, message:"invalid user data"})

        let finduser = await userModel.findById(userId)
        if (!finduser) return res.status(400).send({status:false, message:"user not found"})

        let findCart = await cartModel.findById(cartId)
        if (!findCart) return res.status(400).send({status:false, message:"cart doesn't exist"})

        // let findUserCart = await cartModel.findOne({userId: userId})
        // if ((findCart.userId.toString()) != (findUserCart.userId.toString()))
        if ((findCart.userId.toString()) != userId)
        return res.status(404).send({status:false, message:"cart does not belong to user"})

        

        if (findCart.items.length == 0) return res.status(400).send({status:false, message:"no item in cart"})


        let totalQuantity = 0;
        for (let i = 0; i < findCart.items.length; i++) {

            totalQuantity = totalQuantity + findCart.items[i].quantity
        }


        let order = { userId: userId, items: findCart.items, totalPrice: findCart.totalPrice, totalItems: findCart.totalItems, totalQuantity: totalQuantity }


        if(cancellable){
            if(!(cancellable == "true" || cancellable == "false")) 
            return res.status(404).send({status:false, message:"cancellable should be boolean only"})
            order.cancellable=cancellable
        }

        if(status){
            if (["pending", "completed", "canclled"].indexOf(status) == -1) 
                return res.status(400).send({ status: false, message: "Status should be 'pending', 'completed' or 'canclled'" })
            order.status=status
        
    }
        let orderDetails = await orderModel.create(order)

        await cartModel.findByIdAndUpdate({_id: cartId}, {$set: {items: [], totalPrice: 0, totalItems: 0}})

        return res.status(201).send({ status: true, message: "Seccess", data: orderDetails })
    } 
    catch (err) {
        return res.status(500).send({ status: false, message: err.message })
    }
}

module.exports={createOreder}