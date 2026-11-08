import { CLOSE_MODAL, LOAD_FAILURE, LOAD_START, LOAD_SUCCESS, LOGOUT, OPEN_MODAL } from '../actionTypes';

// modal: null | { kind: 'folio' | 'payment', bookingId } | { kind: 'form', initial }
const initialState = { loading: false, loaded: false, error: null, modal: null };

export default function uiReducer(state = initialState, action) {
  switch (action.type) {
    case LOAD_START:
      return { ...state, loading: true, error: null };
    case LOAD_SUCCESS:
      return { ...state, loading: false, loaded: true };
    case LOAD_FAILURE:
      return { ...state, loading: false, error: action.payload };
    case OPEN_MODAL:
      return { ...state, modal: action.payload };
    case CLOSE_MODAL:
      return { ...state, modal: null };
    case LOGOUT:
      return initialState;
    default:
      return state;
  }
}
