import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { App, Button, Col, Modal, Popconfirm, Row, Segmented, Table } from 'antd';
import { addPayment, removeBookingService } from '../context/actions/folioActions';
import { checkOut } from '../context/actions/bookingActions';
import { closeModal } from '../context/actions/uiActions';
import { calcInvoice, folioOf, sameId } from '../utils/booking';
import { BOOKING_STATUS, PAYMENT_METHOD_LABEL, SOURCE_OPTIONS } from '../utils/constants';
import { formatDate } from '../utils/date';
import { formatMoney } from '../utils/money';
import { sen, text } from '../utils/theme';
import MoneyInput from './MoneyInput';
import SectionCard from './SectionCard';
import ServiceChargePanel from './ServiceChargePanel';

// Trần 1240px nhưng co theo màn hẹp, không đẻ thanh cuộn ngang cho cả trang.
const MODAL_WIDTH = 'min(1240px, 94vw)';
const LABEL_WIDTH = 124;
const sub = { fontSize: 12, color: sen.muted };
const METHOD_OPTIONS = Object.entries(PAYMENT_METHOD_LABEL).map(([value, label]) => ({ value, label }));

function Field({ label, value }) {
  return (
    <div style={{ display: 'flex', gap: 8, fontSize: 13, padding: '3px 0' }}>
      <span style={{ width: LABEL_WIDTH, flexShrink: 0, color: sen.muted }}>{label}</span>
      <span style={{ color: sen.ink }}>{value || '—'}</span>
    </div>
  );
}

function SumLine({ label, value, tone, strong }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 24, padding: '3px 0' }}>
      <span style={{ fontSize: 13, color: sen.muted }}>{label}</span>
      <span
        style={{
          minWidth: 140,
          textAlign: 'right',
          fontVariantNumeric: 'tabular-nums',
          fontWeight: strong ? 600 : 500,
          fontSize: strong ? 16 : 14,
          color: tone || sen.ink,
        }}
      >
        {formatMoney(value)}
      </span>
    </div>
  );
}

/** Màn Thanh toán — rút gọn từ PaymentDialog.tsx: thông tin khách, bảng chi phí, ghi dịch vụ, thu tiền. */
export default function PaymentDialog({ bookingId }) {
  const dispatch = useDispatch();
  const { message } = App.useApp();
  const booking = useSelector((state) => state.bookings.list.find((b) => sameId(b.id, bookingId)));
  const rooms = useSelector((state) => state.rooms.list);
  const types = useSelector((state) => state.rooms.types);
  const folio = useSelector((state) => state.folio);
  const [method, setMethod] = useState('CASH');
  const [amount, setAmount] = useState(null);
  const [saving, setSaving] = useState(false);
  const close = () => dispatch(closeModal());

  if (!booking) return null;
  const room = rooms.find((r) => sameId(r.id, booking.roomId));
  const type = room && types.find((t) => t.id === room.roomTypeId);
  const { services, payments } = folioOf(folio, booking.id);
  const invoice = calcInvoice(booking, services, payments);
  const isStaying = booking.status === BOOKING_STATUS.CHECKED_IN;
  const canCollect = isStaying && invoice.balance > 0;
  const source = SOURCE_OPTIONS.find((s) => s.value === booking.source);

  const rows = [
    {
      key: 'room',
      stt: 1,
      description: `Tiền phòng ${room ? room.number : ''}${type ? ` (${type.name})` : ''}`,
      note: `${formatDate(booking.checkIn).slice(0, 5)} → ${formatDate(booking.checkOut)}`,
      qty: invoice.nights,
      unit: booking.pricePerNight,
      total: invoice.roomTotal,
    },
    ...services.map((s, i) => ({
      key: `s-${s.id}`,
      stt: i + 2,
      description: s.name,
      note: s.note,
      qty: s.quantity,
      unit: s.price,
      total: s.price * s.quantity,
      lineId: s.id,
    })),
  ];

  const handleRemove = async (lineId) => {
    const result = await dispatch(removeBookingService(lineId));
    if (result.ok) message.success('Đã xoá dòng dịch vụ');
    else message.error(result.error);
  };

  const columns = [
    { title: 'STT', dataIndex: 'stt', width: 52, align: 'right' },
    {
      title: 'Nội dung dịch vụ',
      key: 'description',
      render: (_, r) => (
        <>
          {r.description}
          {r.note ? <div style={sub}>{r.note}</div> : null}
        </>
      ),
    },
    { title: 'SL', dataIndex: 'qty', width: 56, align: 'right', render: (q) => String(q).padStart(2, '0') },
    { title: 'Đơn giá', dataIndex: 'unit', width: 120, align: 'right', render: (v) => formatMoney(v) },
    { title: 'Thành tiền', dataIndex: 'total', width: 130, align: 'right', render: (v) => <span style={{ fontWeight: 500 }}>{formatMoney(v)}</span> },
    {
      title: '',
      key: 'action',
      width: 48,
      render: (_, r) =>
        isStaying && r.lineId ? (
          <Popconfirm title={`Xoá "${r.description}"?`} onConfirm={() => handleRemove(r.lineId)}>
            <Button type="link" size="small" danger style={{ padding: 0 }}>Xoá</Button>
          </Popconfirm>
        ) : null,
    },
  ];

  const handleCollect = async () => {
    setSaving(true);
    const result = await dispatch(addPayment(booking.id, { amount: amount == null ? NaN : amount, method }));
    setSaving(false);
    if (result.ok) {
      message.success(`Đã thu ${formatMoney(amount)} (${PAYMENT_METHOD_LABEL[method]})`);
      setAmount(null);
    } else {
      message.error(result.error);
    }
  };

  const handleCheckOut = async () => {
    const result = await dispatch(checkOut(booking.id));
    if (result.ok) {
      message.success(`Đã trả phòng ${room ? room.number : ''}`);
      close();
    } else {
      message.error(result.error);
    }
  };

  return (
    <Modal
      title={`Thanh toán — ${booking.guestName} (${booking.bookingCode})`}
      open
      onCancel={close}
      width={MODAL_WIDTH}
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          {isStaying && (
            <Popconfirm title="Chắc chắn Check-out?" onConfirm={handleCheckOut}>
              <Button type="primary" danger>Check-out</Button>
            </Popconfirm>
          )}
          <Button onClick={close}>Đóng</Button>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '0 32px',
            background: sen.canvas,
            border: `1px solid ${sen.hairline}`,
            borderRadius: 14,
            padding: '12px 16px',
          }}
        >
          <Field label="Khách hàng" value={booking.guestName} />
          <Field label="Điện thoại" value={booking.phone} />
          <Field label="Phòng" value={room ? `${room.number}${type ? ` (${type.name})` : ''}` : null} />
          <Field label="Nguồn khách" value={source ? source.label : booking.source} />
          <Field label="Ngày nhận phòng" value={formatDate(booking.checkIn)} />
          <Field label="Ngày trả phòng" value={formatDate(booking.checkOut)} />
        </div>

        <Row gutter={[16, 16]}>
          <Col xs={24} xl={14}>
            <SectionCard title="Chi phí">
              <Table dataSource={rows} columns={columns} rowKey="key" pagination={false} size="small" />
              <div style={{ marginTop: 12 }}>
                <SumLine label="Tổng cộng" value={invoice.total} strong />
                <SumLine label="Đã thu" value={invoice.paid} tone={invoice.paid > 0 ? text.success : undefined} />
                <SumLine label="Còn lại" value={invoice.balance} tone={invoice.balance > 0 ? text.danger : text.success} strong />
              </div>
            </SectionCard>
          </Col>
          <Col xs={24} xl={10} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <ServiceChargePanel booking={booking} />
            <SectionCard title="Thu tiền">
              <Segmented options={METHOD_OPTIONS} value={method} onChange={setMethod} disabled={!canCollect} block />
              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                <MoneyInput aria-label="Số tiền thu" placeholder="Số tiền" value={amount} onChange={setAmount} min={0} disabled={!canCollect} />
                <Button onClick={() => setAmount(invoice.balance)} disabled={!canCollect}>Thu hết</Button>
                <Button type="primary" onClick={handleCollect} loading={saving} disabled={!canCollect || !amount}>
                  Thu tiền
                </Button>
              </div>
              <div style={{ marginTop: 8, fontSize: 13, color: sen.muted }}>
                {canCollect
                  ? `Còn phải thu ${formatMoney(invoice.balance)}`
                  : isStaying
                    ? 'Khách đã thanh toán đủ — có thể Check-out.'
                    : 'Chỉ thu tiền khi khách đang ở.'}
              </div>
            </SectionCard>
            <SectionCard title="Lịch sử thu tiền">
              <Table
                size="small"
                rowKey="id"
                pagination={false}
                dataSource={payments}
                locale={{ emptyText: 'Chưa thu lần nào' }}
                columns={[
                  { title: 'Thời gian', dataIndex: 'createdAt', render: (v) => new Date(v).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' }) },
                  { title: 'Hình thức', dataIndex: 'method', render: (m) => PAYMENT_METHOD_LABEL[m] || m },
                  { title: 'Số tiền', dataIndex: 'amount', align: 'right', render: (v) => formatMoney(v) },
                ]}
              />
            </SectionCard>
          </Col>
        </Row>
      </div>
    </Modal>
  );
}
