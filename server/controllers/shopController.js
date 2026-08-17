import Shop from "../models/shopModel.js";

// @desc    Create the shop record (only works if none exists yet)
// @route   POST /api/shop
// @access  Private (owner only)
//
// SINGLE-SHOP LOGIC (explained):
// Since this app is for ONE shop only, we never want more than one Shop
// document to exist in the whole collection. Before creating anything, we
// check `Shop.findOne()` with no filter — this just grabs "any one shop
// document, if one exists at all". If it finds something, we block the
// request instead of creating a second one. This is a simple and clear way
// to enforce "singleton" behavior without needing a fixed/hardcoded ID.
export const createShop = async (req, res) => {
  try {
    const existingShop = await Shop.findOne();
    if (existingShop) {
      return res.status(400).json({
        success: false,
        message: "Shop is already set up. Use PUT /api/shop to update it instead.",
      });
    }

    const { name, phone, address, email, gstNumber } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: "Shop name is required" });
    }

    const shop = await Shop.create({ name, phone, address, email, gstNumber });

    return res.status(201).json({ success: true, data: shop });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to create shop", error: error.message });
  }
};

// @desc    Get the shop information
// @route   GET /api/shop
// @access  Private (owner and staff)
export const getShop = async (req, res) => {
  try {
    const shop = await Shop.findOne();

    if (!shop) {
      return res.status(404).json({ success: false, message: "Shop has not been set up yet" });
    }

    return res.status(200).json({ success: true, data: shop });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to fetch shop", error: error.message });
  }
};

// @desc    Update the shop information
// @route   PUT /api/shop
// @access  Private (owner only)
export const updateShop = async (req, res) => {
  try {
    const { name, phone, address, email, gstNumber } = req.body;

    const shop = await Shop.findOne();

    if (!shop) {
      return res.status(404).json({
        success: false,
        message: "Shop has not been set up yet. Use POST /api/shop first.",
      });
    }

    if (name !== undefined) shop.name = name;
    if (phone !== undefined) shop.phone = phone;
    if (address !== undefined) shop.address = address;
    if (email !== undefined) shop.email = email;
    if (gstNumber !== undefined) shop.gstNumber = gstNumber;

    await shop.save();

    return res.status(200).json({ success: true, data: shop });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to update shop", error: error.message });
  }
};