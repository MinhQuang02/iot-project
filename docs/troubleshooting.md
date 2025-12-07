# Troubleshooting Guide

## Common Issues

### 1. `401: invalid_client` (Google Login)
- **Cause**: The Google Client ID is missing or incorrect in the React application.
- **Fix**: Check `client/.env`. Ensure `VITE_GOOGLE_CLIENT_ID` is set and matches the Credential ID in your Google Cloud Console.

### 2. "Duplicate ID" Error during Registration
- **Cause**: The server creates a user with an ID that already exists.
- **Fix**: This was fixed by removing manual ID generation in `server/iot_app/views_auth.py`. Ensure you are running the latest backend code which relies on `MaND` (Auto-increment).

### 3. Login fails but Registration worked
- **Cause**: Password hashing mismatch or Supabase connection issue.
- **Fix**: Check the server logs. Ensure `paho-mqtt` or other libraries aren't blocking the thread. Verify `check_password` is being used correctly in `views_auth.py`.

### 4. "Network Error" on Frontend
- **Cause**: The Django server is not running or CORS is blocking the request.
- **Fix**:
    - Ensure `python manage.py runserver` is active on port 8000.
    - Check `IotServer/settings.py` for `CORS_ALLOW_ALL_ORIGINS = True`.

### 5. Protected Routes redirecting immediately
- **Cause**: Access token expired or missing.
- **Fix**: The system automatically attempts to refresh. If that fails (refresh token expired), you will be redirected to Login. Try logging in again.

### 6. Email not sending
- **Cause**: SMTP credentials invalid or Google "Less Secure Apps" blocked.
- **Fix**: Use an App Password for Gmail in `settings.py`. Check console for "Failed to send welcome email" logs.
