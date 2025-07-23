import { Router, Request, Response } from "express";
import mongoose from "mongoose";
import Announcements from "../models/announcment";
import { verifyAdminWithToken } from "./tokenVerify";

const router = Router();

// GET /api/announcement — get the latest active announcement
router.get("/", async (_req: Request, res: Response) => {
  try {
    const title = await Announcements.findOne({ active: true }).sort({
      updatedAt: -1,
    });
    res.status(200).json(title);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: "Internal server error" });
  }
});

// POST /api/announcement — add a new announcement
router.post("/", verifyAdminWithToken, async (req: Request, res: Response) => {
  const { title } = req.body;

  if (!title || title.length > 140) {
    return res
      .status(400)
      .json({ error: "Text length cannot exceed 140 characters" });
  }

  const newAnnouncement = new Announcements({ title });

  try {
    await newAnnouncement.save();
    res.status(200).json({ message: "Announcement successfully added!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /api/announcement/:id — edit announcement status
router.put(
  "/:id",
  verifyAdminWithToken,
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const { title, active } = req.body;

    if (!title || typeof active !== "boolean") {
      return res.status(400).json({ message: "All fields are required!" });
    }

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid ID provided!" });
    }

    try {
      if (active) {
        await Announcements.updateMany({}, { $set: { active: false } });
      }

      await Announcements.findByIdAndUpdate(id, {
        $set: { title, active },
      });

      res.status(200).json({ message: "Announcement successfully updated!" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// DELETE /api/announcement/active — deactivate all announcements
router.delete(
  "/active",
  verifyAdminWithToken,
  async (_req: Request, res: Response) => {
    try {
      const result = await Announcements.updateMany(
        { active: true },
        { $set: { active: false } }
      );

      res
        .status(200)
        .json({
          message: `${result.modifiedCount} announcements deactivated successfully!`,
        });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// GET /api/announcement/all — get all announcements
router.get(
  "/all",
  verifyAdminWithToken,
  async (_req: Request, res: Response) => {
    try {
      const allAnnouncements = await Announcements.find();
      res.status(200).json(allAnnouncements);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// DELETE /api/announcement/:id — delete a specific announcement
router.delete(
  "/:id",
  verifyAdminWithToken,
  async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: `${id} is not a valid ID` });
    }

    try {
      await Announcements.findByIdAndDelete(id);
      res.status(200).json({ message: "Announcement deleted successfully" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

export default router;
