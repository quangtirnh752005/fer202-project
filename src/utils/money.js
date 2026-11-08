const vnd = new Intl.NumberFormat('vi-VN');

export function formatMoney(amount) {
  const n = amount == null || Number.isNaN(Number(amount)) ? 0 : Number(amount);
  return `${vnd.format(n)} ₫`;
}

// Giữ tên cũ cho các câu báo lỗi trong utils/booking.js.
export const formatVND = formatMoney;

/** "500000" → "500,000" — phân cách nghìn ngay khi gõ trong ô tiền. */
export const moneyFormatter = (value) =>
  value === undefined || value === null || value === '' ? '' : `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

export const moneyParser = (display) => (display ? Number(String(display).replace(/[^\d]/g, '')) : 0);
