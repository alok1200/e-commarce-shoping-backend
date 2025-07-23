import mongoose, { Schema, Document, Model, Types } from "mongoose";

// Interface for embedded address object
interface IAddressDetail {
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  mobile: number;
}

// Interface for the full Address document
export interface IAddress extends Document {
  userID: Types.ObjectId;
  address: IAddressDetail;
}

// Schema definition
const AddressSchema: Schema<IAddress> = new Schema({
  userID: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true,
  },
  address: {
    street: {
      type: String,
      required: [true, "Street cannot be empty!"],
    },
    city: {
      type: String,
      required: [true, "City cannot be empty!"],
    },
    state: {
      type: String,
      required: [true, "State cannot be empty!"],
    },
    zip: {
      type: String,
      required: [true, "Zip cannot be empty!"],
    },
    country: {
      type: String,
      required: [true, "Country cannot be empty!"],
    },
    mobile: {
      type: Number,
      required: [true, "Mobile cannot be empty!"],
    },
  },
});

// Create and export the model
const Address: Model<IAddress> = mongoose.model<IAddress>(
  "address",
  AddressSchema
);
export default Address;
