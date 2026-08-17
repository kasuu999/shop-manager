/**
 * REPLACE your existing customerRoute.js with this.
 *
 * Rule applied: staff can view, create, and update customers. Deleting a
 * customer record is left to owner only.
 */

import express from "express";
import {
  createCustomer,
  getCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
} from "../controllers/customerController.js";
import { protect } from "../middlewares/userMiddlware.js";
import { authorize } from "../middlewares/authorizeMiddleware.js";

const router = express.Router();

router.use(protect);

router.route("/")
  .get(authorize("owner", "staff"), getCustomers)
  .post(authorize("owner", "staff"), createCustomer);

router.route("/:id")
  .get(authorize("owner", "staff"), getCustomerById)
  .put(authorize("owner", "staff"), updateCustomer)
  .delete(authorize("owner"), deleteCustomer); // deleting customers restricted to owner

export default router;