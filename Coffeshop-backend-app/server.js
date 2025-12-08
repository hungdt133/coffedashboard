const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const bcrypt = require("bcrypt");
const cors = require("cors");           
const morgan = require("morgan");       
const jwt = require("jsonwebtoken");    

// Import Models & Routes
const User = require("./models/users.model");
const Item = require("./models/products.model");
const orderRoutes = require("./routes/orders.routes");
const comboRoutes = require("./routes/combos.routes");
const attendanceRoutes = require("./routes/attendance.routes");

dotenv.config();
const app = express();
const server = http.createServer(app);

// Setup Socket.io với CORS để frontend có thể kết nối
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", // Frontend URL
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Export io để dùng trong routes
app.set("io", io);

// --- MIDDLEWARES ---
app.use(express.json({ limit: "50mb" }));  // Tăng giới hạn để chứa ảnh base64
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(cors());            // Quan trọng: Cho phép mọi nguồn (Android/Web) gọi vào
app.use(morgan("dev"));     // In log ngắn gọn ra console

// --- Socket.io Connection Handler ---
io.on("connection", (socket) => {
    console.log("✅ Client connected:", socket.id);

    socket.on("disconnect", () => {
        console.log("❌ Client disconnected:", socket.id);
    });
});

// --- Kết nối MongoDB ---
mongoose
    .connect(process.env.MONGO_URI)
    .then(() => {
        console.log("✅ Connected to MongoDB");

        // Start server only after DB connection is ready
        const PORT = process.env.PORT || 3000;
        server.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`);
            console.log(`📡 Socket.io ready for connections`);
            // --- Setup MongoDB Change Stream to listen for external inserts (e.g. MongoDB Compass)
            try {
                const setupChangeStream = () => {
                    const ordersColl = mongoose.connection.collection('orders');
                    // Listen only to insert operations
                    const changeStream = ordersColl.watch([
                        { $match: { operationType: 'insert' } }
                    ], { fullDocument: 'updateLookup' });

                    changeStream.on('change', (change) => {
                        const order = change.fullDocument;
                        if (order) {
                            io.emit('newOrder', {
                                message: 'Có đơn hàng mới!',
                                order,
                                timestamp: new Date()
                            });
                            console.log('📡 ChangeStream emitted newOrder:', order._id);
                        }
                    });

                    changeStream.on('error', (err) => {
                        console.error('❌ ChangeStream error:', err);
                    });

                    // Close stream on process exit
                    process.on('SIGINT', () => {
                        try { changeStream.close(); } catch (e) {}
                        process.exit();
                    });
                };

                setupChangeStream();
            } catch (err) {
                console.error('❌ Failed to setup ChangeStream:', err);
            }
        });
    })
    .catch((err) => {
        console.error("❌ MongoDB connection error:", err);
        process.exit(1);
    });

// --- Route test ---
app.get("/", (req, res) => {
    res.send("Hello from Express + MongoDB!");
});

// --- API User (Admin tạo) ---
app.post("/users", async (req, res) => {
    try {
        // Hash password nếu admin tạo user trực tiếp qua API này
        if(req.body.password) {
            req.body.password = await bcrypt.hash(req.body.password, 10);
        }
        const newUser = await User.create(req.body);
        res.status(201).json(newUser);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

app.get("/users", async (req, res) => {
    try {
        const users = await User.find();
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- API Đăng Ký ---
app.post("/register", async (req, res) => {
    try {
        const { name, username, password, email, phone, role } = req.body;

        const existingUser = await User.findOne({ username });
        if (existingUser) return res.status(400).json({ error: "Username already exists" });

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await User.create({
            name, username, email, phone, role,
            password: hashedPassword,
        });

        res.status(201).json({ message: "✅ User registered", user: newUser });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// --- API Đăng Nhập (Có trả về Token) ---
app.post("/login", async (req, res) => {
    try {
        const { username, password } = req.body;

        const user = await User.findOne({ username });
        if (!user) return res.status(404).json({ error: "❌ Username not found" });

        // So sánh mật khẩu đã hash
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ error: "❌ Invalid password" });

        // Tạo Token
        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET || "secret_key_tam_thoi",
            { expiresIn: "1d" }
        );

        const { password: _, ...userData } = user.toObject();
        res.json({ message: "✅ Login successful", token, user: userData });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- API Lấy danh sách món ăn (Gộp chung logic lọc) ---
app.get("/items", async (req, res) => {
    try {
        const { category, search } = req.query;
        let query = { isActive: true }; // Mặc định chỉ lấy món đang bán

        // Nếu client muốn lấy tất cả (kể cả món ẩn) thì gửi ?active=all (tuỳ chọn thêm)
        // Hiện tại code giữ logic cơ bản:
        if (category && category !== "all") {
            query.category = category;
        }
        if (search) {
            query.name = { $regex: search, $options: "i" };
        }

        const items = await Item.find(query);
        res.json(items);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Routes orders
app.use("/orders", orderRoutes);
// Routes combos
app.use("/combos", comboRoutes);

// Test Connection
app.get("/testconnection", (req, res) => res.json("Connection OK"));
