import { useSelector } from 'react-redux';
import FolioModal from './FolioModal';
import PaymentDialog from './PaymentDialog';
import BookingFormModal from './BookingFormModal';

// Một chỗ duy nhất vẽ modal, đọc từ state.ui.modal — trang nào cũng mở được bằng dispatch.
// Mở modal mới là THAY modal cũ chứ không chồng lên (app thật tránh modal trong modal).
export default function ModalHost() {
  const modal = useSelector((state) => state.ui.modal);
  if (!modal) return null;
  if (modal.kind === 'folio') return <FolioModal bookingId={modal.bookingId} />;
  if (modal.kind === 'payment') return <PaymentDialog bookingId={modal.bookingId} />;
  if (modal.kind === 'form') return <BookingFormModal initial={modal.initial} />;
  return null;
}
