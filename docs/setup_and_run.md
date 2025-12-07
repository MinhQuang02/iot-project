# Setup and Run Guide

## Prerequisites
- **Node.js** (v18+)
- **Python** (v3.10+)
- **Git**
- **Supabase Account** (or existing connection strings)
- **Google Cloud Console Project** (for OAuth)

## 1. Clone the Repository
```bash
git clone https://github.com/MinhQuang02/iot-project.git
cd iot-project
```

## 2. Server Setup (Django)
Navigate to the server directory:
```bash
cd server
```

### Install Dependencies
Create a virtual environment (recommended) and install packages:
```bash
python -m venv venv
# Windows
venv\Scripts\activate
# Mac/Linux
source venv/bin/activate

pip install -r requirements.txt
```

### Configure Environment
1.  Check `IotServer/settings.py` or `.env` (if configured) for Supabase credentials.
2.  Ensure `SUPABASE_URL` and `SUPABASE_KEY` are correct.
3.  Ensure `EMAIL_` settings are configured for password resets.

### Run Migrations (If applicable)
Since this project largely uses raw Supabase calls, standard migrations might be skipped, but `manage.py migrate` is needed for the Django Auth system.
```bash
python manage.py migrate
```

### Start the Server
```bash
python manage.py runserver
```
Server runs at `http://localhost:8000/`.

## 3. Client Setup (React)
Open a new terminal and navigate to the client directory:
```bash
cd client
```

### Install Dependencies
```bash
npm install
```

### Configure Environment
Create a `.env` file in the `client/` root:
```env
VITE_GOOGLE_CLIENT_ID=your-google-oauth-client-id
```

### Start the Client
```bash
npm run dev
```
Client runs at `http://localhost:5173/`.

## 4. Verification
1.  Open `http://localhost:5173/`.
2.  You should see the Home Page.
3.  Click "Sign Up" to register or "Google Login" to sign in.
