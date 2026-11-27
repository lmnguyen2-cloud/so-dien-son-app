# Sổ Điện Sơn

App phục vụ việc kinh doanh bán lại hóa đơn tiền điện của anh Sơn. Luôn trả lời bằng **tiếng Việt**.

## Cấu trúc
- `web/so-dien-son.html` — **nguồn chính** của app (một file HTML/JS). Chạy được 3 nơi: bản web (artifact Claude), file mở trên máy, và bên trong APK (WebView, có `window.Native`).
  Tab chính: Nhận lô · Bank khách · Đại lý · Lọc đơn · Công nợ; nút "Khác" mở Check cước · Tra mã · Cài đặt.
  Lệnh sổ tháng qua `api({action})` (Google Sheets API khi đăng nhập Google, hoặc cầu nối Apps Script): ping, check, stock, assign, insert, byname, lots, lot, settle, ledger, ledgerAdd, draft, drafts, undraft, push (sheet đại lý con).
  Nháp: cột H sổ tháng `HT 27/11 12:10` (tên + giờ gửi), tô vàng A–D. Lọc đơn: Kiểm tra cước (bỏ 0đ, tự lọc bù ≤3 lượt) → Gửi khách & ghi nháp. Kho (Lọc đơn, Kho đơn) bỏ dòng có H. Bank khách: Lấy đơn nháp → Check cước → mã còn cước "Trả về kho" (xóa H), mã 0đ "Gửi bank & chốt" (ghi D/E/G, xanh, xóa H). Nháp quá 3 giờ chỉ nhắc trên app, không tự trả.
  Công nợ lưu ở tab "Cong no" của sổ tháng (Ngày · Khách · Loại · Số tiền · Ghi chú; dương = còn phải chuyển khách).
- `web/core.js` — `SDSCore`: check cước trên trang otpsms (đợt 23 mã, chọn server, tự đổi server khi lỗi). Chạy **trong trang otpsms** (inject).
- `web/tram.js` — khung "Trạm check" (bookmarklet / nút Mở Trạm trong APK): check, tải Excel, ghi sổ, copy tin đại lý (STT · mã · tiền).
- `web/build.sh` — dựng `tram.min.js`, nhúng bookmarklet + mã cầu nối vào HTML, xuất `app/src/main/assets/{index.html,tram.js,core.js}`.
- `app/` — vỏ Android (Java, WebView). `MainActivity.java`: 2 WebView (Sổ + otpsms), cầu `Native` (copy, saveFile, shareZalo, shareFile, check, askServers, googleAuth/googleAuthChoose/googleLogout, http).
  Ký bằng `app/sds.keystore` (pass `sodienson`) — **không đổi khóa**, nếu đổi thì anh phải gỡ app mới cài được.
- `.github/workflows/build.yml` — push lên `main` là GitHub dựng APK debug và tạo Release `build-N` (file `SoDienSon.apk`). Tăng `versionCode/versionName` trong `app/build.gradle` mỗi bản.
- `apps-script/cau-noi-so-thang.gs` — cầu nối Apps Script (dự phòng cho bản web): ping/check/insert/stock/assign theo link sheet gửi lên.
- `kho-don/` — trang "Kho đơn" cho đại lý tự lấy đơn bằng PIN (Apps Script web app: `Code.gs` + `Index.html`). Test: `node kho-don/test.js`, `node kho-don/test-ui.js`.
- `web/tests/` — test Playwright (t8: bank/đại lý/công nợ/xong lô với Sheets giả; t10: nháp cột H) với `window.Native` giả lập (t4 Nhận lô/Lọc, t5 Sheets API giả, t6 sheet đại lý con, t3 Trạm). Cần file CSV sổ tháng: `T11_CSV=... node web/tests/t4.js`.

## Quy tắc nghiệp vụ (đừng đổi khi chưa hỏi anh)
- Sổ tháng (Google Sheet "Hoa Don T11.2026", tab đầu): A lô (`HUY 20.11.26`) · B mã · C tiền · D khách làm (HOA, không dấu, liền) · E % thu · F % chi · G `=C*(E-F)`. Dòng tổng cuối: `=SUM(C1:Cn)`, `=SUM(G1:Gn)`. Ghi lô mới: chèn trước dòng tổng, xếp tiền tăng dần.
- Cột F theo bậc: Bậc 3 <400k 0,5% · 400k–<1tr 0,6% · ≥1tr 1%. Bậc 2 <400k 0,5% · ≥400k 0,6%. HUY luôn bậc 3; HUNG, TUNG bậc 2; KHA/SANG/THUAN/TRI/NAM bậc 3 ngày 1–4, bậc 2 từ ngày 5.
- Đầu mã: PB1107 + 7 số (đại lý thường), PB2005 + 7 số (HUY). Đại lý hay gửi 5 số cuối.
- Tin bank khách: `N đơn (x%)` / dòng trống / tổng (dấu chấm) / phí (2 số lẻ, dấu phẩy) / còn (làm tròn). Nhiều mức % thì liệt kê từng mã `MÃ tiền (x,x%)`. Có ứng/trừ thì thêm `Đã ứng:` / `Trừ lại:` / `Còn chuyển:`.
- Tin thanh toán đại lý: `THANH TOÁN X (n đơn)`, từng mã kèm %, dòng tổng theo bậc, rồi tổng/phí/còn.
- Sheet đại lý con "ĐIỆN A SƠN VTS": dán đơn còn cước **từ 400k**, 1 dòng tên lô (Georgia 36 đậm đỏ nền vàng) rồi Mã·Tiền, cách lô trước 1 dòng trống.
- Đơn giao Phúc không ghi tên lên cột D sổ tháng cho tới khi Phúc báo xong; nhưng **được ghi nháp cột H** (`PHUC dd/mm HH:MM`) như khách khác (anh duyệt 27/11).
- **Không bao giờ** tự nhập mật khẩu / đăng nhập otpsms hay Google thay anh.

## Đăng nhập Google trong APK
Dự án Google Cloud của anh, client Android: gói `vn.sodienson`, SHA-1 `A7:6C:DE:2D:34:1E:0E:C4:F3:5F:1B:C8:88:56:6D:D1:3D:D4:DA:34`. App đang ở chế độ thử nghiệm — tài khoản phải nằm trong "Người dùng thử".
