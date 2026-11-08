import { createElement } from 'react';
import { Menu } from 'antd';
import { CalendarOutlined, CustomerServiceOutlined } from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';
import { BRAND_FONT, sen } from '../utils/theme';

// Menu rút gọn từ navItems.ts của app thật: chỉ giữ nhóm Quản lý đặt phòng + Danh mục dịch vụ.
const NAV_ITEMS = [
  {
    key: 'booking',
    label: 'Quản lý đặt phòng',
    icon: createElement(CalendarOutlined),
    children: [
      { key: 'booking/room-view', label: 'Sơ đồ phòng', path: '/booking/room-view' },
      { key: 'booking/create', label: 'Tạo đặt phòng', path: '/booking/create' },
      { key: 'booking/list', label: 'Danh sách đặt phòng', path: '/booking/list' },
    ],
  },
  {
    key: 'settings/services',
    label: 'Danh mục dịch vụ',
    icon: createElement(CustomerServiceOutlined),
    path: '/settings/services',
  },
];

const LEAVES = NAV_ITEMS.flatMap((it) =>
  it.children ? it.children.map((c) => ({ ...c, parentKey: it.key })) : [it]
);

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = NAV_ITEMS.map((it) =>
    it.children
      ? { key: it.key, icon: it.icon, label: it.label, children: it.children.map((c) => ({ key: c.key, label: c.label })) }
      : { key: it.key, icon: it.icon, label: it.label }
  );
  const active = LEAVES.find((l) => location.pathname === l.path || location.pathname.startsWith(`${l.path}/`));

  return (
    <div style={{ height: '100%', background: sen.rail, display: 'flex', flexDirection: 'column' }}>
      <div style={{ height: 64, flex: '0 0 auto', display: 'flex', alignItems: 'center', gap: 10, padding: '0 18px' }}>
        <span
          style={{
            width: 30,
            height: 30,
            borderRadius: 9,
            background: `linear-gradient(135deg, ${sen.accent}, ${sen.accentDeep})`,
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: 16,
            fontFamily: BRAND_FONT,
            flex: '0 0 auto',
            boxShadow: '0 2px 8px rgba(212,103,74,0.35)',
          }}
        >
          E
        </span>
        <span
          style={{
            fontWeight: 700,
            fontSize: 16,
            color: '#F4F1EA',
            fontFamily: BRAND_FONT,
            letterSpacing: '0.2px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
          }}
        >
          EasyHotelHub
        </span>
      </div>
      <div style={{ flex: '1 1 auto', overflowY: 'auto', overflowX: 'hidden' }}>
        <Menu
          className="rail-menu"
          theme="dark"
          mode="inline"
          selectedKeys={active ? [active.key] : []}
          defaultOpenKeys={['booking']}
          items={menuItems}
          style={{ border: 'none', background: 'transparent' }}
          onClick={({ key }) => {
            const leaf = LEAVES.find((l) => l.key === key);
            if (leaf) navigate(leaf.path);
          }}
        />
      </div>
    </div>
  );
}
