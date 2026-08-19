import express from "express";
import {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  getProductByBarcode,
  uploadProductImage,
} from "../controllers/productController.js";
import { protect } from "../middlewares/userMiddlware.js";
import { authorize } from "../middlewares/authorizeMiddleware.js";
import upload from "../middlewares/uploadMiddleware.js";

const router = express.Router();

router.use(protect);

router.get("/", authorize("owner", "staff"), getProducts);
router.get("/barcode/:barcode", authorize("owner", "staff"), getProductByBarcode);
router.post("/", authorize("owner","staff"), createProduct);

router.put(
  "/:id/image",
  authorize("owner"),
  upload.single("image"),
  uploadProductImage
);

router.route("/:id")
  .get(authorize("owner", "staff"), getProductById)
  .put(authorize("owner"), updateProduct)
  .delete(authorize("owner"), deleteProduct);

export default router;