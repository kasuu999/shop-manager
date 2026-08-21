/**
 * REPLACE your existing saleRoute.js with this.
 *
 * Rule applied: staff can create/update sales (billing is their day-to-day
 * job). Deleting a sale record is left to owner only, since deleting
 * financial records is more sensitive than creating them.
 */

import express from "express";
import {
  createSale,
  getSales,
  getSaleById,
  cancelSale,
  deleteSale,
} from "../controllers/saleController.js";
import { protect } from "../middlewares/userMiddlware.js";
import { authorize } from "../middlewares/authorizeMiddleware.js";

const router = express.Router();

router.use(protect);

router.route("/")
  .get(authorize("owner", "staff"), getSales)
  .post(authorize("owner", "staff"), createSale);

router.route("/:id")
  .get(authorize("owner", "staff"), getSaleById)
  .delete(authorize("owner"), deleteSale); // deleting sales restricted to owner

// Cancelling a sale reverses stock/financial records, same sensitivity as
// deleting one, so it's restricted to owner as well.
router.patch("/:id/cancel", authorize("owner"), cancelSale);

export default router;