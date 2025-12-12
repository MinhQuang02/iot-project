import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Sidebar = forwardRef((props, ref) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const { user, logout } = useAuth();

    const location = useLocation();
    const navigate = useNavigate();
    const currentPath = location.pathname;

    useImperativeHandle(ref, () => ({
        toggle: () => setIsOpen(prev => !prev),
        open: () => setIsOpen(true),
        close: () => setIsOpen(false)
    }));

    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth < 768;
            setIsMobile(mobile);
            if (!mobile) setIsOpen(false);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        const handleSidebarEvent = () => {
            setIsOpen(prev => !prev);
        };

        window.addEventListener('open-sidebar', handleSidebarEvent);

        return () => {
            window.removeEventListener('open-sidebar', handleSidebarEvent);
        };
    }, []);

    const toggleSidebar = () => {
        setIsOpen(!isOpen);
    };

    const menuItems = [
        { path: '/', label: 'Home', icon: 'fa-house' },
        { path: '/statistics', label: 'Statistics', icon: 'fa-chart-simple' },
        { path: '/members', label: 'Members', icon: 'fa-users' },
        { path: '/history', label: 'History', icon: 'fa-clock-rotate-left' },
    ];

    const textClass = `whitespace-nowrap transition-all duration-300 ease-in-out ${isOpen ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2 hidden'
        }`;

    const sidebarWidthClass = isMobile
        ? (isOpen ? 'translate-x-0 w-64' : '-translate-x-full w-64')
        : (isOpen ? 'w-64' : 'w-[88px]');

    return (
        <>
            <div
                className={`fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 transition-opacity duration-300 ease-in-out ${isMobile && isOpen ? 'block opacity-100' : 'hidden opacity-0'
                    }`}
                onClick={() => setIsOpen(false)}
            ></div>

            <aside
                className={`h-full bg-brand-green flex flex-col justify-between py-6 transition-all duration-300 ease-in-out fixed md:static inset-y-0 left-0 z-50 shadow-2xl md:shadow-xl ${sidebarWidthClass}`}
            >
                <div className="flex flex-col w-full">
                    {/* Header Toggle */}
                    <div
                        className="flex items-center h-12 mb-8 cursor-pointer overflow-hidden px-0 group"
                        onClick={toggleSidebar}
                    >
                        <div className="w-[88px] flex justify-center items-center flex-shrink-0 transition-transform duration-300 group-hover:scale-110">
                            <i className="fa-solid fa-bars text-white text-xl"></i>
                        </div>
                        <span className={`text-white font-bold text-xl ${textClass}`}>
                            GreenSphere
                        </span>
                    </div>

                    {/* Navigation Links */}
                    <nav className="flex flex-col w-full gap-2">
                        {menuItems.map((item) => {
                            const isActive = currentPath === item.path;

                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className={`group relative flex items-center h-14 w-full transition-all duration-300 ease-in-out ${!isActive ? 'hover:bg-white/10' : ''
                                        }`}
                                    onClick={(e) => {
                                        if (!user && item.path !== '/') {
                                            e.preventDefault();
                                            navigate('/signup');
                                        }
                                        if (isMobile) setIsOpen(false);
                                    }}
                                >
                                    <div
                                        className={`absolute left-0 top-1/2 -translate-y-1/2 mt-4 h-8 w-1 bg-white rounded-r-full z-20 transition-all duration-300 ease-out ${isActive ? 'opacity-100 scale-y-100' : 'opacity-0 scale-y-0'
                                            }`}
                                    ></div>

                                    {/* Icon Container */}
                                    <div className="w-[88px] flex justify-center items-center flex-shrink-0 z-10">
                                        <div
                                            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 ease-in-out shadow-sm ${isActive
                                                ? 'bg-white shadow-lg scale-100'
                                                : 'bg-transparent scale-90 group-hover:scale-100'
                                                }`}
                                        >
                                            <i className={`fa-solid ${item.icon} text-lg transition-colors duration-300 ${isActive ? 'text-brand-green' : 'text-white/80'
                                                }`}></i>
                                        </div>
                                    </div>

                                    {/* Text Label */}
                                    <span className={`text-white ${isActive ? 'font-bold' : 'font-medium'} ${textClass}`}>
                                        {item.label}
                                    </span>
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                {/* Login/Logout Button */}
                <div>
                    {user ? (
                        <button
                            onClick={logout}
                            className="group relative flex items-center h-14 w-full hover:bg-white/10 transition-colors duration-300 w-full text-left"
                        >
                            <div className="w-[88px] flex justify-center items-center flex-shrink-0 transition-transform duration-300 group-hover:-translate-x-1">
                                <i className="fa-solid fa-right-from-bracket text-white text-lg"></i>
                            </div>
                            <span className={`text-white font-medium ${textClass}`}>
                                Logout
                            </span>
                        </button>
                    ) : (
                        <Link
                            to="/signup"
                            className="group relative flex items-center h-14 w-full hover:bg-white/10 transition-colors duration-300"
                        >
                            <div className="w-[88px] flex justify-center items-center flex-shrink-0 transition-transform duration-300 group-hover:-translate-x-1">
                                <i className="fa-solid fa-user-plus text-white text-lg"></i>
                            </div>
                            <span className={`text-white font-medium ${textClass}`}>
                                Sign Up
                            </span>
                        </Link>
                    )}
                </div>
            </aside>
        </>
    );
});

Sidebar.displayName = 'Sidebar';

export default Sidebar;