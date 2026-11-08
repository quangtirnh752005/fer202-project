import api, { errorMessage, fail, ok } from '../../utils/api';
import { clearSession, saveSession } from '../../utils/session';
import { LOGIN_SUCCESS, LOGOUT } from '../actionTypes';

export const login = (username, password) => async (dispatch) => {
  if (!username.trim() || !password) return fail('Nhập tên đăng nhập và mật khẩu');
  try {
    // Chỉ lọc theo username trên URL, mật khẩu so ở client để không lộ ra query string.
    const res = await api.get('/users', { params: { username: username.trim() } });
    const user = res.data.find((u) => u.password === password);
    if (!user) return fail('Sai tên đăng nhập hoặc mật khẩu');

    const session = { id: user.id, username: user.username, fullName: user.fullName };
    saveSession(session);
    dispatch({ type: LOGIN_SUCCESS, payload: session });
    return ok(session);
  } catch (e) {
    return fail(errorMessage(e));
  }
};

export const logout = () => (dispatch) => {
  clearSession();
  dispatch({ type: LOGOUT });
};
