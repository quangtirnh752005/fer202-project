import api, { errorMessage, fail, ok } from '../../utils/api';
import { sameId } from '../../utils/booking';
import { ADD_SERVICE_SUCCESS, UPDATE_SERVICE_SUCCESS } from '../actionTypes';

export function validateService(form, services) {
  const name = (form.name || '').trim();
  if (!name) return 'Nhập tên dịch vụ';
  if (!Number.isInteger(form.price) || form.price < 0) return 'Đơn giá phải là số nguyên không âm';
  const duplicate = services.find((s) => s.name.trim().toLowerCase() === name.toLowerCase() && !sameId(s.id, form.id));
  if (duplicate) return 'Đã có dịch vụ trùng tên';
  return null;
}

export const createService = (form) => async (dispatch, getState) => {
  const error = validateService(form, getState().services.list);
  if (error) return fail(error);
  try {
    const res = await api.post('/services', { name: form.name.trim(), price: form.price, isActive: true });
    dispatch({ type: ADD_SERVICE_SUCCESS, payload: res.data });
    return ok(res.data);
  } catch (e) {
    return fail(errorMessage(e));
  }
};

// Không có xoá: bookingServices tham chiếu serviceId, xoá là gãy lịch sử.
// Ngừng dùng thì tắt — dịch vụ biến khỏi ô chọn của lễ tân, hoá đơn cũ còn nguyên.
export const setServiceActive = (id, isActive) => async (dispatch) => {
  try {
    const res = await api.patch(`/services/${id}`, { isActive });
    dispatch({ type: UPDATE_SERVICE_SUCCESS, payload: res.data });
    return ok(res.data);
  } catch (e) {
    return fail(errorMessage(e));
  }
};
