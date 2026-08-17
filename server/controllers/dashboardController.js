import Product from "../models/productmodel.js";
import Customer from "../models/customerModel.js";
import Supplier from "../models/supplierModel.js";
import Sale from "../models/saleModel.js";
import Purchase from "../models/purchaseModel.js";

// @desc    Get a business summary for the logged-in shop
// @route   GET /api/dashboard
// @access  Private
//
// This controller does NOT create or duplicate any data — it only READS
// from the existing Product, Customer, Supplier, Sale, and Purchase
// collections and puts together a summary object.
export const getDashboardSummary = async (req, res) => {
  try {
    // 1. Work out "today" as a date range: from midnight today to midnight tomorrow.
    // This is how we filter sales/purchases that happened "today" regardless
    // of what time it currently is.
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const startOfTomorrow = new Date(startOfToday);
    startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);

    const todayDateFilter = { $gte: startOfToday, $lt: startOfTomorrow };

    // 2. Run all the independent reads in parallel for speed (none of these
    // depend on each other, so there's no need to wait one-by-one).
    const [
      todaysSalesResult,
      todaysPurchasesResult,
      totalProducts,
      totalCustomers,
      totalSuppliers,
      lowStockCount,
      recentSales,
      recentPurchases,
    ] = await Promise.all([
      // Sum of grandTotal for every sale made today
      Sale.aggregate([
        { $match: { saleDate: todayDateFilter } },
        { $group: { _id: null, total: { $sum: "$grandTotal" } } },
      ]),

      // Sum of subtotal for every purchase made today
      Purchase.aggregate([
        { $match: { purchaseDate: todayDateFilter } },
        { $group: { _id: null, total: { $sum: "$subtotal" } } },
      ]),

      Product.countDocuments(),
      Customer.countDocuments(),
      Supplier.countDocuments(),

      // Low stock = stock is at or below the product's own lowStockLimit.
      // $expr lets us compare two fields of the same document to each other.
      Product.countDocuments({ $expr: { $lte: ["$stock", "$lowStockLimit"] } }),

      Sale.find()
        .populate("customer", "name phone")
        .sort({ saleDate: -1 })
        .limit(5),

      Purchase.find()
        .populate("supplier", "name phone")
        .sort({ purchaseDate: -1 })
        .limit(5),
    ]);

    // aggregate() returns an array; if there were no matching documents,
    // the array is empty, so we default the total to 0 in that case.
    const todaysSalesTotal = todaysSalesResult[0]?.total || 0;
    const todaysPurchaseTotal = todaysPurchasesResult[0]?.total || 0;

    return res.status(200).json({
      success: true,
      data: {
        todaysSalesTotal,
        todaysPurchaseTotal,
        totalProducts,
        totalCustomers,
        totalSuppliers,
        lowStockCount,
        recentSales,
        recentPurchases,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to fetch dashboard summary", error: error.message });
  }
};