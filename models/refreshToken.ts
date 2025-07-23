import mongoose, { Schema, Document, Model, Types } from "mongoose";

// Interface for Refresh Token
export interface IRefreshToken extends Document {
  token: string;
  userID: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

// Define the schema
const refreshTokenSchema: Schema<IRefreshToken> = new Schema(
  {
    token: { type: String, required: true },
    userID: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

// Create and export the model
const RefreshToken: Model<IRefreshToken> = mongoose.model<IRefreshToken>(
  "refreshTken",
  refreshTokenSchema,
  "refToken" // Optional: explicitly sets the collection name
);

export default RefreshToken;
