import { LOAD_SUCCESS, UPDATE_ROOM_SUCCESS } from '../actionTypes';

const initialState = { list: [], types: [] };

export default function roomReducer(state = initialState, action) {
  switch (action.type) {
    case LOAD_SUCCESS:
      return { list: action.payload.rooms, types: action.payload.roomTypes };
    case UPDATE_ROOM_SUCCESS:
      return {
        ...state,
        list: state.list.map((r) => (r.id === action.payload.id ? action.payload : r)),
      };
    default:
      return state;
  }
}
