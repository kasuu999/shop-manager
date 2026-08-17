import mongoose from "mongoose";

const shopSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Shop name is required"],
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
      default: "",
    },
    address: {
      type: String,
      trim: true,
      default: "",
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
    },
    gstNumber: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { timestamps: true } // gives createdAt/updatedAt automatically
);

const Shop = mongoose.model("Shop", shopSchema);

export default Shop;