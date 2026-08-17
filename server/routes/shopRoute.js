import express from "express";
import { createShop, getShop, updateShop } from "../controllers/shopController.js";
import { protect } from "../middlewares/userMiddlware.js";
import { authorize } from "../middlewares/authorizeMiddleware.js";

const router = express.Router();

router.use(protect);

// Owner sets up the shop the first time
router.post("/", authorize("owner"), createShop);

// Both owner and staff can view shop info (e.g. for printing on a receipt)
router.get("/", authorize("owner", "staff"), getShop);

// Only owner can change shop info
router.put("/", authorize("owner"), updateShop);

export default router;