import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { App, AutoComplete, Button, Input, Space } from 'antd';
import { addBookingService } from '../context/actions/folioActions';
import { BOOKING_STATUS } from '../utils/constants';
import { formatMoney } from '../utils/money';
import { sen } from '../utils/theme';
import MoneyInput from './MoneyInput';
import SectionCard from './SectionCard';

/**
 * Ghi dịch vụ phát sinh — chép từ ServiceChargePanel.tsx. AutoComplete chứ không phải Select:
 * lễ tân phải gõ được dịch vụ KHÔNG có trong danh mục; chọn từ danh mục thì đơn giá tự về.
 */
export default function ServiceChargePanel({ booking }) {
  const dispatch = useDispatch();
  const { message } = App.useApp();
  const catalog = useSelector((state) => state.services.list.filter((s) => s.isActive));
  const [serviceName, setServiceName] = useState('');
  const [serviceId, setServiceId] = useState(null);
  const [note, setNote] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [unitPrice, setUnitPrice] = useState(null);
  const [saving, setSaving] = useState(false);
  const disabled = booking.status !== BOOKING_STATUS.CHECKED_IN || saving;

  const term = serviceName.trim().toLowerCase();
  const options = catalog
    .filter((s) => !term || s.name.toLowerCase().includes(term))
    .map((s) => ({ value: s.name, label: `${s.name} · ${formatMoney(s.price)}`, id: s.id, price: s.price }));

  const handleSubmit = async () => {
    setSaving(true);
    const result = await dispatch(
      addBookingService(booking.id, {
        serviceId,
        name: serviceName,
        price: unitPrice == null ? NaN : unitPrice,
        quantity: quantity == null ? NaN : quantity,
        note,
      })
    );
    setSaving(false);
    if (!result.ok) {
      message.error(result.error);
      return;
    }
    message.success('Thêm dịch vụ thành công');
    setServiceName('');
    setServiceId(null);
    setNote('');
    setQuantity(1);
    setUnitPrice(null);
  };

  return (
    <SectionCard title="Dịch vụ phát sinh">
      <Space.Compact style={{ width: '100%' }}>
        <AutoComplete
          aria-label="Tên dịch vụ"
          style={{ width: '44%' }}
          placeholder="Tên dịch vụ"
          value={serviceName}
          options={options}
          onSelect={(value, option) => {
            setServiceName(value);
            setServiceId(option.id);
            setUnitPrice(option.price);
          }}
          // Gõ tay đè lên lựa chọn cũ: dòng này không còn là dịch vụ trong danh mục nữa.
          onChange={(value) => {
            setServiceName(value);
            setServiceId(null);
          }}
          disabled={disabled}
        />
        <MoneyInput aria-label="Số lượng" style={{ width: '16%' }} placeholder="SL" value={quantity} onChange={setQuantity} min={1} disabled={disabled} />
        <MoneyInput aria-label="Đơn giá" style={{ width: '26%' }} placeholder="Đơn giá" value={unitPrice} onChange={setUnitPrice} min={0} disabled={disabled} />
        <Button type="primary" onClick={handleSubmit} disabled={disabled}>
          Thêm
        </Button>
      </Space.Compact>
      <Input
        aria-label="Ghi chú"
        style={{ marginTop: 8 }}
        placeholder="Ghi chú, vd: 1 coca, 2 bia — đón sân bay 4 chỗ"
        value={note}
        maxLength={200}
        onChange={(e) => setNote(e.target.value)}
        onPressEnter={handleSubmit}
        disabled={disabled}
      />
      <div style={{ marginTop: 8, fontSize: 13, color: sen.muted }}>
        {booking.status === BOOKING_STATUS.CHECKED_IN ? (
          <>
            Thành tiền:{' '}
            <span style={{ color: sen.ink, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
              {formatMoney((quantity || 0) * (unitPrice || 0))}
            </span>
          </>
        ) : (
          'Chỉ ghi dịch vụ khi khách đang ở.'
        )}
      </div>
    </SectionCard>
  );
}
