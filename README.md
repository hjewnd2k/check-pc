# CheckPC - Diagnostic Tool 🛠️

**CheckPC** là một phần mềm mã nguồn mở chạy trên Windows, được xây dựng bằng **Electron.js**. Công cụ này được thiết kế đặc biệt để giúp người dùng (đặc biệt là những người không chuyên) kiểm tra nhanh và chính xác tình trạng phần cứng của máy tính/laptop, cực kì hữu ích khi cần mua máy tính cũ để tránh bị lừa.

Được phát triển bởi **[hieuphamcoder](https://github.com/hjewnd2k)**.

---

## 📥 Tải xuống (Download)

Bạn có thể tải ngay phiên bản chạy trực tiếp (`.exe`) không cần cài đặt tại đây:

👉 **[TẢI VỀ CHECKPC (.exe) TẠI ĐÂY](https://github.com/hjewnd2k/check-pc/releases/latest/download/CheckPC.exe)** 👈

⚠️ **Lưu ý quan trọng khi chạy:** Vì đây là phần mềm mã nguồn mở hoàn toàn miễn phí và không có chứng chỉ số (Code Signing Certificate - thường tốn phí rất cao), Windows Defender SmartScreen có thể sẽ hiện bảng cảnh báo màu xanh **"Windows protected your PC"** (Unknown publisher). 
Bạn hoàn toàn yên tâm đây là cảnh báo tự động của Windows đối với file `.exe` tải từ internet. Để chạy phần mềm, bạn chỉ cần bấm vào dòng chữ **"More info"** (hoặc "Thông tin thêm"), sau đó bấm nút **"Run anyway"** (hoặc "Vẫn chạy") là được.

_(Lưu ý dành cho dev: Bạn hãy đọc phần hướng dẫn tạo Release ở cuối trang để link tải này hoạt động nhé)._

---

## ✨ Các tính năng chính

1. **Dashboard Thông Tin Hệ Thống:**
   - Xem tổng quan thông tin CPU, RAM, GPU (Card đồ họa rời & onboard).
   - Kiểm tra chi tiết **tình trạng Pin (Độ chai pin)**, dung lượng thiết kế và thực tế.
   - Thông tin Ổ cứng, Bo mạch chủ, Hệ điều hành.
2. **Test Bàn Phím (Keyboard Test):** Mô phỏng lại layout bàn phím để test, nhận diện chính xác mọi phím bấm để phát hiện phím bị liệt hoặc kẹt phím.
3. **Test Màn Hình (Screen Test):** Hiển thị màn hình toàn vân màu sắc cơ bản (Trắng, Đen, Đỏ, Xanh lá, Xanh dương) giúp bạn soi rõ điểm ảnh chết (dead pixels), hở sáng hoặc đốm mờ.
4. **Test Camera, Mic & Loa (Media Test):** Bật webcam và test bộ thu/phát âm thanh ngay trên ứng dụng để đảm bảo tính năng nghe gọi trực tuyến vẫn hoạt động tốt.
5. **Test Chuột & Touchpad:** Kiểm tra các phím chuột (Trái, Phải, Con lăn, Cuộn) và khu vực vẽ track (Canvas) nhận diện thao tác vuốt để phát hiện điểm liệt cảm ứng (dead zones) trên Touchpad của laptop.

---

## 🚀 Hướng dẫn chạy code (Dành cho Developer)

Yêu cầu máy tính đã cài đặt **Node.js** và **npm**.

1. Clone repository về máy:
   ```bash
   git clone https://github.com/hjewnd2k/check-pc.git
   ```
2. Di chuyển vào thư mục dự án:
   ```bash
   cd check-pc
   ```
3. Cài đặt các thư viện cần thiết:
   ```bash
   npm install
   ```
4. Chạy phần mềm trong môi trường phát triển:
   ```bash
   npm start
   ```

---

## 📦 Hướng dẫn Build phần mềm thành file .exe

Để đóng gói phần mềm thành file `.exe` cho người dùng cuối (chỉ cần gửi file exe là chạy được ngay không cần cài đặt):

```bash
npm run build
```

Sau khi quá trình build hoàn tất, file phần mềm sẽ nằm trong thư mục `dist/` (Tên file thường là `CheckPC 1.0.0.exe`).

---

## 📜 Giấy phép (License)

Dự án này là mã nguồn mở (Open Source). Mọi người đều có thể tham khảo, đóng góp và sử dụng.
Nguồn tác giả: **hieuphamcoder**
