const express = require("express");
const router = express.Router();

// POST /api/notifications/sendAllClient - Gửi thông báo tùy chỉnh đến tất cả clients
router.post("/sendAllClient", async (req, res) => {
  try {
    const { title, body } = req.body;

    // Validate input
    if (!title || !body) {
      return res.status(400).json({
        error: "Title and body are required"
      });
    }

    // Get io instance from app
    const io = req.app.get("io");

    // Emit notification to all connected clients
    io.emit("adminNotification", {
      title,
      body,
      type: "info", // Default type
      timestamp: new Date().toISOString()
    });

    console.log(`📢 Admin notification sent: ${title} - ${body}`);

    res.status(200).json({
      success: true,
      message: "Notification sent successfully",
      data: { title, body }
    });

  } catch (error) {
    console.error("Error sending notification:", error);
    res.status(500).json({
      error: "Failed to send notification"
    });
  }
});

module.exports = router;