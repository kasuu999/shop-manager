import mongoose from "mongoose";
import Supplier from "../models/supplierModel.js";

// @desc    Create a new supplier
// @route   POST /api/suppliers
// @access  Private
export const createSupplier = async (req, res) => {
  try {
    const { name, phone, email, address } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ success: false, message: "name and phone are required" });
    }

    const supplier = await Supplier.create({ name, phone, email, address });

    return res.status(201).json({ success: true, data: supplier });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to create supplier", error: error.message });
  }
};

// @desc    Get all suppliers (supports search by name or phone, pagination)
// @route   GET /api/suppliers
// @query   search= -> matches name or phone (partial match)
// @query   page=, limit= -> pagination
// @access  Private
export const getSuppliers = async (req, res) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;

    const filter = {};

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
      ];
    }

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.max(parseInt(limit, 10) || 20, 1);

    const [suppliers, total] = await Promise.all([
      Supplier.find(filter)
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),
      Supplier.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      count: suppliers.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      data: suppliers,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to fetch suppliers", error: error.message });
  }
};

// @desc    Get a single supplier by id
// @route   GET /api/suppliers/:id
// @access  Private
export const getSupplierById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid supplier id" });
    }

    const supplier = await Supplier.findById(id);

    if (!supplier) {
      return res.status(404).json({ success: false, message: "Supplier not found" });
    }

    return res.status(200).json({ success: true, data: supplier });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to fetch supplier", error: error.message });
  }
};

// @desc    Update a supplier
// @route   PUT /api/suppliers/:id
// @access  Private
export const updateSupplier = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, email, address } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid supplier id" });
    }

    const supplier = await Supplier.findById(id);
    if (!supplier) {
      return res.status(404).json({ success: false, message: "Supplier not found" });
    }

    if (name !== undefined) supplier.name = name;
    if (phone !== undefined) supplier.phone = phone;
    if (email !== undefined) supplier.email = email;
    if (address !== undefined) supplier.address = address;

    await supplier.save();

    return res.status(200).json({ success: true, data: supplier });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to update supplier", error: error.message });
  }
};

// @desc    Delete a supplier
// @route   DELETE /api/suppliers/:id
// @access  Private
export const deleteSupplier = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid supplier id" });
    }

    const supplier = await Supplier.findByIdAndDelete(id);

    if (!supplier) {
      return res.status(404).json({ success: false, message: "Supplier not found" });
    }

    return res.status(200).json({ success: true, message: "Supplier deleted successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to delete supplier", error: error.message });
  }
};