import mongoose from "mongoose";
import Purchase from "../models/purchaseModel.js";
import Supplier from "../models/supplierModel.js";
import Product from "../models/productmodel.js";
import StockHistory from "../models/stockHistoryModel.js";

// @desc    Create a new purchase (and increase product stock)
// @route   POST /api/purchases
// @access  Private
//
// STOCK UPDATE LOGIC (explained):
// A purchase means we bought stock FROM a supplier, so for every item in the
// purchase, the matching product's `stock` field should go UP by the
// purchased `quantity`.
//
// For EVERY stock change we also create a StockHistory record — this is a
// permanent log of "what changed, by how much, and why" (previousStock ->
// newStock, linked back to this purchase). This never happens through a
// separate API; it only ever happens automatically, right here, whenever a
// purchase actually changes stock.
//
// We do "create purchase" + "increase stock" + "log stock history" as ONE
// MongoDB transaction. This matters because there are multiple write
// operations happening together. If, say, one of them fails halfway
// through, we do NOT want the purchase record to exist with only some
// products updated, or with a stock change that has no matching history
// record — that would leave your data inconsistent. A transaction
// guarantees "all or nothing": either everything succeeds and gets saved,
// or everything is rolled back as if nothing happened.
export const createPurchase = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const { supplier, items, purchaseDate, invoiceNumber } = req.body;

    // 1. Basic shape validation
    if (!supplier || !mongoose.Types.ObjectId.isValid(supplier)) {
      return res.status(400).json({ success: false, message: "Valid supplier id is required" });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: "At least one purchase item is required" });
    }

    // 2. Validate supplier exists
    const supplierExists = await Supplier.findById(supplier);
    if (!supplierExists) {
      return res.status(404).json({ success: false, message: "Supplier not found" });
    }

    // 3. Validate every item: product id format, quantity, purchasePrice
    for (const item of items) {
      if (!item.product || !mongoose.Types.ObjectId.isValid(item.product)) {
        return res.status(400).json({ success: false, message: "Each item must have a valid product id" });
      }
      if (!item.quantity || item.quantity <= 0) {
        return res.status(400).json({ success: false, message: "Each item's quantity must be greater than 0" });
      }
      if (!item.purchasePrice || item.purchasePrice <= 0) {
        return res.status(400).json({ success: false, message: "Each item's purchasePrice must be greater than 0" });
      }
    }

    // 4. Validate every product actually exists in DB
    const productIds = items.map((item) => item.product);
    const foundProducts = await Product.find({ _id: { $in: productIds } });

    if (foundProducts.length !== new Set(productIds.map(String)).size) {
      return res.status(404).json({ success: false, message: "One or more products not found" });
    }

    const productMap = new Map(foundProducts.map((p) => [String(p._id), p]));

    // 5. Calculate each item's total and the purchase subtotal
    const itemsWithTotal = items.map((item) => ({
      product: item.product,
      quantity: item.quantity,
      purchasePrice: item.purchasePrice,
      total: item.quantity * item.purchasePrice,
    }));

    const subtotal = itemsWithTotal.reduce((sum, item) => sum + item.total, 0);

    // 6. Run the purchase creation + stock updates + stock history inside a transaction
    let createdPurchase;

    await session.withTransaction(async () => {
      const purchaseDocs = await Purchase.create(
        [
          {
            supplier,
            items: itemsWithTotal,
            subtotal,
            purchaseDate: purchaseDate || Date.now(),
            invoiceNumber,
          },
        ],
        { session }
      );

      createdPurchase = purchaseDocs[0];

      // Increase stock for every purchased product, and log a StockHistory
      // entry right after each update so previousStock/newStock are accurate.
      for (const item of itemsWithTotal) {
        const productBefore = productMap.get(String(item.product));
        const previousStock = productBefore.stock;
        const newStock = previousStock + item.quantity;

        await Product.findByIdAndUpdate(
          item.product,
          { $inc: { stock: item.quantity } }, // $inc atomically adds to existing stock
          { session }
        );

        await StockHistory.create(
          [
            {
              product: item.product,
              type: "PURCHASE",
              quantity: item.quantity,
              previousStock,
              newStock,
              referenceId: createdPurchase._id,
              referenceModel: "Purchase",
            },
          ],
          { session }
        );
      }
    });

    // 7. Fetch the created purchase again, populated, for a useful response
    const populatedPurchase = await Purchase.findById(createdPurchase._id)
      .populate("supplier", "name phone")
      .populate("items.product", "name unit sellingPrice");

    return res.status(201).json({ success: true, data: populatedPurchase });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to create purchase", error: error.message });
  } finally {
    session.endSession();
  }
};

// @desc    Get all purchases (supports filtering by supplier and date range)
// @route   GET /api/purchases
// @query   supplier=      -> filter by supplier id
// @query   startDate=, endDate= -> filter by purchaseDate range (YYYY-MM-DD)
// @query   page=, limit=  -> pagination
// @access  Private
export const getPurchases = async (req, res) => {
  try {
    const { supplier, startDate, endDate, page = 1, limit = 20 } = req.query;

    const filter = {};

    if (supplier) {
      if (!mongoose.Types.ObjectId.isValid(supplier)) {
        return res.status(400).json({ success: false, message: "Invalid supplier id" });
      }
      filter.supplier = supplier;
    }

    if (startDate || endDate) {
      filter.purchaseDate = {};
      if (startDate) filter.purchaseDate.$gte = new Date(startDate);
      if (endDate) filter.purchaseDate.$lte = new Date(endDate);
    }

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.max(parseInt(limit, 10) || 20, 1);

    const [purchases, total] = await Promise.all([
      Purchase.find(filter)
        .populate("supplier", "name phone")
        .populate("items.product", "name unit")
        .sort({ purchaseDate: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),
      Purchase.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      count: purchases.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      data: purchases,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to fetch purchases", error: error.message });
  }
};

// @desc    Get a single purchase by id
// @route   GET /api/purchases/:id
// @access  Private
export const getPurchaseById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid purchase id" });
    }

    const purchase = await Purchase.findById(id)
      .populate("supplier", "name phone address")
      .populate("items.product", "name unit sellingPrice");

    if (!purchase) {
      return res.status(404).json({ success: false, message: "Purchase not found" });
    }

    return res.status(200).json({ success: true, data: purchase });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to fetch purchase", error: error.message });
  }
};

// @desc    Return (part or all of) a purchase — decreases product stock for
//          every returned item and tracks per-item returnedQuantity plus an
//          overall returnStatus ("none" -> "partial" -> "full"). The
//          purchase record itself is kept (not deleted) so invoice/history/
//          audit trail is preserved — same pattern as Sale cancellation.
// @route   POST /api/purchase/:id/return
// @body    { items: [{ product, quantity }, ...] }
// @access  Private (owner only — same restriction as creating/deleting a purchase)
//
// PURCHASE RETURN LOGIC (explained):
// A purchase return means stock we received from the supplier is going BACK
// OUT of the shop, so for every returned item, the matching product's
// `stock` field must go DOWN by the returned `quantity`.
//
// Unlike Sale cancellation (which reverses a whole sale in one go), a
// purchase can be returned in MULTIPLE PARTIAL steps across separate
// requests, so we track a running `returnedQuantity` on each purchase item
// and only allow returning up to (quantity - returnedQuantity) at a time.
//
// For EVERY stock decrease we also create a StockHistory record (type
// "PURCHASE_RETURN"), logging previousStock -> newStock and linking back to
// this purchase — mirroring exactly how createPurchase logs "PURCHASE" and
// cancelSale logs "SALE_RETURN".
//
// "decrease stock" + "log stock history" + "update returnedQuantity/status"
// are wrapped in ONE MongoDB transaction, so it's all-or-nothing — same
// pattern as createPurchase/createSale/cancelSale.
export const returnPurchase = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const { id } = req.params;
    const { items } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid purchase id" });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: "At least one return item is required" });
    }

    const purchase = await Purchase.findById(id);
    if (!purchase) {
      return res.status(404).json({ success: false, message: "Purchase not found" });
    }

    // 1. Basic shape validation for every return item
    for (const item of items) {
      if (!item.product || !mongoose.Types.ObjectId.isValid(item.product)) {
        return res.status(400).json({ success: false, message: "Each return item must have a valid product id" });
      }
      if (item.quantity === undefined || item.quantity === null || Number(item.quantity) <= 0) {
        return res.status(400).json({ success: false, message: "Each return item's quantity must be greater than 0" });
      }
    }

    // 2. Reject duplicate product entries within the same return request —
    // keeps the "already returned" bookkeeping unambiguous per request.
    const seenProducts = new Set();
    for (const item of items) {
      const key = String(item.product);
      if (seenProducts.has(key)) {
        return res.status(400).json({
          success: false,
          message: "Duplicate product in return request — combine quantities into a single entry per product",
        });
      }
      seenProducts.add(key);
    }

    // 3. Every returned product must actually be part of this purchase, and
    // the return quantity must not exceed what's still returnable
    // (purchased - already returned) for that item.
    const purchaseItemMap = new Map(purchase.items.map((pi) => [String(pi.product), pi]));

    for (const item of items) {
      const purchaseItem = purchaseItemMap.get(String(item.product));
      if (!purchaseItem) {
        return res.status(400).json({
          success: false,
          message: `Product ${item.product} was not part of this purchase`,
        });
      }

      const alreadyReturned = purchaseItem.returnedQuantity || 0;
      const remainingReturnable = purchaseItem.quantity - alreadyReturned;
      const requestedQty = Number(item.quantity);

      if (requestedQty > remainingReturnable) {
        return res.status(400).json({
          success: false,
          message: `Only ${remainingReturnable} quantity can be returned (purchased: ${purchaseItem.quantity}, already returned: ${alreadyReturned})`,
        });
      }
    }

    // 4. Validate every product still exists AND has enough current stock to
    // give back — stock must never go negative.
    const productIds = items.map((item) => item.product);
    const foundProducts = await Product.find({ _id: { $in: productIds } });

    if (foundProducts.length !== new Set(productIds.map(String)).size) {
      return res.status(404).json({ success: false, message: "One or more products not found" });
    }

    const productMap = new Map(foundProducts.map((p) => [String(p._id), p]));

    for (const item of items) {
      const product = productMap.get(String(item.product));
      const requestedQty = Number(item.quantity);
      if (product.stock < requestedQty) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock to return "${product.name}". Available: ${product.stock}, attempting to return: ${requestedQty}`,
        });
      }
    }

    // 5. Run stock decrease + stock history + returnedQuantity/status update inside a transaction
    await session.withTransaction(async () => {
      for (const item of items) {
        const requestedQty = Number(item.quantity);
        const product = productMap.get(String(item.product));
        const previousStock = product.stock;
        const newStock = previousStock - requestedQty;

        await Product.findByIdAndUpdate(
          item.product,
          { $inc: { stock: -requestedQty } }, // $inc with a negative number subtracts
          { session }
        );

        await StockHistory.create(
          [
            {
              product: item.product,
              type: "PURCHASE_RETURN",
              quantity: requestedQty,
              previousStock,
              newStock,
              referenceId: purchase._id,
              referenceModel: "Purchase",
            },
          ],
          { session }
        );

        // Keep the in-memory product stock in sync (defensive, in case a
        // future change allows the same product to appear more than once).
        product.stock = newStock;

        // Update this item's running returnedQuantity on the purchase doc.
        const purchaseItem = purchaseItemMap.get(String(item.product));
        purchaseItem.returnedQuantity = (purchaseItem.returnedQuantity || 0) + requestedQty;
      }

      // Recompute the overall returnStatus from every item's state.
      const allFullyReturned = purchase.items.every((pi) => pi.returnedQuantity >= pi.quantity);
      const anyReturned = purchase.items.some((pi) => pi.returnedQuantity > 0);
      purchase.returnStatus = allFullyReturned ? "full" : anyReturned ? "partial" : "none";

      await purchase.save({ session });
    });

    // 6. Fetch again, populated, for a useful response (same shape as other endpoints)
    const populatedPurchase = await Purchase.findById(purchase._id)
      .populate("supplier", "name phone")
      .populate("items.product", "name unit sellingPrice");

    return res.status(200).json({
      success: true,
      message: purchase.returnStatus === "full" ? "Purchase fully returned and stock updated" : "Purchase return processed and stock updated",
      data: populatedPurchase,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to process purchase return", error: error.message });
  } finally {
    session.endSession();
  }
};

// @desc    Delete a purchase record
// @route   DELETE /api/purchases/:id
// @access  Private
//
// NOTE: This only deletes the purchase record itself. It does NOT reverse
// the stock that was added when the purchase was created, and it does NOT
// delete the related StockHistory records either. Prefer `returnPurchase`
// above for reversing stock on a purchase — it keeps the record and audit
// trail intact. This raw delete is left as-is for existing callers/behavior.
export const deletePurchase = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid purchase id" });
    }

    const purchase = await Purchase.findByIdAndDelete(id);

    if (!purchase) {
      return res.status(404).json({ success: false, message: "Purchase not found" });
    }

    return res.status(200).json({ success: true, message: "Purchase deleted successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to delete purchase", error: error.message });
  }
};