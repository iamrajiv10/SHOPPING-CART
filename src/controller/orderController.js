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

    //     if(status){
    //         if (["pending", "completed", "cancled"].indexOf(status) == -1) 
    //             return res.status(400).send({ status: false, message: "Status should be 'pending', 'completed' or 'cancled'" })
    //         order.status=status
    // }

        if(status){
            if (status != "pending")  return res.status(400).send({ status: false, message: "Status should be 'pending'" })
            order.status=status
    }
        let orderDetails = await orderModel.create(order)

        await cartModel.findByIdAndUpdate(cartId, {$set: {items: [], totalPrice: 0, totalItems: 0}})

        return res.status(201).send({ status: true, message: "Success", data: orderDetails })
    } 
    catch (err) {
        return res.status(500).send({ status: false, message: err.message })
    }
}


//============================================= update order =========================================


const updateOrder = async function (req,res){
    try{
        let data = req.body
        let userId = req.params.userId
        let { orderId, status } = data

        if (!validation.isValidRequestBody(data)) return res.status(400).send({ status: false, message: "No data found" })

        if (!validation.isValidObjectId(userId)) return res.status(400).send({ status: false, message: "User Id is not valid" })

        if(!validation.isValid(orderId)) return res.status(400).send({ status: false, message: "Order Id required" })

        if (!validation.isValidObjectId(orderId)) return res.status(400).send({ status: false, message: "Order Id is not valid" })

        if(!validation.isValid(status)) return res.status(400).send({ status: false, message: "Status is required for updatation" })

        
        let findUser = await userModel.findById(userId)
        if (!findUser) return res.status(404).send({ status: false, message: "User is not found" })

        let findOrder = await orderModel.findOne({_id:orderId,isDeleted:false})
        if (!findOrder) return res.status(404).send({ status: false, message: "Order is not found" })

        
        if(userId != findOrder.userId.toString()) 
        return res.status(400).send({ status: false, message: "Order is not belong to the user" })


        if(findOrder.cancellable == false) return res.status(400).send({ status: false, message: "You cant't cancel the order, Order is not cancellable" })

        // if (["completed", "cancled"].indexOf(status) == -1) {
        //     return res.status(400).send({ status: false, message: "Status should be  'completed' or 'cancled'" })
        // }

        if (status != "completed" && status != "cancled")  return res.status(400).send({ status: false, message: "Status should be  'completed' or 'cancled'" })
        

        if (findOrder.status == "cancled") return res.status(400).send({status:false, message:"Order is already cancled, you cant't update"})
        if (findOrder.status == "completed") return res.status(400).send({status:false, message:"Order is already completed, you cant't update"})

        const updateOrder = await orderModel.findByIdAndUpdate(orderId, {status: status}, {new: true})

        // if(!updateOrder) {return res.status(404).send({ status: false, message: "Order is not found or deleted" })
        // }

        return res.status(200).send({ status: true, message: "Order status updated successfully", order:updateOrder })


    }
    catch (err) {
        return res.status(500).send({ status: false, msg: err.message })
    }

    
}

module.exports={createOreder,updateOrder}