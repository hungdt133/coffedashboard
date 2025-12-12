const express = require("express");
const router = express.Router();

const Promotion = require("../models/promotions.model");
const Product = require("../models/products.model");

// --- Helper function: Validate promotion uniqueness ---
const validatePromotion = async (scope, productIds, categories, comboItems, excludePromotionId = null) => {
    const errors = [];

    // Build base query to exclude current promotion (for updates)
    const baseQuery = excludePromotionId ? { _id: { $ne: excludePromotionId } } : {};

    if (scope === "PRODUCT" && productIds && productIds.length > 0) {
        // Check if any productId already has a promotion
        for (const productId of productIds) {
            const existing = await Promotion.findOne({
                ...baseQuery,
                scope: "PRODUCT",
                productIds: productId
            });

            if (existing) {
                errors.push(`Product ${productId} already has an active promotion (ID: ${existing._id}). Please update the existing promotion instead.`);
            }
        }
    }

    if (scope === "CATEGORY" && categories && categories.length > 0) {
        // Check if any category already has a promotion
        for (const category of categories) {
            const existing = await Promotion.findOne({
                ...baseQuery,
                scope: "CATEGORY",
                categories: category
            });

            if (existing) {
                errors.push(`Category "${category}" already has an active promotion (ID: ${existing._id}). Please update the existing promotion instead.`);
            }
        }
    }

    if (scope === "COMBO" && comboItems && comboItems.length > 0) {
        // Sort comboItems for consistent comparison
        const sortedComboItems = [...comboItems].sort((a, b) =>
            a.productId.toString().localeCompare(b.productId.toString())
        );

        // Find all existing combo promotions
        const existingCombos = await Promotion.find({
            ...baseQuery,
            scope: "COMBO"
        });

        // Check if the same combo already exists
        for (const existingCombo of existingCombos) {
            const existingSorted = [...existingCombo.comboItems].sort((a, b) =>
                a.productId.toString().localeCompare(b.productId.toString())
            );

            // Compare if combo items match
            if (existingSorted.length === sortedComboItems.length) {
                const isMatch = existingSorted.every((item, index) => {
                    const sortedItem = sortedComboItems[index];
                    return item.productId.toString() === sortedItem.productId.toString()
                        && item.requiredQty === sortedItem.requiredQty;
                });

                if (isMatch) {
                    errors.push(`This combo already exists in promotion (ID: ${existingCombo._id}). Please update the existing promotion instead.`);
                    break;
                }
            }
        }
    }

    return errors;
};

// --- API: Get all promotions ---
router.get("/", async (req, res) => {
    try {
        const { isActive, scope, type } = req.query;

        // Build filter object
        const filter = {};
        if (isActive !== undefined) {
            filter.isActive = isActive === "true";
        }
        if (scope) {
            filter.scope = scope;
        }
        if (type) {
            filter.type = type;
        }

        const promotions = await Promotion.find(filter)
            .sort({ createdAt: -1 });

        res.json(promotions);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- API: Get active promotions (currently valid) ---
router.get("/active", async (req, res) => {
    try {
        const now = new Date();

        const promotions = await Promotion.find({
            isActive: true,
            startDate: { $lte: now },
            endDate: { $gte: now }
        }).sort({ startDate: -1 });

        res.json(promotions);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- API: Get promotion by ID ---
router.get("/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const promotion = await Promotion.findById(id);

        if (!promotion) {
            return res.status(404).json({ error: "Promotion not found" });
        }

        res.json(promotion);
    } catch (err) {
        if (err.name === "CastError") {
            return res.status(400).json({ error: "Invalid promotion ID" });
        }
        res.status(500).json({ error: err.message });
    }
});

// --- API: Create new promotion ---
router.post("/", async (req, res) => {
    try {
        const {
            name,
            description,
            type,
            scope,
            value,
            startDate,
            endDate,
            minOrderTotal,
            isActive,
            productIds,
            categories,
            comboItems
        } = req.body;

        // Validation
        if (!name || !type || !scope || value === undefined || !startDate || !endDate) {
            return res.status(400).json({
                error: "Missing required fields: name, type, scope, value, startDate, endDate"
            });
        }

        // Validate type enum
        if (!["PERCENT", "FIXED_AMOUNT", "FIXED_PRICE_COMBO"].includes(type)) {
            return res.status(400).json({
                error: "Invalid type. Must be PERCENT, FIXED_AMOUNT, or FIXED_PRICE_COMBO"
            });
        }

        // Validate scope enum
        if (!["ORDER", "PRODUCT", "CATEGORY", "COMBO"].includes(scope)) {
            return res.status(400).json({
                error: "Invalid scope. Must be ORDER, PRODUCT, CATEGORY, or COMBO"
            });
        }

        // Validate scope-specific fields
        if (scope === "PRODUCT" && (!productIds || productIds.length === 0)) {
            return res.status(400).json({
                error: "productIds is required for PRODUCT scope"
            });
        }

        if (scope === "CATEGORY" && (!categories || categories.length === 0)) {
            return res.status(400).json({
                error: "categories is required for CATEGORY scope"
            });
        }

        if (scope === "COMBO" && (!comboItems || comboItems.length === 0)) {
            return res.status(400).json({
                error: "comboItems is required for COMBO scope"
            });
        }

        // *** VALIDATE UNIQUENESS ***
        const validationErrors = await validatePromotion(scope, productIds, categories, comboItems);
        if (validationErrors.length > 0) {
            return res.status(409).json({
                error: "Promotion validation failed",
                details: validationErrors
            });
        }

        const promotionData = {
            name,
            description,
            type,
            scope,
            value,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            minOrderTotal,
            isActive: isActive !== undefined ? isActive : true
        };

        // Add scope-specific fields
        if (scope === "PRODUCT") promotionData.productIds = productIds;
        if (scope === "CATEGORY") promotionData.categories = categories;
        if (scope === "COMBO") promotionData.comboItems = comboItems;

        const promotion = await Promotion.create(promotionData);

        res.status(201).json(promotion);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- API: Update promotion ---
router.put("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const {
            name,
            description,
            type,
            scope,
            value,
            startDate,
            endDate,
            minOrderTotal,
            isActive,
            productIds,
            categories,
            comboItems
        } = req.body;

        const promotion = await Promotion.findById(id);

        if (!promotion) {
            return res.status(404).json({ error: "Promotion not found" });
        }

        // *** VALIDATE UNIQUENESS only when scope-related fields are being updated ***
        let validationErrors = [];
        if (scope !== undefined || productIds !== undefined || categories !== undefined || comboItems !== undefined) {
            // Determine the scope to validate (use new scope if provided, otherwise keep existing)
            const scopeToValidate = scope !== undefined ? scope : promotion.scope;
            const productIdsToValidate = productIds !== undefined ? productIds : promotion.productIds;
            const categoriesToValidate = categories !== undefined ? categories : promotion.categories;
            const comboItemsToValidate = comboItems !== undefined ? comboItems : promotion.comboItems;

            validationErrors = await validatePromotion(
                scopeToValidate,
                productIdsToValidate,
                categoriesToValidate,
                comboItemsToValidate,
                id  // Exclude current promotion from validation
            );
        }

        if (validationErrors.length > 0) {
            return res.status(409).json({
                error: "Promotion validation failed",
                details: validationErrors
            });
        }

        // Build update object
        const updateFields = {};
        if (name !== undefined) updateFields.name = name;
        if (description !== undefined) updateFields.description = description;
        if (type !== undefined) {
            if (!["PERCENT", "FIXED_AMOUNT", "FIXED_PRICE_COMBO"].includes(type)) {
                return res.status(400).json({
                    error: "Invalid type. Must be PERCENT, FIXED_AMOUNT, or FIXED_PRICE_COMBO"
                });
            }
            updateFields.type = type;
        }
        if (scope !== undefined) {
            if (!["ORDER", "PRODUCT", "CATEGORY", "COMBO"].includes(scope)) {
                return res.status(400).json({
                    error: "Invalid scope. Must be ORDER, PRODUCT, CATEGORY, or COMBO"
                });
            }
            updateFields.scope = scope;
        }
        if (value !== undefined) updateFields.value = value;
        if (startDate !== undefined) updateFields.startDate = new Date(startDate);
        if (endDate !== undefined) updateFields.endDate = new Date(endDate);
        if (minOrderTotal !== undefined) updateFields.minOrderTotal = minOrderTotal;
        if (isActive !== undefined) updateFields.isActive = isActive;

        // Update scope-specific fields (only if scope matches or if scope is being changed)
        if (scope !== undefined) {
            // Clear old scope-specific fields
            updateFields.productIds = [];
            updateFields.categories = [];
            updateFields.comboItems = [];
        }

        if (productIds !== undefined && (scope === "PRODUCT" || (scope === undefined && promotion.scope === "PRODUCT"))) {
            updateFields.productIds = productIds;
        }
        if (categories !== undefined && (scope === "CATEGORY" || (scope === undefined && promotion.scope === "CATEGORY"))) {
            updateFields.categories = categories;
        }
        if (comboItems !== undefined && (scope === "COMBO" || (scope === undefined && promotion.scope === "COMBO"))) {
            updateFields.comboItems = comboItems;
        }

        // Use findByIdAndUpdate to avoid pre-save hook issues
        const updatedPromotion = await Promotion.findByIdAndUpdate(
            id,
            updateFields,
            { new: true, runValidators: false } // Skip validation to avoid pre-save hook issues
        );

        res.json(updatedPromotion);
    } catch (err) {
        if (err.name === "CastError") {
            return res.status(400).json({ error: "Invalid promotion ID" });
        }
        res.status(500).json({ error: err.message });
    }
});


// --- API: Delete promotion ---
router.delete("/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const promotion = await Promotion.findById(id);

        if (!promotion) {
            return res.status(404).json({ error: "Promotion not found" });
        }

        await promotion.deleteOne();

        res.json({ message: "Promotion deleted successfully" });
    } catch (err) {
        if (err.name === "CastError") {
            return res.status(400).json({ error: "Invalid promotion ID" });
        }
        res.status(500).json({ error: err.message });
    }
});

// --- API: Calculate applicable promotions for an order ---
router.post("/calculate", async (req, res) => {
    try {
        const { items, subtotal } = req.body;

        if (!items || !Array.isArray(items) || subtotal === undefined) {
            return res.status(400).json({
                error: "Missing required fields: items (array), subtotal (number)"
            });
        }

        // Get active promotions
        const now = new Date();
        const promotions = await Promotion.find({
            isActive: true,
            startDate: { $lte: now },
            endDate: { $gte: now }
        });

        // Get product details for items
        const productIds = items.map(item => item.productId);
        const products = await Product.find({ _id: { $in: productIds } });
        const productMap = {};
        products.forEach(p => productMap[p._id] = p);

        // Count items by product
        const itemCounts = {};
        items.forEach(item => {
            itemCounts[item.productId] = (itemCounts[item.productId] || 0) + item.quantity;
        });

        const applicablePromotions = [];
        let totalDiscount = 0;

        for (const promo of promotions) {
            let discount = 0;
            let applies = false;

            if (promo.scope === "ORDER") {
                if (subtotal >= (promo.minOrderTotal || 0)) {
                    applies = true;
                    if (promo.type === "PERCENT") {
                        discount = subtotal * (promo.value / 100);
                    } else if (promo.type === "FIXED_AMOUNT") {
                        discount = promo.value;
                    }
                }
            } else if (promo.scope === "CATEGORY") {
                const categoryItems = items.filter(item => {
                    const prod = productMap[item.productId];
                    return prod && promo.categories.includes(prod.category);
                });
                if (categoryItems.length > 0) {
                    applies = true;
                    const categorySubtotal = categoryItems.reduce((sum, item) => {
                        const prod = productMap[item.productId];
                        return sum + (prod ? prod.basePrice * item.quantity : 0);
                    }, 0);
                    if (promo.type === "PERCENT") {
                        discount = categorySubtotal * (promo.value / 100);
                    } else if (promo.type === "FIXED_AMOUNT") {
                        discount = promo.value;
                    }
                }
            } else if (promo.scope === "PRODUCT") {
                const productItems = items.filter(item => promo.productIds.some(pid => pid.toString() === item.productId));
                if (productItems.length > 0) {
                    applies = true;
                    const productSubtotal = productItems.reduce((sum, item) => {
                        const prod = productMap[item.productId];
                        return sum + (prod ? prod.basePrice * item.quantity : 0);
                    }, 0);
                    if (promo.type === "PERCENT") {
                        discount = productSubtotal * (promo.value / 100);
                    } else if (promo.type === "FIXED_AMOUNT") {
                        discount = promo.value;
                    }
                }
            } else if (promo.scope === "COMBO") {
                // Check if combo requirements are met
                const comboMet = promo.comboItems.every(comboItem => {
                    const count = itemCounts[comboItem.productId.toString()] || 0;
                    return count >= comboItem.requiredQty;
                });
                if (comboMet) {
                    applies = true;
                    if (promo.type === "FIXED_PRICE_COMBO") {
                        // Calculate the combo price vs original
                        const originalComboPrice = promo.comboItems.reduce((sum, comboItem) => {
                            const prod = productMap[comboItem.productId];
                            return sum + (prod ? prod.basePrice * comboItem.requiredQty : 0);
                        }, 0);
                        discount = originalComboPrice - promo.value;
                    } else if (promo.type === "PERCENT") {
                        const comboPrice = promo.comboItems.reduce((sum, comboItem) => {
                            const prod = productMap[comboItem.productId];
                            return sum + (prod ? prod.basePrice * comboItem.requiredQty : 0);
                        }, 0);
                        discount = comboPrice * (promo.value / 100);
                    } else if (promo.type === "FIXED_AMOUNT") {
                        discount = promo.value;
                    }
                }
            }

            if (applies && discount > 0) {
                applicablePromotions.push({
                    promotionId: promo._id,
                    name: promo.name,
                    discountAmount: discount
                });
                totalDiscount += discount;
            }
        }

        const finalTotal = Math.max(subtotal - totalDiscount, 0);

        res.json({
            applicablePromotions,
            totalDiscount,
            finalTotal
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;