import api, { errorMessage } from '../../utils/api';
import { LOAD_FAILURE, LOAD_START, LOAD_SUCCESS } from '../actionTypes';

const COLLECTIONS = ['rooms', 'roomTypes', 'bookings', 'services', 'bookingServices', 'payments'];

// Dữ liệu nhỏ (60 phòng) nên tải hết một lần sau khi đăng nhập.
export const fetchAll = () => async (dispatch) => {
  dispatch({ type: LOAD_START });
  try {
    const responses = await Promise.all(COLLECTIONS.map((name) => api.get(`/${name}`)));
    const payload = COLLECTIONS.reduce(
      (acc, name, i) => ({ ...acc, [name]: responses[i].data }),
      {}
    );
    dispatch({ type: LOAD_SUCCESS, payload });
  } catch (e) {
    dispatch({ type: LOAD_FAILURE, payload: errorMessage(e) });
  }
};
