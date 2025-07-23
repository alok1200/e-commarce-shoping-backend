import { Router, Request, Response } from "express";
import Address, { IAddress } from "../models/UserAddress"; // make sure `UserAddress.ts` exports `IAddress`
import { verifyToken, AuthenticatedRequest } from "./tokenVerify"; // modify tokenVerify to support types

const route = Router();

// GET user address
route.get(
  "/",
  verifyToken,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const address = await Address.findOne({ userID: req.user.id });

      console.log(address);

      if (address?.address) {
        return res.status(200).json({ ok: true, address: address.address });
      }

      return res.status(200).json({ ok: false, message: "No address found" });
    } catch (error) {
      console.error(error);
      return res
        .status(500)
        .json({ ok: false, message: "Internal server error" });
    }
  }
);

// POST or UPDATE user address
route.post(
  "/",
  verifyToken,
  async (req: AuthenticatedRequest, res: Response) => {
    const { street, city, state, zip, country, mobile } = req.body;

    if (!street || !city || !state || !zip || !country || !mobile) {
      return res
        .status(400)
        .json({ ok: false, message: "All fields are required" });
    }

    const payload = {
      userID: req.user.id,
      address: { street, city, state, zip, country, mobile },
    };

    const isUpdate = req.query.update;

    try {
      const address = isUpdate
        ? await Address.findOneAndUpdate({ userID: req.user.id }, payload, {
            new: true,
          })
        : await Address.create(payload);

      return res.status(200).json({ ok: true, address });
    } catch (error: any) {
      if (error.code === 11000) {
        return res.status(500).json({
          ok: false,
          message: "We already have your address in our system",
        });
      }
      console.error(error);
      return res
        .status(500)
        .json({ ok: false, message: "Internal server error" });
    }
  }
);

export default route;
