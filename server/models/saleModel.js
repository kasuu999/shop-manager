import mongoose from "mongoose";

const saleItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: [true, "Product is required for each sale item"],
    },
    quantity: {
      type: Number,
      required: [true, "Quantity is required"],
      min: [1, "Quantity must be greater than 0"],
    },
    sellingPrice: {
      type: Number,
      required: [true, "Selling price is required"],
      min: [0.01, "Selling price must be greater than 0"],
    },
    total: {
      type: Number,
      required: true, // quantity * sellingPrice, calculated in the controller
    },
  },
  { _id: false }
);

const saleSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      default: null, // optional -> supports walk-in customers with no record
    },
    items: {
      type: [saleItemSchema],
      required: true,
      validate: {
        validator: (items) => Array.isArray(items) && items.length > 0,
        message: "Sale must have at least one item",
      },
    },
    subtotal: {
      type: Number,
      required: true, // sum of all item totals, calculated in the controller
    },
    discount: {
      type: Number,
      default: 0,
      min: [0, "Discount cannot be negative"],
    },
    grandTotal: {
      type: Number,
      required: true, // subtotal - discount, calculated in the controller
    },
    paymentMethod: {
      type: String,
      enum: ["cash", "upi", "bank", "credit"],
      required: [true, "Payment method is required"],
    },
    invoiceNumber: {
      type: String,
      required: true,
      unique: true, // enforced at DB level too, in case of a race condition
    },
    saleDate: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

const Sale = mongoose.model("Sale", saleSchema);

export default Sale;