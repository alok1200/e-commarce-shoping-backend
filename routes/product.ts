import { Router, Request, Response } from "express";
import mongoose from "mongoose";
import Product from "../models/product";
import { verifyAdminWithToken } from "./tokenVerify";
import {
  uploadImageToCloudinary,
  deleteImageFromCloudinary,
} from "../utils/cloudinaryMethods";

const router = Router();

// Add new product
router.post("/", verifyAdminWithToken, async (req: Request, res: Response) => {
  const id = new mongoose.Types.ObjectId();
  try {
    const image = await uploadImageToCloudinary(req.body.img, id.toString());
    req.body.img = image.url;
    const savedProduct = await Product.create({ ...req.body, _id: id });
    res.status(200).json(savedProduct);
  } catch (err: any) {
    if (err.name === "ValidationError") {
      for (const field in err.errors) {
        return res
          .status(400)
          .json({ success: false, message: err.errors[field].message });
      }
    }
    if (err.code === 11000) {
      const duplicate = Object.keys(err.keyPattern)[0];
      return res
        .status(400)
        .json({
          message: `A product already exists with the same ${duplicate}`,
        });
    }
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

// Update product
router.put(
  "/:id",
  verifyAdminWithToken,
  async (req: Request, res: Response) => {
    try {
      if (req.body.img.startsWith("data:image")) {
        const image = await uploadImageToCloudinary(req.body.img, req.body._id);
        req.body.img = image.url;
      }
      const updatedProduct = await Product.findByIdAndUpdate(
        req.params.id,
        { $set: req.body },
        { new: true }
      );
      res.status(200).json(updatedProduct);
    } catch (error) {
      console.error(error);
      res.status(400).json(error);
    }
  }
);

// Delete product
router.delete(
  "/:id",
  verifyAdminWithToken,
  async (req: Request, res: Response) => {
    const id = req.params.id;
    if (!mongoose.isValidObjectId(id))
      return res.status(403).json({ message: "Invalid product ID" });
    try {
      await Product.findByIdAndDelete(id);
      await deleteImageFromCloudinary(id);
      res.status(200).json({ message: "Product deleted successfully" });
    } catch (err) {
      res.status(500).json({ message: "Failed to delete product" });
    }
  }
);

// Get specific product
router.get("/info/:id", async (req: Request, res: Response) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id))
    return res.status(404).json("Invalid Product ID");
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.status(200).json(product);
  } catch (err) {
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get all products with filters
router.get("/allinfo", async (req: Request, res: Response) => {
  const { page = "1", limit = "5", category, sort, color, size, s } = req.query;
  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);
  const startIndex = (pageNum - 1) * limitNum;

  try {
    let query = Product.find();
    const filters: any[] = [];

    if (s)
      filters.push({
        $or: [
          { title: { $regex: s, $options: "i" } },
          { productno: { $regex: s, $options: "i" } },
          { desc: { $regex: s, $options: "i" } },
          { categories: { $in: [s] } },
        ],
      });

    if (category) filters.push({ categories: { $in: [category] } });
    if (color) filters.push({ color: { $in: [color] } });
    if (size) filters.push({ size: { $in: [size] } });

    if (filters.length) query = query.find({ $and: filters });

    switch (sort) {
      case "Newest":
        query.sort({ createdAt: -1 });
        break;
      case "price-asc":
        query.sort({ price: 1 });
        break;
      case "price-desc":
        query.sort({ price: -1 });
        break;
      case "toppurchased":
        query.sort({ purchasedCount: -1 });
        break;
      case "topRated":
        query.sort({ ratingsQuantity: -1, ratingsAverage: -1 });
        break;
      case "topreviewed":
        query.sort({ ratingsQuantity: -1 });
        break;
    }

    query.skip(startIndex).limit(limitNum);
    const products = await query.exec();

    if (!products.length)
      return res.status(404).json({ message: "No more products found!" });

    res.status(200).json(products);
  } catch (err) {
    res.status(500).json({ message: "Failed to get products" });
  }
});

// Search products
router.get("/search/:s", async (req: Request, res: Response) => {
  const s = req.params.s;
  if (!s) return res.status(400).json("Not found");

  try {
    const products = await Product.find(
      {
        $or: [
          { title: { $regex: s, $options: "i" } },
          { productno: { $regex: s, $options: "i" } },
          { desc: { $regex: s, $options: "i" } },
          { categories: { $in: [s] } },
        ],
      },
      { title: 1, _id: 1 }
    ).limit(5);

    res.status(200).json(products);
  } catch (err) {
    console.error(err);
    res.status(500).json("Internal server error");
  }
});

export default router;
