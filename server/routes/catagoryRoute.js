import express from "express";
import {
  createCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
} from "../controllers/catagoryController.js";
import { protect } from "../middlewares/userMiddlware.js";

const router = express.Router();

// All category routes require authentication
router.use(protect);

router.route("/")
  .get(getCategories)
  .post(createCategory);

router.route("/:id")
  .get(getCategoryById)
  .put(updateCategory)
  .delete(deleteCategory);

export default router;