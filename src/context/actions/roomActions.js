import api, { errorMessage, fail, ok } from '../../utils/api';
import { roomDisplayStatus, sameId } from '../../utils/booking';
import { ROOM_STATUS } from '../../utils/constants';
import { today } from '../../utils/date';
import { UPDATE_ROOM_SUCCESS } from '../actionTypes';

const { AVAILABLE, DIRTY, MAINTENANCE } = ROOM_STATUS;

// Lễ tân chỉ đổi tay được các trạng thái này; OCCUPIED chỉ do nhận/trả phòng đặt.
const MANUAL_TRANSITIONS = {
  [DIRTY]: [AVAILABLE],
  [AVAILABLE]: [MAINTENANCE],
  [MAINTENANCE]: [AVAILABLE],
};

export const setRoomStatus = (roomId, nextStatus) => async (dispatch, getState) => {
  const state = getState();
  const room = state.rooms.list.find((r) => sameId(r.id, roomId));
  if (!room) return fail('Không tìm thấy phòng');
  if (!(MANUAL_TRANSITIONS[room.status] || []).includes(nextStatus)) {
    return fail('Không đổi được trạng thái phòng theo hướng này');
  }
  if (nextStatus === MAINTENANCE && roomDisplayStatus(room, state.bookings.list, today()) === 'RESERVED') {
    return fail(`Phòng ${room.number} có khách đến hôm nay, không chuyển bảo trì được`);
  }
  try {
    const res = await api.patch(`/rooms/${room.id}`, { status: nextStatus });
    dispatch({ type: UPDATE_ROOM_SUCCESS, payload: res.data });
    return ok(res.data);
  } catch (e) {
    return fail(errorMessage(e));
  }
};
