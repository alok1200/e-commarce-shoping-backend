import { Router, Request, Response } from "express";
import Stripe from "stripe";

const router = Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2023-08-16",
});

router.post("/payment", async (req: Request, res: Response) => {
  console.log("API hit");

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: req.body.amount,
      currency: "INR",
      payment_method: req.body.tokenID,
      confirm: true,
    });

    res.status(200).json(paymentIntent);
  } catch (error) {
    console.error(error);
    res.status(500).json(error);
  }
});

export default router;
