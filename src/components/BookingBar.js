import { useState } from 'react';
import { Dropdown, Popover } from 'antd';
import { BOOKING_STATUS_LABEL } from '../utils/constants';
import { formatDate } from '../utils/date';
import { DIM, RV, readableOn } from '../utils/timeline';

function HoverCard({ booking, nights }) {
  const muted = { color: 'rgba(255,255,255,0.72)' };
  return (
    <div style={{ color: '#fff', fontSize: 12, lineHeight: 1.6, minWidth: 210 }}>
      <div style={{ fontWeight: 600, fontSize: 13 }}>{booking.guestName}</div>
      <div style={muted}>
        {booking.bookingCode} · {BOOKING_STATUS_LABEL[booking.status]}
      </div>
      <div>
        {formatDate(booking.checkIn).slice(0, 5)} → {formatDate(booking.checkOut)} · {nights} đêm
      </div>
      <div>
        {booking.adults} người lớn{booking.children ? `, ${booking.children} trẻ em` : ''}
      </div>
      {booking.phone && <div style={muted}>SĐT {booking.phone}</div>}
      {booking.note && <div style={{ marginTop: 4 }}>Ghi chú: {booking.note}</div>}
    </div>
  );
}

/**
 * Bar đặt phòng trên lưới — chép từ BookingBar.tsx của app thật (bỏ kéo-thả đổi phòng).
 * Rê chuột: thẻ thông tin khách. Bấm: menu Chi tiết / Thanh toán.
 */
export default function BookingBar({ booking, label, color, geo, nights, trimmed, menuItems }) {
  const R = 7;
  const [menuOpen, setMenuOpen] = useState(false);
  const [hoverOpen, setHoverOpen] = useState(false);
  // Mép bị lưới cắt thì phẳng + mũi ‹ ›; mép bị vạch "bây giờ" cắt thì phẳng nhưng không mũi.
  const flatStart = geo.clippedStart || trimmed;

  const bar = (
    <div
      className="rv-bar"
      role="button"
      tabIndex={0}
      aria-label={`${label}, nhận ${formatDate(booking.checkIn)}, trả ${formatDate(booking.checkOut)}`}
      aria-haspopup="menu"
      aria-expanded={menuOpen}
      onMouseDown={(e) => e.stopPropagation()}
      onKeyDown={(e) => {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        e.preventDefault();
        setMenuOpen(true);
      }}
      style={{
        position: 'absolute',
        top: DIM.barTop,
        height: DIM.barHeight,
        left: geo.left,
        width: geo.width,
        background: color,
        backgroundImage: 'linear-gradient(180deg, rgba(255,255,255,0.16), rgba(0,0,0,0.07))',
        color: readableOn(color),
        borderTopLeftRadius: flatStart ? 0 : R,
        borderBottomLeftRadius: flatStart ? 0 : R,
        borderTopRightRadius: geo.clippedEnd ? 0 : R,
        borderBottomRightRadius: geo.clippedEnd ? 0 : R,
        padding: `0 ${geo.clippedEnd ? 5 : 9}px 0 ${geo.clippedStart ? 5 : 9}px`,
        boxShadow: flatStart
          ? '0 1px 2px rgba(16,24,40,0.16)'
          : '0 1px 2px rgba(16,24,40,0.16), inset 3px 0 0 rgba(255,255,255,0.45)',
        fontSize: 11.5,
        fontWeight: 500,
        letterSpacing: '0.1px',
        lineHeight: `${DIM.barHeight}px`,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        display: 'flex',
        alignItems: 'center',
        gap: 5,
        cursor: 'pointer',
        zIndex: 2,
      }}
    >
      {geo.clippedStart && <span aria-hidden="true" style={{ flexShrink: 0, opacity: 0.75, fontWeight: 700, marginRight: -2 }}>‹</span>}
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</span>
      {geo.clippedEnd && <span aria-hidden="true" style={{ flexShrink: 0, opacity: 0.75, fontWeight: 700, marginLeft: 'auto' }}>›</span>}
    </div>
  );

  return (
    <Popover
      content={<HoverCard booking={booking} nights={nights} />}
      color={RV.ink}
      placement="top"
      open={hoverOpen && !menuOpen}
      onOpenChange={setHoverOpen}
      trigger={['hover', 'focus']}
      mouseEnterDelay={0.3}
      mouseLeaveDelay={0.05}
    >
      <Dropdown
        menu={{ items: menuItems, onClick: () => setMenuOpen(false) }}
        trigger={['click']}
        open={menuOpen}
        onOpenChange={setMenuOpen}
      >
        {bar}
      </Dropdown>
    </Popover>
  );
}
