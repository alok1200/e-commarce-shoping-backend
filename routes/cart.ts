import { Router, Request, Response } from "express";
import mongoose from "mongoose";
import Cart from "../models/cart";
import Product from "../models/product";
import { verifyAdminWithToken, verifyToken } from "./tokenVerify";

const router = Router();

// Add new product to cart
router.post("/", verifyToken, async (req: Request, res: Response) => {
  try {
    const cart = await Cart.findOne({ userID: req.user.id });

    if (cart) {
      const itemIndex = cart.products.findIndex(
        (p: any) => `${p.productID}` === `${req.body.products[0].productID}`
      );

      if (itemIndex > -1) {
        let productItem = cart.products[itemIndex];
        const newQuantity =
          parseInt(productItem.quantity) +
          parseInt(req.body.products[0].quantity);
        productItem.quantity = newQuantity;
        cart.products[itemIndex] = productItem;

        await cart.save();

        return res
          .status(200)
          .json({
            status: "success",
            productExisted: true,
            message: "Product Quantity updated to Cart",
          });
      } else {
        await Cart.findOneAndUpdate(
          { userID: req.user.id },
          { $push: { products: req.body.products } },
          { new: true }
        );

        return res
          .status(200)
          .json({
            status: "success",
            productExisted: false,
            message: "Product added to Cart",
          });
      }
    } else {
      const newCart = new Cart({ ...req.body, userID: req.user.id });
      await newCart.save();
      return res
        .status(200)
        .json({
          status: "success",
          productExisted: false,
          message: "Product added to Cart",
        });
    }
  } catch (err) {
    res
      .status(500)
      .json({ status: "failed", message: "Internal Server Error" });
    console.log(err);
  }
});

// Get cart size
router.get("/size", verifyToken, async (req: Request, res: Response) => {
  try {
    const cartSize = await Cart.aggregate([
      { $match: { userID: req.user.id } },
      { $addFields: { size: { $size: "$products" } } },
      { $project: { size: 1, _id: 0 } },
    ]);
    const [removedArrayBrackets] = cartSize;
    res.status(200).json(removedArrayBrackets);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "internal server error" });
  }
});

// Update products quantity in cart
router.put(
  "/updatequantity/:productNumber/:newQuantity",
  verifyToken,
  async (req: Request, res: Response) => {
    try {
      if (req.params.newQuantity === "0") {
        await Cart.updateOne(
          { userID: req.user.id },
          { $pull: { products: { productID: req.params.productNumber } } }
        );
      } else {
        await Cart.updateOne(
          {
            userID: req.user.id,
            "products.productID": req.params.productNumber,
          },
          { $set: { "products.$.quantity": req.params.newQuantity } }
        );
      }

      res
        .status(200)
        .json({
          status: "success",
          message: "Product Quantity Updated Successfully",
        });
    } catch (error) {
      console.log(error);
      res
        .status(500)
        .json({ status: "failed", message: "Internal Server Error" });
    }
  }
);

// Delete product from cart
router.delete("/:id", verifyToken, async (req: Request, res: Response) => {
  try {
    await Cart.updateOne(
      { userID: req.user.id },
      { $pull: { products: { productID: req.params.id } } }
    );
    res
      .status(200)
      .json({ status: "success", message: "Product deleted Successfully" });
  } catch (err) {
    console.log(err);
    res
      .status(500)
      .json({ status: "failed", message: "Internal Server Error" });
  }
});

// Get user cart
router.get(
  "/info/:userId",
  verifyToken,
  async (req: Request, res: Response) => {
    try {
      const cart = await Cart.aggregate([
        { $match: { userID: req.user.id } },
        {
          $lookup: {
            from: "products",
            localField: "products.productID",
            foreignField: "_id",
            as: "productInfo",
          },
        },
        {
          $project: {
            userID: 1,
            products: 1,
            productInfo: {
              title: 1,
              productno: 1,
              _id: 1,
              desc: 1,
              img: 1,
              price: 1,
            },
          },
        },
      ]);

      if (!cart.length) {
        return res
          .status(404)
          .json({ success: true, message: "no products found" });
      }

      const [cartt] = cart;
      const mergedProducts: any[] = [];

      cartt.products.forEach((product: any) => {
        const productInfo = cartt.productInfo.find(
          (info: any) => `${info._id}` === `${product.productID}`
        );
        mergedProducts.push({ ...product, ...productInfo });
      });

      res
        .status(200)
        .json({
          userID: req.user.id,
          cartID: cartt._id,
          products: mergedProducts,
          productFound: true,
        });
    } catch (err) {
      console.log(err);
      res.status(500).json(err);
    }
  }
);

// Get all carts (admin only)
router.get(
  "/allinfo",
  verifyAdminWithToken,
  async (req: Request, res: Response) => {
    try {
      const cart = await Cart.find();
      res.status(200).json(cart);
    } catch (err) {
      res.status(500).json(err);
    }
  }
);

export default router;
