const pad = (n) => String(n).padStart(2, '0');
const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function toISODate(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function today() {
  return toISODate(new Date());
}

export function addDays(isoDate, days) {
  const [y, m, d] = isoDate.split('-').map(Number);
  return toISODate(new Date(y, m - 1, d + days));
}

// new Date(2026, 1, 31) tự cuộn sang 03/03 nên phải so vòng tròn mới bắt được ngày tràn.
export function isValidISODate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return false;
  const [y, m, d] = value.split('-').map(Number);
  return toISODate(new Date(y, m - 1, d)) === value;
}

// Tính bằng UTC để không lệch 1 đêm khi dải ngày đi qua mốc đổi giờ.
export function nightsBetween(checkIn, checkOut) {
  const [y1, m1, d1] = checkIn.split('-').map(Number);
  const [y2, m2, d2] = checkOut.split('-').map(Number);
  return Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / MS_PER_DAY);
}

export function formatDate(isoDate) {
  if (!isoDate) return '';
  const [y, m, d] = isoDate.slice(0, 10).split('-');
  return `${d}/${m}/${y}`;
}
