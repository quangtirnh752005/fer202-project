import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:9999',
  timeout: 8000,
});

export function errorMessage(error) {
  if (error && error.response) return `Lỗi máy chủ (${error.response.status}), thử lại sau`;
  return 'Không kết nối được json-server ở cổng 9999. Đã chạy "npm run server" chưa?';
}

export const fail = (error) => ({ ok: false, error });
export const ok = (data) => ({ ok: true, data });

export default api;
