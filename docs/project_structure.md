# Project Structure Documentation

This document describes the organization of the **GreenSphere** IoT Project, including the directories, key files, and their purposes.

## Root Directory (`/`)
-   **`client/`**: Contains the Frontend source code (React + Vite).
-   **`server/`**: Contains the Backend source code (Django + Django REST Framework).
-   **`firmware/`**: Contains the source code for ESP32 hardware devices.
-   **`docs/`**: Project documentation.

---

## 1. Frontend (`client/`)
Built with **React**, **Vite**, and **TailwindCSS**.

### Key Directories
-   **`src/`**: Main source code.
    -   **`api/`**: Axios configuration (`axiosClient.js`) for communicating with the Backend.
    -   **`assets/`**: Static assets like images and global styles.
    -   **`components/`**: Reusable UI components.
        -   **`Header/`**: Search bar, notifications, and user profile menu.
        -   **`Sidebar/`**: Navigation sidebar.
        -   **`HomePage/`**: Dashboard view.
        -   **`MembersPage/`**: Management of registered members.
        -   **`HistoryPage/`**: Access logs and session history.
        -   **`StatisticsPage/`**: Charts and data visualization.
        -   **`SettingModal.jsx`**: User profile settings (Update profile, Delete account).
    -   **`context/`**: Global state management.
        -   **`AuthContext.jsx`**: Manages user authentication state (login/logout/user data).
    -   **`App.jsx`**: Main application component with Routing configuration (`react-router-dom`).
    -   **`main.jsx`**: Application entry point.

### Key Files
-   **`vite.config.js`**: Configuration for the Vite build tool.
-   **`tailwind.config.js`**: Configuration for TailwindCSS styling.

---

## 2. Backend (`server/`)
Built with **Django**, **Django REST Framework**, and **Supabase** (PostgreSQL).

### Root Files
-   **`manage.py`**: Django's command-line utility for administrative tasks.
-   **`db.sql`**: SQL schema definition for the Database tables.
-   **`requirements.txt`**: List of Python dependencies.

### Application Directory (`server/iot_app/`)
This is the main Django app containing the business logic.

#### core
-   **`apps.py`**: Application configuration. **Crucially**, it starts the `mqtt_service` daemon when the server starts.
-   **`models.py`**: Django ORM models (not heavily used as we use direct Supabase queries for some operations, but standard User model is used for Auth).
-   **`urls.py`**: API Route definitions. Maps URLs to Views.
-   **`supabase_client.py`**: Singleton helper to initialize and get the Supabase client.

#### Views (Controllers)
-   **`views_auth.py`**: Handles Authentication.
    -   `RegisterView`, `LoginView`, `GoogleLoginView`: Auth flows.
    -   `UserDetailView`: Get current user, Update profile, Delete account.
-   **`views_data.py`**: Handles Data Retrieval.
    -   `MemberListView`, `MemberDetailView`: CRUD for Members.
    -   `HistoryListView`: Fetch Access Logs.
    -   `Statistics*View`: Endpoints for Charts (Environment, Activity, Top Users).
-   **`views_device.py`**: Handles Device Interaction.
    -   `DeviceDoorView`: Control door servo.
    -   `DeviceLCDView`: Send text to LCD.
    -   `DeviceSensorsView`: Get latest cached sensor data.

#### Services
-   **`mqtt_service.py`**: Background Service for MQTT Communication.
    -   Connects to HiveMQ broker.
    -   Subscribes to sensor/RFID topics.
    -   Publishes commands (Door control, LCD).
    -   Caches latest data in memory for fast API access.

---

## 3. Firmware (`firmware/`)
C++ code for **ESP32** microcontrollers using the Arduino framework.

### Directories
-   **`esp32/`**: Main Controller Node.
    -   **`esp32.ino`**: Main loop. Handles WiFi, MQTT connection, and logic.
    -   **`dht_setup.h`**: DHT11 Sensor logic (Temperature/Humidity).
    -   **`rfid_setup.h`**: MFRC522 RFID Reader logic.
    -   **`servo_setup.h`**: Servo Motor control (Door).
    -   **`lcd_setup.h`**: LCD I2C Display logic.
-   **`esp32_Cam/`**: Camera Node.
    -   **`esp32_Cam.ino`**: Handles Camera initialization and image streaming over MQTT.

---

## 4. Integration Flow
1.  **Device** (ESP32) sends data (MQTT) $\rightarrow$ **Server** (Django `mqtt_service`).
2.  **Server** caches data.
3.  **Frontend** (React) polling/requesting (HTTP API) $\rightarrow$ **Server** (`views_device`).
4.  **Frontend** sends command (HTTP POST) $\rightarrow$ **Server** $\rightarrow$ **Device** (MQTT Publish).
