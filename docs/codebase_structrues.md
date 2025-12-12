# IoT Project - Detailed Codebase Structure

This document provides a comprehensive breakdown of the project's file structure and the purpose of each file.

## 📁 Root Directory
- **`README.md`**: General project overview and instructions.
- **`package.json` / `package-lock.json`**: (Root level) Configuration for any root-level Node scripts (if applicable, typically for monorepo setups, though `client/` has its own).

## 📁 Client (`/client`)
The React Frontend application configured with Vite.

### Root Config
- **`package.json`**: Dependencies and scripts (`dev`, `build`, `lint`).
- **`vite.config.js`**: Vite bundler configuration (plugins, server settings).
- **`eslint.config.js`**: Linting rules.
- **`index.html`**: The single HTML entry point.

### Source Code (`/client/src`)
- **`main.jsx`**: Application entry point. Mounts the React app to the DOM.
- **`App.jsx`**: Main Application component. Handles top-level Routing logic (`BrowserRouter`) and Layouts.

#### 📂 Services (`/client/src/services`)
- **`api.js`**: Centralized Axios instance configuration.
    - Handles Request Interceptors (attaching JWT tokens).
    - Handles Response Interceptors (error handling, logging).

#### 📂 Context (`/client/src/context`)
- **`AuthContext.jsx`**: Global Authentication State Management.
    - Provides: `user` object, `login`, `register`, `logout`, `googleLogin` functions.
    - Handles: Token storage (LocalStorage), user profile fetching.

#### 📂 Components (`/client/src/components`)
**Shared Components:**
- **`Header.jsx`**: Top navigation bar.
    - **Logic**: Conditionally showing User Profile vs "Sign In". Guest restrictions for Settings/Notifications.
- **`Sidebar.jsx`**: Left navigation menu.
    - **Logic**: Conditionally redirects guests to Registration when clicking restricted links.
- **`SettingModal.jsx` / `.css`**: Modal for application settings.
- **`NotFound.jsx`**: 404 Error Page.

**Auth Components (`/components/Auth`)**
- **`Login.jsx`**: Login form (Username/Email + Password) & Google Login button.
- **`Signup.jsx`**: Registration form.
- **`ForgotPassword.jsx`**: Email form for password reset.
- **`ProtectedRoute.jsx`**: Wrapper component to restrict access to authenticated routes.

**Home Page (`/components/HomePage`)**
- **`HomePage.jsx`**: Layout for the main dashboard.
- **`Banner.jsx`**: Visual banner component.
- **`Status.jsx`**: Interactive sensor dashboard (Temperature, Humidity, System Status).
    - **Logic**: Interaction restricted for guests.
- **`ControlSystem.jsx`**: Interactive controls (Lights, Doors, Display).
    - **Logic**: Interaction restricted for guests.
- **`ChatBot.jsx`**: AI Chat interface component.

**Feature Pages**
- **`HistoryPage/HistoryPage.jsx`**: Displays logs or historical data.
- **`MembersPage/MembersPage.jsx`**: Displays a list of group members.
- **`StatisticsPage/`**:
    - **`StatisticsPage.jsx`**: Main layout for charts/graphs.
    - **`Humidity.jsx`**: Humidity specific charts.
    - **`Temperature.jsx`**: Temperature specific charts.
    - **`MostVisited.jsx`, `User.jsx`**: Other statistical widgets.

## 📁 Server (`/server`)
The Django Backend application serving the REST API.

### Root Config
- **`manage.py`**: Django's command-line utility for administrative tasks.
- **`requirements.txt`**: List of Python dependencies (Django, DRF, Supabase, etc.).
- **`db.sqlite3`**: Local SQLite database for Django session/admin data (Dev environment).

### Project Config (`/server/IotServer`)
- **`settings.py`**: Global settings.
    - **Key Configs**: `INSTALLED_APPS`, `DATABASES`, `REST_FRAMEWORK`, `SUPABASE_*` credentials, `CORS`.
- **`urls.py`**: Root URL dispatcher. Maps `/auth/`, `/api/` to app-level URLs.

### App Logic (`/server/iot_app`)
- **`models.py`**: Django data models. (Currently minimal as primary data is in Supabase).
- **`views_auth.py`**: **Core Authentication Logic**.
    - `RegisterView`: Creates user in Supabase + Syncs to Django User.
    - `LoginView`: Validates Supabase creds + Returns JWT.
    - `GoogleLoginView`: Validates Google Token + Syncs User + Returns JWT.
- **`views.py`**: Other API endpoints.
- **`supabase_client.py`**: Utility singleton for connecting to Supabase.
- **`urls.py`**: App-specific URL routing.
- **`serializers.py`**: DRF Serializers for validation and data transformation.

## 📁 Firmware (`/firmware`) (If applicable)
- **`esp32/Publisher/Publisher.ino`**: Arduino sketch for ESP32.
- **`wokwi-project.txt`**: Configuration for Wokwi simulator.

## 📁 Documentation (`/docs`)
- **`PROJECT_GUIDE.md`**: General Setup and Guide.
- **`CODEBASE_STRUCTURE.md`**: (This file) Detailed Codebase Structure.
