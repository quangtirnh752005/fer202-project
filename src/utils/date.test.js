import { addDays, formatDate, isValidISODate, nightsBetween } from './date';

describe('isValidISODate', () => {
  test('nhận ngày hợp lệ', () => {
    expect(isValidISODate('2026-11-08')).toBe(true);
    expect(isValidISODate('2028-02-29')).toBe(true);
  });

  test('chặn ngày tràn mà new Date tự cuộn', () => {
    expect(isValidISODate('2026-02-31')).toBe(false);
    expect(isValidISODate('2026-02-29')).toBe(false);
    expect(isValidISODate('2026-13-01')).toBe(false);
  });

  test('chặn sai định dạng', () => {
    expect(isValidISODate('')).toBe(false);
    expect(isValidISODate(undefined)).toBe(false);
    expect(isValidISODate('08/11/2026')).toBe(false);
  });
});

describe('nightsBetween', () => {
  test('đếm số đêm, kể cả qua tháng và năm', () => {
    expect(nightsBetween('2026-11-08', '2026-11-11')).toBe(3);
    expect(nightsBetween('2026-12-30', '2027-01-02')).toBe(3);
  });
});

test('addDays qua cuối tháng', () => {
  expect(addDays('2026-11-30', 1)).toBe('2026-12-01');
});

test('formatDate ra dd/mm/yyyy', () => {
  expect(formatDate('2026-11-08')).toBe('08/11/2026');
  expect(formatDate('2026-11-08T10:00:00.000Z')).toBe('08/11/2026');
});
