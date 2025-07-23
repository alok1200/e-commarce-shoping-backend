import { Router, Request, Response } from "express";
import mongoose from "mongoose";
import Reviews from "../models/Reviews";
import { verifyToken } from "./tokenVerify";
import { AuthRequest } from "../types/customTypes";

const router = Router();

router.post(
  "/:productid",
  verifyToken,
  async (req: AuthRequest, res: Response) => {
    const { review, rating } = req.body;

    if (!review && !rating) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are Required" });
    }

    if (rating < 1) {
      return res
        .status(400)
        .json({ success: false, message: "Rating can't be less than One" });
    }

    try {
      const checkUser = await Reviews.find({
        user: req.user.id,
        product: req.params.productid,
      });
      if (checkUser.length !== 0) {
        return res
          .status(400)
          .json({
            success: false,
            message: "Only One Review is allowed Per user",
          });
      }

      await Reviews.create({
        user: req.user.id,
        product: req.params.productid,
        rating,
        review,
      });

      res
        .status(201)
        .json({
          success: true,
          message: "Your review has been successfully added",
        });
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  }
);

router.get("/:id", async (req: Request, res: Response) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json("Invalid Product ID");
    }

    const review = await Reviews.aggregate([
      { $match: { product: new mongoose.Types.ObjectId(req.params.id) } },
      {
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $addFields: {
          upVotesLength: { $size: "$upVotes" },
        },
      },
      { $sort: { upVotesLength: -1 } },
      {
        $project: {
          "user._id": 1,
          "user.firstName": 1,
          "user.lastName": 1,
          "user.avatar": 1,
          review: 1,
          rating: 1,
          createdAt: 1,
          upVotesLength: 1,
        },
      },
      { $unwind: "$user" },
    ]);

    res.status(200).json(review);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
});

router.put(
  "/abuse/:id",
  verifyToken,
  async (req: AuthRequest, res: Response) => {
    try {
      const dbreview = await Reviews.findOne({
        _id: new mongoose.Types.ObjectId(req.params.id),
      });

      if (!dbreview) {
        return res
          .status(404)
          .json({ success: false, message: "Review not found" });
      }

      if (
        dbreview.abuseReports.some(
          (vote) => vote.userID.toString() === req.user.id
        )
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message: "You cannot report more than once",
          });
      }

      if (dbreview.user.toString() === req.user.id) {
        return res
          .status(400)
          .json({
            success: false,
            message: "You cannot report your own review",
          });
      }

      await Reviews.findByIdAndUpdate(req.params.id, {
        $push: { abuseReports: { userID: req.user.id } },
      });

      res
        .status(200)
        .json({
          success: true,
          message:
            "Thank you for your contribution, your response has been recorded",
        });
    } catch (err) {
      res.status(500).json({ success: false, message: "Something went wrong" });
    }
  }
);

router.put(
  "/upvote/:id",
  verifyToken,
  async (req: AuthRequest, res: Response) => {
    try {
      const dbreview = await Reviews.findOne({
        _id: new mongoose.Types.ObjectId(req.params.id),
      });

      if (!dbreview) {
        return res
          .status(404)
          .json({ success: false, message: "Review not found" });
      }

      if (
        dbreview.upVotes.some((vote) => vote.userID.toString() === req.user.id)
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message: "You cannot upvote more than once",
          });
      }

      if (dbreview.user.toString() === req.user.id) {
        return res
          .status(400)
          .json({
            success: false,
            message: "You cannot upvote your own review",
          });
      }

      await Reviews.findByIdAndUpdate(req.params.id, {
        $push: { upVotes: { userID: req.user.id } },
      });

      res
        .status(200)
        .json({
          success: true,
          message:
            "Thank you for your contribution, your response has been recorded",
        });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: "Something went wrong" });
    }
  }
);

export default router;
