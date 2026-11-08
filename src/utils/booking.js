import { BOOKING_STATUS, ROOM_DISPLAY, ROOM_STATUS } from './constants';
import { isValidISODate, nightsBetween } from './date';
import { formatVND } from './money';

const { BOOKED, CHECKED_IN, CHECKED_OUT, CANCELLED } = BOOKING_STATUS;
const ACTIVE_STATUSES = [BOOKED, CHECKED_IN];

const TRANSITIONS = {
  [BOOKED]: [CHECKED_IN, CANCELLED],
  [CHECKED_IN]: [CHECKED_OUT],
  [CHECKED_OUT]: [],
  [CANCELLED]: [],
};

// json-server trả id dạng số, còn URL params là chuỗi -> luôn so theo chuỗi.
export const sameId = (a, b) => String(a) === String(b);

export function canTransition(from, to) {
  return (TRANSITIONS[from] || []).includes(to);
}

// Hai khoảng [in, out) chồng nhau khi in1 < out2 và in2 < out1. Ngày ISO so chuỗi được.
export function findOverlap(bookings, candidate) {
  return (
    bookings.find(
      (b) =>
        ACTIVE_STATUSES.includes(b.status) &&
        sameId(b.roomId, candidate.roomId) &&
        !sameId(b.id, candidate.id) &&
        b.checkIn < candidate.checkOut &&
        candidate.checkIn < b.checkOut
    ) || null
  );
}

export function validateBooking(form, bookings, todayStr) {
  const errors = {};
  if (!form.guestName || !form.guestName.trim()) errors.guestName = 'Nhập tên khách';
  if (!/^0\d{9}$/.test(form.phone || '')) errors.phone = 'SĐT gồm 10 số, bắt đầu bằng 0';
  if (!form.roomId) errors.roomId = 'Chọn phòng';
  if (!isValidISODate(form.checkIn)) errors.checkIn = 'Ngày đến không hợp lệ';
  if (!isValidISODate(form.checkOut)) errors.checkOut = 'Ngày đi không hợp lệ';

  if (!errors.checkIn && !form.id && form.checkIn < todayStr) {
    errors.checkIn = 'Không đặt phòng cho ngày đã qua';
  }
  if (!errors.checkIn && !errors.checkOut && form.checkOut <= form.checkIn) {
    errors.checkOut = 'Ngày đi phải sau ngày đến';
  }
  if (Object.keys(errors).length === 0) {
    const clash = findOverlap(bookings, form);
    if (clash) errors.roomId = `Phòng đã có đặt phòng #${clash.id} (${clash.guestName}) trùng ngày`;
  }
  return errors;
}

// Lấy dịch vụ đã dùng + các lần thu của một đặt phòng từ state.folio.
export function folioOf(folio, bookingId) {
  return {
    services: folio.bookingServices.filter((s) => sameId(s.bookingId, bookingId)),
    payments: folio.payments.filter((p) => sameId(p.bookingId, bookingId)),
  };
}

export function calcInvoice(booking, services, payments) {
  const nights = nightsBetween(booking.checkIn, booking.checkOut);
  const roomTotal = nights * booking.pricePerNight;
  const serviceTotal = services.reduce((sum, s) => sum + s.price * s.quantity, 0);
  const paid = payments.reduce((sum, p) => sum + p.amount, 0);
  const total = roomTotal + serviceTotal;
  return { nights, roomTotal, serviceTotal, total, paid, balance: total - paid };
}

export function roomDisplayStatus(room, bookings, todayStr) {
  if (room.status !== ROOM_STATUS.AVAILABLE) return room.status;
  const reservedToday = bookings.some(
    (b) =>
      b.status === BOOKED &&
      sameId(b.roomId, room.id) &&
      b.checkIn <= todayStr &&
      todayStr < b.checkOut
  );
  return reservedToday ? 'RESERVED' : ROOM_STATUS.AVAILABLE;
}

// Đặt phòng "gắn" với phòng hôm nay: khách đang ở (kể cả quá hạn chưa trả), hoặc khách đến hôm nay.
export function currentBookingOf(room, bookings, todayStr) {
  const ofRoom = bookings.filter((b) => sameId(b.roomId, room.id));
  return (
    ofRoom.find((b) => b.status === CHECKED_IN) ||
    ofRoom.find((b) => b.status === BOOKED && b.checkIn <= todayStr && todayStr < b.checkOut) ||
    null
  );
}

// Các hàm *Error trả về câu lỗi để hiện cho lễ tân, hoặc null nếu hợp lệ.
export function checkInError(booking, room, todayStr) {
  if (!canTransition(booking.status, CHECKED_IN)) return 'Chỉ nhận phòng được khi đặt phòng đang ở trạng thái Đã đặt';
  if (booking.checkIn > todayStr) return 'Chưa tới ngày đến, chưa nhận phòng được';
  if (booking.checkOut <= todayStr) return 'Đã qua ngày đi, không nhận phòng được nữa';
  if (!room) return 'Không tìm thấy phòng';
  if (room.status !== ROOM_STATUS.AVAILABLE) {
    return `Phòng ${room.number} đang ở trạng thái "${ROOM_DISPLAY[room.status].label}", chưa nhận được`;
  }
  return null;
}

export function checkOutError(booking, invoice) {
  if (!canTransition(booking.status, CHECKED_OUT)) return 'Chỉ trả phòng được khi khách đang ở';
  if (invoice.balance > 0) return `Khách còn nợ ${formatVND(invoice.balance)}, thu đủ trước khi trả phòng`;
  return null;
}

export function cancelError(booking) {
  if (!canTransition(booking.status, CANCELLED)) return 'Chỉ huỷ được đặt phòng chưa nhận phòng';
  return null;
}

// Dịch vụ gõ tay (không có trong danh mục) vẫn ghi được — giống quầy thật: tên + đơn giá do lễ tân nhập.
export function serviceUsageError(booking, { name, price, quantity }) {
  if (booking.status !== CHECKED_IN) return 'Chỉ ghi dịch vụ khi khách đang ở';
  if (!name || !name.trim()) return 'Nhập tên dịch vụ';
  if (!Number.isInteger(quantity) || quantity < 1) return 'Số lượng phải là số nguyên từ 1 trở lên';
  if (!Number.isInteger(price) || price < 0) return 'Đơn giá phải là số nguyên không âm';
  return null;
}

// Mã đặt phòng kế tiếp: BK0001, BK0002… lấy từ mã lớn nhất đang có.
export function nextBookingCode(bookings) {
  const max = bookings.reduce((m, b) => {
    const n = Number(String(b.bookingCode || '').replace(/\D/g, ''));
    return Number.isFinite(n) && n > m ? n : m;
  }, 0);
  return `BK${String(max + 1).padStart(4, '0')}`;
}

export function paymentError(booking, amount, balance) {
  if (booking.status !== CHECKED_IN) return 'Chỉ thu tiền khi khách đang ở';
  if (!Number.isInteger(amount) || amount <= 0) return 'Số tiền phải lớn hơn 0';
  if (amount > balance) return `Số tiền vượt số còn nợ (${formatVND(balance)})`;
  return null;
}
