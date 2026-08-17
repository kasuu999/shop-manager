/**
 * REPLACE your existing supplierRoute.js with this.
 *
 * Rule applied: staff should NOT manage suppliers at all, per your
 * requirements ("Staff should NOT be allowed to: manage suppliers"). So
 * every supplier route — including just viewing the list — is owner-only.
 */

import express from "express";
import {
  createSupplier,
  getSuppliers,
  getSupplierById,
  updateSupplier,
  deleteSupplier,
} from "../controllers/supplierController.js";
import { protect } from "../middlewares/userMiddlware.js";
import { authorize } from "../middlewares/authorizeMiddleware.js";

const router = express.Router();

router.use(protect);
router.use(authorize("owner")); // entire supplier module is owner-only

router.route("/")
  .get(getSuppliers)
  .post(createSupplier);

router.route("/:id")
  .get(getSupplierById)
  .put(updateSupplier)
  .delete(deleteSupplier);

export default router;