import mongoose from "mongoose";
import Product from "../models/productmodel.js";
import fs from "node:fs";
import uploadToCloudinary,{cloudinary} from '../config/cloudinary.js'

// @desc    Create a new product
// @route   POST /api/products
// @access  Private
export const createProduct = async (req, res) => {
  try {
    const {
      name,
      category,
      barcode,
      purchasePrice,
      sellingPrice,
      unit,
      stock,
      lowStockLimit,
      image,
    } = req.body;

    // Basic validation for required fields
    if (!name || !category || purchasePrice === undefined || sellingPrice === undefined || !unit) {
      return res.status(400).json({
        success: false,
        message: "name, category, purchasePrice, sellingPrice and unit are required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(category)) {
      return res.status(400).json({ success: false, message: "Invalid category id" });
    }

    if (purchasePrice < 0 || sellingPrice < 0) {
      return res.status(400).json({ success: false, message: "Prices cannot be negative" });
    }

    // Check barcode uniqueness only if barcode is provided
    if (barcode) {
      const existingBarcode = await Product.findOne({ barcode });
      if (existingBarcode) {
        return res.status(409).json({ success: false, message: "A product with this barcode already exists" });
      }
    }

    const product = await Product.create({
      name,
      category,
      barcode,
      purchasePrice,
      sellingPrice,
      unit,
      stock,
      lowStockLimit,
      image,
    });

    return res.status(201).json({ success: true, data: product });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to create product", error: error.message });
  }
};

// @desc    Get all products (supports search, barcode search, category filter, pagination)
// @route   GET /api/products
// @query   search=  -> search by product name (partial match)
// @query   barcode= -> search by exact barcode
// @query   category= -> filter by category id
// @query   page=, limit= -> pagination
// @access  Private
export const getProducts = async (req, res) => {
  try {
    const { search, barcode, category, page = 1, limit = 20 } = req.query;

    const filter = {};

    if (search) {
      filter.name = { $regex: search, $options: "i" }; // case-insensitive partial match
    }

    if (barcode) {
      filter.barcode = barcode; // exact match, useful for barcode scanner lookups later
    }

    if (category) {
      if (!mongoose.Types.ObjectId.isValid(category)) {
        return res.status(400).json({ success: false, message: "Invalid category id" });
      }
      filter.category = category;
    }

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.max(parseInt(limit, 10) || 20, 1);

    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate("category", "name slug")
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),
      Product.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      count: products.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      data: products,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to fetch products", error: error.message });
  }
};

// @desc    Get a single product by id
// @route   GET /api/products/:id
// @access  Private
export const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid product id" });
    }

    const product = await Product.findById(id).populate("category", "name slug");

    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    return res.status(200).json({ success: true, data: product });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to fetch product", error: error.message });
  }
};

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private
export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      category,
      barcode,
      purchasePrice,
      sellingPrice,
      unit,
      stock,
      lowStockLimit,
      image,
    } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid product id" });
    }

    if (category && !mongoose.Types.ObjectId.isValid(category)) {
      return res.status(400).json({ success: false, message: "Invalid category id" });
    }

    if (purchasePrice !== undefined && purchasePrice < 0) {
      return res.status(400).json({ success: false, message: "Purchase price cannot be negative" });
    }

    if (sellingPrice !== undefined && sellingPrice < 0) {
      return res.status(400).json({ success: false, message: "Selling price cannot be negative" });
    }

    // If barcode is being changed, make sure it's not already used by another product
    if (barcode) {
      const duplicate = await Product.findOne({ barcode, _id: { $ne: id } });
      if (duplicate) {
        return res.status(409).json({ success: false, message: "Another product with this barcode already exists" });
      }
    }

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    if (name !== undefined) product.name = name;
    if (category !== undefined) product.category = category;
    if (barcode !== undefined) product.barcode = barcode;
    if (purchasePrice !== undefined) product.purchasePrice = purchasePrice;
    if (sellingPrice !== undefined) product.sellingPrice = sellingPrice;
    if (unit !== undefined) product.unit = unit;
    if (stock !== undefined) product.stock = stock;
    if (lowStockLimit !== undefined) product.lowStockLimit = lowStockLimit;
    if (image !== undefined) product.image = image;

    await product.save();

    return res.status(200).json({ success: true, data: product });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to update product", error: error.message });
  }
};

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private
export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid product id" });
    }

    const product = await Product.findByIdAndDelete(id);

    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    return res.status(200).json({ success: true, message: "Product deleted successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to delete product", error: error.message });
  }
};

export const getProductByBarcode = async (req, res) => {
  try {
    const { barcode } = req.params;
 
    // Basic validation — barcode must be a non-empty string
    if (!barcode || !barcode.trim()) {
      return res.status(400).json({ success: false, message: "Barcode is required" });
    }
 
    const product = await Product.findOne({ barcode: barcode.trim() }).populate("category", "name slug");
 
    if (!product) {
      return res.status(404).json({ success: false, message: "No product found with this barcode" });
    }
 
    // Return full product info needed for billing and editing
    const billingInfo = {
      _id: product._id,
      id: product._id,
      name: product.name,
      barcode: product.barcode,
      sellingPrice: product.sellingPrice,
      purchasePrice: product.purchasePrice,
      unit: product.unit,
      stock: product.stock,
      lowStockLimit: product.lowStockLimit,
      category: product.category,
      image: product.image,
    };
 
    return res.status(200).json({ success: true, data: billingInfo });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to fetch product by barcode", error: error.message });
  }
};
 

const getPublicIdFromUrl = (url) => {
  try {
    const parts = url.split("/upload/")[1]; // "v169.../products/abc123.jpg"
    const withoutVersion = parts.split("/").slice(1).join("/"); // "products/abc123.jpg"
    const withoutExtension = withoutVersion.substring(0, withoutVersion.lastIndexOf("."));
    return withoutExtension; // "products/abc123"
  } catch {
    return null;
  }
};
 
// @desc    Upload or update a product's image
// @route   PUT /api/products/:id/image
// @access  Private (owner only)
export const uploadProductImage = async (req, res) => {
  try {
    const { id } = req.params;
 
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid product id" });
    }
 
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No image file was uploaded" });
    }
 
    const product = await Product.findById(id);
    if (!product) {
      // Clean up the temp file since we're not using it
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ success: false, message: "Product not found" });
    }
 
    // Upload the new image to Cloudinary using the local file path
    const uploadResult = await uploadToCloudinary(req.file.path);
 
    if (!uploadResult) {
      return res.status(500).json({ success: false, message: "Failed to upload image to Cloudinary" });
    }
 
    // The temp file was already deleted by uploadToCloudinary on failure.
    // On success, we still have it on disk — clean it up now that it's
    // safely stored on Cloudinary.
    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
 
    // If there was an old image, delete it from Cloudinary AFTER the new
    // one is successfully uploaded, so a failed new upload never leaves the
    // product with no image at all.
    if (product.image) {
      const oldPublicId = getPublicIdFromUrl(product.image);
      if (oldPublicId) {
        await cloudinary.uploader.destroy(oldPublicId).catch(() => {});
      }
    }
 
    product.image = uploadResult.secure_url;
    await product.save();
 
    return res.status(200).json({ success: true, data: product });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to upload product image", error: error.message });
  }
};
