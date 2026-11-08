import { CLOSE_MODAL, OPEN_MODAL } from '../actionTypes';

// Modal Chi tiết / Thanh toán / Form đặt phòng do Redux điều khiển: trang nào cũng mở
// được (Sơ đồ phòng, Danh sách), một ModalHost duy nhất trong AppLayout vẽ chúng.
export const openFolio = (bookingId) => ({ type: OPEN_MODAL, payload: { kind: 'folio', bookingId } });
export const openPayment = (bookingId) => ({ type: OPEN_MODAL, payload: { kind: 'payment', bookingId } });

/** initial: { roomId?, checkIn?, checkOut? } khi tạo mới, hoặc { bookingId } khi sửa. */
export const openBookingForm = (initial = {}) => ({ type: OPEN_MODAL, payload: { kind: 'form', initial } });

export const closeModal = () => ({ type: CLOSE_MODAL });
