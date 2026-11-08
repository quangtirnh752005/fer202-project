import { ADD_SERVICE_SUCCESS, LOAD_SUCCESS, UPDATE_SERVICE_SUCCESS } from '../actionTypes';

const initialState = { list: [] };

// Không có xoá: dịch vụ ngừng dùng thì tắt isActive, hoá đơn cũ vẫn nguyên (như app thật).
export default function serviceReducer(state = initialState, action) {
  switch (action.type) {
    case LOAD_SUCCESS:
      return { list: action.payload.services };
    case ADD_SERVICE_SUCCESS:
      return { list: [...state.list, action.payload] };
    case UPDATE_SERVICE_SUCCESS:
      return { list: state.list.map((s) => (s.id === action.payload.id ? action.payload : s)) };
    default:
      return state;
  }
}
