import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Typography } from 'antd';
import { openFolio } from '../context/actions/uiActions';
import { addDays } from '../utils/date';
import BookingForm from './BookingForm';
import SectionCard from './SectionCard';

export default function BookingCreatePage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Tạo xong: về Sơ đồ phòng đúng tuần của booking và mở Chi tiết — lưới chính là màn kết quả.
  const handleDone = (booking) => {
    navigate(`/booking/room-view?date=${addDays(booking.checkIn, -1)}`);
    dispatch(openFolio(booking.id));
  };

  return (
    <div style={{ maxWidth: 960 }}>
      <Typography.Title level={3} style={{ marginTop: 0 }}>
        Tạo đặt phòng
      </Typography.Title>
      <SectionCard>
        <BookingForm onDone={handleDone} />
      </SectionCard>
    </div>
  );
}
