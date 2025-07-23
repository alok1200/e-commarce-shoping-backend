import mongoose, { Schema, Document, Model } from "mongoose";

// Interface for the User document
export interface IUser extends Document {
  firstName: string;
  lastName: string;
  avatar?: string;
  email: string;
  number: number;
  password: string;
  isAdmin?: boolean;
  userIP?: string;
  purchasedProducts?: any[]; // You can make this more specific if needed
  mfa?: boolean;
  otp?: number;
  otpExpire?: Date;
  resetPasswordToken?: string;
  resetPasswordExpire?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

// User Schema
const UserSchema: Schema<IUser> = new Schema(
  {
    firstName: {
      type: String,
      required: [true, "First name is required"],
      minlength: [2, "First name minimum length should be 2 characters"],
      maxlength: [10, "First name maximum length should be 10 characters"],
    },
    lastName: {
      type: String,
      required: true,
      minlength: [2, "Last name minimum length should be 2 characters"],
      maxlength: [10, "Last name maximum length should be 10 characters"],
    },
    avatar: {
      type: String,
      default:
        "https://w7.pngwing.com/pngs/867/694/png-transparent-user-profile-default-computer-icons-network-video-recorder-avatar-cartoon-maker-blue-text-logo.png",
    },
    email: {
      type: String,
      required: true,
      unique: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "This email is not valid",
      ],
    },
    number: {
      type: Number,
      required: [true, "Number is required"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
    userIP: {
      type: String,
    },
    purchasedProducts: {
      type: Array,
      required: false,
    },

    // 2FA
    mfa: {
      type: Boolean,
      default: false,
    },
    otp: Number,
    otpExpire: Date,

    // Reset password
    resetPasswordToken: String,
    resetPasswordExpire: Date,
  },
  { timestamps: true }
);

// Export the model
const User: Model<IUser> = mongoose.model<IUser>("user", UserSchema);
export default User;
