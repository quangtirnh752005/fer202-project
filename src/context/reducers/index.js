import { combineReducers } from 'redux';
import authReducer from './authReducer';
import uiReducer from './uiReducer';
import roomReducer from './roomReducer';
import bookingReducer from './bookingReducer';
import serviceReducer from './serviceReducer';
import folioReducer from './folioReducer';

const appReducer = combineReducers({
  auth: authReducer,
  ui: uiReducer,
  rooms: roomReducer,
  bookings: bookingReducer,
  services: serviceReducer,
  folio: folioReducer,
});

export default appReducer;
