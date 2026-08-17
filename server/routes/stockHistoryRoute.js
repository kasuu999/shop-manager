import express from "express";
import {
  getStockHistory,
  getStockHistoryByProduct,
} from "../controllers/stockHistoryController.js";
import { protect } from "../middlewares/userMiddlware.js"; // same auth middleware used across other modules

const router = express.Router();

router.use(protect);

// GET /api/stock-history -> all records (supports ?product=, ?type=, ?startDate=, ?endDate=, ?page=, ?limit=)
router.get("/", getStockHistory);

// GET /api/stock-history/:productId -> records for a single product
router.get("/:productId", getStockHistoryByProduct);

// NOTE: intentionally no POST/PUT/DELETE here. Stock history records are only
// ever created automatically by the Purchase and Sale controllers — never
// directly through this API.

export default router;