import mongoose, { Schema, Document, Model } from "mongoose";

// Product structure in the order
interface IOrderProduct {
  title?: string;
  img?: string;
  price?: number;
  productID?: string;
  quantity?: number;
  size?: string;
  color?: string;
}

// User information
interface IUserInfo {
  address: Record<string, any>;
  name: string;
  email: string;
}

// Main Confirm Order interface
interface IConfirmOrder extends Document {
  userID: string;
  type?: string;
  products: IOrderProduct[];
  price: number;
  userInfo: IUserInfo;
  order: Record<string, any>;
  paymentStatus?: boolean;
  paymentInfo?: Record<string, any> | boolean;
  orderStatus?: string;
  ExpectedDelevery?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

// Schema definition
const ConfirmOrderSchema: Schema<IConfirmOrder> = new Schema(
  {
    userID: { type: String, required: true },
    type: { type: String }, // cart payment or single product payment
    products: [
      {
        title: { type: String },
        img: { type: String },
        price: { type: Number },
        productID: { type: String },
        quantity: { type: Number, default: 1 },
        size: { type: String },
        color: { type: String },
      },
    ],
    price: { type: Number, required: true },
    userInfo: {
      address: { type: Object, required: true },
      name: { type: String, required: true },
      email: { type: String, required: true },
    },
    order: { type: Object, required: true },
    paymentStatus: { type: Boolean, default: false },
    paymentInfo: { type: Object, default: false },
    orderStatus: {
      type: String,
      default: "pending",
      set: (v: string) => v.toLowerCase(),
    },
    ExpectedDelevery: {
      type: Date,
      default: function () {
        const date = new Date();
        date.setDate(date.getDate() + 5);
        return date;
      },
    },
  },
  { timestamps: true }
);

// Export model
const PaidOrder: Model<IConfirmOrder> = mongoose.model<IConfirmOrder>(
  "PaidOrder",
  ConfirmOrderSchema
);

export default PaidOrder;
