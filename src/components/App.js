import { Navigate, Route, Routes } from 'react-router-dom';
import Login from './Login';
import AppLayout from './AppLayout';
import RequireAuth from './RequireAuth';
import RoomViewPage from './RoomViewPage';
import BookingCreatePage from './BookingCreatePage';
import BookingList from './BookingList';
import ServiceCatalogPage from './ServiceCatalogPage';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        element={
          <RequireAuth>
            <AppLayout />
          </RequireAuth>
        }
      >
        <Route index element={<Navigate to="/booking/room-view" replace />} />
        <Route path="booking/room-view" element={<RoomViewPage />} />
        <Route path="booking/create" element={<BookingCreatePage />} />
        <Route path="booking/list" element={<BookingList />} />
        <Route path="settings/services" element={<ServiceCatalogPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
