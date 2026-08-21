import mongoose from "mongoose";
import StockHistory from "../models/stockHistoryModel.js";

// @desc    Get all stock history records (supports filtering by product, type, date)
// @route   GET /api/stock-history
// @query   product=   -> filter by product id
// @query   type=      -> filter by "PURCHASE" or "SALE"
// @query   startDate=, endDate= -> filter by createdAt range (YYYY-MM-DD)
// @query   page=, limit= -> pagination
// @access  Private
export const getStockHistory = async (req, res) => {
  try {
    const { product, type, startDate, endDate, page = 1, limit = 20 } = req.query;

    const filter = {};

    if (product) {
      if (!mongoose.Types.ObjectId.isValid(product)) {
        return res.status(400).json({ success: false, message: "Invalid product id" });
      }
      filter.product = product;
    }

    if (type) {
      if (!["PURCHASE", "SALE", "SALE_RETURN"].includes(type)) {
        return res.status(400).json({ success: false, message: "type must be PURCHASE, SALE or SALE_RETURN" });
      }
      filter.type = type;
    }

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.max(parseInt(limit, 10) || 20, 1);

    const [history, total] = await Promise.all([
      StockHistory.find(filter)
        .populate("product", "name unit")
        .populate("referenceId") // uses refPath, so this pulls from Purchase or Sale automatically
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),
      StockHistory.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      count: history.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      data: history,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to fetch stock history", error: error.message });
  }
};

// @desc    Get stock history for a single product
// @route   GET /api/stock-history/:productId
// @query   type=, startDate=, endDate=, page=, limit= -> same filters as above, scoped to one product
// @access  Private
export const getStockHistoryByProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const { type, startDate, endDate, page = 1, limit = 20 } = req.query;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ success: false, message: "Invalid product id" });
    }

    const filter = { product: productId };

    if (type) {
      if (!["PURCHASE", "SALE", "SALE_RETURN"].includes(type)) {
        return res.status(400).json({ success: false, message: "type must be PURCHASE, SALE or SALE_RETURN" });
      }
      filter.type = type;
    }

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.max(parseInt(limit, 10) || 20, 1);

    const [history, total] = await Promise.all([
      StockHistory.find(filter)
        .populate("product", "name unit")
        .populate("referenceId")
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),
      StockHistory.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      count: history.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      data: history,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to fetch product stock history", error: error.message });
  }
};