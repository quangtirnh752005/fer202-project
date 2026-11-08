// Hình học + màu của lưới Sơ đồ phòng — chép từ roomview-clone (geometry.ts, model.ts, contrast.ts) của app thật.
import { BOOKING_STATUS_META, SOURCE_OPTIONS, TIMELINE_LEGEND } from './constants';

const MS_PER_DAY = 86400000;
const GUTTER = 4;

// Khách sạn quy ước nhận 14:00, trả 12:00 → bar Tuần/Tháng bắt đầu ở 14/24 ô, kết ở 12/24 ô.
export const CHECK_IN_FRAC = 14 / 24;
export const CHECK_OUT_FRAC = 12 / 24;

export const SPAN_DAYS = { week: 7, month: 30 };

export const DIM = {
  minCol: { week: 88, month: 44 },
  labelCol: 168,
  rowHeight: 40,
  groupHeight: 28,
  headerHeight: 46,
  barHeight: 28,
  barTop: 6,
};

export const RV = {
  ink: '#1E2A28',
  inkMuted: '#586662',
  inkFaint: '#5E6C68',
  canvas: '#FAF8F3',
  panel: '#F3EFE7',
  groupBand: '#EFEAE0',
  hairline: '#ECE8E0',
  border: '#DED8CC',
  brand: '#11705F',
  todayTint: '#FBEFE6',
  todayInk: '#AE4C2E',
  now: '#D4674A',
  nowPill: '#B84E33',
  weekend: '#F4EFE6',
  segTrack: '#EBE6DC',
  dirtyDot: '#B96A15',
};

const isoParts = (iso) => {
  const [y, m, d] = iso.split('-').map(Number);
  return [y, m - 1, d];
};

export function dateIndex(dateISO, startISO) {
  return Math.round((Date.UTC(...isoParts(dateISO)) - Date.UTC(...isoParts(startISO))) / MS_PER_DAY);
}

export function buildDates(startISO, days) {
  const base = Date.UTC(...isoParts(startISO));
  return Array.from({ length: days }, (_, i) => new Date(base + i * MS_PER_DAY).toISOString().slice(0, 10));
}

export function isWeekend(iso) {
  const wd = new Date(`${iso}T00:00:00Z`).getUTCDay();
  return wd === 0 || wd === 6;
}

const WEEKDAYS = ['CN', 'Th 2', 'Th 3', 'Th 4', 'Th 5', 'Th 6', 'Th 7'];
export function dayLabel(iso) {
  return { wd: WEEKDAYS[new Date(`${iso}T00:00:00Z`).getUTCDay()], dd: iso.slice(8, 10) };
}

const HIDDEN = { left: 0, width: 0, visible: false, clippedStart: false, clippedEnd: false };

/** Vị trí bar trong dải ô của một hàng; bar tràn ra ngoài khung thì cắt và đánh dấu clipped. */
export function computeBarGeometry({ checkInIdx, nights, dayWidth, totalDays, startFrac = 0, endFrac = 0 }) {
  const rawStart = checkInIdx + startFrac;
  const rawEnd = checkInIdx + nights + endFrac;
  const start = Math.max(rawStart, 0);
  const end = Math.min(rawEnd, totalDays);
  if (end - start <= 0) return HIDDEN;
  const width = (end - start) * dayWidth - GUTTER;
  if (width <= 0) return HIDDEN;
  return {
    left: start * dayWidth + GUTTER / 2,
    width,
    visible: true,
    clippedStart: rawStart < 0,
    clippedEnd: rawEnd > totalDays,
  };
}

/** Màu bar: quá hạn trả (đang ở mà ngày đi đã tới) và quá hạn nhận tách màu riêng để quầy thấy ngay. */
export function statusColor(status, checkIn, checkOut, todayISO) {
  if (status === 'CHECKED_IN' && checkOut <= todayISO) return TIMELINE_LEGEND.NOT_GONE.color;
  if (status === 'BOOKED') {
    return checkIn < todayISO ? TIMELINE_LEGEND.NOT_ARRIVED.color : TIMELINE_LEGEND.BOOKED.color;
  }
  return (BOOKING_STATUS_META[status] || BOOKING_STATUS_META.CANCELLED).color;
}

/** "BKG - Nguyễn Văn A": nhìn lưới là biết khách của kênh nào. */
export function barLabel(booking) {
  const source = SOURCE_OPTIONS.find((s) => s.value === booking.source);
  return source ? `${source.tag} - ${booking.guestName}` : booking.guestName;
}

function relativeLuminance(hex) {
  const n = parseInt(hex.replace('#', ''), 16);
  const chan = (shift) => {
    const c = ((n >> shift) & 255) / 255;
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * chan(16) + 0.7152 * chan(8) + 0.0722 * chan(0);
}

function contrastRatio(a, b) {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/** Bar cam/hồng sáng quá để đội chữ trắng — chọn mực theo nền. */
export function readableOn(bg) {
  return contrastRatio('#FFFFFF', bg) >= contrastRatio(RV.ink, bg) ? '#FFFFFF' : RV.ink;
}

/** Vị trí vạch "bây giờ" theo đơn vị cột ngày (14:30 hôm nay = idx + 14.5/24). */
export function nowPosition(startISO, now = new Date()) {
  const p = (x) => String(x).padStart(2, '0');
  const todayISO = `${now.getFullYear()}-${p(now.getMonth() + 1)}-${p(now.getDate())}`;
  return dateIndex(todayISO, startISO) + (now.getHours() + now.getMinutes() / 60) / 24;
}
