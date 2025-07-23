import express, { Request, Response } from "express";
import User from "../models/user";
import { verifyUserWithToken, verifyAdminWithToken } from "./tokenVerify";
import mongoose from "mongoose";
import { decreptPass, encreptPass } from "../utils/pass";
import { IUser } from "../types/user"; // Optional: define User type

const router = express.Router();

// UPDATE user info (req: login)
router.put("/:id", verifyUserWithToken, async (req: Request, res: Response) => {
  try {
    if (req.body.password) {
      if (!req.body.currentPass)
        return res.status(400).json({ error: "Old password Is Required!!" });

      const oldDbPass = await User.findById(req.user.id, {
        password: 1,
        _id: 0,
      });
      const decryptedOldPass = decreptPass(oldDbPass?.password || "");

      if (decryptedOldPass !== req.body.currentPass)
        return res.status(401).json({ error: "Old password doesn't match!!" });

      req.body.password = encreptPass(req.body.password);
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );
    res.status(200).json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update user" });
  }
});

// DELETE user (req: login)
router.delete(
  "/:id",
  verifyUserWithToken,
  async (req: Request, res: Response) => {
    try {
      await User.findByIdAndDelete(req.params.id);
      res.status(200).json("User deleted");
    } catch (err) {
      res.status(500).json(err);
    }
  }
);

// GET specific user info (req: admin)
router.get(
  "/info/:id",
  verifyAdminWithToken,
  async (req: Request, res: Response) => {
    try {
      const suser = await User.findById(req.params.id);
      res.status(200).json(suser);
    } catch (err) {
      res.status(500).json(err);
    }
  }
);

// GET all user info (req: admin)
router.get(
  "/allinfo",
  verifyAdminWithToken,
  async (req: Request, res: Response) => {
    const limit = req.query.limit as string;
    const search = req.query.s as string;

    try {
      let query = User.find({}, { password: 0 });
      const filters: any[] = [];

      if (search) {
        if (mongoose.isValidObjectId(search)) {
          filters.push({ _id: new mongoose.Types.ObjectId(search) });
        } else if (isNaN(Number(search))) {
          filters.push({
            $or: [
              { firstName: { $regex: search, $options: "i" } },
              { lastName: { $regex: search, $options: "i" } },
              { email: { $regex: search, $options: "i" } },
            ],
          });
        } else {
          filters.push({ number: { $eq: Number(search) } });
        }
      }

      if (filters.length > 0) {
        query = User.find({ $and: filters }, { password: 0 });
      }

      const resUsers = await query.exec();
      res.status(200).json(resUsers);
    } catch (err) {
      console.error(err);
      res.status(500).json(err);
    }
  }
);

// GET user stats (req: admin)
router.get(
  "/stats",
  verifyAdminWithToken,
  async (req: Request, res: Response) => {
    const date = new Date();
    const lastYear = new Date(date.setFullYear(date.getFullYear() - 1));

    try {
      const data = await User.aggregate([
        { $match: { createdAt: { $gte: lastYear } } },
        {
          $project: {
            month: { $month: "$createdAt" },
          },
        },
        {
          $group: {
            _id: "$month",
            total: { $sum: 1 },
          },
        },
      ]);

      res.status(200).json(data);
    } catch (err) {
      res.status(500).json(err);
    }
  }
);

export default router;
