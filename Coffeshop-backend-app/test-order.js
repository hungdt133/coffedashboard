const axios = require('axios');
const mongoose = require('mongoose');

const testOrder = {
  orderDate: new Date(),
  status: 'Pending',
  paymentMethod: 'VNPAY',
  note: 'Test order - Thông báo mới',
  subtotal: 150000,
  discountAmount: 0,
  shippingFee: 30000,
  taxes: 0,
  totalAmount: 180000,
  deliveryAddress: {
    fullName: 'Nguyễn Văn Test',
    phone: '0912345678',
    street: '123 Đường Test',
    ward: 'Phường 1',
    district: 'Quận 1',
    city: 'TP. Hồ Chí Minh'
  },
  items: [
    {
      productName: 'Cà phê đen',
      quantity: 2,
      finalUnitPrice: 35000,
      sizeChosen: 'M',
      tempChosen: 'Nóng',
      iceLevel: 'Không',
      sugarLevel: 'Bình thường'
    }
  ]
};

axios.post('http://localhost:3000/orders', testOrder)
  .then(res => {
    const orderData = res.data.order || res.data;
    const orderId = orderData._id;
    const orderCode = orderId ? orderId.toString().slice(-6).toUpperCase() : 'N/A';
    console.log('\n✅ Đơn hàng test được tạo thành công!');
    console.log('📦 Mã đơn: #' + orderCode);
    console.log('💰 Tổng tiền:', new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(orderData.totalAmount));
    console.log('👤 Khách hàng:', orderData.deliveryAddress.fullName);
    console.log('📞 Số điện thoại:', orderData.deliveryAddress.phone);
    console.log('\n✨ Thông báo đơn hàng mới sẽ hiện trên dashboard!');
  })
  .catch(err => {
    console.error('❌ Lỗi:', err.response?.data?.error || err.message);
    process.exit(1);
  });
