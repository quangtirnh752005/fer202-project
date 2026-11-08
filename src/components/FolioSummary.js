import { formatMoney } from '../utils/money';
import { formatDate } from '../utils/date';
import { sen, surface, text } from '../utils/theme';
import StatusTag from './StatusTag';

function MoneyCell({ label, value, tone }) {
  return (
    <div style={{ flex: 1, padding: '10px 16px' }}>
      <div style={{ fontSize: 11, letterSpacing: 0.6, textTransform: 'uppercase', color: sen.muted }}>{label}</div>
      <div style={{ marginTop: 2, fontSize: 18, fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: tone || sen.ink }}>
        {formatMoney(value)}
      </div>
    </div>
  );
}

// Chép từ FolioSummary.tsx: tên + mã + trạng thái, dòng ngày ở/phòng, dải 3 con số tiền.
export default function FolioSummary({ booking, invoice, room, type }) {
  const divider = <div style={{ width: 1, background: sen.hairline }} />;
  return (
    <div style={{ background: sen.canvas, border: `1px solid ${sen.hairline}`, borderRadius: 14, padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <span style={{ fontWeight: 600, fontSize: 16, color: sen.ink }}>{booking.guestName}</span>
        <span style={{ color: sen.muted, fontSize: 13 }}>#{booking.bookingCode}</span>
        <StatusTag status={booking.status} />
      </div>
      <div style={{ marginTop: 6, fontSize: 13, color: sen.muted }}>
        {formatDate(booking.checkIn).slice(0, 5)} → {formatDate(booking.checkOut)}
        {` · ${invoice.nights} đêm`}
        {room && ` · Phòng ${room.number}`}
        {type && ` (${type.name})`}
      </div>
      <div
        style={{
          marginTop: 12,
          display: 'flex',
          background: surface.card,
          border: `1px solid ${sen.hairline}`,
          borderRadius: 10,
          overflow: 'hidden',
        }}
      >
        <MoneyCell label="Tổng tiền" value={invoice.total} />
        {divider}
        <MoneyCell label="Đã thu" value={invoice.paid} tone={invoice.paid > 0 ? text.success : undefined} />
        {divider}
        <MoneyCell label="Còn lại" value={invoice.balance} tone={invoice.balance > 0 ? text.danger : text.success} />
      </div>
    </div>
  );
}
