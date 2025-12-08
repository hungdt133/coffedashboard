const express = require("express");
const router = express.Router();
const Order = require("../models/orders.model");

// --- Tạo đơn ---
router.post("/", async (req, res) => {
  try {
    const order = await Order.create(req.body);

    // Emit event qua Socket.io để thông báo đơn hàng mới
    const io = req.app.get("io");
    if (io) {
      io.emit("newOrder", {
        message: "Có đơn hàng mới!",
        order: order,
        timestamp: new Date()
      });
      console.log("📢 Emitted newOrder event:", order._id);
    }

    res.status(201).json({
      message: "Order created successfully",
      order,
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// --- Hủy đơn (cập nhật trạng thái thành Cancelled) ---
router.delete("/:id", async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status: "Cancelled" },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    res.json({
      message: "Order cancelled successfully",
      order,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// --- Xác nhận đơn (cập nhật trạng thái thành Confirmed) ---
router.post("/:id", async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status: "Confirmed" },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    res.json({
      message: "Order confirmed successfully",
      order,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Cập nhật thông tin đơn ---
router.put("/:id", async (req, res) => {
  try {
    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!updatedOrder) {
      return res.status(404).json({ error: "Order not found" });
    }

    res.json({
      message: "Order updated successfully",
      order: updatedOrder,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Đổi trạng thái đơn ---
router.patch("/:id/status", async (req, res) => {
  try {
    const { status } = req.body;

    const validStatuses = [
      "Pending",
      "Unpaid", //Chưa dùng
      "Confirmed",
      "Delivering",
      "Delivered",
      "Cancelled",
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid order status" });
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    res.json({
      message: "Order status updated successfully",
      order,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Lấy danh sách đơn ---
router.get("/", async (req, res) => {
  try {
    const orders = await Order.find();
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Lấy danh sách đơn theo userId và status (hỗ trợ not equal) ---
router.get("/filter", async (req, res) => {
  try {
    const { userId, status, status_ne, city, district, ward, paymentMethod, date_from, date_to, keyword } = req.query;

    let query = {};

    if (userId) query.userId = userId;
    if (status) query.status = status;
    if (status_ne) query.status = { $ne: status_ne };

    // area filtering (deliveryAddress)
    if (city) query['deliveryAddress.city'] = city;
    if (district) query['deliveryAddress.district'] = district;
    if (ward) query['deliveryAddress.ward'] = ward;

    // payment method
    if (paymentMethod) query.paymentMethod = paymentMethod;

    // date range (orderDate)
    if (date_from || date_to) {
      query.orderDate = {};
      if (date_from) query.orderDate.$gte = new Date(date_from);
      if (date_to) query.orderDate.$lte = new Date(date_to);
    }

    // keyword search: search order id, customer name, phone, items.productName
    if (keyword) {
      const kw = keyword.trim();
      const or = [
        { _id: kw },
        { 'deliveryAddress.fullName': { $regex: kw, $options: 'i' } },
        { 'deliveryAddress.phone': { $regex: kw, $options: 'i' } },
        { 'items.productName': { $regex: kw, $options: 'i' } },
      ];
      query.$or = or;
    }

    const orders = await Order.find(query);
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Lấy đơn theo ID ---
router.get("/:id", async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: "Order not found" });

    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



module.exports = router;