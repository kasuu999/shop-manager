import mongoose from "mongoose";

const purchaseItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: [true, "Product is required for each purchase item"],
    },
    quantity: {
      type: Number,
      required: [true, "Quantity is required"],
      min: [1, "Quantity must be greater than 0"],
    },
    purchasePrice: {
      type: Number,
      required: [true, "Purchase price is required"],
      min: [0.01, "Purchase price must be greater than 0"],
    },
    total: {
      type: Number,
      required: true, // quantity * purchasePrice, calculated in the controller
    },
    returnedQuantity: {
      type: Number,
      default: 0,
      min: [0, "Returned quantity cannot be negative"], // running total returned so far for this item
    },
  },
  { _id: false }
);

const purchaseSchema = new mongoose.Schema(
  {
    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Supplier",
      required: [true, "Supplier is required"],
    },
    items: {
      type: [purchaseItemSchema],
      required: true,
      validate: {
        validator: (items) => Array.isArray(items) && items.length > 0,
        message: "Purchase must have at least one item",
      },
    },
    subtotal: {
      type: Number,
      required: true, // sum of all item totals, calculated in the controller
    },
    purchaseDate: {
      type: Date,
      default: Date.now,
    },
    invoiceNumber: {
      type: String,
      trim: true,
      default: "",
    },
    returnStatus: {
      type: String,
      enum: ["none", "partial", "full"],
      default: "none", // "partial" once any item has returnedQuantity > 0, "full" once every item is fully returned
    },
  },
  { timestamps: true }
);

const Purchase = mongoose.model("Purchase", purchaseSchema);

export default Purchase;