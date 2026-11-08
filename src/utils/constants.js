export const BOOKING_STATUS = {
  BOOKED: 'BOOKED',
  CHECKED_IN: 'CHECKED_IN',
  CHECKED_OUT: 'CHECKED_OUT',
  CANCELLED: 'CANCELLED',
};

// Nhãn + màu theo bảng trạng thái của app thật (Room View / Danh sách đặt phòng).
export const BOOKING_STATUS_META = {
  BOOKED: { label: 'Đã xác nhận', color: '#2F6BD8' },
  CHECKED_IN: { label: 'Đang ở', color: '#E0322B' },
  CHECKED_OUT: { label: 'Đã trả phòng', color: '#EC6FB0' },
  CANCELLED: { label: 'Đã huỷ', color: '#9AA3AF' },
};

export const BOOKING_STATUS_LABEL = Object.fromEntries(
  Object.entries(BOOKING_STATUS_META).map(([k, v]) => [k, v.label])
);

// Chú giải màu bar trên Sơ đồ phòng, xếp theo dòng đời một ca ở.
export const TIMELINE_LEGEND = {
  BOOKED: { label: 'Đã xác nhận', color: '#2F6BD8' },
  NOT_ARRIVED: { label: 'Quá hạn nhận', color: '#6B3FA0' },
  CHECK_IN: { label: 'Đang ở', color: '#E0322B' },
  NOT_GONE: { label: 'Quá hạn trả', color: '#F5912B' },
  CHECK_OUT: { label: 'Đã trả phòng', color: '#EC6FB0' },
};

export const ROOM_STATUS = {
  AVAILABLE: 'AVAILABLE',
  OCCUPIED: 'OCCUPIED',
  DIRTY: 'DIRTY',
  MAINTENANCE: 'MAINTENANCE',
};

// Trạng thái HIỂN THỊ của phòng: thêm RESERVED (phòng trống nhưng có khách đặt đến hôm nay)
export const ROOM_DISPLAY = {
  AVAILABLE: { label: 'Trống' },
  RESERVED: { label: 'Đã đặt hôm nay' },
  OCCUPIED: { label: 'Đang ở' },
  DIRTY: { label: 'Bẩn' },
  MAINTENANCE: { label: 'Bảo trì' },
};

export const SOURCE_OPTIONS = [
  { value: 'DIRECT', label: 'Khách trực tiếp', tag: 'DIRECT' },
  { value: 'OTA_BOOKING', label: 'Booking.com', tag: 'BKG' },
  { value: 'OTA_EXPEDIA', label: 'Expedia', tag: 'EXPEDIA' },
  { value: 'CORPORATE', label: 'Công ty', tag: 'CORP' },
];

export const PAYMENT_METHOD_LABEL = {
  CASH: 'Tiền mặt',
  CARD: 'Thẻ',
  TRANSFER: 'Chuyển khoản',
};
