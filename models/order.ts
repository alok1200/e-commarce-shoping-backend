import mongoose, { Schema, Document, Model } from "mongoose";

// Interface for each product in the order
interface IOrderProduct {
  title?: string;
  img?: string;
  price?: number;
  productID?: string;
  quantity?: number;
  size?: string;
  color?: string;
}

// Interface for user information
interface IUserInfo {
  address: Record<string, any>;
  name: string;
  email: string;
}

// Main Order interface
export interface IOrder extends Document {
  userID: string;
  type?: string;
  products: IOrderProduct[];
  price: number;
  userInfo: IUserInfo;
  order: Record<string, any>;
  paymentStatus?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

// Define the schema
const OrderSchema: Schema<IOrder> = new Schema(
  {
    userID: { type: String, required: true },
    type: { type: String },
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
  },
  { timestamps: true }
);

// Export the model
const Order: Model<IOrder> = mongoose.model<IOrder>("Order", OrderSchema);
export default Order;
