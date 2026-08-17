import Sale from "../models/saleModel.js";
import Purchase from "../models/purchaseModel.js";
import Product from "../models/productmodel.js";

// Small shared helper: build a { $gte, $lte } date filter object from
// optional startDate/endDate query params. Returns null if neither is given.
const buildDateFilter = (startDate, endDate) => {
  if (!startDate && !endDate) return null;

  const filter = {};
  if (startDate) filter.$gte = new Date(startDate);
  if (endDate) filter.$lte = new Date(endDate);
  return filter;
};

// @desc    Sales report — total sales amount, count, and list, filtered by date range
// @route   GET /api/reports/sales
// @query   startDate=, endDate= (optional, format YYYY-MM-DD)
// @access  Private
export const getSalesReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const filter = {};
    const dateFilter = buildDateFilter(startDate, endDate);
    if (dateFilter) filter.saleDate = dateFilter;

    const sales = await Sale.find(filter)
      .populate("customer", "name phone")
      .populate("items.product", "name unit")
      .sort({ saleDate: -1 });

    const totalSalesAmount = sales.reduce((sum, sale) => sum + sale.grandTotal, 0);

    return res.status(200).json({
      success: true,
      data: {
        totalSalesAmount,
        numberOfSales: sales.length,
        sales,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to generate sales report", error: error.message });
  }
};

// @desc    Purchase report — total purchase amount, count, and list, filtered by date range
// @route   GET /api/reports/purchases
// @query   startDate=, endDate= (optional, format YYYY-MM-DD)
// @access  Private
export const getPurchaseReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const filter = {};
    const dateFilter = buildDateFilter(startDate, endDate);
    if (dateFilter) filter.purchaseDate = dateFilter;

    const purchases = await Purchase.find(filter)
      .populate("supplier", "name phone")
      .populate("items.product", "name unit")
      .sort({ purchaseDate: -1 });

    const totalPurchaseAmount = purchases.reduce((sum, purchase) => sum + purchase.subtotal, 0);

    return res.status(200).json({
      success: true,
      data: {
        totalPurchaseAmount,
        numberOfPurchases: purchases.length,
        purchases,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to generate purchase report", error: error.message });
  }
};

// @desc    Stock report — current stock level and low-stock status for every product
// @route   GET /api/reports/stock
// @access  Private
export const getStockReport = async (req, res) => {
  try {
    const products = await Product.find().sort({ name: 1 });

    const stockReport = products.map((product) => ({
      productId: product._id,
      name: product.name,
      barcode: product.barcode,
      stock: product.stock,
      unit: product.unit,
      lowStockLimit: product.lowStockLimit,
      isLowStock: product.stock <= product.lowStockLimit,
    }));

    return res.status(200).json({
      success: true,
      count: stockReport.length,
      data: stockReport,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to generate stock report", error: error.message });
  }
};

// @desc    Profit report — profit = (sellingPrice - purchasePrice) x quantity, from sales in a date range
// @route   GET /api/reports/profit
// @query   startDate=, endDate= (optional, format YYYY-MM-DD)
// @access  Private
//
// HOW PROFIT IS CALCULATED (explained):
// Each Sale stores the sellingPrice that was charged AT THE TIME of that
// sale (this is correct and shouldn't change later). However, a Sale does
// NOT store the purchasePrice — that's a Product-level field which can
// change over time as you restock at different prices.
// For this simple report, we use each product's CURRENT purchasePrice
// (from the Product collection right now) to estimate profit. This is an
// approximation — if a product's purchase price has changed since it was
// sold, the profit shown here uses today's cost, not the historical cost.
// A more precise "profit at time of sale" would require storing
// purchasePrice on the sale item itself, which is a bigger change outside
// this simple report module.
export const getProfitReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const filter = {};
    const dateFilter = buildDateFilter(startDate, endDate);
    if (dateFilter) filter.saleDate = dateFilter;

    const sales = await Sale.find(filter).populate("items.product", "name purchasePrice");

    let totalProfit = 0;
    const breakdown = [];

    for (const sale of sales) {
      let saleProfit = 0;

      for (const item of sale.items) {
        // item.product is populated, but guard in case a product was deleted later
        const currentPurchasePrice = item.product?.purchasePrice ?? 0;
        const itemProfit = (item.sellingPrice - currentPurchasePrice) * item.quantity;
        saleProfit += itemProfit;
      }

      totalProfit += saleProfit;

      breakdown.push({
        saleId: sale._id,
        invoiceNumber: sale.invoiceNumber,
        saleDate: sale.saleDate,
        profit: saleProfit,
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        totalProfit,
        numberOfSales: sales.length,
        breakdown,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to generate profit report", error: error.message });
  }
};