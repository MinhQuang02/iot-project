import React from 'react';
import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from './context/AuthContext';

import Sidebar from './components/Sidebar';
import Header from './components/Header';
import SettingModal from './components/SettingModal';
import NotFound from './components/NotFound';
import ProtectedRoute from './components/Auth/ProtectedRoute';

import HomePage from './components/HomePage/HomePage';
import StatisticsPage from './components/StatisticsPage/StatisticsPage';
import MembersPage from './components/MembersPage/MembersPage';
import HistoryPage from './components/HistoryPage/HistoryPage';

import Login from './components/Auth/Login';
import Signup from './components/Auth/Signup';
import ForgotPassword from './components/Auth/ForgotPassword';

// REPLACE THIS WITH YOUR REAL GOOGLE CLIENT ID
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "YOUR_GOOGLE_CLIENT_ID_PLACEHOLDER";

const MainLayout = () => {
  return (
    <>
      <SettingModal />
      <Sidebar />
      <main className="flex-1 flex flex-col h-full relative min-w-0 bg-gray-50 transition-all duration-300">
        <Header />
        <Outlet />
      </main>
    </>
  );
};

function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Auth Routes (No Sidebar/Header) */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />

            {/* Main Application Routes (With Sidebar/Header) */}
            <Route element={<MainLayout />}>
              {/* Public Home Page */}
              <Route path="/" element={<HomePage />} />

              {/* Protected Dashboard Routes */}
              <Route element={<ProtectedRoute />}>
                <Route path="/statistics" element={<StatisticsPage />} />
                <Route path="/members" element={<MembersPage />} />
                <Route path="/history" element={<HistoryPage />} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}

export default App;