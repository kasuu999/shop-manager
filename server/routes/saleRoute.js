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

export default router;