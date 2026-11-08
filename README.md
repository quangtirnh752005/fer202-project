# EasyHotelHub – bản đồ án (CRA + Redux)

Bản rút gọn của app lễ tân khách sạn thật: **giao diện chép từ `hotel-management-client`** (antd, bản sắc "Sen":
rail teal tối, nền giấy ấm, nhấn màu mơ, Be Vietnam Pro + Inter), chỉ giữ các chức năng chính.
Viết lại bằng Create React App + JavaScript, Redux kiểu cũ (`createStore`, reducer `switch`, `redux-thunk`),
dữ liệu giả lập bằng **json-server** đọc `db.json`. Không có backend.

## Chạy

```bash
npm install
npm run server   # terminal 1: json-server ở http://localhost:9999
npm start        # terminal 2: app ở http://localhost:3000
```

Tài khoản đăng nhập nằm trong `db.json` → mục `users`.
json-server ghi thẳng vào `db.json`; muốn về dữ liệu mẫu: tắt server, chạy `npm run reset-db`.

```bash
CI=true npx react-scripts test --watchAll=false   # chạy test (Git Bash)
```

## Chức năng giữ lại

| Màn | Đường dẫn | Chép từ app thật |
|---|---|---|
| Đăng nhập | `/login` | `LoginForm.tsx` |
| Sơ đồ phòng (timeline) | `/booking/room-view` | `roomview-clone/` — tuần/tháng, nhóm theo hạng, vạch "bây giờ", kéo-chọn ô trống để tạo đặt phòng, bấm bar → Chi tiết / Thanh toán, bấm số phòng → đổi trạng thái buồng |
| Tạo đặt phòng | `/booking/create` | `BookingCreateForm.tsx` (rút gọn) |
| Danh sách đặt phòng | `/booking/list` | `BookingListPage.tsx` |
| Chi tiết đặt phòng (modal) | — | `FolioModal.tsx` + `FolioSummary.tsx` |
| Thanh toán (modal) | — | `PaymentDialog.tsx` + `ServiceChargePanel.tsx` |
| Danh mục dịch vụ | `/settings/services` | `ServiceCatalogPage.tsx` |

**Đã lược bỏ:** quỹ / chốt ca / đối soát, công nợ công ty, báo cáo, buồng phòng, quản lý khách, OTA email,
phân quyền nhiều vai, đa cơ sở, in phiếu, ngoại tệ, giá từng đêm, cọc, kéo-thả đổi phòng, xem theo ngày.

## Luồng và luật dữ liệu

```
Đã xác nhận ──Check-in──▶ Đang ở ──Check-out──▶ Đã trả phòng
     └──Hủy──▶ Đã huỷ
```

- Ngày đi > ngày đến; một phòng không có 2 đặt phòng còn hiệu lực chồng ngày; không tạo đặt phòng cho ngày đã qua.
- Check-in: đúng khoảng ngày lưu trú và phòng đang Trống (Bẩn / Bảo trì / còn khách cũ thì chặn).
- Ghi dịch vụ và thu tiền chỉ khi khách Đang ở; mỗi lần thu > 0 và không vượt số còn nợ.
- Check-out khi đã thu đủ → phòng chuyển Bẩn → bấm số phòng trên Sơ đồ → "Đánh dấu đã dọn".
- Giá phòng và đơn giá dịch vụ được **chép** vào bản ghi lúc tạo — sửa danh mục không làm đổi hoá đơn cũ.
- Dịch vụ không xoá, chỉ tắt "Đang dùng" (như app thật) để không gãy lịch sử.

Luật nằm ở `src/utils/booking.js`, hình học timeline ở `src/utils/timeline.js` (đều có test);
thunk trong `src/context/actions` kiểm lại trước khi gọi API.

## Redux

- `state.auth` — người đăng nhập (lưu localStorage, không lưu mật khẩu)
- `state.ui` — tải dữ liệu + **modal đang mở** (`openFolio`, `openPayment`, `openBookingForm`): một `ModalHost`
  trong layout vẽ modal, trang nào cũng mở được bằng `dispatch`
- `state.rooms`, `state.bookings`, `state.services`, `state.folio` (dịch vụ đã dùng + các lần thu)

## Cấu trúc

```
src/
  components/   màn hình + component (AppLayout, Sidebar, TimelineGrid, FolioModal, PaymentDialog, …)
  context/      Redux: store.js, actionTypes.js, actions/, reducers/
  styles/       app.css (CSS toàn cục, rail, Sơ đồ phòng)
  utils/        theme (token Sen cho antd), api (axios), luật nghiệp vụ, timeline, ngày, tiền, session
```

## Giới hạn (chấp nhận cho đồ án)

- Mật khẩu để dạng chữ thường trong `db.json`, ai gọi `/users` cũng đọc được.
- json-server không có transaction: Check-in / Check-out ghi 2 bản ghi, bước 2 lỗi thì app ghi ngược bước 1.
- Luật chỉ kiểm ở client; gọi thẳng API json-server thì vẫn ghi được dữ liệu sai.
