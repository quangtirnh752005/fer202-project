import { ADD_BOOKING_SUCCESS, LOAD_SUCCESS, UPDATE_BOOKING_SUCCESS } from '../actionTypes';

const initialState = { list: [] };

export default function bookingReducer(state = initialState, action) {
  switch (action.type) {
    case LOAD_SUCCESS:
      return { list: action.payload.bookings };
    case ADD_BOOKING_SUCCESS:
      return { list: [...state.list, action.payload] };
    case UPDATE_BOOKING_SUCCESS:
      return { list: state.list.map((b) => (b.id === action.payload.id ? action.payload : b)) };
    default:
      return state;
  }
}
