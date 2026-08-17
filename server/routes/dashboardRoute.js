/**
 * REPLACE your existing dashboardRoute.js with this.
 *
 * Rule applied: "Staff should NOT be allowed to: access dashboard
 * statistics" — so this entire route is owner-only.
 */

import express from "express";
import { getDashboardSummary } from "../controllers/dashboardController.js";
import { protect } from "../middlewares/userMiddlware.js";
import { authorize } from "../middlewares/authorizeMiddleware.js";

const router = express.Router();

router.use(protect);
router.use(authorize("owner")); // dashboard is owner-only

router.get("/", getDashboardSummary);

export default router;