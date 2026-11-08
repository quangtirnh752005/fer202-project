const KEY = 'hotel-session';

// localStorage có thể ném lỗi (chế độ riêng tư, bị chặn) -> coi như chưa đăng nhập.
export function loadSession() {
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

export function saveSession(user) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(user));
  } catch (e) {
    // Không lưu được thì phiên chỉ sống tới khi tải lại trang.
  }
}

export function clearSession() {
  try {
    window.localStorage.removeItem(KEY);
  } catch (e) {
    // bỏ qua
  }
}
