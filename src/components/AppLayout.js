import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Outlet, useLocation } from 'react-router-dom';
import { Alert, Button, Layout, Spin } from 'antd';
import { fetchAll } from '../context/actions/dataActions';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import ModalHost from './ModalHost';

const { Header, Sider, Content } = Layout;
const CONTENT_PADDING = 24;
// Lưới Sơ đồ phòng tràn viền, mọi trang khác có lề 24px.
const FULL_BLEED = ['/booking/room-view'];

export default function AppLayout() {
  const dispatch = useDispatch();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const { loading, loaded, error } = useSelector((state) => state.ui);
  const fullBleed = FULL_BLEED.includes(location.pathname);

  useEffect(() => {
    dispatch(fetchAll());
  }, [dispatch]);

  return (
    // height (không phải minHeight) + overflow hidden: vùng cuộn duy nhất là <Content>,
    // rail và topbar đứng yên khi kéo trang.
    <Layout style={{ height: '100vh', overflow: 'hidden' }}>
      <Sider theme="light" collapsible collapsed={collapsed} onCollapse={setCollapsed} width={240}>
        <Sidebar />
      </Sider>
      <Layout>
        <Header style={{ padding: 0, background: '#fff', borderBottom: '1px solid #f0f0f0' }}>
          <Topbar />
        </Header>
        <Content style={{ overflow: 'auto', padding: fullBleed ? 0 : CONTENT_PADDING }}>
          {error && (
            <Alert
              type="error"
              showIcon
              style={{ margin: fullBleed ? 16 : 0, marginBottom: 16 }}
              title={error}
              action={<Button size="small" onClick={() => dispatch(fetchAll())}>Thử lại</Button>}
            />
          )}
          {!loaded && loading && (
            <div style={{ padding: 48, textAlign: 'center' }}>
              <Spin description="Đang tải dữ liệu…" />
            </div>
          )}
          {loaded && <Outlet />}
        </Content>
      </Layout>
      {loaded && <ModalHost />}
    </Layout>
  );
}
