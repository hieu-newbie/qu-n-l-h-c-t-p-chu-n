# STUDYHUB – Smart Student Management (Bản Web Tĩnh HTML / CSS / JS)

Phiên bản web tĩnh gọn nhẹ gồm `index.html`, `css/styles.css`, `js/*.js` — **không cần build, không cần Node.js**, chạy trực tiếp trên **GitHub Pages**, **Vercel Drop**, **Netlify Drop** hoặc mở ngay file `index.html`.

## Đẩy lên web trong 30 giây

### Cách 1: GitHub Pages (`*.github.io`)
1. Tải toàn bộ file bên trong thư mục `studyhub-web` (`index.html`, `manifest.json`, `sw.js`, `icon.svg`, thư mục `icons/`, thư mục `css/`, thư mục `js/`) lên thư mục gốc repo GitHub của bạn.
2. Vào **Settings → Pages → Build and deployment → Source: Deploy from a branch** → chọn nhánh `main` và thư mục `/ (root)` → bấm **Save**.
3. Đợi 1 phút và mở link `https://<ten-github>.github.io/<ten-repo>/` trên cả máy tính lẫn điện thoại!

### Cách 2: Vercel Drop / Netlify Drop
1. Kéo-thả trực tiếp thư mục `studyhub-web` (có `index.html` ở ngoài cùng) vào **Vercel Drop** hoặc **app.netlify.com/drop**.
2. Nhận link HTTPS thật sau vài giây!

## Cài đặt thành App về điện thoại & máy tính (PWA Offline)
Sau khi mở STUDYHUB qua đường dẫn HTTPS (GitHub Pages / Vercel / Netlify):
- **Android (Chrome / Edge):** Bấm nút **"Tải app về máy"** ngay trên web (hoặc banner cài đặt phía dưới) → bấm **Cài đặt**.
- **iPhone / iPad (Safari):** Mở bằng Safari → bấm nút **Chia sẻ (↑)** → chọn **"Thêm vào MH chính" (Add to Home Screen)** → bấm **Thêm**.
- **Máy tính (Chrome / Edge):** Bấm nút **"Tải app về máy"** trên STUDYHUB hoặc biểu tượng cài đặt ở góc phải thanh địa chỉ.
- **Chạy ngoại tuyến (Offline):** Service Worker (`sw.js`) tự động lưu bộ nhớ đệm giao diện để bạn xem lịch học, điểm GPA, bài tập, ghi chú và chi tiêu ngay cả khi không có mạng.

## Tính năng đầy đủ
- **Tài khoản riêng biệt**: Đăng ký, đăng nhập, quên & đặt lại mật khẩu, hồ sơ cá nhân, đổi mật khẩu, sao lưu / khôi phục dữ liệu JSON (dữ liệu cô lập theo từng tài khoản, mật khẩu băm SHA-256 + salt).
- **Dashboard tổng quan**: Lời chào gõ chữ theo giờ, số đếm tăng dần (count-up), vòng tròn tiến độ SVG, thời khóa biểu hôm nay, bài tập sắp đến hạn, biểu đồ điểm, lịch thi & hoạt động gần đây.
- **Thời khóa biểu**: Xem theo Tuần & Ngày (có thanh 7 ngày 1 chạm trên điện thoại), lặp lại, phòng học, giảng viên, phân màu môn học & cảnh báo trùng giờ.
- **Môn học & Tính GPA**: Tùy chỉnh đầu điểm thành phần & trọng số %, tự tính điểm thang 10 / điểm chữ / thang 4.0 và GPA học kỳ.
- **Bài tập & Công việc**: Deadline, ưu tiên, cảnh báo quá hạn, lọc/tìm kiếm, đánh dấu hoàn thành bắn confetti.
- **Lịch thi**: Đếm ngược trực tiếp & nhắc lịch thi sắp tới.
- **Ghi chú học tập**: Hỗ trợ Markdown (Soạn thảo / Xem trước), thẻ tag, ghim, tài liệu tham khảo & gửi nhanh sang AI.
- **Chi tiêu sinh viên**: Thu/chi theo danh mục, ngân sách tháng, cảnh báo vượt mức, biểu đồ cột 6 tháng & biểu đồ tròn.
- **AI Study Assistant (8 chế độ)**: Gọi API thực tế (Google Gemini `gemini-4-hydrogen` hoặc OpenAI / OpenRouter) sau khi bạn nhập API key cá nhân trong phần cấu hình (không giả lập câu trả lời khi chưa có key).
- **Tương thích hoàn hảo cho điện thoại (Mobile-First + PWA)**: Thanh điều hướng đáy, modal dạng bottom-sheet, Dark/Light Mode chuyển mượt 300ms.
