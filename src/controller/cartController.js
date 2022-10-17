const cartModel = require('../model/cartModel');
const productModel = require('../model/productModel');
const userModel = require('../model/userModel');
const validation = require("../validation/validation")



// ===================================================== create cart ==============================================
const createCart = async function (req, res) {
    try {
        let userId = req.params.userId;
        let requestBody = req.body;
        let { productId, quantity } = requestBody;
        if (!validation.isValidRequestBody(requestBody)) {
            return res.status(400).send({ status: false, message: "Please provide valid request body" });
        }
        if (!validation.isValidObjectId(userId)) {
            return res.status(400).send({ status: false, message: "Please provide valid User Id" });
        }
        if (!validation.isValidObjectId(productId)) {
            return res.status(400).send({ status: false, message: "Please provide valid Product Id" });
        }

        if (!quantity) quantity = 1

        else if (quantity) {
            if (!validation.isValid(quantity) || !validation.isValidDigit(quantity)) {
                return res.status(400).send({ status: false, message: "Please provide valid quantity & it must be greater than zero." });
            }
        }

        const findUser = await userModel.findById(userId);

        if (!findUser) {
            return res.status(400).send({ status: false, message: `User doesn't exist by ${userId}` });
        }

        const findProduct = await productModel.findOne({ _id: productId, isDeleted: false });

        if (!findProduct) return res.status(400).send({ status: false, message: `Product doesn't exist by ${productId}  or its deleted` });
        

        const findCartOfUser = await cartModel.findOne({ userId: userId });
        let singlePrice = findProduct.price

        if (!findCartOfUser) {
            let cartData = {
                userId: userId,
                items: [
                    {
                        productId: productId,
                        quantity: quantity,
                    },
                ],
                totalPrice: singlePrice * quantity,

                totalItems: 1
            };
            const createCart = await cartModel.create(cartData);
            return res.status(201).send({ status: true, message: `Cart created successfully`, data: createCart });
        }

        if (findCartOfUser) {

            let price = findCartOfUser.totalPrice + quantity * singlePrice;

            let arr = findCartOfUser.items;
            console.log(arr)

            for (i in arr) {
                if (arr[i].productId === productId) {
                    arr[i].quantity++;
                }
            }
            arr.push({ productId: productId, quantity: quantity });

            let updatedCart = {
                items: arr,
                totalPrice: price,
                totalItems: arr.length,
            };

            let responseData = await cartModel.findOneAndUpdate({ _id: findCartOfUser._id }, updatedCart, { new: true });
            return res.status(200).send({ status: true, message: `Product added successfully`, data: responseData });
        }

    } catch (error) {
        res.status(500).send({ status: false, message: error.message });
    }
};



// ========================================================= get cart ===============================================

const getCartData = async function (req, res) {
    try {
        let userId = req.params.userId

        if (!validation.isValidObjectId(userId)) return res.status(400).send({ status: false, message: "User Id is not valid" })

        let findUser = await userModel.findById({ _id: userId })
        if (!findUser) return res.status(404).send({ status: false, message: "User not found" })

        // Authentication
        let tokenId = req.userId
    
        if (tokenId != userId) return res.status(401).send({ status: false, message: "Unauthorised Access" })

        let findCart = await cartModel.findOne({ userId: userId })
    
        if (!findCart) return res.status(404).send({ status: false, message: "Cart is not found" })

        return res.status(200).send({ status: true, message: "Cart data fetched successfully", data: findCart })

    }
    catch (err) {
        return res.status(500).send({ status: false, msg: err.message })
    }
}
module.exports = { createCart , getCartData }