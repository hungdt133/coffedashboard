import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import { toast } from 'react-toastify';
import "./OrderManager.css";

// Import hình ảnh
import imgBacXiu from "../assets/bac-xiu.jpg";
import imgLava from "../assets/banh-socola-lava.jpg";
import imgCroissant from "../assets/banh-sung-bo-croissants.jpg";
import imgCaPheSuaDa from "../assets/ca_phe_sua_da.jpg";
import imgCaPheDen from "../assets/ca-phe-den.jpg";
import imgEspresso from "../assets/espresso-macchiato.jpg";
import imgLatte from "../assets/latte-caramel-da-xay.jpg";
import imgRedVelvet from "../assets/red-velvet-cupcake.jpg";
import imgSinhToBo from "../assets/sinh-to-bo.jpg";
import imgTiramisu from "../assets/tiramisiu.jpg";
import imgTraDao from "../assets/tra-dao-cam-sa.jpg";
import imgTraSua from "../assets/tra-sua.jpg";

const OrderManager = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [tempStatus, setTempStatus] = useState("");
  const [notification, setNotification] = useState(null);
  const [notificationsList, setNotificationsList] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const [filterCity, setFilterCity] = useState("");
  const [filterDistrict, setFilterDistrict] = useState("");
  const [filterWard, setFilterWard] = useState("");
  const [filterPayment, setFilterPayment] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [filterKeyword, setFilterKeyword] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const socketRef = useRef(null);
  const [lastOrderId, setLastOrderId] = useState(null);
  const [hasLoaded, setHasLoaded] = useState(false);

  const API_URL = "";

  const getProductImage = (productName) => {
    if (!productName) return imgCaPheDen; 
    const name = productName.toLowerCase(); 

    if (name.includes("combo")) {
        if (name.includes("sáng") || name.includes("tỉnh")) return imgCaPheDen;
        if (name.includes("trà") || name.includes("chill")) return imgTraDao;
        if (name.includes("béo")) return imgBacXiu;
        if (name.includes("bữa xế")) return imgSinhToBo;
        if (name.includes("đôi") || name.includes("bạn")) return imgTraSua;
        return imgCroissant;
    }

    if (name.includes("bạc xỉu")) return imgBacXiu;
    if (name.includes("sữa đá") || name.includes("nâu đá")) return imgCaPheSuaDa;
    if (name.includes("đen") || name.includes("black")) return imgCaPheDen;
    if (name.includes("espresso") || name.includes("macchiato")) return imgEspresso;
    if (name.includes("latte") || name.includes("caramel")) return imgLatte;
    if (name.includes("trà đào") || name.includes("cam sả")) return imgTraDao;
    if (name.includes("trà sữa") || name.includes("trân châu")) return imgTraSua;
    if (name.includes("sinh tố") || name.includes("bơ")) return imgSinhToBo;
    if (name.includes("sung bò") || name.includes("croissant")) return imgCroissant;
    if (name.includes("lava") || name.includes("socola")) return imgLava;
    if (name.includes("red velvet") || name.includes("cupcake")) return imgRedVelvet;
    if (name.includes("tiramisu")) return imgTiramisu;

    return imgCaPheDen;
  };

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      // Build filter params
      const params = {};
      if (filterCity) params.city = filterCity;
      if (filterDistrict) params.district = filterDistrict;
      if (filterWard) params.ward = filterWard;
      if (filterStatus) params.status = filterStatus;
      if (filterPayment) params.paymentMethod = filterPayment;
      if (filterDateFrom) params.date_from = filterDateFrom;
      if (filterDateTo) params.date_to = filterDateTo;
      if (filterKeyword) params.keyword = filterKeyword;

      const res = await axios.get(`${API_URL}/orders/filter`, { params });
      const sortedOrders = res.data.sort((a, b) => 
        new Date(b.orderDate) - new Date(a.orderDate)
      );
      setOrders(sortedOrders);

      // Check for new order notification
      if (!hasLoaded) {
        setHasLoaded(true);
      } else if (lastOrderId && sortedOrders.length > 0 && sortedOrders[0]._id !== lastOrderId) {
        // Show notification for new order
        const newOrder = sortedOrders[0];
        const note = {
          id: newOrder._id,
          message: "Có đơn hàng mới!",
          order: newOrder,
          timestamp: newOrder.createdAt || new Date().toISOString(),
        };
        setNotificationsList((prev) => [note, ...prev]);
        setUnreadCount((c) => c + 1);
        setNotification({ ...note });

        // Show toast notification
        toast.success("Có đơn hàng mới!");

        // Desktop notification
        if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
          const title = 'Có đơn hàng mới!';
          const money = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(newOrder.totalAmount || 0);
          const body = `Khách: ${newOrder.deliveryAddress?.fullName || 'Khách vãng lai'} • Tổng: ${money}`;
          new Notification(title, { body });
        }
        playBeep();

        // Auto hide
        setTimeout(() => {
          setNotification(null);
        }, 5000);
      }
      setLastOrderId(sortedOrders.length > 0 ? sortedOrders[0]._id : null);
    } catch (error) {
      console.error("Lỗi tải đơn hàng:", error);
      alert("Không thể kết nối đến server!");
    } finally {
      setLoading(false);
    }
  }, [API_URL, filterCity, filterDistrict, filterWard, filterStatus, filterPayment, filterDateFrom, filterDateTo, filterKeyword]);
  
  // request Notification permission on mount
  useEffect(() => {
    if (typeof Notification !== 'undefined' && Notification.permission !== 'granted') {
      Notification.requestPermission().then(() => {});
    }
  }, []);

  const playBeep = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine'; o.frequency.value = 880;
      g.gain.value = 0.05;
      o.connect(g); g.connect(ctx.destination);
      o.start();
      setTimeout(() => { o.stop(); ctx.close(); }, 200);
    } catch (e) {
      // ignore audio errors
    }
  };

  useEffect(() => {
    fetchOrders();

    // Socket.io disabled due to CORS on production
    // if (window.socket) {
    //   socketRef.current = window.socket;
    // } else {
    //   socketRef.current = io('https://coffeeshop-mobileappproject-backend.onrender.com/', {
    //     transports: ["websocket", "polling"]
    //   });
    // }

    // socketRef.current.on("connect", () => {
    //   console.log("✅ Connected to Socket.io server");
    // });

    // // Listen event đơn hàng mới
    // socketRef.current.on("newOrder", (data) => {
    //   console.log("📦 New order received:", data);
      
    //   // Hiển thị notification
    //   const note = {
    //     id: data.order?._id || Date.now().toString(),
    //     message: data.message || "Có đơn hàng mới!",
    //     order: data.order,
    //     timestamp: data.timestamp || new Date().toISOString(),
    //   };

    //   setNotificationsList((prev) => [note, ...prev]);
    //   setUnreadCount((c) => c + 1);
    //   setNotification({ ...note });

    //   // Desktop notification + sound
    //   if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
    //     try {
    //       const title = note.message || 'Có đơn hàng mới!';
    //       const money = note.order ? new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(note.order.totalAmount || 0) : '';
    //       const body = note.order ? `Khách: ${note.order.deliveryAddress?.fullName || 'Khách vãng lai'} • Tổng: ${money}` : '';
    //       new Notification(title, { body });
    //     } catch (e) {}
    //   }
    //   playBeep();

    //   // Tự động refresh danh sách đơn hàng
    //   fetchOrders();

    //   // Tự động ẩn notification sau 5 giây
    //   setTimeout(() => {
    //     setNotification(null);
    //   }, 5000);
    // });

    // socketRef.current.on("disconnect", () => {
    //   console.log("❌ Disconnected from Socket.io server");
    // });

    // // Cleanup khi component unmount
    // return () => {
    //   if (socketRef.current) {
    //     socketRef.current.disconnect();
    //   }
    // };
  }, [fetchOrders]);

  // Polling disabled - only manual refresh
  // useEffect(() => {
  //   const interval = setInterval(() => {
  //     fetchOrders();
  //   }, 20000);
  //   return () => clearInterval(interval);
  // }, [fetchOrders]);

  const handleBellClick = () => {
    setShowNotifPanel((s) => !s);
    setUnreadCount(0);
  };

  const handleOpenFromNotif = (note) => {
    if (note && note.order) {
      openModal(note.order);
      setShowNotifPanel(false);
    }
  };

  const handleDismissNotif = (id) => {
    setNotificationsList((prev) => prev.filter(n => n.id !== id));
  };

  const openModal = (order) => {
    setSelectedOrder(order);
    setTempStatus(order.status);
  };

  const closeModal = () => {
    setSelectedOrder(null);
  };

  const updateStatus = async () => {
    if (!selectedOrder) return;
    try {
      await axios.patch(`${API_URL}/orders/${selectedOrder._id}/status`, {
        status: tempStatus
      });
      alert(`Đã cập nhật đơn hàng thành: ${tempStatus}`);
      const updatedOrders = orders.map(ord => 
        ord._id === selectedOrder._id ? { ...ord, status: tempStatus } : ord
      );
      setOrders(updatedOrders);
      closeModal();
    } catch (error) {
      alert("Lỗi cập nhật: " + (error.response?.data?.error || error.message));
    }
  };

  const formatMoney = (amount) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleString("vi-VN", {
      hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit", year: "numeric"
    });
  };

  const getStatusColor = (status) => {
    switch(status) {
      case "Pending": return "status-pending";
      case "Confirmed": return "status-confirmed";
      case "Delivering": return "status-delivering";
      case "Delivered": return "status-delivered";
      case "Cancelled": return "status-cancelled";
      case "Completed": return "status-delivered";
      default: return "";
    }
  };

  return (
    <div className="order-container">

      <div className="order-header">
        <h2 className="page-title">📦 Quản Lý Đơn Hàng</h2>
        <button className="btn-refresh" onClick={() => fetchOrders()} title="Làm mới danh sách đơn hàng">
          🔄 Làm mới
        </button>

        <div className="notif-area">
          <button className="notif-bell" onClick={handleBellClick} aria-label="Thông báo">
            <span className="notif-icon">🔔</span>
            {unreadCount > 0 && (<span className="notif-badge">{unreadCount}</span>)}
          </button>

          {showNotifPanel && (
            <div className="notif-panel">
              <div className="notif-panel-header">
                <strong>Thông báo</strong>
                <button className="notif-clear" onClick={() => setNotificationsList([])}>Xóa tất cả</button>
              </div>
              {notificationsList.length === 0 ? (
                <div className="notif-empty">Không có thông báo</div>
              ) : (
                notificationsList.map((note) => (
                  <div key={note.id} className="notif-item">
                    <div className="notif-item-icon">📦</div>
                    <div className="notif-item-body">
                      <div className="notif-item-title">{note.message}</div>
                      {note.order && (
                        <div className="notif-item-details">
                          <div>Khách: {note.order.deliveryAddress?.fullName || 'Khách vãng lai'}</div>
                          <div>Tổng: {formatMoney(note.order.totalAmount || 0)}</div>
                        </div>
                      )}
                      <div className="notif-item-actions">
                        <button className="btn-notif-view" onClick={() => handleOpenFromNotif(note)}>Xem</button>
                        <button className="btn-notif-close" onClick={() => handleDismissNotif(note.id)}>Đóng</button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Filter Section */}
      <div className="filter-section">
        <div className="filter-group">
          <label>Trạng thái:</label>
          <select 
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value)}
            className="filter-select"
          >
            <option value="">Tất cả</option>
            <option value="Pending">🕒 Chờ xác nhận</option>
            <option value="Confirmed">✅ Đã xác nhận</option>
            <option value="Delivering">🚚 Đang giao</option>
            <option value="Delivered">🎁 Đã giao</option>
            <option value="Completed">🏁 Hoàn thành</option>
            <option value="Cancelled">❌ Hủy đơn</option>
          </select>
        </div>
        <button className="btn-filter" onClick={() => fetchOrders()}>
          🔍 Tìm kiếm
        </button>
      </div>

      {/* Notification khi có đơn hàng mới */}
      {notification && (
        <div className="notification-toast">
          <div className="notification-content">
            <div className="notification-icon">🔔</div>
            <div className="notification-text">
              <strong>{notification.message}</strong>
              {notification.order && (
                <div className="notification-details">
                  <span>Khách: {notification.order.deliveryAddress?.fullName || "Khách vãng lai"}</span>
                  <span>•</span>
                  <span>Tổng: {formatMoney(notification.order.totalAmount || 0)}</span>
                </div>
              )}
            </div>
            <button 
              className="notification-close" 
              onClick={() => setNotification(null)}
            >
              ×
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="loading">Đang tải dữ liệu...</div>
      ) : (
        <>
          <div className="table-responsive">
          <table className="order-table">
            <thead>
              <tr>
                <th>Ngày đặt</th>
                <th>Khách hàng</th>
                <th>Tổng tiền</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order._id}>
                  <td>{formatDate(order.orderDate)}</td>
                  <td>
                    <div className="customer-info">
                      <strong>{order.deliveryAddress?.fullName || "Khách vãng lai"}</strong>
                      <br/>
                      <small>{order.deliveryAddress?.phone}</small>
                    </div>
                  </td>
                  <td className="money">{formatMoney(order.totalAmount)}</td>
                  <td>
                    <span className={`badge ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </td>
                  <td>
                    <button className="btn-detail" onClick={() => openModal(order)}>
                      Xem & Xử lý
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </>
      )}

      {selectedOrder && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Chi tiết đơn hàng</h3>
              <span className="close-btn" onClick={closeModal}>&times;</span>
            </div>

            <div className="modal-body">
              <div className="info-group">
                <h4>📍 Thông tin giao hàng</h4>
                <p><strong>Người nhận:</strong> {selectedOrder.deliveryAddress?.fullName}</p>
                <p><strong>SĐT:</strong> {selectedOrder.deliveryAddress?.phone}</p>
                <p><strong>Địa chỉ:</strong> {selectedOrder.deliveryAddress?.street}, {selectedOrder.deliveryAddress?.ward}, {selectedOrder.deliveryAddress?.district}, {selectedOrder.deliveryAddress?.city}</p>
                <p><strong>Ghi chú đơn:</strong> <span className="note-text">{selectedOrder.note || "Không có"}</span></p>
              </div>

              <div className="items-group">
                <h4>🛒 Danh sách món ăn</h4>
                <ul className="item-list">
                  {selectedOrder.items.map((item, index) => (
                    <li key={index} className="item-row" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                      <img 
                        src={getProductImage(item.productName)} 
                        alt={item.productName} 
                        style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #eee' }}
                      />

                      <div className="item-details" style={{ flex: 1 }}>
                        <div className="item-name-row">
                            <span className="qty-tag">{item.quantity}x</span>
                            <strong>{item.productName}</strong>
                            {item.sizeChosen && <span className="size-tag">{item.sizeChosen}</span>}
                        </div>
                        
                        <div className="item-options">
                           {item.iceLevel && item.iceLevel !== "N/A" && item.sugarLevel && item.sugarLevel !== "N/A" ? (
                             <>📝 {item.iceLevel} đá, {item.sugarLevel} đường<br/></>
                           ) : null}
                           
                           {item.chosenToppings && item.chosenToppings.length > 0 && (
                               <span className="toppings">
                                 + Topping: {item.chosenToppings.map(t => t.name).join(", ")}
                               </span>
                           )}

                           {item.itemNote && (
                               <div style={{color: '#e67e22', fontStyle: 'italic', fontSize: '0.85rem', marginTop: '4px'}}>
                                   Note: {item.itemNote}
                               </div>
                           )}
                        </div>
                      </div>
                      <div className="item-price">
                        {formatMoney(item.finalUnitPrice * item.quantity)}
                      </div>
                    </li>
                  ))}
                </ul>

                <div className="order-summary">
                   <div className="sum-row"><span>Tạm tính:</span> <span>{formatMoney(selectedOrder.subtotal || 0)}</span></div>
                   <div className="sum-row"><span>Phí ship:</span> <span>{formatMoney(selectedOrder.shippingFee || 0)}</span></div>
                   {selectedOrder.discountAmount > 0 && (
                       <div className="sum-row discount"><span>Giảm giá:</span> <span>-{formatMoney(selectedOrder.discountAmount)}</span></div>
                   )}
                   <div className="sum-row total"><span>Tổng cộng:</span> <span>{formatMoney(selectedOrder.totalAmount || 0)}</span></div>
                </div>
              </div>

              <div className="status-action">
                <h4>⚙️ Cập nhật trạng thái</h4>
                <div className="action-row">
                    <select 
                        value={tempStatus} 
                        onChange={(e) => setTempStatus(e.target.value)}
                        className="status-select"
                    >
                        <option value="Pending">🕒 Chờ xác nhận (Pending)</option>
                        <option value="Confirmed">✅ Đã xác nhận (Confirmed)</option>
                        <option value="Delivering">🚚 Đang giao (Delivering)</option>
                        <option value="Delivered">🎁 Đã giao (Delivered)</option>
                        <option value="Completed">🏁 Hoàn thành (Completed)</option>
                        <option value="Cancelled">❌ Hủy đơn (Cancelled)</option>
                    </select>
                    <button className="btn-save" onClick={updateStatus}>Lưu Trạng Thái</button>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderManager;