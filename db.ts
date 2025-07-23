import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";

const mongoURI: string = process.env.MONGODB_URL || "";

mongoose.set("strictQuery", false);

const connectToMongo = (): void => {
  mongoose
    .connect(mongoURI, {
      autoIndex: true, // Make this true to build indexes automatically
    })
    .then(() => {
      console.log("Successfully connected to MongoDB");
    })
    .catch((err: Error) => {
      console.error("MongoDB connection error:", err);
    });
};

export default connectToMongo;
