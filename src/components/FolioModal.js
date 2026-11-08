import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { App, Button, Descriptions, Modal, Popconfirm } from 'antd';
import { cancelBooking, checkIn, checkOut } from '../context/actions/bookingActions';
import { closeModal, openBookingForm, openPayment } from '../context/actions/uiActions';
import { calcInvoice, folioOf, sameId } from '../utils/booking';
import { BOOKING_STATUS, SOURCE_OPTIONS } from '../utils/constants';
import { formatMoney } from '../utils/money';
import FolioSummary from './FolioSummary';

/** Chi tiết đặt phòng — chép từ FolioModal.tsx: tóm tắt + thông tin + các nút hành động theo trạng thái. */
export default function FolioModal({ bookingId }) {
  const dispatch = useDispatch();
  const { message } = App.useApp();
  const booking = useSelector((state) => state.bookings.list.find((b) => sameId(b.id, bookingId)));
  const rooms = useSelector((state) => state.rooms.list);
  const types = useSelector((state) => state.rooms.types);
  const folio = useSelector((state) => state.folio);
  const [busy, setBusy] = useState(false);
  const close = () => dispatch(closeModal());

  if (!booking) return null;
  const room = rooms.find((r) => sameId(r.id, booking.roomId));
  const type = room && types.find((t) => t.id === room.roomTypeId);
  const { services, payments } = folioOf(folio, booking.id);
  const invoice = calcInvoice(booking, services, payments);
  const source = SOURCE_OPTIONS.find((s) => s.value === booking.source);
  const isBooked = booking.status === BOOKING_STATUS.BOOKED;
  const isStaying = booking.status === BOOKING_STATUS.CHECKED_IN;

  const run = async (thunk, successText) => {
    setBusy(true);
    const result = await dispatch(thunk);
    setBusy(false);
    if (result.ok) {
      message.success(successText);
      close();
    } else {
      message.error(result.error);
    }
  };

  const footer = (
    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', gap: 8 }}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {isBooked && (
          <Popconfirm title="Huỷ đặt phòng này?" okText="Huỷ booking" cancelText="Không" onConfirm={() => run(cancelBooking(booking.id), 'Đã huỷ đặt phòng')}>
            <Button danger disabled={busy}>Hủy Booking</Button>
          </Popconfirm>
        )}
        {isBooked && <Button onClick={() => dispatch(openBookingForm({ bookingId: booking.id }))}>Sửa đặt phòng</Button>}
        {isBooked && (
          <Popconfirm title="Chắc chắn Check-in khách?" onConfirm={() => run(checkIn(booking.id), `Đã nhận phòng ${room ? room.number : ''}`)}>
            <Button type="primary" loading={busy}>Check-in</Button>
          </Popconfirm>
        )}
        {isStaying && (
          <Popconfirm title="Chắc chắn Check-out?" onConfirm={() => run(checkOut(booking.id), `Đã trả phòng ${room ? room.number : ''}`)}>
            <Button type="primary" danger loading={busy}>Check-out</Button>
          </Popconfirm>
        )}
        {booking.status !== BOOKING_STATUS.CANCELLED && (
          <Button onClick={() => dispatch(openPayment(booking.id))}>Thanh toán</Button>
        )}
      </div>
      <Button onClick={close}>Đóng</Button>
    </div>
  );

  return (
    <Modal
      title={`Đặt phòng: ${booking.guestName} (${booking.bookingCode})`}
      open
      onCancel={close}
      footer={footer}
      width={720}
    >
      <FolioSummary booking={booking} invoice={invoice} room={room} type={type} />
      <Descriptions
        size="small"
        column={2}
        style={{ marginTop: 16 }}
        items={[
          { key: 'phone', label: 'Số điện thoại', children: booking.phone },
          { key: 'source', label: 'Nguồn khách', children: source ? source.label : booking.source },
          {
            key: 'guests',
            label: 'Số khách',
            children: `${booking.adults} người lớn${booking.children ? `, ${booking.children} trẻ em` : ''}`,
          },
          { key: 'price', label: 'Giá phòng/đêm', children: formatMoney(booking.pricePerNight) },
          { key: 'note', label: 'Ghi chú', span: 2, children: booking.note || '—' },
        ]}
      />
    </Modal>
  );
}
