import { useSelector } from 'react-redux';
import { Checkbox, DatePicker, Input, Select } from 'antd';
import dayjs from 'dayjs';
import { ROOM_DISPLAY, TIMELINE_LEGEND } from '../utils/constants';
import { RV } from '../utils/timeline';

const toolbarStyle = {
  background: RV.canvas,
  borderBottom: `1px solid ${RV.border}`,
  fontSize: 12,
  color: RV.ink,
  userSelect: 'none',
};
const rowStyle = { display: 'flex', alignItems: 'center', gap: 14, padding: '8px 16px', flexWrap: 'wrap' };
const legendItemStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  whiteSpace: 'nowrap',
  color: RV.inkMuted,
  fontSize: 12,
  fontWeight: 500,
};
const sep = { width: 1, height: 18, background: RV.hairline, flexShrink: 0 };
const ghostBtn = {
  padding: '4px 9px',
  fontSize: 13,
  border: `1px solid ${RV.border}`,
  background: '#fff',
  cursor: 'pointer',
  borderRadius: 8,
  lineHeight: '18px',
  color: RV.inkMuted,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const VIEW_OPTIONS = [
  { label: 'Tuần', value: 'week' },
  { label: 'Tháng', value: 'month' },
];
const GROUPING_OPTIONS = [
  { label: 'Hạng phòng', value: 'type' },
  { label: 'Số phòng', value: 'room' },
];
const ROOM_STATUS_OPTIONS = ['AVAILABLE', 'OCCUPIED', 'DIRTY', 'MAINTENANCE'].map((s) => ({
  value: s,
  label: ROOM_DISPLAY[s].label,
}));

function Dot({ color }) {
  return (
    <span
      style={{
        display: 'inline-block',
        width: 9,
        height: 9,
        borderRadius: '50%',
        background: color,
        flexShrink: 0,
        boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.06)',
      }}
    />
  );
}

function Segmented({ options, value, onChange }) {
  return (
    <div style={{ display: 'inline-flex', background: RV.segTrack, borderRadius: 9, padding: 2, gap: 2 }}>
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            aria-pressed={active}
            className={`rv-seg${active ? ' rv-seg-active' : ''}`}
            onClick={() => onChange(opt.value)}
            style={{
              padding: '3px 12px',
              fontSize: 12,
              border: 'none',
              borderRadius: 7,
              cursor: 'pointer',
              fontWeight: active ? 600 : 500,
              color: active ? RV.brand : RV.inkMuted,
              background: active ? '#fff' : 'transparent',
              boxShadow: active ? '0 1px 2px rgba(16,24,40,0.12)' : 'none',
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

export default function RoomViewToolbar(props) {
  const { startDate, view, grouping, onViewChange, onGroupingChange, onPrev, onNext, onToday, onPickDate, filters, onFiltersChange } = props;
  const roomTypes = useSelector((state) => state.rooms.types);
  const patch = (p) => onFiltersChange({ ...filters, ...p });
  const filtering = filters.types.length > 0 || filters.statuses.length > 0 || filters.roomQuery.trim() !== '' || filters.onlyFree;

  return (
    <div style={toolbarStyle}>
      {/* Hàng 1: chú giải màu bar theo trạng thái đặt phòng */}
      <div style={rowStyle}>
        {Object.values(TIMELINE_LEGEND).map((s) => (
          <span key={s.label} style={legendItemStyle}>
            <Dot color={s.color} />
            <span>{s.label}</span>
          </span>
        ))}
        <span style={{ ...legendItemStyle, marginLeft: 'auto', color: RV.inkFaint }}>
          Kéo chọn ô trống để tạo đặt phòng · bấm số phòng để đổi trạng thái buồng
        </span>
      </div>

      {/* Hàng 2: điều hướng ngày + phạm vi + cách nhóm */}
      <div style={{ ...rowStyle, paddingTop: 0 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <button type="button" className="rv-navbtn" style={{ ...ghostBtn, padding: '4px 8px' }} aria-label="Lùi lại" onClick={onPrev}>‹</button>
          <button type="button" className="rv-navbtn" style={{ ...ghostBtn, padding: '4px 8px' }} aria-label="Tiến tới" onClick={onNext}>›</button>
          <DatePicker
            aria-label="Ngày bắt đầu"
            value={dayjs(startDate)}
            onChange={(d) => d && onPickDate(d.format('YYYY-MM-DD'))}
            format="DD/MM/YYYY"
            allowClear={false}
            size="small"
            style={{ width: 130 }}
          />
          <button type="button" className="rv-navbtn" style={ghostBtn} onClick={onToday}>Hôm nay</button>
        </div>
        <span style={sep} />
        <Segmented options={VIEW_OPTIONS} value={view} onChange={onViewChange} />
        <Segmented options={GROUPING_OPTIONS} value={grouping} onChange={onGroupingChange} />
      </div>

      {/* Hàng 3: lọc phòng — không lên URL, F5 là về lưới đầy đủ */}
      <div style={{ ...rowStyle, paddingTop: 0 }}>
        <Select
          mode="multiple"
          aria-label="Lọc hạng phòng"
          placeholder="Lọc hạng phòng"
          size="small"
          allowClear
          maxTagCount="responsive"
          style={{ minWidth: 170 }}
          value={filters.types}
          onChange={(v) => patch({ types: v })}
          options={roomTypes.map((t) => ({ value: t.id, label: t.name }))}
        />
        <Select
          mode="multiple"
          aria-label="Lọc trạng thái phòng"
          placeholder="Lọc trạng thái"
          size="small"
          allowClear
          maxTagCount="responsive"
          style={{ minWidth: 170 }}
          value={filters.statuses}
          onChange={(v) => patch({ statuses: v })}
          options={ROOM_STATUS_OPTIONS}
        />
        <Input
          aria-label="Tìm số phòng"
          placeholder="Số phòng"
          size="small"
          allowClear
          style={{ width: 110 }}
          value={filters.roomQuery}
          onChange={(e) => patch({ roomQuery: e.target.value })}
        />
        <Checkbox checked={filters.onlyFree} onChange={(e) => patch({ onlyFree: e.target.checked })}>
          Chỉ phòng trống
        </Checkbox>
        {filtering && (
          <button
            type="button"
            className="rv-navbtn"
            style={ghostBtn}
            onClick={() => patch({ types: [], statuses: [], roomQuery: '', onlyFree: false })}
          >
            Xoá lọc
          </button>
        )}
      </div>
    </div>
  );
}
