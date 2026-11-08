import { Tag } from 'antd';
import { BOOKING_STATUS_LABEL } from '../utils/constants';
import { statusPalette } from '../utils/theme';

const TONE = {
  BOOKED: 'arriving',
  CHECKED_IN: 'inhouse',
  CHECKED_OUT: 'available',
  CANCELLED: 'dirty',
};

export default function StatusTag({ status }) {
  const c = statusPalette[TONE[status] || 'neutral'];
  return (
    <Tag style={{ background: c.bg, color: c.fg, border: `1px solid ${c.border}`, borderRadius: 6 }}>
      <span
        aria-hidden="true"
        style={{
          display: 'inline-block',
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: c.fg,
          marginRight: 6,
          verticalAlign: 'middle',
        }}
      />
      {BOOKING_STATUS_LABEL[status] || status}
    </Tag>
  );
}
