// Các khoản của hoá đơn + tiền đã thu gắn vào từng khoản (như allocate-in-tx của app thật).
import { nightsBetween } from './date';

export const ROOM_KEY = 'ROOM';
export const serviceKey = (id) => `S:${id}`;

/**
 * Dòng hoá đơn theo thứ tự: tiền phòng rồi từng dòng dịch vụ; mỗi dòng có paid / due.
 * payment.allocations = [{ key, amount }] gắn tiền vào đúng khoản. Tiền không gắn được
 * (payment cũ chưa có allocations, khoản đã bị xoá, khoản giảm giá sau khi đổi hạng)
 * gom lại rồi rải theo thứ tự hoá đơn — tổng đã thu luôn khớp tổng các lần thu.
 */
export function billLines(booking, services, payments) {
  const lines = [
    {
      key: ROOM_KEY,
      kind: 'ROOM',
      qty: nightsBetween(booking.checkIn, booking.checkOut),
      unit: booking.pricePerNight,
      service: null,
    },
    ...services.map((s) => ({ key: serviceKey(s.id), kind: 'SERVICE', qty: s.quantity, unit: s.price, service: s })),
  ].map((l) => ({ ...l, total: l.qty * l.unit }));

  const paid = Object.fromEntries(lines.map((l) => [l.key, 0]));
  let pool = 0;
  payments.forEach((p) => {
    if (!Array.isArray(p.allocations)) {
      pool += p.amount;
      return;
    }
    p.allocations.forEach((a) => {
      const line = lines.find((l) => l.key === a.key);
      if (!line) {
        pool += a.amount;
        return;
      }
      const take = Math.min(line.total - paid[a.key], a.amount);
      paid[a.key] += take;
      pool += a.amount - take;
    });
  });
  lines.forEach((l) => {
    const take = Math.min(pool, l.total - paid[l.key]);
    paid[l.key] += take;
    pool -= take;
  });

  return lines.map((l, i) => ({ ...l, stt: i + 1, paid: paid[l.key], due: l.total - paid[l.key] }));
}

/** Gắn một lần thu vào các khoản còn nợ: khoản được tick trước, phần dư theo thứ tự hoá đơn. */
export function allocatePayment(amount, lines, tickedKeys = []) {
  const due = lines.filter((l) => l.due > 0);
  const ordered = [...due.filter((l) => tickedKeys.includes(l.key)), ...due.filter((l) => !tickedKeys.includes(l.key))];
  const out = [];
  let left = amount;
  for (const l of ordered) {
    if (left <= 0) break;
    const take = Math.min(left, l.due);
    out.push({ key: l.key, amount: take });
    left -= take;
  }
  return out;
}

/** Tổng còn nợ của các khoản đang tick — số tự điền vào ô Thu tiền. */
export function tickedDue(lines, tickedKeys) {
  return lines.filter((l) => tickedKeys.includes(l.key)).reduce((sum, l) => sum + l.due, 0);
}
