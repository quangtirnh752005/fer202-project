import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { App, Button, Input, Space, Switch, Table, Typography } from 'antd';
import { createService, setServiceActive } from '../context/actions/serviceActions';
import { sameId } from '../utils/booking';
import { formatMoney } from '../utils/money';
import { sen } from '../utils/theme';
import MoneyInput from './MoneyInput';
import SectionCard from './SectionCard';

/**
 * Danh mục dịch vụ — chép từ ServiceCatalogPage.tsx. KHÔNG có nút xoá: dòng đã dùng
 * mà xoá là gãy lịch sử. Ngừng dùng thì tắt công tắc, hoá đơn cũ còn nguyên.
 */
export default function ServiceCatalogPage() {
  const dispatch = useDispatch();
  const { message } = App.useApp();
  const services = useSelector((state) => state.services.list);
  const bookingServices = useSelector((state) => state.folio.bookingServices);
  const [name, setName] = useState('');
  const [price, setPrice] = useState(null);
  const [saving, setSaving] = useState(false);

  const handleAdd = async () => {
    setSaving(true);
    const result = await dispatch(createService({ name, price: price == null ? NaN : price }));
    setSaving(false);
    if (!result.ok) {
      message.error(result.error);
      return;
    }
    message.success('Đã thêm dịch vụ');
    setName('');
    setPrice(null);
  };

  const handleToggle = async (service, checked) => {
    const result = await dispatch(setServiceActive(service.id, checked));
    if (result.ok) message.success(checked ? `Đã bật ${service.name}` : `Đã tắt ${service.name}`);
    else message.error(result.error);
  };

  const columns = [
    { title: 'Tên dịch vụ', dataIndex: 'name' },
    { title: 'Đơn giá', dataIndex: 'price', align: 'right', width: 160, render: (v) => formatMoney(v) },
    {
      title: 'Đã dùng',
      key: 'used',
      align: 'right',
      width: 110,
      render: (_, s) => `${bookingServices.filter((l) => sameId(l.serviceId, s.id)).length} lần`,
    },
    {
      title: 'Đang dùng',
      key: 'isActive',
      width: 110,
      render: (_, s) => <Switch checked={s.isActive} onChange={(checked) => handleToggle(s, checked)} />,
    },
  ];

  return (
    <div style={{ maxWidth: 960 }}>
      <Typography.Title level={3} style={{ marginTop: 0 }}>
        Danh mục dịch vụ
      </Typography.Title>
      <SectionCard title="Thêm dịch vụ">
        <Space.Compact style={{ width: '100%', maxWidth: 560 }}>
          <Input
            aria-label="Tên dịch vụ"
            placeholder="Tên dịch vụ, vd: Giặt là"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onPressEnter={handleAdd}
            disabled={saving}
          />
          <MoneyInput aria-label="Đơn giá" style={{ width: 180 }} placeholder="Đơn giá" value={price} onChange={setPrice} min={0} disabled={saving} />
          <Button type="primary" onClick={handleAdd} loading={saving}>
            Thêm
          </Button>
        </Space.Compact>
        <div style={{ marginTop: 8, fontSize: 12, color: sen.muted }}>
          Đơn giá ở đây là giá gợi ý — lễ tân vẫn sửa được khi ghi vào hoá đơn.
        </div>
      </SectionCard>

      <SectionCard title="Danh sách" style={{ marginTop: 16 }}>
        <Table dataSource={services} columns={columns} rowKey="id" pagination={false} locale={{ emptyText: 'Chưa có dịch vụ nào trong danh mục' }} />
      </SectionCard>
    </div>
  );
}
