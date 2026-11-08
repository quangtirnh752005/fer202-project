import api, { errorMessage, fail, ok } from '../../utils/api';
import {
  calcInvoice,
  cancelError,
  checkInError,
  checkOutError,
  folioOf,
  nextBookingCode,
  sameId,
  validateBooking,
} from '../../utils/booking';
import { BOOKING_STATUS, ROOM_STATUS } from '../../utils/constants';
import { today } from '../../utils/date';
import { ADD_BOOKING_SUCCESS, UPDATE_BOOKING_SUCCESS, UPDATE_ROOM_SUCCESS } from '../actionTypes';

const findBooking = (state, id) => state.bookings.list.find((b) => sameId(b.id, id));
const findRoom = (state, id) => state.rooms.list.find((r) => sameId(r.id, id));
const priceOfRoom = (state, room) => state.rooms.types.find((t) => t.id === room.roomTypeId).price;

function bookingFields(form, room) {
  return {
    guestName: form.guestName.trim(),
    phone: form.phone,
    roomId: room.id,
    checkIn: form.checkIn,
    checkOut: form.checkOut,
    source: form.source || 'DIRECT',
    adults: Number(form.adults) || 1,
    children: Number(form.children) || 0,
    note: (form.note || '').trim(),
  };
}

export const createBooking = (form) => async (dispatch, getState) => {
  const state = getState();
  const errors = validateBooking(form, state.bookings.list, today());
  if (Object.keys(errors).length > 0) return { ok: false, errors };

  const room = findRoom(state, form.roomId);
  const body = {
    bookingCode: nextBookingCode(state.bookings.list),
    ...bookingFields(form, room),
    // Chốt giá lúc đặt: sửa giá hạng phòng sau này không làm đổi hoá đơn cũ.
    pricePerNight: priceOfRoom(state, room),
    status: BOOKING_STATUS.BOOKED,
    createdAt: new Date().toISOString(),
  };
  try {
    const res = await api.post('/bookings', body);
    dispatch({ type: ADD_BOOKING_SUCCESS, payload: res.data });
    return ok(res.data);
  } catch (e) {
    return fail(errorMessage(e));
  }
};

export const updateBooking = (id, form) => async (dispatch, getState) => {
  const state = getState();
  const booking = findBooking(state, id);
  if (!booking) return fail('Không tìm thấy đặt phòng');
  if (booking.status !== BOOKING_STATUS.BOOKED) return fail('Chỉ sửa được đặt phòng chưa nhận phòng');

  const errors = validateBooking({ ...form, id: booking.id }, state.bookings.list, today());
  if (Object.keys(errors).length > 0) return { ok: false, errors };

  const room = findRoom(state, form.roomId);
  const roomChanged = !sameId(room.id, booking.roomId);
  const body = {
    ...bookingFields(form, room),
    pricePerNight: roomChanged ? priceOfRoom(state, room) : booking.pricePerNight,
  };
  try {
    const res = await api.patch(`/bookings/${booking.id}`, body);
    dispatch({ type: UPDATE_BOOKING_SUCCESS, payload: res.data });
    return ok(res.data);
  } catch (e) {
    return fail(errorMessage(e));
  }
};

export const cancelBooking = (id) => async (dispatch, getState) => {
  const booking = findBooking(getState(), id);
  if (!booking) return fail('Không tìm thấy đặt phòng');
  const error = cancelError(booking);
  if (error) return fail(error);
  try {
    const res = await api.patch(`/bookings/${booking.id}`, { status: BOOKING_STATUS.CANCELLED });
    dispatch({ type: UPDATE_BOOKING_SUCCESS, payload: res.data });
    return ok(res.data);
  } catch (e) {
    return fail(errorMessage(e));
  }
};

// json-server không có transaction: ghi bước 1, nếu bước 2 hỏng thì ghi ngược bước 1
// để booking và phòng không lệch trạng thái nhau.
async function patchPair(dispatch, first, second) {
  const firstRes = await api.patch(first.url, first.body);
  try {
    const secondRes = await api.patch(second.url, second.body);
    dispatch({ type: first.type, payload: firstRes.data });
    dispatch({ type: second.type, payload: secondRes.data });
  } catch (e) {
    try {
      await api.patch(first.url, first.undo);
    } catch (undoError) {
      throw new Error('Ghi dở dang, dữ liệu có thể lệch. Tải lại trang để kiểm tra.');
    }
    throw e;
  }
}

const runPair = async (dispatch, first, second) => {
  try {
    await patchPair(dispatch, first, second);
    return ok();
  } catch (e) {
    return fail(e.isAxiosError ? errorMessage(e) : e.message);
  }
};

export const checkIn = (id) => async (dispatch, getState) => {
  const state = getState();
  const booking = findBooking(state, id);
  if (!booking) return fail('Không tìm thấy đặt phòng');
  const room = findRoom(state, booking.roomId);
  const error = checkInError(booking, room, today());
  if (error) return fail(error);

  return runPair(
    dispatch,
    {
      url: `/rooms/${room.id}`,
      body: { status: ROOM_STATUS.OCCUPIED },
      undo: { status: room.status },
      type: UPDATE_ROOM_SUCCESS,
    },
    {
      url: `/bookings/${booking.id}`,
      body: { status: BOOKING_STATUS.CHECKED_IN, checkedInAt: new Date().toISOString() },
      type: UPDATE_BOOKING_SUCCESS,
    }
  );
};

export const checkOut = (id) => async (dispatch, getState) => {
  const state = getState();
  const booking = findBooking(state, id);
  if (!booking) return fail('Không tìm thấy đặt phòng');
  const { services, payments } = folioOf(state.folio, booking.id);
  const error = checkOutError(booking, calcInvoice(booking, services, payments));
  if (error) return fail(error);

  return runPair(
    dispatch,
    {
      url: `/bookings/${booking.id}`,
      body: { status: BOOKING_STATUS.CHECKED_OUT, checkedOutAt: new Date().toISOString() },
      undo: { status: booking.status, checkedOutAt: null },
      type: UPDATE_BOOKING_SUCCESS,
    },
    {
      url: `/rooms/${booking.roomId}`,
      body: { status: ROOM_STATUS.DIRTY },
      type: UPDATE_ROOM_SUCCESS,
    }
  );
};
