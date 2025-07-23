import express, { Request, Response } from "express";
import User from "../models/user";
import cryptoJS from "crypto-js";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import sendEmail from "../helpers/sendEmail";
import { createResetEmailHTML } from "../helpers/orderConfrimation";

const router = express.Router();

// Register
router.post("/register", async (req: Request, res: Response) => {
  const { firstName, lastName, email, number, password, userIP } = req.body;

  if (!password || password.length < 5 || password.length > 16) {
    return res
      .status(400)
      .json({
        success: false,
        message: "Password length should be in range of 5 to 16 characters",
      });
  }

  const newUser = new User({
    firstName,
    lastName,
    email,
    number,
    password: cryptoJS.AES.encrypt(
      password,
      process.env.CRYPTOJS_SECRET_KEY!.toString()
    ).toString(),
    userIP,
  });

  try {
    const savedUser = await newUser.save();
    const { password, ...others } = savedUser._doc;

    const accessToken = jwt.sign(
      {
        id: savedUser._id,
        isAdmin: savedUser.isAdmin,
      },
      process.env.JWT_SECRET_KEY!,
      { expiresIn: process.env.JWT_SECRET_EXPIRE || "3d" }
    );

    res.status(201).json({ ...others, accessToken });
  } catch (err: any) {
    console.log(err);
    if (err.code === 11000) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Account with this email already exists",
        });
    } else if (err.name === "ValidationError") {
      for (const field in err.errors) {
        return res
          .status(400)
          .json({ success: false, message: err.errors[field].message });
      }
    } else {
      return res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  }
});

// Login
router.post("/login", async (req: Request, res: Response) => {
  const { email, password, forAdmin } = req.body;
  if (!email || !password) {
    return res
      .status(400)
      .json({ success: false, message: "Please provide email and password" });
  }

  try {
    const user = await User.findOne({ email });
    if (!user)
      return res
        .status(401)
        .json({
          success: false,
          message: "User with this email doesn't exist",
        });

    if (forAdmin && !user.isAdmin) {
      return res
        .status(401)
        .json({ success: false, message: "Wrong credentials" });
    }

    const hashedPass = cryptoJS.AES.decrypt(
      user.password,
      process.env.CRYPTOJS_SECRET_KEY!
    );
    const pass = hashedPass.toString(cryptoJS.enc.Utf8);
    if (pass !== password) {
      return res
        .status(401)
        .json({ success: false, message: "Wrong credentials" });
    }

    const accessToken = jwt.sign(
      {
        id: user._id,
        isAdmin: user.isAdmin,
      },
      process.env.JWT_SECRET_KEY!,
      { expiresIn: process.env.JWT_SECRET_EXPIRE || "3d" }
    );

    const {
      password: pwd,
      resetPasswordToken,
      resetPasswordExpire,
      ...others
    } = user._doc;
    res.status(200).json({ ...others, accessToken });
  } catch (err) {
    console.log(`Logged Error from login user : ${err}`);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
});

// Forgot Password
router.post("/forgotpass", async (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email)
    return res
      .status(400)
      .json({ success: false, message: "Please provide an email" });

  const resetToken = crypto.randomBytes(20).toString("hex");
  const hashedResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  const expireDate = Date.now() + 10 * 60 * 1000;

  try {
    const user = await User.findOneAndUpdate(
      { email },
      {
        resetPasswordToken: hashedResetToken,
        resetPasswordExpire: expireDate,
      }
    );

    if (!user)
      return res
        .status(401)
        .json({
          success: false,
          message: "User with this email does not exist",
        });

    const resetUrl = `https://satnamcreation.netlify.app/resetpassword/${resetToken}`;
    const emailText = `You have requested a password reset. Please go to this link to reset your password: ${resetUrl}`;
    const emailHTML = createResetEmailHTML(user.firstName, resetUrl);

    try {
      await sendEmail({
        to: user.email,
        subject: "Forgot Password",
        emailhtml: emailHTML,
        emailtext: emailText,
      });
      res
        .status(200)
        .json({ success: true, message: "Email sent successfully" });
    } catch (error) {
      await User.findOneAndUpdate(
        { email },
        {
          resetPasswordToken: undefined,
          resetPasswordExpire: undefined,
        }
      );
      console.log(error);
      return res
        .status(401)
        .json({ success: false, message: "Failed to send email" });
    }
  } catch (error) {
    return res.status(500).json(error);
  }
});

// Reset Password
router.post(
  "/resetpassword/:resetToken",
  async (req: Request, res: Response) => {
    const hashedResetToken = crypto
      .createHash("sha256")
      .update(req.params.resetToken)
      .digest("hex");

    try {
      const user = await User.findOne({
        resetPasswordToken: hashedResetToken,
        resetPasswordExpire: { $gt: Date.now() },
      });

      if (!user) return res.status(400).json({ error: "Invalid reset token" });

      const oldPasswordHash = cryptoJS.AES.decrypt(
        user.password,
        process.env.CRYPTOJS_SECRET_KEY!
      );
      const oldPassword = oldPasswordHash.toString(cryptoJS.enc.Utf8);

      if (oldPassword === req.body.password) {
        return res
          .status(401)
          .json({ error: "You cannot use your current password" });
      }

      user.password = cryptoJS.AES.encrypt(
        req.body.password,
        process.env.CRYPTOJS_SECRET_KEY!.toString()
      ).toString();
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save();

      res.status(200).json({ data: "Password successfully changed" });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

export default router;
