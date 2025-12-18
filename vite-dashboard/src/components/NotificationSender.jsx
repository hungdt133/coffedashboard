import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import './NotificationSender.css';
import './NotificationSender.css';

const NotificationSender = () => {
  const [formData, setFormData] = useState({
    title: '',
    body: '',
    type: 'info'
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.body.trim()) {
      toast.error('Vui lòng nhập đầy đủ tiêu đề và nội dung!');
      return;
    }

    setIsLoading(true);

    try {
      const response = await axios.post('http://localhost:3000/notifications/sendAllClient', formData);

      if (response.data.success) {
        toast.success('Thông báo đã được gửi thành công!');
        setFormData({
          title: '',
          body: '',
          type: 'info'
        });
      }
    } catch (error) {
      console.error('Error sending notification:', error);
      toast.error('Có lỗi xảy ra khi gửi thông báo!');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="notification-sender">
      <div className="sender-header">
        <h2>📢 Gửi Thông Báo</h2>
        <p>Gửi thông báo tùy chỉnh đến tất cả khách hàng đang online</p>
      </div>

      <form onSubmit={handleSubmit} className="notification-form">
        <div className="form-group">
          <label htmlFor="title">Tiêu đề thông báo *</label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            placeholder="Ví dụ: Khuyến mãi đặc biệt!"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="body">Nội dung thông báo *</label>
          <textarea
            id="body"
            name="body"
            value={formData.body}
            onChange={handleInputChange}
            placeholder="Nhập nội dung thông báo bạn muốn gửi..."
            rows="4"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="type">Loại thông báo</label>
          <select
            id="type"
            name="type"
            value={formData.type}
            onChange={handleInputChange}
          >
            <option value="info">ℹ️ Thông tin</option>
            <option value="success">✅ Thành công</option>
            <option value="warning">⚠️ Cảnh báo</option>
            <option value="error">❌ Lỗi</option>
          </select>
        </div>

        <button
          type="submit"
          className="send-btn"
          disabled={isLoading}
        >
          {isLoading ? 'Đang gửi...' : '📤 Gửi Thông Báo'}
        </button>
      </form>

      <div className="preview-section">
        <h3>Xem trước:</h3>
        <div className={`notification-preview ${formData.type}`}>
          <div className="preview-icon">
            {formData.type === 'info' && 'ℹ️'}
            {formData.type === 'success' && '✅'}
            {formData.type === 'warning' && '⚠️'}
            {formData.type === 'error' && '❌'}
          </div>
          <div className="preview-content">
            <strong>{formData.title || 'Tiêu đề thông báo'}</strong>
            <p>{formData.body || 'Nội dung thông báo sẽ hiển thị ở đây...'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationSender;