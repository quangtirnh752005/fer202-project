import { LOGIN_SUCCESS, LOGOUT } from '../actionTypes';
import { loadSession } from '../../utils/session';

const initialState = { user: loadSession() };

export default function authReducer(state = initialState, action) {
  switch (action.type) {
    case LOGIN_SUCCESS:
      return { ...state, user: action.payload };
    case LOGOUT:
      return { ...state, user: null };
    default:
      return state;
  }
}
