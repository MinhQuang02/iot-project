# IoT Project - Comprehensive Guide

## 1. Project Overview
This project is a full-stack IoT dashboard application designed for monitoring and managing greenhouse environments ("GreenSphere"). It features a **Django** backend for API services and data management, and a **React** frontend for a dynamic, responsive user interface.

## 2. Technology Stack
- **Frontend**: React (Vite), TailwindCSS, React Router DOM, Axios.
- **Backend**: Django, Django REST Framework (DRF), SimpleJWT.
- **Database**: Supabase (PostgreSQL) for user data; Django Default (SQLite) for local session management (hybrid approach).
- **Authentication**: JWT-based (Access/Refresh tokens) with Google OAuth 2.0 integration.

## 3. Project Structure

### Backend (`/server`)
```
server/
├── IotServer/          # Main Django Project Config
│   ├── settings.py     # Configs (Apps, DB, CORS, Email)
│   └── urls.py         # Main URL Routing
├── iot_app/            # Main Application Logic
│   ├── models.py       # Data Models
│   ├── views_auth.py   # Authentication Views (Login, Register, Google)
│   ├── views.py        # General API Views
│   └── supabase_client.py # Supabase Connection Utility
├── manage.py           # Django Management Script
└── requirements.txt    # Python Dependencies
```

### Frontend (`/client`)
```
client/
├── src/
│   ├── components/
│   │   ├── Auth/       # Login, Signup, ProtectedRoute
│   │   ├── Header.jsx  # Top Navigation (User Profile, Notifications)
│   │   ├── Sidebar.jsx # Side Navigation (RBAC filtered)
│   │   └── ...pages    # Statistics, Members, History
│   ├── context/
│   │   └── AuthContext.jsx # Global User State & Auth Logic
│   ├── services/
│   │   └── api.js      # Axios Setup (Interceptors)
│   ├── App.jsx         # Main Routing Configuration
│   └── main.jsx        # Entry Point
└── vite.config.js      # Vite Configuration
```

## 4. Authentication & Authorization System
The system implements a robust Role-Based Access Control (RBAC) mechanism.

### Features
1.  **Registration**: Users sign up with Name, Email, Username, Password. Data is stored in **Supabase** (`NGUOI_DUNG` table) and synced to Django's local `User` model for token generation.
2.  **Login**:
    - **Credentials**: Validates against Supabase.
    - **Google OAuth**: Verifies Google Token, checks/creates user in Supabase, syncs with Django user, returns JWT tokens. Handles username collisions automatically.
3.  **Session Management**: Uses **Access Types** (Short-lived, 60min) and **Refresh Tokens** (Long-lived, 1 day) stored in LocalStorage.
4.  **Access Control**:
    - **Anonymous Users**: Restricted to `Home Page`. Accessing `/statistics`, `/members`, etc., redirects to `/login`.
    - **Authenticated Users**: Full access based on role (Member/Admin).
    - **UI**:
        - **Header**: Shows "Sign In" button for guests. Profile interactions, **Settings**, and **Notifications** redirect to **Login**.
        - **Sidebar**: Shows all links; restricted items (Statistics, Members, History) redirect to **Registration**.
        - **Dashboard**: Guest users can view status but **Interactive Controls** (Doors, Lights, Display Text) redirect to **Login**.

### Key Files
- `server/iot_app/views_auth.py`: Handles all auth logic (Supabase queries + Django User sync).
- `client/src/context/AuthContext.jsx`: Manages client-side state (`user`, `loading`) and API calls.
- `client/src/components/Auth/ProtectedRoute.jsx`: Enforces route protection.

## 5. Setup & Run Instructions

### Prerequisites
- Node.js & npm
- Python 3.8+
- Supabase Account (Credentials in `settings.py`)

### Backend Setup
1.  Navigate to `server/`:
    ```bash
    cd server
    ```
2.  Install dependencies:
    ```bash
    pip install -r requirements.txt
    ```
3.  Run Server:
    ```bash
    python manage.py runserver
    ```

### Frontend Setup
1.  Navigate to `client/`:
    ```bash
    cd client
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Run Dev Server:
    ```bash
    npm run dev
    ```

## 6. Accessing the App
- Open browser at `http://localhost:5173`.
- **Guest**: View Home page.
- **Login**: Use test credentials or Google Login to access Dashboard.
