/**
 * REPLACE your existing purchaseRoute.js with this.
 *
 * Rule applied: staff can VIEW purchases (useful for checking what's
 * incoming), but only owner can create or delete purchases, per your
 * requirement ("Staff should NOT be allowed to: create/delete purchases").
 */

import express from "express";
import {
  createPurchase,
  getPurchases,
  getPurchaseById,
  returnPurchase,
  deletePurchase,
} from "../controllers/purchaseController.js";
import { protect } from "../middlewares/userMiddlware.js";
import { authorize } from "../middlewares/authorizeMiddleware.js";

const router = express.Router();

router.use(protect);

router.route("/")
  .get(authorize("owner", "staff"), getPurchases)
  .post(authorize("owner"), createPurchase);

router.route("/:id")
  .get(authorize("owner", "staff"), getPurchaseById)
  .delete(authorize("owner"), deletePurchase);

// Purchase return reverses stock/financial records, same restriction as
// creating/deleting a purchase — owner only.
router.post("/:id/return", authorize("owner"), returnPurchase);

export default router;