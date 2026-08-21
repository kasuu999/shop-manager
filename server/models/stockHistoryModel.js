import mongoose from "mongoose";

const stockHistorySchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: [true, "Product is required"],
    },
    type: {
      type: String,
      enum: ["PURCHASE", "SALE", "SALE_RETURN", "PURCHASE_RETURN"],
      required: [true, "Type is required"],
    },
    quantity: {
      type: Number,
      required: [true, "Quantity is required"], // always the positive amount changed, e.g. 10
    },
    previousStock: {
      type: Number,
      required: [true, "previousStock is required"],
    },
    newStock: {
      type: Number,
      required: [true, "newStock is required"],
    },
    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, "referenceId is required"], // points to the Purchase or Sale that caused this change
      refPath: "referenceModel",
    },
    referenceModel: {
      type: String,
      required: true,
      enum: ["Purchase", "Sale"], // tells Mongoose which collection referenceId points to, for populate()
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

const StockHistory = mongoose.model("StockHistory", stockHistorySchema);

export default StockHistory;