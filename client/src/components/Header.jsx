import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import SettingModal from './SettingModal';
import { useAuth } from '../context/AuthContext';
import axiosClient from '../api/axiosClient';

const Header = () => {
  const settingModalRef = useRef(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const notiRef = useRef(null);
  const profileRef = useRef(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      const fetchNotifs = async () => {
        try {
          const res = await axiosClient.get('/data/notifications/');
          if (res.data) {
            const formatted = res.data.map(n => ({
              id: n.MaTB,
              type: 'info', // Default type as DB doesn't have type yet
              title: n.TieuDe,
              message: n.NoiDung,
              time: new Date(n.ThoiGian).toLocaleTimeString(),
              icon: 'fa-circle-info'
            }));
            setNotifications(formatted);
          }
        } catch (error) {
          console.error("Failed to fetch notifications", error);
        }
      };
      fetchNotifs();
    }
  }, [user]);

  // --- Handlers ---
  const handleToggleSidebar = () => {
    window.dispatchEvent(new CustomEvent('open-sidebar'));
  };

  const handleOpenSettings = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    setShowNotifications(false);
    setShowProfileMenu(false);
    if (settingModalRef.current) {
      settingModalRef.current.open();
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notiRef.current && !notiRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <>
      <header className="h-16 px-4 md:px-8 flex items-center justify-between bg-white/50 backdrop-blur-sm flex-shrink-0 border-b border-gray-100 sticky top-0 z-30">

        {/* Left Section: Sidebar Toggle & Branding */}
        <div className="flex items-center gap-3 md:gap-4">
          <button
            onClick={handleToggleSidebar}
            className="md:hidden text-slate-500 hover:text-brand-green transition-colors p-2 rounded-lg hover:bg-gray-100"
          >
            <i className="fa-solid fa-bars text-xl"></i>
          </button>

          <div>
            <h1 className="font-bold text-lg md:text-2xl text-slate-800 tracking-tight">GreenSphere</h1>
            <p className="text-[10px] md:text-xs text-slate-500 font-semibold">Group 16 - 23CLC06</p>
          </div>
        </div>

        {/* Right Section: Actions */}
        <div className="flex items-center gap-2 md:gap-6">

          {/* 1. Settings Button */}
          <button
            onClick={handleOpenSettings}
            className="text-slate-400 hover:text-brand-green transition-colors hover:rotate-90 duration-300 p-2"
            title="Settings"
          >
            <i className="fa-solid fa-gear text-lg md:text-xl"></i>
          </button>

          {/* 2. Notification Bell (Only show if authenticated? Or public? Keeping it for now but could hide if needed. User only specified Profile/SignUp logic) */}
          <div className="relative" ref={notiRef}>
            <button
              onClick={() => {
                if (!user) {
                  navigate('/login');
                  return;
                }
                setShowNotifications(!showNotifications);
                setShowProfileMenu(false);
              }}
              className={`relative text-slate-400 hover:text-brand-green transition-colors p-2 ${showNotifications ? 'text-brand-green' : ''}`}
            >
              <i className="fa-solid fa-bell text-lg md:text-xl"></i>
              <span className="absolute top-1 right-1 md:top-0 md:right-0 w-2 h-2 md:w-2.5 md:h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
            </button>

            {/* Notification Dropdown */}
            {showNotifications && (
              <div className="absolute right-[-60px] md:right-0 top-full mt-2 w-72 md:w-80 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden animate-[fadeIn_0.2s_ease-out] z-50">
                <div className="px-4 py-3 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                  <h3 className="font-bold text-slate-700 text-sm">Notifications</h3>
                  <span className="text-xs text-brand-green font-semibold cursor-pointer hover:underline">Mark all read</span>
                </div>
                <div className="max-h-[300px] overflow-y-auto">
                  {notifications.map((notif) => (
                    <div key={notif.id} className="px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors border-b border-gray-50 last:border-0 flex gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${notif.type === 'warning' ? 'bg-red-100 text-red-500' :
                        notif.type === 'info' ? 'bg-blue-100 text-blue-500' : 'bg-green-100 text-green-500'
                        }`}>
                        <i className={`fa-solid ${notif.icon} text-xs`}></i>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-700">{notif.title}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{notif.message}</p>
                        <p className="text-[10px] text-slate-400 mt-1">{notif.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="px-4 py-2 bg-gray-50 text-center border-t border-gray-100">
                  <button className="text-xs font-bold text-slate-500 hover:text-brand-green">View all activity</button>
                </div>
              </div>
            )}
          </div>

          {/* 3. User Profile Logic */}
          <div className="relative pl-1 md:pl-4 md:border-l border-gray-200" ref={profileRef}>
            {user ? (
              // Authenticated View
              <>
                <button
                  onClick={() => {
                    setShowProfileMenu(!showProfileMenu);
                    setShowNotifications(false);
                  }}
                  className="flex items-center gap-2 md:gap-3 group focus:outline-none"
                >
                  <img
                    src={`https://ui-avatars.com/api/?name=${user.TenND}+${user.HoND}&background=37bb98&color=fff`}
                    alt="User"
                    className="w-8 h-8 md:w-10 md:h-10 rounded-full shadow-sm group-hover:shadow-md transition-all ring-2 ring-transparent group-hover:ring-brand-green/20"
                  />
                  <div className="hidden md:block text-left">
                    <p className="text-sm font-bold text-slate-700 group-hover:text-brand-green transition-colors">{user.TenND} {user.HoND}</p>
                    <p className="text-xs text-slate-400 text-right">{user.QuyenHan}</p>
                  </div>
                  <i className={`fa-solid fa-chevron-down text-xs text-slate-400 hidden md:block transition-transform duration-200 ${showProfileMenu ? 'rotate-180' : ''}`}></i>
                </button>

                {/* Profile Dropdown */}
                {showProfileMenu && (
                  <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden animate-[fadeIn_0.2s_ease-out] z-50">
                    <div className="p-2 space-y-1">
                      <div className="px-3 py-2 border-b border-gray-50 mb-1">
                        <p className="text-xs text-slate-400 font-semibold">Signed in as</p>
                        <p className="text-sm font-bold text-slate-700 truncate">{user.Email}</p>
                      </div>

                      <a href="#" className="flex items-center gap-3 px-3 py-2 text-sm text-slate-600 hover:bg-gray-50 hover:text-brand-green rounded-xl transition-colors">
                        <i className="fa-regular fa-copyright w-4"></i> Copyright
                      </a>
                      <a href="#" className="flex items-center gap-3 px-3 py-2 text-sm text-slate-600 hover:bg-gray-50 hover:text-brand-green rounded-xl transition-colors">
                        <i className="fa-regular fa-envelope w-4"></i> Contact Creator
                      </a>
                      <a href="#" className="flex items-center gap-3 px-3 py-2 text-sm text-slate-600 hover:bg-gray-50 hover:text-brand-green rounded-xl transition-colors">
                        <i className="fa-regular fa-circle-question w-4"></i> Help & FAQ
                      </a>

                      <div className="h-px bg-gray-100 my-1"></div>

                      <button
                        onClick={() => {
                          logout();
                          setShowProfileMenu(false);
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-500 hover:bg-red-50 hover:text-red-600 rounded-xl transition-colors font-medium"
                      >
                        <i className="fa-solid fa-right-from-bracket w-4"></i> Logout
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              // Anonymous View
              <Link to="/login" className="flex items-center gap-2 group">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gray-100 flex items-center justify-center text-slate-400 group-hover:bg-brand-green group-hover:text-white transition-all">
                  <i className="fa-solid fa-user"></i>
                </div>
                <div className="hidden md:block">
                  <p className="text-sm font-bold text-slate-700 group-hover:text-brand-green transition-colors">Sign In</p>
                </div>
              </Link>
            )}

          </div>
        </div>
      </header>

      <SettingModal ref={settingModalRef} />
    </>
  );
};

export default Header;