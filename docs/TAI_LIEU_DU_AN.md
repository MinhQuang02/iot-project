# Tài Liệu Dự Án IoT - GreenSphere

## 1. Tổng Quan Dự Án
Dự án **GreenSphere** là một hệ thống IoT Dashboard full-stack dùng để giám sát và điều khiển môi trường nhà kính. Dự án sử dụng mô hình Hybrid Cloud:
- **Backend Chính**: Django REST Framework (xử lý logic API).
- **Cơ Sở Dữ Liệu Chính**: **Supabase (PostgreSQL)**. Đây là nơi lưu trữ **toàn bộ** dữ liệu người dùng, cảm biến và trạng thái hệ thống.
- **Frontend**: ReactJS (Giao diện người dùng).
- **Auth Proxy**: Django User Model chỉ đóng vai trò là "session cache" tạm thời để tạo JWT Token, dữ liệu luôn được đồng bộ trực tiếp từ Supabase mỗi khi đăng nhập.

## 2. Công Nghệ Sử Dụng
- **Frontend**: React (Vite), TailwindCSS, React Router DOM, Axios.
- **Backend**: Django, Django REST Framework, SimpleJWT.
- **Database**: Supabase.
- **Authentication**: JWT (Access/Refresh Tokens) + Google OAuth 2.0.

## 3. Cấu Trúc Mã Nguồn

### 📂 Backend (`/server`)
Nơi chứa mã nguồn server Django.

- **`IotServer/settings.py`**: Cấu hình toàn bộ dự án (Database, Cors, Apps).
- **`IotServer/urls.py`**: Định tuyến URL gốc.
- **`iot_app/views_auth.py`**: **Quan trọng**. Xử lý đăng ký, đăng nhập.
    - Logic đặc biệt: Khi đăng nhập, hệ thống **luôn** lấy dữ liệu mới nhất từ Supabase và đồng bộ vào cache cục bộ để cấp Token. Không lưu trữ dữ liệu người dùng vĩnh viễn ở local.
- **`iot_app/supabase_client.py`**: Singleton kết nối đến Supabase.
- **`iot_app/models.py`**: Các model Django (Ít sử dụng do dùng Supabase).

### 📂 Frontend (`/client`)
Ứng dụng ReactJS.

- **`src/context/AuthContext.jsx`**: Quản lý trạng thái đăng nhập toàn cục. Lưu Access Token vào LocalStorage.
- **`src/components/Header.jsx`**: Thanh điều hướng trên cùng.
    - *Logic*: Hiển thị tên người dùng nếu đã đăng nhập. Nếu chưa (Khách), hiển thị nút "Sign In". Các nút Settings/Notifications sẽ chuyển hướng trang Login nếu là Khách.
- **`src/components/Sidebar.jsx`**: Thanh menu bên trái.
    - *Logic*: Hiển thị tất cả mục menu. Tuy nhiên, nếu Khách bấm vào các mục hạn chế (Statistics, Members, History), sẽ chuyển hướng sang trang **Sign Up**.
- **`src/components/HomePage/ControlSystem.jsx`**: Bảng điều khiển thiết bị (Đèn, Cửa).
    - *Logic*: Chỉ cho phép thao tác nếu đã đăng nhập.
- **`src/components/HomePage/Status.jsx`**: Các thẻ trạng thái hệ thống.

## 4. Luồng Xác Thực & Phân Quyền (Auth Flow)

1.  **Đăng Ký (Sign Up)**:
    -   Client gửi thông tin -> Django API.
    -   Django tạo user mới trực tiếp trên **Supabase** (`NGUOI_DUNG`).
    -   Sau khi tạo thành công trên Supabase, Django tạo cache user cục bộ để cấp Token ngay lập tức.

2.  **Đăng Nhập (Login)**:
    -   Client gửi credentials -> Django API.
    -   Django xác thực với **Supabase**.
    -   Nếu đúng, Django dùng `update_or_create` để đồng bộ thông tin mới nhất từ Supabase về cache cục bộ -> Cấp JWT Token.

3.  **Google Login**:
    -   Frontend nhận Token từ Google -> Gửi về Django.
    -   Django xác thực Token với Google Server.
    -   Tìm/Tạo user trên **Supabase**.
    -   Đồng bộ về cache cục bộ -> Cấp JWT Token.

4.  **Phân Quyền (RBAC)**:
    -   **Khách (Anonymous)**: 
        -   Chỉ xem Dashboard (Read-only).
        -   Không thể bấm nút điều khiển.
        -   Không thể truy cập Statistics/History.
    -   **Thành Viên (Member)**: Full quyền hạn.

## 5. Hướng Dẫn Cài Đặt & Chạy

### Yêu Cầu
- Node.js (v16 trở lên)
- Python (v3.8 trở lên)
- Tài khoản Supabase

### Chạy Backend
```bash
cd server
pip install -r requirements.txt
python manage.py runserver
```

### Chạy Frontend
```bash
cd client
npm install
npm run dev
```

Truy cập `http://localhost:5173`.
