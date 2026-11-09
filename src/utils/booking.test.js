import {
  calcInvoice,
  canTransition,
  cancelError,
  changeRoomError,
  priceAfterMove,
  checkInError,
  checkOutError,
  findOverlap,
  nextBookingCode,
  paymentError,
  roomDisplayStatus,
  serviceUsageError,
  validateBooking,
} from './booking';

const TODAY = '2026-11-08';
const booking = (over = {}) => ({
  id: 1,
  guestName: 'An',
  phone: '0912345678',
  roomId: 1,
  checkIn: '2026-11-08',
  checkOut: '2026-11-10',
  pricePerNight: 500000,
  status: 'BOOKED',
  ...over,
});

describe('findOverlap', () => {
  const existing = [booking({ id: 1, checkIn: '2026-11-08', checkOut: '2026-11-10' })];

  test('phát hiện chồng ngày cùng phòng', () => {
    expect(findOverlap(existing, { roomId: 1, checkIn: '2026-11-09', checkOut: '2026-11-12' })).toBe(existing[0]);
  });

  test('ngày đi trùng ngày đến của khách sau thì không chồng', () => {
    expect(findOverlap(existing, { roomId: 1, checkIn: '2026-11-10', checkOut: '2026-11-12' })).toBeNull();
  });

  test('khác phòng thì không chồng', () => {
    expect(findOverlap(existing, { roomId: 2, checkIn: '2026-11-08', checkOut: '2026-11-10' })).toBeNull();
  });

  test('bỏ qua đặt phòng đã huỷ hoặc đã trả', () => {
    const done = [booking({ status: 'CANCELLED' }), booking({ id: 2, status: 'CHECKED_OUT' })];
    expect(findOverlap(done, { roomId: 1, checkIn: '2026-11-08', checkOut: '2026-11-10' })).toBeNull();
  });

  test('khi sửa thì không tự so với chính mình (id số vs chuỗi)', () => {
    expect(findOverlap(existing, { id: '1', roomId: '1', checkIn: '2026-11-08', checkOut: '2026-11-11' })).toBeNull();
  });
});

describe('validateBooking', () => {
  const form = { guestName: 'Bình', phone: '0987654321', roomId: 3, checkIn: TODAY, checkOut: '2026-11-09' };

  test('form đúng thì không có lỗi', () => {
    expect(validateBooking(form, [], TODAY)).toEqual({});
  });

  test('ngày đi phải sau ngày đến', () => {
    expect(validateBooking({ ...form, checkOut: TODAY }, [], TODAY).checkOut).toBeTruthy();
  });

  test('không cho tạo mới ngày đã qua, nhưng sửa đặt phòng cũ thì được', () => {
    const past = { ...form, checkIn: '2026-11-07' };
    expect(validateBooking(past, [], TODAY).checkIn).toBeTruthy();
    expect(validateBooking({ ...past, id: 9 }, [], TODAY).checkIn).toBeUndefined();
  });

  test('báo lỗi chồng lịch ở ô phòng', () => {
    const errors = validateBooking(form, [booking({ id: 7, roomId: 3 })], TODAY);
    expect(errors.roomId).toMatch('#7');
  });

  test('chặn SĐT sai và tên rỗng', () => {
    const errors = validateBooking({ ...form, guestName: '  ', phone: '123' }, [], TODAY);
    expect(errors.guestName).toBeTruthy();
    expect(errors.phone).toBeTruthy();
  });
});

describe('chuyển trạng thái', () => {
  test('chỉ đi theo luồng hợp lệ', () => {
    expect(canTransition('BOOKED', 'CHECKED_IN')).toBe(true);
    expect(canTransition('BOOKED', 'CHECKED_OUT')).toBe(false);
    expect(canTransition('CHECKED_IN', 'CANCELLED')).toBe(false);
    expect(canTransition('CANCELLED', 'BOOKED')).toBe(false);
  });

  test('checkInError', () => {
    const room = { id: 1, number: '101', status: 'AVAILABLE' };
    expect(checkInError(booking(), room, TODAY)).toBeNull();
    expect(checkInError(booking({ checkIn: '2026-11-09' }), room, TODAY)).toMatch('Chưa tới ngày');
    expect(checkInError(booking(), { ...room, status: 'DIRTY' }, TODAY)).toMatch('Bẩn');
    expect(checkInError(booking({ status: 'CHECKED_IN' }), room, TODAY)).toBeTruthy();
  });

  test('checkOutError chặn khi còn nợ', () => {
    const b = booking({ status: 'CHECKED_IN' });
    expect(checkOutError(b, { balance: 100000 })).toMatch('còn nợ');
    expect(checkOutError(b, { balance: 0 })).toBeNull();
  });

  test('cancelError chỉ cho huỷ khi còn Đã đặt', () => {
    expect(cancelError(booking())).toBeNull();
    expect(cancelError(booking({ status: 'CHECKED_IN' }))).toBeTruthy();
  });
});

describe('calcInvoice', () => {
  test('tiền phòng + dịch vụ - đã thu', () => {
    const inv = calcInvoice(
      booking({ checkIn: '2026-11-06', checkOut: '2026-11-10' }),
      [{ price: 100000, quantity: 2 }, { price: 50000, quantity: 3 }],
      [{ amount: 500000 }]
    );
    expect(inv).toEqual({
      nights: 4,
      roomTotal: 2000000,
      serviceTotal: 350000,
      total: 2350000,
      paid: 500000,
      balance: 1850000,
    });
  });
});

describe('dịch vụ và thu tiền', () => {
  const staying = booking({ status: 'CHECKED_IN' });

  test('serviceUsageError', () => {
    const line = { name: 'Giặt là', price: 50000, quantity: 2 };
    expect(serviceUsageError(staying, line)).toBeNull();
    expect(serviceUsageError(staying, { ...line, price: 0 })).toBeNull();
    expect(serviceUsageError(booking(), line)).toMatch('đang ở');
    expect(serviceUsageError(staying, { ...line, quantity: 0 })).toBeTruthy();
    expect(serviceUsageError(staying, { ...line, quantity: 1.5 })).toBeTruthy();
    expect(serviceUsageError(staying, { ...line, name: '  ' })).toMatch('tên');
    expect(serviceUsageError(staying, { ...line, price: -1 })).toBeTruthy();
  });

  test('nextBookingCode lấy mã lớn nhất + 1', () => {
    expect(nextBookingCode([])).toBe('BK0001');
    expect(nextBookingCode([{ bookingCode: 'BK0007' }, { bookingCode: 'BK0002' }])).toBe('BK0008');
  });

  test('paymentError không cho thu vượt số nợ hoặc số <= 0', () => {
    expect(paymentError(staying, 300000, 300000)).toBeNull();
    expect(paymentError(staying, 300001, 300000)).toMatch('vượt');
    expect(paymentError(staying, 0, 300000)).toBeTruthy();
    expect(paymentError(booking(), 1000, 300000)).toMatch('đang ở');
  });
});

describe('đổi phòng (kéo bar)', () => {
  const types = [{ id: 1, price: 500000 }, { id: 2, price: 800000 }];
  const r101 = { id: 1, number: '101', roomTypeId: 1, status: 'AVAILABLE' };
  const r102 = { id: 2, number: '102', roomTypeId: 1, status: 'AVAILABLE' };
  const r201 = { id: 3, number: '201', roomTypeId: 2, status: 'AVAILABLE' };

  test('cùng hạng giữ giá đã chốt, khác hạng lấy giá hạng mới', () => {
    const b = booking({ pricePerNight: 450000 });
    expect(priceAfterMove(b, r101, r102, types)).toBe(450000);
    expect(priceAfterMove(b, r101, r201, types)).toBe(800000);
  });

  test('cho chuyển khi phòng đích trống ngày đó', () => {
    expect(changeRoomError(booking(), r102, [booking()])).toBeNull();
  });

  test('chặn khi phòng đích có khách trùng ngày', () => {
    const other = booking({ id: 9, bookingCode: 'BK0009', roomId: 2 });
    expect(changeRoomError(booking(), r102, [booking(), other])).toMatch('BK0009');
  });

  test('khách đang ở chỉ chuyển sang phòng Trống; khách chưa đến thì phòng Bẩn vẫn được', () => {
    const dirty = { ...r102, status: 'DIRTY' };
    expect(changeRoomError(booking({ status: 'CHECKED_IN' }), dirty, [])).toMatch('Bẩn');
    expect(changeRoomError(booking(), dirty, [])).toBeNull();
  });

  test('không đổi phòng cho đặt phòng đã đóng', () => {
    expect(changeRoomError(booking({ status: 'CHECKED_OUT' }), r102, [])).toBeTruthy();
    expect(changeRoomError(booking({ status: 'CANCELLED' }), r102, [])).toBeTruthy();
  });
});

describe('roomDisplayStatus', () => {
  const room = { id: 1, status: 'AVAILABLE' };

  test('phòng trống có khách đến hôm nay -> RESERVED', () => {
    expect(roomDisplayStatus(room, [booking()], TODAY)).toBe('RESERVED');
  });

  test('khách đến ngày mai -> vẫn Trống', () => {
    expect(roomDisplayStatus(room, [booking({ checkIn: '2026-11-09', checkOut: '2026-11-10' })], TODAY)).toBe('AVAILABLE');
  });

  test('trạng thái vật lý thắng', () => {
    expect(roomDisplayStatus({ ...room, status: 'DIRTY' }, [booking()], TODAY)).toBe('DIRTY');
  });
});
