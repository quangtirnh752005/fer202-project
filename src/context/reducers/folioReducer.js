import {
  ADD_BOOKING_SERVICE_SUCCESS,
  ADD_PAYMENT_SUCCESS,
  DELETE_BOOKING_SERVICE_SUCCESS,
  LOAD_SUCCESS,
} from '../actionTypes';

// "Folio" = sổ của từng đặt phòng: dịch vụ đã dùng + các lần thu tiền.
const initialState = { bookingServices: [], payments: [] };

export default function folioReducer(state = initialState, action) {
  switch (action.type) {
    case LOAD_SUCCESS:
      return {
        bookingServices: action.payload.bookingServices,
        payments: action.payload.payments,
      };
    case ADD_BOOKING_SERVICE_SUCCESS:
      return { ...state, bookingServices: [...state.bookingServices, action.payload] };
    case DELETE_BOOKING_SERVICE_SUCCESS:
      return {
        ...state,
        bookingServices: state.bookingServices.filter((s) => s.id !== action.payload),
      };
    case ADD_PAYMENT_SUCCESS:
      return { ...state, payments: [...state.payments, action.payload] };
    default:
      return state;
  }
}
