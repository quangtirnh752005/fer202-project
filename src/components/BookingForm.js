import { useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { App, Button, Col, DatePicker, Form, Input, InputNumber, Row, Select } from 'antd';
import dayjs from 'dayjs';
import { createBooking, updateBooking } from '../context/actions/bookingActions';
import { findOverlap, sameId, validateBooking } from '../utils/booking';
import { ROOM_STATUS, SOURCE_OPTIONS } from '../utils/constants';
import { addDays, nightsBetween, today } from '../utils/date';
import { formatMoney } from '../utils/money';
import { sen } from '../utils/theme';

const { RangePicker } = DatePicker;
const toISO = (d) => (d ? d.format('YYYY-MM-DD') : '');
// Lỗi từ validateBooking trả theo tên trường dữ liệu; ô ngày trên form là một RangePicker.
const FIELD_OF = { guestName: 'guestName', phone: 'phone', roomId: 'roomId', checkIn: 'dates', checkOut: 'dates' };

function SectionLabel({ children }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 0.6, textTransform: 'uppercase', color: sen.muted, margin: '4px 0 8px' }}>
      {children}
    </div>
  );
}

/**
 * Form đặt phòng dùng chung cho trang Tạo đặt phòng và popup từ Sơ đồ phòng —
 * rút gọn từ BookingCreateForm.tsx (bỏ giấy tờ, công ty, giá từng đêm, cọc).
 * initial: { roomId?, checkIn?, checkOut? } khi tạo; booking: bản ghi khi sửa.
 */
export default function BookingForm({ initial = {}, booking, onDone, onCancel }) {
  const dispatch = useDispatch();
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const rooms = useSelector((state) => state.rooms.list);
  const types = useSelector((state) => state.rooms.types);
  const bookings = useSelector((state) => state.bookings.list);
  const [saving, setSaving] = useState(false);
  const todayStr = today();
  const isEdit = Boolean(booking);

  const [initialValues] = useState(() => {
    const room = rooms.find((r) => sameId(r.id, booking ? booking.roomId : initial.roomId));
    if (booking) {
      return {
        guestName: booking.guestName,
        phone: booking.phone,
        dates: [dayjs(booking.checkIn), dayjs(booking.checkOut)],
        source: booking.source,
        roomTypeId: room && room.roomTypeId,
        roomId: booking.roomId,
        adults: booking.adults,
        children: booking.children,
        note: booking.note,
      };
    }
    const checkIn = initial.checkIn || todayStr;
    return {
      dates: [dayjs(checkIn), dayjs(initial.checkOut || addDays(checkIn, 1))],
      source: 'DIRECT',
      roomTypeId: room ? room.roomTypeId : undefined,
      roomId: room ? room.id : undefined,
      adults: 2,
      children: 0,
    };
  });

  const dates = Form.useWatch('dates', form) || initialValues.dates;
  const roomTypeId = Form.useWatch('roomTypeId', form) ?? initialValues.roomTypeId;
  const roomId = Form.useWatch('roomId', form) ?? initialValues.roomId;
  const checkIn = toISO(dates && dates[0]);
  const checkOut = toISO(dates && dates[1]);
  const datesValid = Boolean(checkIn && checkOut && checkOut > checkIn);
  const bookingId = booking ? booking.id : undefined;

  // Phòng bận trong khoảng ngày đang chọn thì khoá trong dropdown.
  const roomOptions = useMemo(
    () =>
      rooms
        .filter((r) => r.roomTypeId === roomTypeId)
        .map((r) => {
          const busy = datesValid && Boolean(findOverlap(bookings, { id: bookingId, roomId: r.id, checkIn, checkOut }));
          const suffix = `${busy ? ' — bận' : ''}${r.status === ROOM_STATUS.MAINTENANCE ? ' — đang bảo trì' : ''}`;
          return { value: r.id, label: `Phòng ${r.number}${suffix}`, disabled: busy && !sameId(r.id, roomId) };
        }),
    [rooms, roomTypeId, bookings, bookingId, checkIn, checkOut, datesValid, roomId]
  );

  const type = types.find((t) => t.id === roomTypeId);
  const nights = datesValid ? nightsBetween(checkIn, checkOut) : 0;
  const price = isEdit && sameId(roomId, booking.roomId) ? booking.pricePerNight : type && type.price;

  const onFinish = async (values) => {
    const payload = {
      guestName: values.guestName,
      phone: (values.phone || '').trim(),
      roomId: values.roomId,
      checkIn: toISO(values.dates[0]),
      checkOut: toISO(values.dates[1]),
      source: values.source,
      adults: values.adults,
      children: values.children || 0,
      note: values.note,
    };
    const showErrors = (errors) =>
      form.setFields(Object.entries(errors).map(([k, msg]) => ({ name: FIELD_OF[k] || k, errors: [msg] })));

    const localErrors = validateBooking({ ...payload, id: bookingId }, bookings, todayStr);
    if (Object.keys(localErrors).length > 0) {
      showErrors(localErrors);
      return;
    }
    setSaving(true);
    const result = await dispatch(isEdit ? updateBooking(booking.id, payload) : createBooking(payload));
    setSaving(false);
    if (result.ok) {
      message.success(isEdit ? 'Đã lưu đặt phòng' : `Đã tạo đặt phòng ${result.data.bookingCode}`);
      onDone(result.data);
    } else if (result.errors) {
      showErrors(result.errors);
    } else {
      message.error(result.error);
    }
  };

  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={initialValues}
      onFinish={onFinish}
      onValuesChange={(changed) => {
        // Đổi hạng thì phòng cũ không còn thuộc hạng mới.
        if ('roomTypeId' in changed) form.setFieldValue('roomId', undefined);
      }}
      requiredMark="optional"
    >
      <SectionLabel>Thông tin khách</SectionLabel>
      <Row gutter={16}>
        <Col xs={24} md={12}>
          <Form.Item name="guestName" label="Tên khách" rules={[{ required: true, whitespace: true, message: 'Vui lòng nhập tên khách' }]}>
            <Input placeholder="Họ tên khách" autoComplete="off" />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item name="phone" label="Số điện thoại" rules={[{ required: true, message: 'Vui lòng nhập số điện thoại' }]}>
            <Input inputMode="numeric" placeholder="10 số, bắt đầu bằng 0" />
          </Form.Item>
        </Col>
      </Row>

      <SectionLabel>Lưu trú</SectionLabel>
      <Row gutter={16}>
        <Col xs={24} md={12}>
          <Form.Item name="dates" label="Ngày nhận – trả phòng" rules={[{ required: true, message: 'Vui lòng chọn ngày nhận và trả phòng' }]}>
            <RangePicker
              format="DD/MM/YYYY"
              style={{ width: '100%' }}
              placeholder={['Ngày nhận', 'Ngày trả']}
              disabledDate={isEdit ? undefined : (d) => d && d.format('YYYY-MM-DD') < todayStr}
            />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item name="source" label="Nguồn khách" rules={[{ required: true, message: 'Vui lòng chọn nguồn khách' }]}>
            <Select options={SOURCE_OPTIONS.map((s) => ({ value: s.value, label: s.label }))} />
          </Form.Item>
        </Col>
      </Row>

      <SectionLabel>Phòng</SectionLabel>
      <Row gutter={16}>
        <Col xs={24} md={7}>
          <Form.Item name="roomTypeId" label="Hạng phòng" rules={[{ required: true, message: 'Vui lòng chọn hạng phòng' }]}>
            <Select placeholder="Chọn hạng" options={types.map((t) => ({ value: t.id, label: `${t.name} · ${formatMoney(t.price)}` }))} />
          </Form.Item>
        </Col>
        <Col xs={24} md={7}>
          <Form.Item name="roomId" label="Phòng" rules={[{ required: true, message: 'Vui lòng chọn phòng' }]}>
            <Select placeholder={roomTypeId ? 'Chọn phòng' : 'Chọn hạng trước'} options={roomOptions} showSearch={{ optionFilterProp: 'label' }} disabled={!roomTypeId} />
          </Form.Item>
        </Col>
        <Col xs={12} md={5}>
          <Form.Item name="adults" label="Người lớn" rules={[{ required: true, message: 'Nhập số người lớn' }]}>
            <InputNumber min={1} max={10} precision={0} style={{ width: '100%' }} />
          </Form.Item>
        </Col>
        <Col xs={12} md={5}>
          <Form.Item name="children" label="Trẻ em">
            <InputNumber min={0} max={10} precision={0} style={{ width: '100%' }} />
          </Form.Item>
        </Col>
      </Row>

      <Form.Item name="note" label="Ghi chú / yêu cầu">
        <Input.TextArea rows={2} maxLength={300} placeholder="Giờ đến, yêu cầu phòng…" />
      </Form.Item>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          flexWrap: 'wrap',
          background: sen.canvas,
          border: `1px solid ${sen.hairline}`,
          borderRadius: 10,
          padding: '12px 16px',
        }}
      >
        <div style={{ fontSize: 13, color: sen.muted }}>
          {nights > 0 && price ? (
            <>
              {nights} đêm × {formatMoney(price)} ={' '}
              <span style={{ fontSize: 18, fontWeight: 600, color: sen.ink, fontVariantNumeric: 'tabular-nums' }}>
                {formatMoney(nights * price)}
              </span>
            </>
          ) : (
            'Chọn ngày và hạng phòng để xem tạm tính'
          )}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {onCancel && <Button onClick={onCancel}>Huỷ bỏ</Button>}
          <Button type="primary" htmlType="submit" loading={saving}>
            {isEdit ? 'Lưu thay đổi' : 'Tạo đặt phòng'}
          </Button>
        </div>
      </div>
    </Form>
  );
}
