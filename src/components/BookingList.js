import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import { App, Button, DatePicker, Input, Segmented, Space, Table, Tag, Typography } from 'antd';
import { cancelBooking, checkIn, checkOut } from '../context/actions/bookingActions';
import { openFolio, openPayment } from '../context/actions/uiActions';
import { calcInvoice, folioOf, sameId } from '../utils/booking';
import { BOOKING_STATUS, BOOKING_STATUS_META } from '../utils/constants';
import { formatDate } from '../utils/date';
import { formatMoney } from '../utils/money';
import { text } from '../utils/theme';

const { RangePicker } = DatePicker;
const PAGE_SIZE = 20;
const STATUS_TABS = [
  { label: 'Tất cả', value: 'ALL' },
  { label: 'Xác nhận', value: 'BOOKED' },
  { label: 'Đang ở', value: 'CHECKED_IN' },
  { label: 'Đã trả', value: 'CHECKED_OUT' },
  { label: 'Đã huỷ', value: 'CANCELLED' },
];

// Bỏ dấu để gõ "nguyen" vẫn ra "Nguyễn".
const normalize = (s) =>
  String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd');

/** Danh sách đặt phòng — chép từ BookingListPage.tsx, lọc/phân trang ở client thay vì server. */
export default function BookingList() {
  const dispatch = useDispatch();
  const { message, modal } = App.useApp();
  const bookings = useSelector((state) => state.bookings.list);
  const rooms = useSelector((state) => state.rooms.list);
  const types = useSelector((state) => state.rooms.types);
  const folio = useSelector((state) => state.folio);
  const [searchParams] = useSearchParams();
  const urlQ = searchParams.get('q') || '';
  const [q, setQ] = useState(urlQ);
  const [status, setStatus] = useState('ALL');
  const [range, setRange] = useState(null);
  const [page, setPage] = useState(1);

  // Tìm kiếm trên Topbar khi đang ở sẵn trang này chỉ đổi ?q, không remount.
  useEffect(() => {
    setQ(urlQ);
    setPage(1);
  }, [urlQ]);

  const rows = useMemo(() => {
    const term = normalize(q.trim());
    const from = range && range[0] ? range[0].format('YYYY-MM-DD') : null;
    const to = range && range[1] ? range[1].format('YYYY-MM-DD') : null;
    return bookings
      .map((b) => {
        const room = rooms.find((r) => sameId(r.id, b.roomId));
        const { services, payments } = folioOf(folio, b.id);
        return {
          ...b,
          roomNumber: room ? room.number : '—',
          typeName: room ? (types.find((t) => t.id === room.roomTypeId) || {}).name : '—',
          balance: b.status === BOOKING_STATUS.CANCELLED ? 0 : calcInvoice(b, services, payments).balance,
        };
      })
      .filter((b) => status === 'ALL' || b.status === status)
      .filter((b) => (!from || b.checkIn >= from) && (!to || b.checkIn <= to))
      .filter(
        (b) =>
          !term ||
          normalize(b.guestName).includes(term) ||
          normalize(b.bookingCode).includes(term) ||
          b.phone.includes(term) ||
          b.roomNumber.includes(term)
      )
      .sort((a, b) => (a.checkIn === b.checkIn ? b.id - a.id : a.checkIn < b.checkIn ? 1 : -1));
  }, [bookings, rooms, types, folio, q, status, range]);

  const changeFilter = (fn) => {
    setPage(1);
    fn();
  };

  const confirmRun = (title, content, okText, thunk, successText) =>
    modal.confirm({
      title,
      content,
      okText,
      cancelText: 'Đóng',
      onOk: async () => {
        const result = await dispatch(thunk);
        if (result.ok) message.success(successText);
        else message.error(result.error);
      },
    });

  const columns = [
    {
      title: 'Mã',
      dataIndex: 'bookingCode',
      width: 100,
      render: (code, r) => (
        <Button type="link" style={{ padding: 0 }} onClick={() => dispatch(openFolio(r.id))}>
          {code}
        </Button>
      ),
    },
    {
      title: 'Khách',
      key: 'guest',
      width: 190,
      render: (_, r) => (
        <div>
          <div>{r.guestName}</div>
          <div style={{ fontSize: 12, color: '#888' }}>{r.phone}</div>
        </div>
      ),
    },
    { title: 'Phòng', dataIndex: 'roomNumber', width: 80 },
    { title: 'Hạng', dataIndex: 'typeName', width: 100 },
    {
      title: 'Nhận – Trả',
      key: 'dates',
      width: 190,
      render: (_, r) => <span style={{ whiteSpace: 'nowrap' }}>{`${formatDate(r.checkIn)} – ${formatDate(r.checkOut)}`}</span>,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      width: 120,
      render: (s) => <Tag color={BOOKING_STATUS_META[s].color}>{BOOKING_STATUS_META[s].label}</Tag>,
    },
    {
      title: 'Công nợ',
      dataIndex: 'balance',
      width: 130,
      align: 'right',
      render: (v) => <span style={{ color: v > 0 ? text.danger : text.success, fontVariantNumeric: 'tabular-nums' }}>{formatMoney(v)}</span>,
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 210,
      render: (_, r) => (
        <Space size={4} wrap>
          {r.status === BOOKING_STATUS.BOOKED && (
            <Button size="small" type="link" onClick={() => confirmRun('Nhận phòng', `Nhận phòng cho ${r.guestName}?`, 'Nhận phòng', checkIn(r.id), 'Đã nhận phòng.')}>
              Nhận
            </Button>
          )}
          {r.status === BOOKING_STATUS.CHECKED_IN && (
            <Button size="small" type="link" onClick={() => confirmRun('Trả phòng', `Trả phòng cho ${r.guestName}?`, 'Trả phòng', checkOut(r.id), 'Đã trả phòng.')}>
              Trả
            </Button>
          )}
          {r.status !== BOOKING_STATUS.CANCELLED && (
            <Button size="small" type="link" onClick={() => dispatch(openPayment(r.id))}>
              Thanh toán
            </Button>
          )}
          {r.status === BOOKING_STATUS.BOOKED && (
            <Button size="small" type="link" danger onClick={() => confirmRun('Huỷ đặt phòng', `Huỷ đặt phòng ${r.bookingCode} của ${r.guestName}?`, 'Huỷ booking', cancelBooking(r.id), 'Đã huỷ đặt phòng.')}>
              Huỷ
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Typography.Title level={3} style={{ marginTop: 0 }}>
        Danh sách đặt phòng
      </Typography.Title>
      <Space wrap style={{ marginBottom: 16 }}>
        <Segmented options={STATUS_TABS} value={status} onChange={(v) => changeFilter(() => setStatus(v))} />
        <RangePicker format="DD/MM/YYYY" placeholder={['Nhận từ', 'Nhận đến']} value={range} onChange={(v) => changeFilter(() => setRange(v))} />
        <Input.Search
          key={urlQ}
          defaultValue={q}
          allowClear
          placeholder="Mã / tên / SĐT / số phòng"
          style={{ width: 240 }}
          onSearch={(v) => changeFilter(() => setQ(v))}
        />
      </Space>
      <Table
        rowKey="id"
        columns={columns}
        dataSource={rows}
        scroll={{ x: 1100 }}
        locale={{
          emptyText: (
            <div style={{ padding: 24 }}>
              <div style={{ marginBottom: 8 }}>Chưa có đặt phòng nào khớp bộ lọc</div>
              <Button
                onClick={() =>
                  changeFilter(() => {
                    setStatus('ALL');
                    setRange(null);
                    setQ('');
                  })
                }
              >
                Xoá bộ lọc
              </Button>
            </div>
          ),
        }}
        pagination={{ current: page, pageSize: PAGE_SIZE, total: rows.length, onChange: setPage, showSizeChanger: false }}
      />
    </div>
  );
}
