import mongoose, { Schema, Document, Model } from "mongoose";

// Define the Product interface
export interface IProduct extends Document {
  title: string;
  productno: string;
  desc: string;
  img: any; // Can be refined based on your image data type (e.g., URL string or file metadata)
  categories?: string[] | string;
  size?: string[];
  color?: string[];
  price: number;
  quantity: number;
  purchasedCount?: number;
  ratingsQuantity?: number;
  ratingsAverage?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

// Define the Product schema
const ProductSchema: Schema<IProduct> = new Schema(
  {
    title: { type: String, required: true },
    productno: { type: String, required: true, unique: true, index: true },
    desc: { type: String, required: true },
    img: { type: Schema.Types.Mixed, required: true },
    categories: { type: Array, default: "kurti" },
    size: { type: Array },
    color: { type: Array },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true },
    purchasedCount: { type: Number, default: 0 },
    ratingsQuantity: { type: Number, default: 0 },
    ratingsAverage: {
      type: Number,
      default: 0,
      max: [5, "Rating must be below 5.0"],
      set: (val: number) => Math.round(val * 10) / 10,
    },
  },
  { timestamps: true }
);

// Create and export the model
const Product: Model<IProduct> = mongoose.model<IProduct>(
  "products",
  ProductSchema
);
export default Product;
