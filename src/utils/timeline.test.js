import {
  CHECK_IN_FRAC,
  CHECK_OUT_FRAC,
  barLabel,
  buildDates,
  computeBarGeometry,
  dateIndex,
  nowPosition,
  readableOn,
  statusColor,
} from './timeline';

test('buildDates đi qua cuối tháng', () => {
  expect(buildDates('2026-11-29', 3)).toEqual(['2026-11-29', '2026-11-30', '2026-12-01']);
});

test('dateIndex âm khi ngày đứng trước đầu lưới', () => {
  expect(dateIndex('2026-11-06', '2026-11-08')).toBe(-2);
  expect(dateIndex('2026-11-10', '2026-11-08')).toBe(2);
});

describe('computeBarGeometry', () => {
  const base = { dayWidth: 100, totalDays: 7 };

  test('bar 2 đêm bắt đầu 14:00 kết 12:00', () => {
    const g = computeBarGeometry({ ...base, checkInIdx: 1, nights: 2, startFrac: CHECK_IN_FRAC, endFrac: CHECK_OUT_FRAC });
    expect(g.visible).toBe(true);
    expect(g.left).toBeCloseTo(100 + (14 / 24) * 100 + 2);
    expect(g.width).toBeCloseTo((2 - 14 / 24 + 12 / 24) * 100 - 4);
    expect(g.clippedStart).toBe(false);
  });

  test('bar bắt đầu trước khung thì bị cắt mép trái', () => {
    const g = computeBarGeometry({ ...base, checkInIdx: -2, nights: 4 });
    expect(g.left).toBe(2);
    expect(g.clippedStart).toBe(true);
  });

  test('bar nằm ngoài khung thì ẩn', () => {
    expect(computeBarGeometry({ ...base, checkInIdx: 9, nights: 2 }).visible).toBe(false);
    expect(computeBarGeometry({ ...base, checkInIdx: -5, nights: 2 }).visible).toBe(false);
  });
});

describe('statusColor', () => {
  const today = '2026-11-08';
  test('quá hạn trả và quá hạn nhận có màu riêng', () => {
    expect(statusColor('CHECKED_IN', '2026-11-05', '2026-11-08', today)).toBe('#F5912B');
    expect(statusColor('BOOKED', '2026-11-07', '2026-11-09', today)).toBe('#6B3FA0');
    expect(statusColor('BOOKED', '2026-11-08', '2026-11-09', today)).toBe('#2F6BD8');
    expect(statusColor('CHECKED_IN', '2026-11-07', '2026-11-09', today)).toBe('#E0322B');
  });
});

test('barLabel thêm tiền tố kênh', () => {
  expect(barLabel({ guestName: 'An', source: 'OTA_BOOKING' })).toBe('BKG - An');
  expect(barLabel({ guestName: 'An', source: 'LẠ' })).toBe('An');
});

test('readableOn chọn mực tối trên nền sáng', () => {
  expect(readableOn('#2F6BD8')).toBe('#FFFFFF');
  expect(readableOn('#F5912B')).toBe('#1E2A28');
});

test('nowPosition = chỉ số ngày + phần giờ', () => {
  expect(nowPosition('2026-11-08', new Date(2026, 10, 9, 12, 0))).toBeCloseTo(1.5);
});
