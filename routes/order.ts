import express, { Request, Response } from "express";
import mongoose from "mongoose";
import Order from "../models/order";
import ConfirmOrders from "../models/ConfirmOrders";
import product from "../models/product";
import {
  verifyAdminWithToken,
  verifyToken,
  verifyUserWithToken,
} from "./tokenVerify";
import { createOrderTemplate } from "../helpers/orderConfrimation";
import sendEmail from "../helpers/sendEmail";

const router = express.Router();

// CREATE ORDER
router.post("/", verifyToken, async (req: Request, res: Response) => {
  const newOrder = new Order(req.body);
  try {
    const savedOrder = await newOrder.save();
    res.status(200).json(savedOrder);
  } catch (err) {
    res.status(500).json(err);
  }
});

// UPDATE ORDER
router.put(
  "/:id",
  verifyAdminWithToken,
  async (req: Request, res: Response) => {
    try {
      const updatedOrder = await Order.findByIdAndUpdate(
        req.params.id,
        { $set: req.body },
        { new: true }
      );
      res.status(200).json(updatedOrder);
    } catch (err) {
      res.status(500).json(err);
    }
  }
);

// GET USER CONFIRMED ORDERS
router.get(
  "/find/:id",
  verifyUserWithToken,
  async (req: Request, res: Response) => {
    try {
      const orders = await ConfirmOrders.find({ userID: req.user.id }).sort({
        createdAt: -1,
      });
      res.status(200).json(orders);
    } catch (err) {
      res.status(500).json(err);
    }
  }
);

// GET ALL CONFIRMED ORDERS (WITH FILTERS)
router.get("/", verifyAdminWithToken, async (req: Request, res: Response) => {
  const { page = 1, limit = 10, sort, status, search } = req.query as any;
  const startIndex = (parseInt(page) - 1) * parseInt(limit);
  const FeildsIWant = { createdAt: 1, userInfo: 1, price: 1, orderStatus: 1 };

  let query = ConfirmOrders.find({}, FeildsIWant);
  const filters: any[] = [];

  if (search && !isNaN(Number(search)))
    filters.push({ "userInfo.address.mobile": Number(search) });
  if (status) filters.push({ orderStatus: status });

  if (filters.length) query = query.find({ $and: filters });

  if (sort === "price-asc") query.sort({ price: 1 });
  else if (sort === "price-desc") query.sort({ price: -1 });
  else if (sort === "oldest") query.sort({ createdAt: 1 });
  else if (sort === "newest") query.sort({ createdAt: -1 });

  try {
    const orders = await query.skip(startIndex).limit(parseInt(limit)).exec();
    if (orders.length < 1)
      return res.status(404).json({ message: "No Products Found" });
    res.status(200).json(orders);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "internal server error" });
  }
});

// UPDATE CONFIRMED ORDER STATUS
router.put(
  "/status/:id",
  verifyAdminWithToken,
  async (req: Request, res: Response) => {
    const { status } = req.body;
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id))
      return res.status(402).json({ message: "order id is not valid" });
    if (!status) return res.status(402).json({ message: "status is required" });

    try {
      const order = await ConfirmOrders.findByIdAndUpdate(
        id,
        { orderStatus: status },
        { new: true }
      );
      if (!order) return res.status(404).json({ message: "Order not found" });

      const emailHTML = createOrderTemplate(order);

      sendEmail({
        to: order.userInfo.email,
        subject: "Order Confirmation",
        emailhtml: emailHTML,
        emailtext: emailHTML,
      });

      res
        .status(200)
        .json({ message: `order status successfully updated to ${status}` });
    } catch (err) {
      console.log(err);
      res.status(500).json({ message: "internal server error" });
    }
  }
);

// GET CONFIRMED ORDER BY ID
router.get("/:id", async (req: Request, res: Response) => {
  const id = req.params.id;
  if (!id) return res.status(401).json({ message: "ID required" });

  if (!mongoose.isValidObjectId(id))
    return res.status(401).json({ message: "ID is not valid" });

  try {
    const order = await ConfirmOrders.findById(id);
    res.status(200).json(order);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "internal server error" });
  }
});

export default router;
