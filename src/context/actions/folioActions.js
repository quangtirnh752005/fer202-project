import api, { errorMessage, fail, ok } from '../../utils/api';
import { calcInvoice, folioOf, paymentError, sameId, serviceUsageError } from '../../utils/booking';
import { BOOKING_STATUS } from '../../utils/constants';
import { allocatePayment, billLines, serviceKey } from '../../utils/bill';
import { today } from '../../utils/date';
import {
  ADD_BOOKING_SERVICE_SUCCESS,
  ADD_PAYMENT_SUCCESS,
  DELETE_BOOKING_SERVICE_SUCCESS,
} from '../actionTypes';

const findBooking = (state, id) => state.bookings.list.find((b) => sameId(b.id, id));

// Ngày dùng = hôm nay, kẹp trong khoảng lưu trú.
const usedDateFor = (booking) => {
  const t = today();
  if (t < booking.checkIn) return booking.checkIn;
  if (t > booking.checkOut) return booking.checkOut;
  return t;
};

/**
 * line: { serviceId: id | null, name, price, quantity, note }
 * serviceId null = dịch vụ gõ tay, không có trong danh mục (giống quầy thật).
 */
export const addBookingService = (bookingId, line) => async (dispatch, getState) => {
  const state = getState();
  const booking = findBooking(state, bookingId);
  if (!booking) return fail('Không tìm thấy đặt phòng');
  const error = serviceUsageError(booking, line);
  if (error) return fail(error);

  const service = line.serviceId == null ? null : state.services.list.find((s) => sameId(s.id, line.serviceId));
  if (line.serviceId != null && !service) return fail('Dịch vụ không còn trong danh mục');

  // Chép tên + đơn giá vào bản ghi để hoá đơn không đổi khi danh mục bị sửa.
  const body = {
    bookingId: booking.id,
    serviceId: service ? service.id : null,
    name: service ? service.name : line.name.trim(),
    price: line.price,
    quantity: line.quantity,
    note: (line.note || '').trim(),
    usedDate: usedDateFor(booking),
  };
  try {
    const res = await api.post('/bookingServices', body);
    dispatch({ type: ADD_BOOKING_SERVICE_SUCCESS, payload: res.data });
    return ok(res.data);
  } catch (e) {
    return fail(errorMessage(e));
  }
};

export const removeBookingService = (id) => async (dispatch, getState) => {
  const state = getState();
  const line = state.folio.bookingServices.find((s) => sameId(s.id, id));
  if (!line) return fail('Không tìm thấy dòng dịch vụ');
  const booking = findBooking(state, line.bookingId);
  if (!booking || booking.status !== BOOKING_STATUS.CHECKED_IN) {
    return fail('Chỉ xoá dịch vụ khi khách đang ở');
  }
  // Dòng đã thu tiền mà xoá thì tiền đã thu mất chỗ gắn — hoá đơn lệch với các lần thu.
  const { services, payments } = folioOf(state.folio, booking.id);
  const billLine = billLines(booking, services, payments).find((l) => l.key === serviceKey(line.id));
  if (billLine && billLine.paid > 0) return fail(`"${line.name}" đã thu tiền, không xoá được`);
  try {
    await api.delete(`/bookingServices/${line.id}`);
    dispatch({ type: DELETE_BOOKING_SERVICE_SUCCESS, payload: line.id });
    return ok();
  } catch (e) {
    return fail(errorMessage(e));
  }
};

/** ticked: khoá các khoản lễ tân tick ('ROOM' | 'S:<id>') — nhận tiền trước, phần dư theo thứ tự hoá đơn. */
export const addPayment = (bookingId, { amount, ticked = [] }) => async (dispatch, getState) => {
  const state = getState();
  const booking = findBooking(state, bookingId);
  if (!booking) return fail('Không tìm thấy đặt phòng');

  const { services, payments } = folioOf(state.folio, booking.id);
  const { balance } = calcInvoice(booking, services, payments);
  const error = paymentError(booking, amount, balance);
  if (error) return fail(error);

  try {
    const res = await api.post('/payments', {
      bookingId: booking.id,
      amount,
      allocations: allocatePayment(amount, billLines(booking, services, payments), ticked),
      createdAt: new Date().toISOString(),
    });
    dispatch({ type: ADD_PAYMENT_SUCCESS, payload: res.data });
    return ok(res.data);
  } catch (e) {
    return fail(errorMessage(e));
  }
};
