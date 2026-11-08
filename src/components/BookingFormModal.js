import { useDispatch, useSelector } from 'react-redux';
import { Alert, Modal } from 'antd';
import { closeModal, openFolio } from '../context/actions/uiActions';
import { sameId } from '../utils/booking';
import { BOOKING_STATUS } from '../utils/constants';
import BookingForm from './BookingForm';

/** Popup Tạo / Sửa đặt phòng (kéo-chọn trên Sơ đồ phòng, hoặc nút Sửa trong Chi tiết). */
export default function BookingFormModal({ initial }) {
  const dispatch = useDispatch();
  const rooms = useSelector((state) => state.rooms.list);
  const booking = useSelector((state) =>
    initial.bookingId ? state.bookings.list.find((b) => sameId(b.id, initial.bookingId)) : null
  );
  const close = () => dispatch(closeModal());

  const room = rooms.find((r) => sameId(r.id, booking ? booking.roomId : initial.roomId));
  const title = booking
    ? `Sửa đặt phòng ${booking.bookingCode}`
    : ['Tạo đặt phòng', room ? `Phòng ${room.number}` : null].filter(Boolean).join(' · ');

  return (
    <Modal open onCancel={close} footer={null} width={880} style={{ top: 24 }} title={title}>
      {booking && booking.status !== BOOKING_STATUS.BOOKED ? (
        <Alert type="warning" showIcon title="Chỉ sửa được đặt phòng chưa nhận phòng." />
      ) : (
        <BookingForm initial={initial} booking={booking} onCancel={close} onDone={(saved) => dispatch(openFolio(saved.id))} />
      )}
    </Modal>
  );
}
