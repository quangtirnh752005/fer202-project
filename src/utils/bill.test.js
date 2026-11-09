import { allocatePayment, billLines, tickedDue } from './bill';

// 2 đêm × 500k = 1.000.000; Ăn sáng 100k; Giặt là 3 × 50k = 150k → tổng 1.250.000
const booking = { checkIn: '2026-11-09', checkOut: '2026-11-11', pricePerNight: 500000 };
const services = [
  { id: 1, price: 100000, quantity: 1 },
  { id: 2, price: 50000, quantity: 3 },
];
const byKey = (lines) => Object.fromEntries(lines.map((l) => [l.key, [l.paid, l.due]]));

test('chưa thu gì: mọi dòng còn nợ đủ', () => {
  const lines = billLines(booking, services, []);
  expect(lines.map((l) => [l.stt, l.key, l.total])).toEqual([
    [1, 'ROOM', 1000000],
    [2, 'S:1', 100000],
    [3, 'S:2', 150000],
  ]);
  expect(lines.every((l) => l.paid === 0 && l.due === l.total)).toBe(true);
});

test('tiền gắn khoản nào trả đúng khoản đó', () => {
  const payments = [{ amount: 100000, allocations: [{ key: 'S:1', amount: 100000 }] }];
  expect(byKey(billLines(booking, services, payments))).toEqual({
    ROOM: [0, 1000000],
    'S:1': [100000, 0],
    'S:2': [0, 150000],
  });
});

test('payment cũ chưa gắn khoản thì rải theo thứ tự hoá đơn', () => {
  const lines = billLines(booking, services, [{ amount: 1050000 }]);
  expect(byKey(lines)).toEqual({ ROOM: [1000000, 0], 'S:1': [50000, 50000], 'S:2': [0, 150000] });
});

test('tiền gắn vào khoản đã bị xoá không mất, rải sang khoản khác', () => {
  const payments = [{ amount: 80000, allocations: [{ key: 'S:99', amount: 80000 }] }];
  expect(billLines(booking, services, payments)[0].paid).toBe(80000);
});

test('khoản giảm giá sau khi đổi hạng: phần thu vượt chuyển sang khoản sau', () => {
  const cheaper = { ...booking, pricePerNight: 400000 }; // tiền phòng còn 800k
  const payments = [{ amount: 900000, allocations: [{ key: 'ROOM', amount: 900000 }] }];
  expect(byKey(billLines(cheaper, services, payments))).toEqual({
    ROOM: [800000, 0],
    'S:1': [100000, 0],
    'S:2': [0, 150000],
  });
});

describe('allocatePayment', () => {
  const lines = billLines(booking, services, []);

  test('khoản được tick nhận tiền trước', () => {
    expect(allocatePayment(250000, lines, ['S:2', 'S:1'])).toEqual([
      { key: 'S:1', amount: 100000 },
      { key: 'S:2', amount: 150000 },
    ]);
  });

  test('phần dư sau khoản tick rải theo thứ tự hoá đơn', () => {
    expect(allocatePayment(300000, lines, ['S:2'])).toEqual([
      { key: 'S:2', amount: 150000 },
      { key: 'ROOM', amount: 150000 },
    ]);
  });

  test('không tick gì thì trả theo thứ tự hoá đơn, bỏ qua khoản đã trả đủ', () => {
    const paidRoom = billLines(booking, services, [{ amount: 1000000, allocations: [{ key: 'ROOM', amount: 1000000 }] }]);
    expect(allocatePayment(120000, paidRoom)).toEqual([
      { key: 'S:1', amount: 100000 },
      { key: 'S:2', amount: 20000 },
    ]);
  });
});

test('tickedDue cộng số còn nợ của khoản đang tick', () => {
  const lines = billLines(booking, services, [{ amount: 30000, allocations: [{ key: 'S:2', amount: 30000 }] }]);
  expect(tickedDue(lines, ['S:1', 'S:2'])).toBe(100000 + 120000);
  expect(tickedDue(lines, [])).toBe(0);
});
