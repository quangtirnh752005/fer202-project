import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Avatar, Dropdown, Input } from 'antd';
import { DownOutlined, SearchOutlined } from '@ant-design/icons';
import { logout } from '../context/actions/authActions';

export default function Topbar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);
  const [term, setTerm] = useState('');
  const initials = [...(user ? user.username : '?')].slice(0, 2).join('').toUpperCase();

  // Tìm kiếm toàn cục → mở Danh sách đặt phòng đã lọc sẵn (?q=).
  const runSearch = () => {
    const t = term.trim();
    if (t) navigate(`/booking/list?q=${encodeURIComponent(t)}`);
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, height: 56, padding: '0 16px' }}>
      <Input
        type="search"
        prefix={<SearchOutlined />}
        placeholder="Tìm mã đặt phòng, tên khách, SĐT…"
        style={{ maxWidth: 420 }}
        aria-label="Tìm kiếm đặt phòng"
        allowClear
        value={term}
        onChange={(e) => setTerm(e.target.value)}
        onPressEnter={runSearch}
      />
      <div style={{ flex: 1 }} />
      <Dropdown
        menu={{
          items: [
            { key: 'name', label: user ? user.fullName : '', disabled: true },
            { type: 'divider' },
            { key: 'logout', label: 'Đăng xuất' },
          ],
          onClick: ({ key }) => {
            if (key === 'logout') {
              dispatch(logout());
              navigate('/login');
            }
          },
        }}
      >
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
          <Avatar size="small" style={{ background: '#E2EFEB', color: '#11705F' }}>
            {initials}
          </Avatar>
          <DownOutlined style={{ fontSize: 12 }} />
        </span>
      </Dropdown>
    </div>
  );
}
