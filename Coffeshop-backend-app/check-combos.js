const mongoose = require('mongoose');
const Combo = require('./models/combos.model');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('✅ Connected to MongoDB');
    
    const combos = await Combo.find();
    console.log(`\n📊 Tổng số combo trong database: ${combos.length}\n`);
    
    combos.forEach((combo, index) => {
      console.log(`${index + 1}. ${combo.name}`);
      console.log(`   ID: ${combo._id}`);
      console.log(`   Giá: ${combo.basePrice.toLocaleString('vi-VN')} ₫`);
      console.log(`   Giảm giá: ${combo.discount}%`);
      console.log(`   Số sản phẩm: ${combo.items?.length || 0}`);
      console.log(`   Hình ảnh: ${combo.image_url ? 'Có' : 'Không'}`);
      console.log('');
    });
    
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  })
  .catch(err => {
    console.error('❌ Error:', err.message);
    process.exit(1);
  });
