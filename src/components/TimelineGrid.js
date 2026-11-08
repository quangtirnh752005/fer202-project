import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { App, Dropdown, Empty } from 'antd';
import { openBookingForm, openFolio, openPayment } from '../context/actions/uiActions';
import { setRoomStatus } from '../context/actions/roomActions';
import { sameId } from '../utils/booking';
import { ROOM_DISPLAY, ROOM_STATUS } from '../utils/constants';
import { addDays, nightsBetween, today } from '../utils/date';
import {
  CHECK_IN_FRAC,
  CHECK_OUT_FRAC,
  DIM,
  RV,
  SPAN_DAYS,
  barLabel,
  buildDates,
  computeBarGeometry,
  dateIndex,
  dayLabel,
  isWeekend,
  nowPosition,
  statusColor,
} from '../utils/timeline';
import BookingBar from './BookingBar';

const { labelCol: LABEL_COL, rowHeight: ROW_HEIGHT, groupHeight: GROUP_HEIGHT, headerHeight: HEADER_HEIGHT } = DIM;
const ACTIVE = ['BOOKED', 'CHECKED_IN'];

// Lễ tân đổi tay được: Bẩn → Trống, Trống ↔ Bảo trì (Đang ở chỉ đổi qua nhận/trả phòng).
const ROOM_ACTIONS = {
  DIRTY: [{ key: ROOM_STATUS.AVAILABLE, label: 'Đánh dấu đã dọn' }],
  AVAILABLE: [{ key: ROOM_STATUS.MAINTENANCE, label: 'Chuyển sang bảo trì' }],
  MAINTENANCE: [{ key: ROOM_STATUS.AVAILABLE, label: 'Hết bảo trì' }],
};

const pad = (n) => String(n).padStart(2, '0');

function useRoomRows(startDate, days, filters) {
  const rooms = useSelector((state) => state.rooms.list);
  const types = useSelector((state) => state.rooms.types);
  const bookings = useSelector((state) => state.bookings.list);
  const todayISO = today();
  const endDate = addDays(startDate, days);

  const rows = useMemo(() => {
    const inWindow = bookings.filter((b) => b.status !== 'CANCELLED' && b.checkIn < endDate && b.checkOut > startDate);
    return rooms.map((room) => {
      const bars = inWindow
        .filter((b) => sameId(b.roomId, room.id))
        .map((b) => ({
          booking: b,
          checkInIdx: dateIndex(b.checkIn, startDate),
          nights: nightsBetween(b.checkIn, b.checkOut),
          color: statusColor(b.status, b.checkIn, b.checkOut, todayISO),
        }));
      return {
        room,
        type: types.find((t) => t.id === room.roomTypeId),
        bars,
        busy: bars.some((x) => ACTIVE.includes(x.booking.status)),
      };
    });
  }, [rooms, types, bookings, startDate, endDate, todayISO]);

  const q = filters.roomQuery.trim();
  const filtered = rows
    .filter((r) => filters.types.length === 0 || filters.types.includes(r.room.roomTypeId))
    .filter((r) => filters.statuses.length === 0 || filters.statuses.includes(r.room.status))
    .filter((r) => !q || r.room.number.includes(q))
    .filter((r) => !filters.onlyFree || !r.busy)
    .sort((a, b) => a.room.number.localeCompare(b.room.number));

  return { types, filtered, total: rows.length };
}

function RoomLabel({ room }) {
  const dispatch = useDispatch();
  const { message } = App.useApp();
  const actions = ROOM_ACTIONS[room.status] || [];
  const dirty = room.status === ROOM_STATUS.DIRTY;
  const maint = room.status === ROOM_STATUS.MAINTENANCE;

  const onClick = async ({ key }) => {
    const result = await dispatch(setRoomStatus(room.id, key));
    if (result.ok) message.success(`Phòng ${room.number}: ${ROOM_DISPLAY[key].label}`);
    else message.error(result.error);
  };

  const content = (
    <div className="rv-roomlabel" style={{ display: 'flex', alignItems: 'center', gap: 8, height: '100%' }}>
      <span
        title={ROOM_DISPLAY[room.status].label}
        style={{
          width: 7,
          height: 7,
          borderRadius: '50%',
          flexShrink: 0,
          background: dirty ? RV.dirtyDot : maint ? '#9AA3AF' : 'transparent',
          border: dirty || maint ? 'none' : `1.5px solid ${RV.border}`,
        }}
      />
      <span className="rv-roomnum" style={{ fontWeight: 600, fontSize: 13, color: RV.ink, fontVariantNumeric: 'tabular-nums' }}>
        {room.number}
      </span>
      {(dirty || maint) && <span style={{ fontSize: 11, color: RV.inkFaint }}>{ROOM_DISPLAY[room.status].label}</span>}
    </div>
  );

  if (actions.length === 0) return content;
  return (
    <Dropdown menu={{ items: actions, onClick }} trigger={['click']}>
      {content}
    </Dropdown>
  );
}

function RoomRow({ row, cols, colWidth, nowPos, selection, onCellMouseDown, menuFor }) {
  const { room, bars } = row;
  const stripes = `repeating-linear-gradient(to right, transparent 0px, transparent ${colWidth - 1}px, ${RV.hairline} ${colWidth - 1}px, ${RV.hairline} ${colWidth}px)`;
  const maint = room.status === ROOM_STATUS.MAINTENANCE;

  return (
    <div className="rv-row" style={{ display: 'flex', height: ROW_HEIGHT, borderBottom: `1px solid ${RV.hairline}`, position: 'relative' }}>
      <div style={{ width: LABEL_COL, minWidth: LABEL_COL, position: 'sticky', left: 0, zIndex: 3, background: RV.canvas, borderRight: `1px solid ${RV.border}`, paddingLeft: 14, height: '100%' }}>
        <RoomLabel room={room} />
      </div>
      <div
        className="rv-cells"
        aria-label={`Lịch phòng ${room.number}`}
        onMouseDown={(e) => onCellMouseDown(room, e)}
        style={{
          position: 'relative',
          flex: 1,
          height: '100%',
          background: maint ? `repeating-linear-gradient(45deg, rgba(0,0,0,0.035) 0 6px, transparent 6px 12px), ${stripes}` : stripes,
        }}
      >
        {selection && (() => {
          const nights = selection.end - selection.start + 1;
          const geo = computeBarGeometry({ checkInIdx: selection.start, nights, dayWidth: colWidth, totalDays: cols, startFrac: CHECK_IN_FRAC, endFrac: CHECK_OUT_FRAC });
          if (!geo.visible) return null;
          return (
            <div style={{ position: 'absolute', top: DIM.barTop, left: geo.left, width: geo.width, height: DIM.barHeight, background: 'rgba(17,112,95,0.16)', border: `1.5px dashed ${RV.brand}`, borderRadius: 6, zIndex: 2, pointerEvents: 'none' }}>
              <span style={{ position: 'absolute', top: -16, right: 0, background: RV.ink, color: '#fff', fontSize: 10, fontWeight: 600, padding: '1px 7px', borderRadius: 999, whiteSpace: 'nowrap' }}>{nights} đêm</span>
            </div>
          );
        })()}
        {bars.map(({ booking, checkInIdx, nights, color }) => {
          let startUnit = checkInIdx;
          let startFrac = CHECK_IN_FRAC;
          const endUnit = checkInIdx + nights;
          // Khách ĐANG ở: cắt đầu bar tại vạch "bây giờ" — phần còn lại là thời gian ở còn lại.
          const trimmed = booking.status === 'CHECKED_IN' && nowPos > startUnit + startFrac && nowPos < endUnit + CHECK_OUT_FRAC;
          if (trimmed) {
            startUnit = Math.floor(nowPos);
            startFrac = nowPos - startUnit;
          }
          const geo = computeBarGeometry({ checkInIdx: startUnit, nights: endUnit - startUnit, dayWidth: colWidth, totalDays: cols, startFrac, endFrac: CHECK_OUT_FRAC });
          if (!geo.visible) return null;
          return (
            <BookingBar
              key={booking.id}
              booking={booking}
              label={barLabel(booking)}
              color={color}
              geo={geo}
              nights={nights}
              trimmed={trimmed}
              menuItems={menuFor(booking)}
            />
          );
        })}
      </div>
    </div>
  );
}

export default function TimelineGrid({ startDate, view, grouping, filters }) {
  const dispatch = useDispatch();
  const { message } = App.useApp();
  const days = SPAN_DAYS[view];
  const dates = useMemo(() => buildDates(startDate, days), [startDate, days]);
  const todayISO = today();
  const { types, filtered, total } = useRoomRows(startDate, days, filters);

  // Cột co giãn theo bề rộng khung nhìn, có sàn để màn hẹp cuộn ngang thay vì bóp nát cột.
  const [scrollEl, setScrollEl] = useState(null);
  const [viewportW, setViewportW] = useState(1200);
  useEffect(() => {
    if (!scrollEl) return undefined;
    const ro = new ResizeObserver(([entry]) => setViewportW(entry.contentRect.width));
    ro.observe(scrollEl);
    return () => ro.disconnect();
  }, [scrollEl]);
  const colWidth = Math.max(DIM.minCol[view], Math.floor((viewportW - LABEL_COL) / days));
  const totalWidth = LABEL_COL + colWidth * days;

  // Vạch "bây giờ" nhích mỗi phút.
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(id);
  }, []);
  const nowPos = nowPosition(startDate, now);
  const showNow = nowPos >= 0 && nowPos <= days;

  const [collapsed, setCollapsed] = useState(() => new Set());
  const toggleGroup = (id) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const groups =
    grouping === 'type'
      ? types.map((t) => ({ key: t.id, name: t.name, rows: filtered.filter((r) => r.room.roomTypeId === t.id) })).filter((g) => g.rows.length > 0)
      : [{ key: 'flat', name: null, rows: filtered }];

  // Kéo-chọn ô trống → mở form tạo đặt phòng đã điền sẵn phòng + ngày.
  const [selection, setSelection] = useState(null);
  const colAt = (clientX, el) => Math.min(days - 1, Math.max(0, Math.floor((clientX - el.getBoundingClientRect().left) / colWidth)));

  // Gắn listener NGAY lúc mousedown (không đợi effect sau render): kéo nhanh mà nhả chuột
  // trước nhịp render kế tiếp thì listener gắn trong effect không bao giờ nghe thấy mouseup.
  const handleCellMouseDown = (room, e) => {
    if (e.button !== 0) return;
    e.preventDefault();
    const el = e.currentTarget;
    const anchor = colAt(e.clientX, el);
    const range = { start: anchor, end: anchor };
    setSelection({ roomId: room.id, ...range });

    const onMove = (ev) => {
      const col = colAt(ev.clientX, el);
      range.start = Math.min(anchor, col);
      range.end = Math.max(anchor, col);
      setSelection({ roomId: room.id, ...range });
    };
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      setSelection(null);
      const checkIn = dates[range.start];
      if (checkIn < todayISO) {
        message.warning('Không đặt phòng cho ngày đã qua');
        return;
      }
      dispatch(openBookingForm({ roomId: room.id, checkIn, checkOut: addDays(dates[range.end], 1) }));
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const menuFor = (booking) => [
    { key: 'detail', label: 'Chi tiết', onClick: () => dispatch(openFolio(booking.id)) },
    { key: 'payment', label: 'Thanh toán', onClick: () => dispatch(openPayment(booking.id)) },
  ];

  if (filtered.length === 0) {
    return (
      <div style={{ padding: 48 }}>
        <Empty description={total > 0 ? 'Không có phòng nào khớp bộ lọc' : 'Chưa có phòng'} />
      </div>
    );
  }

  const bodyHeight = groups.reduce(
    (h, g) => h + (grouping === 'type' ? GROUP_HEIGHT : 0) + (collapsed.has(g.key) ? 0 : g.rows.length * ROW_HEIGHT),
    0
  );
  const nowLineLeft = LABEL_COL + nowPos * colWidth;

  return (
    <div ref={setScrollEl} style={{ overflow: 'auto', flex: 1, minHeight: 0, position: 'relative', fontSize: 12, color: RV.ink, userSelect: 'none', background: RV.canvas }}>
      <div style={{ width: totalWidth, position: 'relative' }}>
        {/* Hàng tiêu đề ngày — bám đỉnh khi cuộn dọc */}
        <div style={{ display: 'flex', borderBottom: `1px solid ${RV.border}`, background: RV.panel, position: 'sticky', top: 0, zIndex: 10 }}>
          <div style={{ width: LABEL_COL, minWidth: LABEL_COL, position: 'sticky', left: 0, zIndex: 11, background: RV.panel, borderRight: `1px solid ${RV.border}`, display: 'flex', alignItems: 'center', paddingLeft: 14, height: HEADER_HEIGHT, fontWeight: 600, fontSize: 11, letterSpacing: '0.4px', textTransform: 'uppercase', color: RV.inkMuted }}>
            Phòng
          </div>
          {dates.map((iso) => {
            const { wd, dd } = dayLabel(iso);
            const isToday = iso === todayISO;
            return (
              <div
                key={iso}
                style={{
                  width: colWidth,
                  minWidth: colWidth,
                  height: HEADER_HEIGHT,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 1,
                  borderRight: `1px solid ${RV.hairline}`,
                  background: isToday ? RV.todayTint : isWeekend(iso) ? RV.weekend : undefined,
                  color: isToday ? RV.todayInk : RV.inkMuted,
                }}
              >
                <span style={{ fontSize: 10, letterSpacing: '0.5px', fontWeight: 500 }}>{wd}</span>
                <span style={{ fontSize: 14, fontWeight: isToday ? 700 : 600, color: isToday ? RV.todayInk : RV.ink, fontVariantNumeric: 'tabular-nums' }}>{dd}</span>
              </div>
            );
          })}
        </div>

        <div style={{ position: 'relative' }}>
          {dates.map((iso, i) =>
            isWeekend(iso) ? (
              <div key={`wk-${iso}`} aria-hidden="true" style={{ position: 'absolute', top: 0, left: LABEL_COL + i * colWidth, width: colWidth, height: bodyHeight, background: RV.weekend, zIndex: 0, pointerEvents: 'none' }} />
            ) : null
          )}
          {showNow && (
            <>
              <div aria-hidden="true" style={{ position: 'absolute', top: 0, left: nowLineLeft, width: 2, height: bodyHeight, background: RV.now, opacity: 0.9, zIndex: 5, pointerEvents: 'none', boxShadow: `0 0 8px ${RV.now}` }} />
              <div style={{ position: 'sticky', top: HEADER_HEIGHT, height: 0, zIndex: 6, pointerEvents: 'none' }}>
                <span style={{ position: 'absolute', top: 3, left: nowLineLeft + 1, transform: 'translateX(-50%)', background: RV.nowPill, color: '#fff', fontSize: 10, fontWeight: 600, padding: '2px 6px', borderRadius: 999, whiteSpace: 'nowrap', boxShadow: '0 2px 6px rgba(212,103,74,0.45)', fontVariantNumeric: 'tabular-nums' }}>
                  {pad(now.getHours())}:{pad(now.getMinutes())}
                </span>
              </div>
            </>
          )}

          {groups.map((g) => (
            <React.Fragment key={g.key}>
              {grouping === 'type' && (
                <div
                  role="button"
                  tabIndex={0}
                  aria-expanded={!collapsed.has(g.key)}
                  onClick={() => toggleGroup(g.key)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      toggleGroup(g.key);
                    }
                  }}
                  style={{ display: 'flex', height: GROUP_HEIGHT, alignItems: 'center', background: RV.groupBand, borderBottom: `1px solid ${RV.hairline}`, cursor: 'pointer' }}
                >
                  <div style={{ width: LABEL_COL, minWidth: LABEL_COL, position: 'sticky', left: 0, zIndex: 3, background: RV.groupBand, paddingLeft: 14, fontFamily: 'var(--sen-brand-font)', fontWeight: 700, color: RV.ink, fontSize: 11, letterSpacing: '0.6px', textTransform: 'uppercase', borderRight: `1px solid ${RV.hairline}`, height: '100%', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span aria-hidden="true" style={{ fontSize: 9, color: RV.inkMuted }}>{collapsed.has(g.key) ? '▸' : '▾'}</span>
                    {g.name}
                    <span style={{ fontWeight: 500, color: RV.inkFaint, letterSpacing: 0 }}>{g.rows.length}</span>
                  </div>
                  <div style={{ flex: 1, height: '100%' }} />
                </div>
              )}
              {!collapsed.has(g.key) &&
                g.rows.map((row) => (
                  <RoomRow
                    key={row.room.id}
                    row={row}
                    cols={days}
                    colWidth={colWidth}
                    nowPos={nowPos}
                    selection={selection && sameId(selection.roomId, row.room.id) ? selection : null}
                    onCellMouseDown={handleCellMouseDown}
                    menuFor={menuFor}
                  />
                ))}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}
