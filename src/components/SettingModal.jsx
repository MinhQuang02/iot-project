import React, { useState, forwardRef, useImperativeHandle } from 'react';
import './SettingModal.css'

const SettingModal = forwardRef((props, ref) => {
    const user = {
        firstName: "Minh",
        lastName: "Quang Phan",
        fullName: "mphanquang",
        email: "mphanquang06@gmail.com",
        id: "1234-567-890",
        role: "Admin"
    };

    const [isVisible, setIsVisible] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    
    const openModal = () => setIsVisible(true);
    const closeModal = () => setIsVisible(false);

    useImperativeHandle(ref, () => ({
        open: openModal,
        close: closeModal
    }));

    const handleActionClose = () => {
        closeModal();
    };

    const getInitials = (name) => {
        if (!name) return '?';
        const parts = name.split(' ');
        if (parts.length > 1) {
            return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
        }
        return parts[0][0].toUpperCase();
    };
    
    const initials = getInitials(user.fullName);
    const modalClass = isVisible ? '' : 'hidden-modal';
    
    const handleModalClick = (e) => {
        e.stopPropagation();
    };

    return (
        <div 
            id="setting-modal" 
            className={`fixed inset-0 z-[100] flex items-center justify-center bg-black/20 backdrop-blur-sm p-4 ${modalClass}`}
            onClick={closeModal}
        >
            <div 
                className="bg-white rounded-2xl md:rounded-3xl shadow-2xl w-full md:w-[600px] max-h-[90vh] overflow-y-auto custom-scroll p-5 md:p-8 relative animate-[fadeIn_0.3s_ease-out]"
                onClick={handleModalClick}
            >
                
                {/* Header Section: Avatar & Info */}
                <div className="flex flex-col sm:flex-row items-start justify-between mb-6 gap-4 sm:gap-0">
                    <div className="flex items-center gap-4 w-full sm:w-auto">
                        
                        {/* Avatar */}
                        <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-brand-light border-4 border-white shadow-md flex items-center justify-center text-brand-green relative flex-shrink-0">
                            <span className="text-2xl md:text-3xl font-bold">{initials}</span>
                        </div>

                        <div className="flex flex-col overflow-hidden">
                            <div className="flex items-center gap-2 md:gap-3 flex-wrap">
                                <h2 className="text-xl md:text-2xl font-bold text-brand-green truncate">{user.fullName}</h2>
                                
                                {/* Role Badge */}
                                <span className={`text-[10px] md:text-xs font-bold py-1 px-2 md:px-3 rounded-full shadow-sm flex-shrink-0 ${
                                    user.role === 'Admin' 
                                    ? 'bg-red-100 text-red-600' 
                                    : 'bg-green-100 text-brand-green'
                                }`}>
                                    {user.role}
                                </span>
                            </div>
                            <p className="text-slate-400 text-xs md:text-sm truncate">{user.email}</p>
                        </div>
                    </div>

                    {/* Copy Button: Full width on mobile, auto on desktop */}
                    <button 
                        className="w-full sm:w-auto border border-dashed border-brand-green text-brand-green px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-brand-light transition-colors flex items-center justify-center gap-2"
                        onClick={() => navigator.clipboard.writeText(user.id)}
                    >
                        <i className="fa-regular fa-copy"></i> <span className="sm:hidden md:inline">Copy ID</span>
                    </button>
                </div>

                {/* Form Fields */}
                <div className="space-y-4 md:space-y-5">
                    
                    {/* Name Inputs */}
                    <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-6">
                        <label className="w-full md:w-24 font-bold text-sm text-slate-700">Name</label>
                        <div className="flex-1 flex gap-3">
                            <input 
                                type="text" 
                                defaultValue={user.firstName} 
                                className="w-1/2 md:flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-brand-green transition-colors text-slate-700 font-medium" 
                            />
                            <input 
                                type="text" 
                                defaultValue={user.lastName} 
                                className="w-1/2 md:flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-brand-green transition-colors text-slate-700 font-medium" 
                            />
                        </div>
                    </div>

                    {/* User ID (Readonly) */}
                    <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-6">
                        <label className="w-full md:w-24 font-bold text-sm text-slate-700">User ID</label>
                        <div className="flex-1 relative">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 mt-2 w-5 h-5 bg-brand-green rounded-full flex items-center justify-center text-white text-[10px]">
                                <i className="fa-solid fa-star text-[8px]"></i>
                            </div>
                            <input
                                type="text"
                                defaultValue={user.id}
                                readOnly
                                className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm bg-gray-50 focus:outline-none focus:border-brand-green transition-colors text-slate-500 font-medium cursor-default"
                            />
                        </div>  
                    </div>

                    {/* Password Input */}
                    <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-6">
                        <label className="w-full md:w-24 font-bold text-sm text-slate-700">Password</label>
                        <div className="flex-1 relative">
                            <input 
                                type={showPassword ? "text" : "password"} 
                                defaultValue="password123" 
                                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-brand-green transition-colors font-medium pr-10" 
                            />
                            <i 
                                onClick={() => setShowPassword(!showPassword)}
                                className={`fa-regular ${showPassword ? "fa-eye-slash" : "fa-eye"} absolute right-4 top-1/2 -translate-y-1/2 mt-2 text-slate-400 cursor-pointer hover:text-brand-green select-none`}
                            ></i>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="flex flex-col-reverse sm:flex-row items-center justify-between mt-8 md:mt-10 pt-4 border-t border-gray-50 gap-4 sm:gap-0">
                    <button className="w-full sm:w-auto bg-[#d66d6d] text-white px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-red-500 transition-colors flex items-center justify-center gap-2 shadow-sm">
                        <i className="fa-regular fa-trash-can"></i> Delete Account
                    </button>
                    <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                        <button 
                            onClick={handleActionClose} 
                            className="w-full sm:w-auto border border-gray-300 text-slate-600 px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={handleActionClose}
                            className="w-full sm:w-auto bg-[#2d3748] text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-black transition-colors shadow-lg shadow-slate-200"
                        >
                            Save changes
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
});

export default SettingModal;