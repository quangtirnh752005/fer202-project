import bookingReducer from './bookingReducer';
import folioReducer from './folioReducer';
import serviceReducer from './serviceReducer';
import uiReducer from './uiReducer';
import {
  ADD_BOOKING_SUCCESS,
  ADD_PAYMENT_SUCCESS,
  CLOSE_MODAL,
  LOAD_FAILURE,
  LOAD_START,
  LOGOUT,
  OPEN_MODAL,
  UPDATE_BOOKING_SUCCESS,
  UPDATE_SERVICE_SUCCESS,
} from '../actionTypes';

describe('bookingReducer', () => {
  const state = { list: [{ id: 1, status: 'BOOKED' }] };

  test('thêm booking không sửa state cũ', () => {
    const next = bookingReducer(state, { type: ADD_BOOKING_SUCCESS, payload: { id: 2 } });
    expect(next.list).toHaveLength(2);
    expect(state.list).toHaveLength(1);
  });

  test('cập nhật đúng booking theo id', () => {
    const next = bookingReducer(state, {
      type: UPDATE_BOOKING_SUCCESS,
      payload: { id: 1, status: 'CHECKED_IN' },
    });
    expect(next.list[0].status).toBe('CHECKED_IN');
    expect(state.list[0].status).toBe('BOOKED');
  });
});

test('serviceReducer bật/tắt dịch vụ theo id', () => {
  const state = { list: [{ id: 1, isActive: true }, { id: 2, isActive: true }] };
  const next = serviceReducer(state, { type: UPDATE_SERVICE_SUCCESS, payload: { id: 1, isActive: false } });
  expect(next.list).toEqual([{ id: 1, isActive: false }, { id: 2, isActive: true }]);
  expect(state.list[0].isActive).toBe(true);
});

test('uiReducer mở/đóng modal', () => {
  const opened = uiReducer(undefined, { type: OPEN_MODAL, payload: { kind: 'folio', bookingId: 3 } });
  expect(opened.modal).toEqual({ kind: 'folio', bookingId: 3 });
  expect(uiReducer(opened, { type: CLOSE_MODAL }).modal).toBeNull();
});

test('folioReducer thêm payment giữ nguyên bookingServices', () => {
  const state = { bookingServices: [{ id: 1 }], payments: [] };
  const next = folioReducer(state, { type: ADD_PAYMENT_SUCCESS, payload: { id: 5, amount: 100 } });
  expect(next.payments).toEqual([{ id: 5, amount: 100 }]);
  expect(next.bookingServices).toBe(state.bookingServices);
});

test('uiReducer: start -> failure -> logout reset', () => {
  let s = uiReducer(undefined, { type: LOAD_START });
  expect(s.loading).toBe(true);
  s = uiReducer(s, { type: LOAD_FAILURE, payload: 'mất kết nối' });
  expect(s).toEqual({ loading: false, loaded: false, error: 'mất kết nối', modal: null });
  expect(uiReducer(s, { type: LOGOUT })).toEqual({ loading: false, loaded: false, error: null, modal: null });
});
