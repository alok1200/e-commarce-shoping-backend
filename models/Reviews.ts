import mongoose, { Schema, Document, Model, Types } from "mongoose";
import Product from "./product";

// Interface for upvote and abuse report entries
interface IUserRef {
  userID: Types.ObjectId;
}

// Main Review interface
export interface IReview extends Document {
  review: string;
  rating: number;
  product: Types.ObjectId;
  user: Types.ObjectId;
  upVotes: IUserRef[];
  abuseReports: IUserRef[];
  createdAt?: Date;
  updatedAt?: Date;
}

// Interface for the Review model including static method
interface IReviewModel extends Model<IReview> {
  calcAvgRating(productID: Types.ObjectId): Promise<void>;
}

// Schema definition
const ReviewSchema = new Schema<IReview, IReviewModel>(
  {
    review: {
      type: String,
      required: [true, "Review cannot be empty!"],
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    product: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: [true, "Review must belong to a product"],
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Review must belong to a user"],
    },
    upVotes: [
      {
        userID: { type: Schema.Types.ObjectId, ref: "User" },
      },
    ],
    abuseReports: [
      {
        userID: { type: Schema.Types.ObjectId, ref: "User" },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Static method to calculate average rating
ReviewSchema.statics.calcAvgRating = async function (
  productID: Types.ObjectId
): Promise<void> {
  console.log("calc runned");

  const stats = await this.aggregate([
    { $match: { product: productID } },
    {
      $group: {
        _id: "$product",
        numberOfRating: { $sum: 1 },
        avg: { $avg: "$rating" },
      },
    },
  ]);

  if (stats.length > 0) {
    await Product.findByIdAndUpdate(productID, {
      ratingsQuantity: stats[0].numberOfRating,
      ratingsAverage: stats[0].avg,
    });
  } else {
    await Product.findByIdAndUpdate(productID, {
      ratingsQuantity: 0,
      ratingsAverage: 4.5,
    });
  }
};

// Post-save hook
ReviewSchema.post("save", function (doc) {
  // Use model directly, since 'this' here is the document
  (doc.constructor as IReviewModel).calcAvgRating(doc.product);
});

// Export the model
const Reviews = mongoose.model<IReview, IReviewModel>("Reviews", ReviewSchema);
export default Reviews;
