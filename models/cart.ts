import mongoose, { Document, Schema, Model, Types } from "mongoose";

// Define interface for individual product in the cart
interface ICartProduct {
  productID: Types.ObjectId;
  size?: string;
  color?: string;
  quantity?: number;
}

// Define main cart interface extending Mongoose's Document
interface ICart extends Document {
  userID: string;
  products: ICartProduct[];
  createdAt?: Date;
  updatedAt?: Date;
}

// Define schema
const CartSchema: Schema<ICart> = new Schema(
  {
    userID: { type: String, required: true, unique: true },
    products: [
      {
        productID: {
          type: Schema.Types.ObjectId,
          required: true,
          ref: "Product",
        },
        size: { type: String },
        color: { type: String },
        quantity: { type: Number },
      },
    ],
  },
  { timestamps: true }
);

// Create and export model
const Cart: Model<ICart> = mongoose.model<ICart>("Cart", CartSchema);
export default Cart;
