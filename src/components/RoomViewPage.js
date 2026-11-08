import { useCallback, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import RoomViewToolbar from './RoomViewToolbar';
import TimelineGrid from './TimelineGrid';
import { SPAN_DAYS } from '../utils/timeline';
import { addDays, isValidISODate, today } from '../utils/date';

export const EMPTY_FILTERS = { types: [], statuses: [], roomQuery: '', onlyFree: false };

/**
 * Sơ đồ phòng kiểu ezCloud — chép từ RoomViewPage.tsx của app thật.
 * Ngày/phạm vi/cách nhóm đọc từ URL (?date=&view=&group=) để F5 hay gửi link vẫn đúng chỗ.
 */
export default function RoomViewPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const rawDate = searchParams.get('date');
  const start = isValidISODate(rawDate) ? rawDate : addDays(today(), -1);
  const view = searchParams.get('view') === 'month' ? 'month' : 'week';
  const grouping = searchParams.get('group') === 'room' ? 'room' : 'type';
  const [filters, setFilters] = useState(EMPTY_FILTERS);

  // replace chứ không push: bấm ‹ › mười lần không được biến nút Back thành "lùi từng ngày".
  const patch = useCallback(
    (next) =>
      setSearchParams(
        (prev) => {
          const sp = new URLSearchParams(prev);
          Object.entries(next).forEach(([k, v]) => sp.set(k, v));
          return sp;
        },
        { replace: true }
      ),
    [setSearchParams]
  );

  const step = SPAN_DAYS[view];

  return (
    <div className="rv-root" style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#fff' }}>
      <RoomViewToolbar
        startDate={start}
        view={view}
        grouping={grouping}
        onViewChange={(v) => patch({ view: v })}
        onGroupingChange={(g) => patch({ group: g })}
        onPrev={() => patch({ date: addDays(start, -step) })}
        onNext={() => patch({ date: addDays(start, step) })}
        onToday={() => patch({ date: addDays(today(), -1) })}
        onPickDate={(iso) => patch({ date: iso })}
        filters={filters}
        onFiltersChange={setFilters}
      />
      {/* Lưới tự cuộn cả hai trục để hàng tiêu đề ngày và cột số phòng bám dính được. */}
      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <TimelineGrid startDate={start} view={view} grouping={grouping} filters={filters} />
      </div>
    </div>
  );
}
