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
  const [useLocalAPI, setUseLocalAPI] = useState(false);

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
      const apiUrl = useLocalAPI
        ? 'http://localhost:3000/notifications/sendAllClient'
        : '/fcm/sendallclient';

      console.log('📤 SENDING POST REQUEST:');
      console.log('🔗 URL:', apiUrl);
      console.log('📝 Method: POST');
      console.log('📦 Payload:', { title: formData.title, body: formData.body });
      console.log('📋 Headers:', {
        'Content-Type': 'application/json'
      });

      const response = await axios.post(apiUrl, {
        title: formData.title,
        body: formData.body
      }, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });

      console.log('📨 RESPONSE RECEIVED:');
      console.log('📊 Status:', response.status);
      console.log('📄 Data:', response.data);

      console.log('API Response:', response.data);

      // Check for success - API có thể trả về format khác
      if (response.data && (response.data.success === true || response.data.success === "true" || response.status === 200)) {
        toast.success('Thông báo đã được gửi thành công đến tất cả client!');

        // Reset form
        setFormData({
          title: '',
          body: '',
          type: 'info'
        });

        // Emit local notification để hiển thị trên dashboard (optional)
        if (window.socket) {
          window.socket.emit('adminNotification', {
            title: formData.title,
            body: formData.body,
            type: formData.type,
            timestamp: new Date().toISOString()
          });
        }
      } else {
        throw new Error('API không trả về success response');
      }
    } catch (error) {
      console.error('Error sending notification:', error);
      console.error('Error details:', error.response?.data || error.message);

      // Hiển thị lỗi chi tiết hơn
      const errorMessage = error.response?.data?.message ||
                          error.response?.data?.error ||
                          error.message ||
                          'Có lỗi xảy ra khi gửi thông báo!';

      toast.error(`Lỗi: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="notification-sender">
      <div className="sender-header">
        <h2>📢 Gửi Thông Báo</h2>
        <p>Gửi thông báo đẩy đến tất cả khách hàng đang sử dụng app mobile</p>
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
            disabled
          >
            <option value="info">ℹ️ Thông tin</option>
          </select>
          <small style={{ color: '#666', fontSize: '0.8rem' }}>FCM notifications mặc định là loại thông tin</small>
        </div>

        <button
          type="submit"
          className="send-btn"
          disabled={isLoading}
        >
          {isLoading ? 'Đang gửi...' : `📤 POST Thông Báo ${useLocalAPI ? '(Local)' : '(Mobile)'}`}
        </button>

        <button
          type="button"
          className="test-btn"
          onClick={async () => {
            try {
              console.log('📡 URL: /fcm/sendallclient (proxied to external)');
              console.log('📝 Method: POST');
              console.log('📦 Data:', { title: 'Test Notification', body: 'This is a test message' });

              const response = await fetch('/fcm/sendallclient', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  title: 'Test Notification',
                  body: 'This is a test message'
                })
              });

              console.log('📊 Response status:', response.status);
              console.log('📊 Response headers:', Object.fromEntries(response.headers.entries()));

              const responseData = await response.text();
              console.log('📄 Response body:', responseData);

              if (response.ok) {
                alert(`✅ SUCCESS!\nStatus: ${response.status}\nResponse: ${responseData}`);
              } else {
                alert(`❌ ERROR!\nStatus: ${response.status}\nResponse: ${responseData}`);
              }
            } catch (error) {
              console.error('💥 Fetch error:', error);
              alert(`💥 Network Error: ${error.message}\n\nPossible causes:\n• Server not running\n• CORS blocked\n• Network connectivity\n• Wrong URL`);
            }
          }}
        >
          🔧 Test API (POST)
        </button>

        <button
          type="button"
          className="test-btn"
          style={{ background: '#28a745', marginLeft: '10px' }}
          onClick={async () => {
            const apiKey = prompt('Enter API Key (leave empty if not required):');
            try {
              console.log('🧪 Testing API with authentication...');

              const headers = {
                'Content-Type': 'application/json',
              };

              if (apiKey && apiKey.trim()) {
                headers['Authorization'] = `Bearer ${apiKey.trim()}`;
                console.log('🔑 Using API Key authentication');
              }

              const response = await fetch('/fcm/sendallclient', {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({
                  title: 'Test Notification',
                  body: 'This is a test message with auth'
                })
              });

              const responseData = await response.text();
              console.log('📊 Response:', response.status, responseData);

              if (response.ok) {
                alert(`✅ SUCCESS with auth!\nStatus: ${response.status}\nResponse: ${responseData}`);
              } else {
                alert(`❌ ERROR with auth!\nStatus: ${response.status}\nResponse: ${responseData}`);
              }
            } catch (error) {
              console.error('💥 Auth test error:', error);
              alert(`💥 Auth test failed: ${error.message}`);
            }
          }}
        >
          🔑 Test with Auth
        </button>

        <button
          type="button"
          className="test-btn"
          style={{ background: '#dc3545', marginLeft: '10px' }}
          onClick={async () => {
            try {
              console.log('🔍 Testing different endpoints...');

              const endpoints = [
                '/fcm/sendallclient',
                '/api/fcm/sendallclient',
                '/notifications/sendallclient',
                'https://coffeeshop-mobileappproject-backend.onrender.com/fcm/sendallclient'
              ];

              for (const url of endpoints) {
                try {
                  console.log(`Testing: ${url}`);
                  const controller = new AbortController();
                  const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

                  const response = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ title: 'Test', body: 'Test' }),
                    signal: controller.signal
                  });

                  clearTimeout(timeoutId);
                  console.log(`Result: ${url} -> ${response.status}`);

                  if (response.ok) {
                    const data = await response.text();
                    alert(`✅ Found working endpoint!\n${url}\nStatus: ${response.status}\nResponse: ${data}`);
                    return;
                  }
                } catch (e) {
                  console.log(`Failed: ${url} -> ${e.message}`);
                }
              }

              alert('❌ No working endpoints found. Possible issues:\n• Wrong endpoint path\n• Server not configured for FCM\n• Authentication required\n• CORS issues');
            } catch (error) {
              console.error('💥 Endpoint test error:', error);
              alert(`💥 Test failed: ${error.message}`);
            }
          }}
        >
          🔍 Find Endpoint
        </button>

        <button
          type="button"
          className="test-btn"
          style={{ background: useLocalAPI ? '#28a745' : '#6c757d', marginLeft: '10px' }}
          onClick={() => {
            setUseLocalAPI(!useLocalAPI);
            alert(`${!useLocalAPI ? '🔄 Switched to LOCAL API' : '🌐 Switched to EXTERNAL API (via proxy)'}\n\n${!useLocalAPI ? 'http://localhost:3000/notifications/sendAllClient' : '/fcm/sendallclient (proxied to external)'}`);
          }}
        >
          {useLocalAPI ? '🌐 External API' : '🏠 Local API'}
        </button>
      </form>

      <div className="preview-section">
        <h3>📱 Xem trước thông báo trên mobile:</h3>
        <div className="mobile-notification-preview">
          <div className="mobile-header">
            <div className="app-icon">☕</div>
            <div className="app-info">
              <strong>Coffee Shop</strong>
              <small>vừa xong</small>
            </div>
          </div>
          <div className="mobile-content">
            <div className="notification-title">{formData.title || 'Tiêu đề thông báo'}</div>
            <div className="notification-body">{formData.body || 'Nội dung thông báo sẽ hiển thị ở đây...'}</div>
          </div>
        </div>
        <div style={{ marginTop: '15px', padding: '10px', background: '#f8f9fa', borderRadius: '5px', fontSize: '0.9rem' }}>
          <strong>🔍 Debug Info:</strong>
          <br />• <strong>Current API:</strong> {useLocalAPI ? '🏠 Local (Dashboard only)' : '🌐 External (Mobile + Dashboard)'}
          <br />• API URL: {useLocalAPI ? 'http://localhost:3000/notifications/sendAllClient' : 'https://coffeeshop-mobileappproject-backend.onrender.com/fcm/sendallclient'}
          <br />• <strong style={{color: 'red'}}>Method: POST</strong> (Gửi thông báo đến mobile clients)
          <br />• Headers: Content-Type: application/json
          <br />• Body: {`{title: "...", body: "..."}`}
          <br />• <strong>Network Error có thể do:</strong>
          <br />  - Endpoint không tồn tại trên server external
          <br />  - Server external không có FCM integration
          <br />  - Cần authentication (API key)
          <br />  - CORS blocked
          <br />  - Server đang sleep (Render free tier)
        </div>
      </div>
    </div>
  );
};

export default NotificationSender;