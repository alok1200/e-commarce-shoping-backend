import express, { Request, Response } from "express";
import Razorpay from "razorpay";
import dotenv from "dotenv";
import crypto from "crypto";
import mongoose from "mongoose";

import Product from "../models/product";
import Order from "../models/order";
import Cart from "../models/cart";
import User from "../models/user";
import ConfirmOrders from "../models/ConfirmOrders";
import { verifyToken } from "./tokenVerify";
import sendEmail from "../helpers/sendEmail";
import { createOrderTemplate } from "../helpers/orderConfrimation";

dotenv.config();

const router = express.Router();

const instance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

// Checkout Route
router.post("/checkout", verifyToken, async (req: any, res: Response) => {
  let price: number | undefined;
  let cart;
  const margedProducts: any[] = [];

  try {
    if (req.body.type === "product") {
      const dbproduct = await Product.findById(req.body.product.productID, {
        price: 1,
        img: 1,
        title: 1,
        _id: 0,
        quantity: 1,
      });

      if (!dbproduct)
        return res
          .status(404)
          .json({
            success: false,
            message: "Sorry! Unable to find this product.",
          });
      if (dbproduct.quantity < 1)
        return res
          .status(404)
          .json({
            success: false,
            message: "Sorry! This product is currently out of stock",
          });

      price = dbproduct.price * req.body.product.quantity;
      req.finalProduct = { ...dbproduct._doc, ...req.body.product };
    } else if (req.body.type === "cart") {
      cart = await Cart.aggregate([
        { $match: { userID: new mongoose.Types.ObjectId(req.user.id) } },
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
            products: { productID: 1, size: 1, color: 1, quantity: 1 },
            productInfo: {
              productno: 1,
              _id: 1,
              price: 1,
              title: 1,
              img: 1,
            },
          },
        },
      ]);

      const [cartt] = cart;

      if (!cartt)
        return res
          .status(404)
          .json({ message: "No products found in your cart" });

      cartt.products.forEach((product: any) => {
        const productInfo = cartt.productInfo.find(
          (info: any) => `${info._id}` === `${product.productID}`
        );
        margedProducts.push({ ...product, ...productInfo });
      });

      price = margedProducts.reduce(
        (total, item) => total + item.price * item.quantity,
        0
      );
    }

    const options = {
      amount: Number((price! * 100).toFixed(2)),
      currency: "INR",
      receipt: crypto.randomBytes(15).toString("hex"),
    };

    const response = await instance.orders.create(options);

    const dbOrder = await Order.create({
      userID: req.user.id,
      type: req.body.type,
      products: req.finalProduct || margedProducts,
      price: Number(price!.toFixed(2)),
      userInfo: req.body.userInfo,
      order: response,
    });

    res.json({ order: { id: response.id, amount: response.amount } });

    const emailTemplate = createOrderTemplate(dbOrder);
    sendEmail({
      to: dbOrder.userInfo.email,
      subject: "Order Confirmation",
      emailhtml: emailTemplate,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong during checkout." });
  }
});

// Payment Verify Route
router.post("/paymentVerify", async (req: Request, res: Response) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
    req.body;

  const body = razorpay_order_id + "|" + razorpay_payment_id;
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
    .update(body)
    .digest("hex");

  if (expectedSignature === razorpay_signature) {
    try {
      const dborder = await Order.findOneAndDelete({
        "order.id": razorpay_order_id,
      });
      if (!dborder) return res.status(400).json({ error: "Session timeout" });

      const data = {
        ...dborder._doc,
        paymentStatus: true,
        paymentInfo: req.body,
      };
      await ConfirmOrders.create(data);

      if (dborder.type === "cart") {
        const updateProduct = dborder.products.map((product: any) => ({
          updateOne: {
            filter: { _id: product.id },
            update: {
              $inc: {
                purchasedCount: product.quantity,
                quantity: -product.quantity,
              },
            },
          },
        }));

        await Product.bulkWrite(updateProduct);

        await User.updateOne(
          { _id: dborder.userID },
          {
            $addToSet: {
              purchasedProducts: {
                $each: dborder.products.map((p: any) => p._id),
              },
            },
          }
        );

        await Cart.deleteOne({ userID: dborder.userID });
      } else {
        const idObject = new mongoose.Types.ObjectId(
          dborder.products[0].productID
        );

        await User.updateOne(
          { _id: dborder.userID },
          { $addToSet: { purchasedProducts: idObject } }
        );

        await Product.findByIdAndUpdate(dborder.products[0].productID, {
          $inc: {
            purchasedCount: dborder.products[0].quantity,
            quantity: -dborder.products[0].quantity,
          },
        });
      }
    } catch (error) {
      console.error(error);
      return res
        .status(400)
        .json({
          success: false,
          message: "Failed to process your information",
        });
    }

    return res.redirect(
      `${process.env.BACE_FRONTEND_URL}/paymentsuccess?refrence=${razorpay_payment_id}`
    );
  } else {
    return res.status(400).json({ success: false, signatureIsValid: false });
  }
});

// Get Razorpay Key
router.get("/getKey", async (_req: Request, res: Response) => {
  return res.status(200).json({ key: process.env.RAZORPAY_KEY_ID });
});

export default router;
