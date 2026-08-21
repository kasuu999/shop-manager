import mongoose from "mongoose";
import Sale from "../models/saleModel.js";
import Customer from "../models/customerModel.js";
import Product from "../models/productmodel.js";
import StockHistory from "../models/stockHistoryModel.js";

// Small helper to generate a unique-ish invoice number.
// Format: INV-<timestamp>-<3 random digits>
const generateInvoiceNumber = () => {
  const timestamp = Date.now();
  const random = Math.floor(100 + Math.random() * 900); // 3-digit random number
  return `INV-${timestamp}-${random}`;
};

// @desc    Create a new sale (and decrease product stock)
// @route   POST /api/sales
// @access  Private
//
// STOCK DEDUCTION LOGIC (explained):
// A sale means stock is going OUT of the shop, so for every item sold, the
// matching product's `stock` field must go DOWN by the sold `quantity`.
//
// Before touching anything, we first CHECK that every product has enough
// stock for the requested quantity. If even one product is short on stock,
// we reject the WHOLE sale — nothing gets created, nothing gets updated.
//
// For EVERY stock change we also create a StockHistory record (type
// "SALE"), logging previousStock -> newStock and linking back to this sale.
// This only ever happens automatically here — there's no separate API to
// create stock history directly.
//
// Just like Purchase, we wrap "create sale" + "decrease stock" + "log
// stock history" in ONE MongoDB transaction, so it's all-or-nothing.
export const createSale = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const { customer, items, discount, paymentMethod, saleDate } = req.body;

    // 1. Basic shape validation
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: "At least one sale item is required" });
    }

    const allowedPaymentMethods = ["cash", "upi", "bank", "credit"];
    if (!paymentMethod || !allowedPaymentMethods.includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: `paymentMethod is required and must be one of: ${allowedPaymentMethods.join(", ")}`,
      });
    }

    // 2. Validate customer only if provided (customer is optional)
    if (customer) {
      if (!mongoose.Types.ObjectId.isValid(customer)) {
        return res.status(400).json({ success: false, message: "Invalid customer id" });
      }
      const customerExists = await Customer.findById(customer);
      if (!customerExists) {
        return res.status(404).json({ success: false, message: "Customer not found" });
      }
    }

    // 3. Validate every item's shape: product id format, quantity, sellingPrice
    for (const item of items) {
      if (!item.product || !mongoose.Types.ObjectId.isValid(item.product)) {
        return res.status(400).json({ success: false, message: "Each item must have a valid product id" });
      }
      if (!item.quantity || item.quantity <= 0) {
        return res.status(400).json({ success: false, message: "Each item's quantity must be greater than 0" });
      }
      if (!item.sellingPrice || item.sellingPrice <= 0) {
        return res.status(400).json({ success: false, message: "Each item's sellingPrice must be greater than 0" });
      }
    }

    // 4. Validate every product exists AND check stock availability
    const productIds = items.map((item) => item.product);
    const foundProducts = await Product.find({ _id: { $in: productIds } });

    if (foundProducts.length !== new Set(productIds.map(String)).size) {
      return res.status(404).json({ success: false, message: "One or more products not found" });
    }

    const productMap = new Map(foundProducts.map((p) => [String(p._id), p]));

    // Check stock BEFORE creating anything.
    for (const item of items) {
      const product = productMap.get(String(item.product));
      if (product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for "${product.name}". Available: ${product.stock}, requested: ${item.quantity}`,
        });
      }
    }

    // 5. Calculate each item's total and the sale subtotal
    const itemsWithTotal = items.map((item) => ({
      product: item.product,
      quantity: item.quantity,
      sellingPrice: item.sellingPrice,
      total: item.quantity * item.sellingPrice,
    }));

    const subtotal = itemsWithTotal.reduce((sum, item) => sum + item.total, 0);
    const discountValue = discount && discount > 0 ? discount : 0;
    const grandTotal = subtotal - discountValue;

    if (grandTotal < 0) {
      return res.status(400).json({ success: false, message: "Discount cannot be greater than subtotal" });
    }

    const invoiceNumber = generateInvoiceNumber();

    // 6. Run the sale creation + stock deductions + stock history inside a transaction
    let createdSale;

    await session.withTransaction(async () => {
      const saleDocs = await Sale.create(
        [
          {
            customer: customer || null,
            items: itemsWithTotal,
            subtotal,
            discount: discountValue,
            grandTotal,
            paymentMethod,
            invoiceNumber,
            saleDate: saleDate || Date.now(),
          },
        ],
        { session }
      );

      createdSale = saleDocs[0];

      // Decrease stock for every sold product, and log a StockHistory entry
      // right after each update so previousStock/newStock are accurate.
      for (const item of itemsWithTotal) {
        const productBefore = productMap.get(String(item.product));
        const previousStock = productBefore.stock;
        const newStock = previousStock - item.quantity;

        await Product.findByIdAndUpdate(
          item.product,
          { $inc: { stock: -item.quantity } }, // $inc with a negative number subtracts
          { session }
        );

        await StockHistory.create(
          [
            {
              product: item.product,
              type: "SALE",
              quantity: item.quantity,
              previousStock,
              newStock,
              referenceId: createdSale._id,
              referenceModel: "Sale",
            },
          ],
          { session }
        );
      }
    });

    // 7. Fetch the created sale again, populated, for a useful response
    const populatedSale = await Sale.findById(createdSale._id)
      .populate("customer", "name phone")
      .populate("items.product", "name unit");

    return res.status(201).json({ success: true, data: populatedSale });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to create sale", error: error.message });
  } finally {
    session.endSession();
  }
};

// @desc    Get all sales (supports filtering by customer, paymentMethod, and date range)
// @route   GET /api/sales
// @query   customer=      -> filter by customer id
// @query   paymentMethod= -> filter by payment method
// @query   startDate=, endDate= -> filter by saleDate range (YYYY-MM-DD)
// @query   page=, limit=  -> pagination
// @access  Private
export const getSales = async (req, res) => {
  try {
    const { customer, paymentMethod, startDate, endDate, page = 1, limit = 20 } = req.query;

    const filter = {};

    if (customer) {
      if (!mongoose.Types.ObjectId.isValid(customer)) {
        return res.status(400).json({ success: false, message: "Invalid customer id" });
      }
      filter.customer = customer;
    }

    if (paymentMethod) {
      filter.paymentMethod = paymentMethod;
    }

    if (startDate || endDate) {
      filter.saleDate = {};
      if (startDate) filter.saleDate.$gte = new Date(startDate);
      if (endDate) filter.saleDate.$lte = new Date(endDate);
    }

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.max(parseInt(limit, 10) || 20, 1);

    const [sales, total] = await Promise.all([
      Sale.find(filter)
        .populate("customer", "name phone")
        .populate("items.product", "name unit")
        .sort({ saleDate: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),
      Sale.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      count: sales.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      data: sales,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to fetch sales", error: error.message });
  }
};

// @desc    Get a single sale by id
// @route   GET /api/sales/:id
// @access  Private
export const getSaleById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid sale id" });
    }

    const sale = await Sale.findById(id)
      .populate("customer", "name phone address village")
      .populate("items.product", "name unit sellingPrice");

    if (!sale) {
      return res.status(404).json({ success: false, message: "Sale not found" });
    }

    return res.status(200).json({ success: true, data: sale });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to fetch sale", error: error.message });
  }
};

// @desc    Cancel a sale (sale return) — restores stock for every item and
//          marks the sale as "cancelled". The sale record itself is kept
//          (not deleted) so invoice/history/audit trail is preserved.
// @route   PATCH /api/sale/:id/cancel
// @access  Private (owner only — same sensitivity as deleting a sale)
//
// SALE CANCELLATION LOGIC (explained):
// Cancelling a completed sale means the sold stock is coming BACK into the
// shop, so for every item on the sale, the matching product's `stock` field
// must go UP by the same `quantity` that was deducted when the sale was
// created.
//
// A sale can only be cancelled once — if `status` is already "cancelled",
// the request is rejected instead of double-restoring stock.
//
// For EVERY stock restoration we create a StockHistory record (type
// "SALE_RETURN"), logging previousStock -> newStock and linking back to this
// sale, mirroring exactly how createSale logs a "SALE" entry when stock goes
// down. This keeps stock history a complete, consistent audit trail.
//
// Just like createSale, "restore stock" + "log stock history" + "flip sale
// status" are wrapped in ONE MongoDB transaction, so it's all-or-nothing.
export const cancelSale = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid sale id" });
    }

    const sale = await Sale.findById(id);

    if (!sale) {
      return res.status(404).json({ success: false, message: "Sale not found" });
    }

    if (sale.status === "cancelled") {
      return res.status(400).json({ success: false, message: "This sale has already been cancelled" });
    }

    // Validate every product on the sale still exists before touching stock.
    const productIds = sale.items.map((item) => item.product);
    const foundProducts = await Product.find({ _id: { $in: productIds } });
    const productMap = new Map(foundProducts.map((p) => [String(p._id), p]));

    for (const item of sale.items) {
      if (!productMap.has(String(item.product))) {
        return res.status(404).json({
          success: false,
          message: "One or more products on this sale no longer exist, cannot restore stock",
        });
      }
    }

    await session.withTransaction(async () => {
      // Restore stock for every item, and log a StockHistory entry right
      // after each update so previousStock/newStock are accurate.
      for (const item of sale.items) {
        const productBefore = productMap.get(String(item.product));
        const previousStock = productBefore.stock;
        const newStock = previousStock + item.quantity;

        await Product.findByIdAndUpdate(
          item.product,
          { $inc: { stock: item.quantity } }, // $inc with a positive number adds stock back
          { session }
        );

        await StockHistory.create(
          [
            {
              product: item.product,
              type: "SALE_RETURN",
              quantity: item.quantity,
              previousStock,
              newStock,
              referenceId: sale._id,
              referenceModel: "Sale",
            },
          ],
          { session }
        );

        // Keep productMap in sync in case the same product appears in
        // multiple items on this sale.
        productBefore.stock = newStock;
      }

      sale.status = "cancelled";
      sale.cancelledAt = new Date();
      await sale.save({ session });
    });

    // Fetch again, populated, for a useful response (same shape as other endpoints).
    const populatedSale = await Sale.findById(sale._id)
      .populate("customer", "name phone")
      .populate("items.product", "name unit");

    return res.status(200).json({ success: true, message: "Sale cancelled and stock restored successfully", data: populatedSale });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to cancel sale", error: error.message });
  } finally {
    session.endSession();
  }
};

// @desc    Delete a sale record
// @route   DELETE /api/sales/:id
// @access  Private
//
// NOTE: Just like Purchase delete, this only removes the sale record. It
// does NOT restore the deducted stock and does NOT delete the related
// StockHistory records. Prefer `cancelSale` above for reversing a sale —
// it keeps the record and audit trail intact. This raw delete is left as-is
// for existing callers/behavior.
export const deleteSale = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid sale id" });
    }

    const sale = await Sale.findByIdAndDelete(id);

    if (!sale) {
      return res.status(404).json({ success: false, message: "Sale not found" });
    }

    return res.status(200).json({ success: true, message: "Sale deleted successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to delete sale", error: error.message });
  }
};