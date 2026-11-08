import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Navigate, useLocation } from 'react-router-dom';
import { App, Button, Form, Grid, Input, Typography } from 'antd';
import { login } from '../context/actions/authActions';
import { BRAND_FONT, sen } from '../utils/theme';

const { Title, Text } = Typography;

// Chép từ LoginForm.tsx của app thật; đăng nhập bằng tên đăng nhập trong db.json thay vì email + JWT.
export default function Login() {
  const dispatch = useDispatch();
  const location = useLocation();
  const { message } = App.useApp();
  const user = useSelector((state) => state.auth.user);
  const [submitting, setSubmitting] = useState(false);
  // ≥ lg: thương hiệu bên trái + form bên phải. Hẹp hơn: xếp dọc 1 cột.
  const screens = Grid.useBreakpoint();
  const twoCol = !!screens.lg;

  if (user) return <Navigate to={(location.state && location.state.from) || '/'} replace />;

  const onFinish = async (values) => {
    setSubmitting(true);
    const result = await dispatch(login(values.username, values.password));
    if (result.ok) {
      message.success('Đăng nhập thành công');
    } else {
      message.error(result.error);
      setSubmitting(false);
    }
  };

  const inputStyle = { borderRadius: 12, padding: '12px 16px', border: '1px solid #e0e0e0' };

  return (
    <div style={{ display: 'flex', flexDirection: twoCol ? 'row' : 'column', minHeight: '100vh', width: '100%' }}>
      <div
        style={{
          flex: twoCol ? 1 : 'none',
          background: `linear-gradient(135deg, ${sen.rail} 0%, ${sen.brand} 100%)`,
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          color: '#fff',
          overflow: 'hidden',
        }}
      >
        {/* Vầng sáng apricot — điểm nhấn ấm của Sen */}
        <div
          style={{
            position: 'absolute',
            width: 600,
            height: 600,
            maxWidth: '120%',
            background: `radial-gradient(circle, ${sen.accent}55 0%, rgba(232,137,107,0) 70%)`,
            top: '-12%',
            left: '-12%',
            borderRadius: '50%',
            pointerEvents: 'none',
          }}
        />
        <div style={{ zIndex: 1, textAlign: 'center', padding: twoCol ? 40 : '28px 20px' }}>
          <h1
            style={{
              fontFamily: BRAND_FONT,
              fontSize: twoCol ? 48 : 30,
              fontWeight: 800,
              marginBottom: twoCol ? 16 : 6,
              letterSpacing: '-0.5px',
            }}
          >
            EasyHotelHub
          </h1>
          <p
            style={{
              fontSize: twoCol ? 18 : 14,
              opacity: 0.85,
              maxWidth: 400,
              margin: '0 auto',
              lineHeight: 1.6,
              display: screens.xs ? 'none' : 'block',
            }}
          >
            Sổ lễ tân khách sạn: đặt phòng, nhận – trả phòng, dịch vụ và thu tiền trên một màn hình.
          </p>
        </div>
      </div>

      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          background: '#ffffff',
          padding: twoCol ? 24 : '24px 16px',
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: 420,
            padding: twoCol ? 48 : '28px 20px',
            boxShadow: twoCol ? '0 20px 40px rgba(0,0,0,0.08)' : 'none',
            borderRadius: 24,
            background: '#fff',
          }}
        >
          <div style={{ marginBottom: 32, textAlign: 'center' }}>
            <Title level={2} style={{ margin: 0, fontWeight: 700, color: sen.ink, fontFamily: BRAND_FONT }}>
              Chào mừng trở lại
            </Title>
            <Text type="secondary" style={{ fontSize: 15 }}>
              Đăng nhập để tiếp tục vào hệ thống
            </Text>
          </div>

          <Form name="login" layout="vertical" onFinish={onFinish} size="large" requiredMark={false}>
            <Form.Item
              label={<span style={{ fontWeight: 500, color: '#4a4a4a' }}>Tên đăng nhập</span>}
              name="username"
              rules={[{ required: true, whitespace: true, message: 'Vui lòng nhập tên đăng nhập!' }]}
            >
              <Input autoComplete="username" spellCheck={false} placeholder="Nhập tên đăng nhập" style={inputStyle} />
            </Form.Item>
            <Form.Item
              label={<span style={{ fontWeight: 500, color: '#4a4a4a' }}>Mật khẩu</span>}
              name="password"
              rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}
            >
              <Input.Password autoComplete="current-password" placeholder="Nhập mật khẩu" style={inputStyle} />
            </Form.Item>
            <Form.Item style={{ marginTop: 32 }}>
              <Button
                type="primary"
                htmlType="submit"
                block
                loading={submitting}
                style={{
                  height: 50,
                  borderRadius: 12,
                  fontSize: 16,
                  fontWeight: 600,
                  background: `linear-gradient(135deg, ${sen.accent} 0%, ${sen.accentDeep} 100%)`,
                  border: 'none',
                  boxShadow: '0 4px 14px rgba(212, 103, 74, 0.4)',
                }}
              >
                Đăng nhập hệ thống
              </Button>
            </Form.Item>
          </Form>
        </div>
      </div>
    </div>
  );
}
