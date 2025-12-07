# API Endpoints

Base URL: `http://localhost:8000/api`

## Authentication (`/auth/`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/auth/register/` | Register a new user. Expects JSON body with user details. | No |
| `POST` | `/auth/login/` | Login with username/email and password. Returns tokens. | No |
| `POST` | `/auth/google/` | Login with Google ID token. | No |
| `POST` | `/auth/refresh/` | Get a new access token using a refresh token. | No |
| `GET` | `/auth/me/` | Get current user profile details. | **Yes** |
| `POST` | `/auth/forgot-password/` | Request a password reset link via email. | No |
| `POST` | `/auth/reset-password/` | Set a new password using a valid reset token. | No |

## Test / System (`/test/`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/test/health/` | Check server health and Supabase connection. | No |
| `GET` | `/test/data/` | Fetch test data from Supabase. | No |
| `POST` | `/test/create/` | Create raw test data. | No |

## MQTT Bridge (`/mqtt/`)
*(Endpoints defined in `mqttbridge` app, checking urls.py)*

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/mqtt/publish/` | Publish a message to an MQTT topic. | **Yes** |
| `GET` | `/mqtt/status/` | Check the status of the MQTT implementation. | No |

## Response Format
Standard Success Response:
```json
{
  "message": "Operation successful",
  "data": { ... }
}
```

Standard Error Response:
```json
{
  "error": "Error description message"
}
```
