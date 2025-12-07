# Project Folder Structure

This document details the organization of the codebase, explaining the purpose of key directories and files.

## Root Directory
- `client/`: Contains the React frontend application.
- `server/`: Contains the Django backend application.
- `docs/`: (This directory) Project documentation.
- `README.md`: General project entry point.

## Client Structure (`client/`)
Built with Vite + React.

```text
client/
├── .env                # Environment variables (Google Client ID)
├── index.html          # Application entry point
├── package.json        # Frontend dependencies and scripts
├── vite.config.js      # Vite configuration
└── src/
    ├── main.jsx        # React root rendering
    ├── App.jsx         # Main router and provider setup
    ├── assets/         # Static images and icons
    ├── context/
    │   └── AuthContext.jsx # Global auth state (user, login, logout functions)
    ├── services/
    │   └── api.js      # Axios instance with JWT interceptors
    └── components/
        ├── Header.jsx      # Top navigation bar
        ├── Sidebar.jsx     # Side navigation menu
        ├── NotFound.jsx    # 404 Page
        ├── SettingModal.jsx # User settings modal
        ├── Auth/
        │   ├── Login.jsx           # Login page
        │   ├── Signup.jsx          # Registration page
        │   ├── ForgotPassword.jsx  # Password reset request
        │   └── ProtectedRoute.jsx  # Route wrapper for auth checks
        ├── HomePage/       # Public landing page
        ├── StatisticsPage/ # Dashboard graphics
        ├── MembersPage/    # Member management
        └── HistoryPage/    # Activity logs
```

## Server Structure (`server/`)
Built with Django.

```text
server/
├── manage.py           # Django command-line utility
├── requirements.txt    # Python dependencies
├── .env.sample         # Template for environment variables
├── db.sql              # Database schema initialization script
├── IotServer/          # Project configuration
│   ├── settings.py     # Main settings (DB, Auth, CORS, Email)
│   ├── urls.py         # Root URL routing
│   └── wsgi.py         # WSGI entry point
├── iot_app/            # Main application logic
│   ├── models.py       # (Mostly unused, using direct Supabase calls)
│   ├── serializers.py  # DRF serializers for API validation
│   ├── views.py        # General views (Health checks)
│   ├── views_auth.py   # Authentication logic (Register, Login, Google)
│   ├── urls.py         # App-specific API routes
│   └── supabase_client.py # Singleton Supabase client connection
└── mqttbridge/         # MQTT Integration
    ├── mqtt_client.py  # MQTT client logic
    └── ...
```

## Key Files to Know
- **`client/src/context/AuthContext.jsx`**: The heart of frontend authentication. Manages user state and tokens.
- **`server/IotServer/settings.py`**: Configuration hub. Check this for Supabase keys, Email settings, and CORS allowed origins.
- **`server/iot_app/views_auth.py`**: Contains all the custom logic for User Registration, Login, and Google OAuth flow.
- **`server/db.sql`**: The source of truth for the database schema.
