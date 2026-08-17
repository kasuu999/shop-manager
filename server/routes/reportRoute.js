/**
 * REPLACE your existing reportRoute.js with this.
 *
 * Rule applied: "Staff should NOT be allowed to: view reports" — so this
 * entire route is owner-only.
 */

import express from "express";
import {
  getSalesReport,
  getPurchaseReport,
  getStockReport,
  getProfitReport,
} from "../controllers/reportController.js";
import { protect } from "../middlewares/userMiddlware.js";
import { authorize } from "../middlewares/authorizeMiddleware.js";

const router = express.Router();

router.use(protect);
router.use(authorize("owner")); // all reports are owner-only

router.get("/sales/report", getSalesReport);
router.get("/purchases/report", getPurchaseReport);
router.get("/stocks/report", getStockReport);
router.get("/profit/report", getProfitReport);

export default router;