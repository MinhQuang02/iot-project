import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';

import Sidebar from './components/Sidebar';
import Header from './components/Header';
import SettingModal from './components/SettingModal';
import NotFound from './components/NotFound';

import HomePage from './components/HomePage/HomePage';
import StatisticsPage from './components/StatisticsPage/StatisticsPage';
import MembersPage from './components/MembersPage/MembersPage';
import HistoryPage from './components/HistoryPage/HistoryPage';

import Login from './components/Auth/Login'; 
import Signup from './components/Auth/Signup';
import ForgotPassword from './components/Auth/ForgotPassword';

const MainLayout = () => {
  return (
    <>
      <SettingModal />
      <div id="mobile-overlay" onclick="toggleSidebar()" class="fixed inset-0 bg-black/50 z-40 hidden opacity-0 transition-opacity duration-300 md:hidden"></div>
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
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        <Route element={<MainLayout />}>
          <Route path="/" element={<HomePage />} />
          
          <Route path="/statistics" element={<StatisticsPage />} />
          <Route path="/members" element={<MembersPage />} />
          <Route path="/history" element={<HistoryPage />} />
          
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;