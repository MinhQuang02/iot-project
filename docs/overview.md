# IoT Project System Overview

## Introduction
GreenSphere is a full-stack IoT application designed for greenhouse management. It combines a robust Django backend for data processing, authentication, and hardware integration with a dynamic React frontend for user interaction and real-time monitoring.

## System Architecture

### 1. Frontend Client
- **Framework**: React 19 (Vite)
- **Styling**: TailwindCSS 4
- **State Management**: React Context (`AuthContext`)
- **Routing**: `react-router-dom` v7
- **HTTP Client**: Axios with interceptors for JWT management
- **Authentication**: JWT (Access/Refresh tokens) + Google OAuth

### 2. Backend Server
- **Framework**: Django 5.2 + Django REST Framework (DRF)
- **Database**: PostgreSQL (via Supabase)
- **Authentication**: `simplejwt` for JWT generation, Custom Views for Supabase integration
- **IoT Integration**: MQTT Bridge (via `paho-mqtt`) for real-time device communication
- **Email**: SMTP Configuration for welcome and reset password emails

## Key Features
- **User Authentication**: Secure registration, login, and password management.
- **Google OAuth**: One-click sign-in using Google accounts.
- **Role-Based Access**: Distinction between Admins and Members (Database support).
- **Protected Routes**: Dashboard access restricted to authenticated users.
- **Real-time Data**: Connection to IoT devices via MQTT (infrastructure present in `mqttbridge`).
- **Data Persistence**: All user and sensor data stored in Supabase PostgreSQL.

## Data Flow
1.  **Client** sends HTTP requests to **Django API**.
2.  **Django** authenticates requests using JWT.
3.  **Django** interacts with **Supabase** to fetch/store data.
4.  **Django** (in parallel) listens to **MQTT topics** for sensor updates.
5.  **Client** receives JSON responses and updates the UI.
