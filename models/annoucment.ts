import mongoose, { Document, Schema, Model } from "mongoose";

// Define a TypeScript interface for the document
interface IAnnouncment extends Document {
  title: string;
  active?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

// Define the schema
const announcmentSchema: Schema<IAnnouncment> = new Schema(
  {
    title: { type: String, required: true },
    active: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Create the model
const Announcments: Model<IAnnouncment> = mongoose.model<IAnnouncment>(
  "Announcment",
  announcmentSchema
);

export default Announcments;
