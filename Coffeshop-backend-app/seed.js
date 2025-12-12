const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Combo = require("./models/combos.model");

dotenv.config();

const seedCombos = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // Clear existing combos (optional)
    // await Combo.deleteMany({});

    const combosData = [
      {
        name: "Combo Sáng Tỉnh Táo",
        category: "Combo",
        basePrice: 55000,
        discountedPrice: 49000,
        discount: 11,
        description: "Khởi đầu ngày mới đầy năng lượng với Cà phê đen đậm đà và bánh Croissant thơm lừng.",
        image_url: "https://www.phapfr.vn/nghe-thuat-song-du-lich/wp-content/uploads/sites/23/2021/05/cupfreshcoffeewithcroissants-73387856-1620723162001.jpg",
        isActive: true,
        items: [
          {
            productName: "Cà phê đen",
            quantity: 1,
          },
          {
            productName: "Bánh Croissant",
            quantity: 1,
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Combo Trà Bánh Chill",
        category: "Combo",
        basePrice: 75000,
        discountedPrice: 65000,
        discount: 13,
        description: "Sự kết hợp hoàn hảo giữa vị thanh mát của Trà đào và vị ngọt ngào của Tiramisu.",
        image_url: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400",
        isActive: true,
        items: [
          {
            productName: "Trà đào cam sả",
            quantity: 1,
          },
          {
            productName: "Bánh Tiramisu",
            quantity: 1,
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Combo Béo Ngậy",
        category: "Combo",
        basePrice: 70000,
        discountedPrice: 59000,
        discount: 16,
        description: "Vị béo của Bạc xỉu hòa quyện cùng lớp nhân socola tan chảy của bánh Lava.",
        image_url: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400",
        isActive: true,
        items: [
          {
            productName: "Bạc xỉu",
            quantity: 1,
          },
          {
            productName: "Bánh Socola Lava",
            quantity: 1,
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Combo Bữa Xế",
        category: "Combo",
        basePrice: 85000,
        discountedPrice: 75000,
        discount: 12,
        description: "Nạp năng lượng buổi chiều với Sinh tố bơ bổ dưỡng và bánh Red Velvet.",
        image_url: "https://images.unsplash.com/photo-1590621426169-a092ff6ff9a4?w=400",
        isActive: true,
        items: [
          {
            productName: "Sinh tố bơ",
            quantity: 1,
          },
          {
            productName: "Red Velvet Cupcake",
            quantity: 1,
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Combo Đôi Bạn Thân",
        category: "Combo",
        basePrice: 60000,
        discountedPrice: 50000,
        discount: 17,
        description: "Mua 2 ly trà sữa trân châu đường đen với giá ưu đãi.",
        image_url: "https://images.unsplash.com/photo-1505252585461-04db1267ae5b?w=400",
        isActive: true,
        items: [
          {
            productName: "Trà sữa",
            quantity: 2,
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    // Clear existing combos and insert new ones
    await Combo.deleteMany({});
    const result = await Combo.insertMany(combosData);

    console.log("✅ Combos seeded successfully!");
    console.log("📊 Inserted:", result.length);

    await mongoose.disconnect();
    console.log("✅ Disconnected from MongoDB");
  } catch (err) {
    console.error("❌ Error seeding combos:", err.message);
    process.exit(1);
  }
};

seedCombos();