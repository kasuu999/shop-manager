import mongoose from "mongoose";
import Category from "../models/catagoryModel.js";

// @desc    Create a new category
// @route   POST /api/categories
// @access  Private
export const createCategory = async (req, res) => {
  try {
    const { name, description, parent, isActive } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: "Category name is required" });
    }

    if (parent && !mongoose.Types.ObjectId.isValid(parent)) {
      return res.status(400).json({ success: false, message: "Invalid parent category id" });
    }

    const existing = await Category.findOne({ name: name.trim() });
    if (existing) {
      return res.status(409).json({ success: false, message: "Category already exists" });
    }

    const category = await Category.create({
      name,
      description,
      parent: parent || null,
      isActive,
      createdBy: req.user._id, // req.user set by your existing auth middleware
    });

    return res.status(201).json({ success: true, data: category });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to create category", error: error.message });
  }
};

// @desc    Get all categories (supports ?isActive=true&search=&page=&limit=)
// @route   GET /api/categories
// @access  Private
export const getCategories = async (req, res) => {
  try {
    const { search, isActive, page = 1, limit = 20 } = req.query;

    const filter = {};
    if (isActive !== undefined) filter.isActive = isActive === "true";
    if (search) filter.name = { $regex: search, $options: "i" };

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.max(parseInt(limit, 10) || 20, 1);

    const [categories, total] = await Promise.all([
      Category.find(filter)
        .populate("parent", "name slug")
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),
      Category.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      count: categories.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      data: categories,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to fetch categories", error: error.message });
  }
};

// @desc    Get a single category by id
// @route   GET /api/categories/:id
// @access  Private
export const getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid category id" });
    }

    const category = await Category.findById(id).populate("parent", "name slug");

    if (!category) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }

    return res.status(200).json({ success: true, data: category });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to fetch category", error: error.message });
  }
};

// @desc    Update a category
// @route   PUT /api/categories/:id
// @access  Private
export const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, parent, isActive } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid category id" });
    }

    if (parent) {
      if (!mongoose.Types.ObjectId.isValid(parent)) {
        return res.status(400).json({ success: false, message: "Invalid parent category id" });
      }
      if (parent === id) {
        return res.status(400).json({ success: false, message: "A category cannot be its own parent" });
      }
    }

    if (name) {
      const duplicate = await Category.findOne({ name: name.trim(), _id: { $ne: id } });
      if (duplicate) {
        return res.status(409).json({ success: false, message: "Another category with this name already exists" });
      }
    }

    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }

    if (name !== undefined) category.name = name;
    if (description !== undefined) category.description = description;
    if (parent !== undefined) category.parent = parent || null;
    if (isActive !== undefined) category.isActive = isActive;

    await category.save(); // triggers pre-save slug regeneration if name changed

    return res.status(200).json({ success: true, data: category });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to update category", error: error.message });
  }
};

// @desc    Delete a category
// @route   DELETE /api/categories/:id
// @access  Private
export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid category id" });
    }

    const childExists = await Category.exists({ parent: id });
    if (childExists) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete a category that has subcategories. Reassign or delete them first.",
      });
    }

    const category = await Category.findByIdAndDelete(id);

    if (!category) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }

    return res.status(200).json({ success: true, message: "Category deleted successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to delete category", error: error.message });
  }
};