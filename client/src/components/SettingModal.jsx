import React, { useState, forwardRef, useImperativeHandle, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axiosClient from '../api/axiosClient';
import { useNavigate } from 'react-router-dom';
import './SettingModal.css'

const SettingModal = forwardRef((props, ref) => {
    const { user: authUser, logout } = useAuth();
    const navigate = useNavigate();

    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [maid, setMaid] = useState(''); // New state for User ID
    const [password, setPassword] = useState('');
    const [isVisible, setIsVisible] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isIdEditable, setIsIdEditable] = useState(false); // State to toggle ID edit mode

    // Initialize/Reset form data when modal opens or user changes
    useEffect(() => {
        if (authUser) {
            setFirstName(authUser.TenND || '');
            setLastName(authUser.HoND || '');
            setMaid(authUser.MaID || ''); // Init maid
            setIsIdEditable(false);       // Reset edit mode
            setPassword(''); // Always init password as empty
        }
    }, [authUser, isVisible]);

    const user = authUser ? {
        firstName: authUser.TenND || '',
        lastName: authUser.HoND || '',
        fullName: authUser.Username || `${authUser.TenND} ${authUser.HoND}`,
        email: authUser.Email,
        id: authUser.MaID ? `ID: ${authUser.MaID}` : 'ID: N/A',
        displayId: authUser.MaID || 'N/A', // For copy button
        role: authUser.QuyenHan === 'admin' ? 'Admin' : 'Member'
    } : {
        firstName: "Guest",
        lastName: "User",
        fullName: "Guest",
        email: "guest@example.com",
        id: "N/A",
        displayId: "N/A",
        role: "Visitor"
    };

    const openModal = () => setIsVisible(true);
    const closeModal = () => setIsVisible(false);

    useImperativeHandle(ref, () => ({
        open: openModal,
        close: closeModal
    }));

    const handleActionClose = () => {
        closeModal();
    };

    const handleEditId = () => {
        if (window.confirm("WARNING: Changing your User ID might affect your history tracking and access control. Are you sure you want to proceed?")) {
            setIsIdEditable(true);
        }
    };

    const handleSave = async () => {
        setIsLoading(true);
        try {
            const payload = {
                first_name: firstName,
                last_name: lastName,
                maid: maid // Include maid in update
            };
            if (password) {
                payload.password = password;
            }

            const res = await axiosClient.put('/auth/me/', payload);
            if (res.status === 200) {
                alert('Profile updated successfully!');
                // Ideally update context here, but for now simple alert
                // If password changed, maybe force logout?
                if (password) {
                    alert("Password changed. Please login again.");
                    logout();
                    navigate('/login');
                } else {
                    window.location.reload(); // Simple reload to reflect name changes in header
                }
                closeModal();
            }
        } catch (error) {
            console.error(error);
            alert(error.response?.data?.error || 'Failed to update profile');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (!window.confirm("CRITICAL WARNING: Are you sure you want to delete your account? This action cannot be undone and will delete all your data.")) {
            return;
        }

        setIsLoading(true);
        try {
            await axiosClient.delete('/auth/me/');
            alert('Account deleted successfully. We are sorry to see you go.');
            logout();
            navigate('/', { replace: true });
        } catch (error) {
            console.error(error);
            alert(error.response?.data?.error || 'Failed to delete account');
        } finally {
            setIsLoading(false);
        }
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

    if (!authUser) return null; // Or handle guest view appropriately

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
                                <span className={`text-[10px] md:text-xs font-bold py-1 px-2 md:px-3 rounded-full shadow-sm flex-shrink-0 ${user.role === 'Admin'
                                    ? 'bg-red-100 text-red-600'
                                    : 'bg-green-100 text-brand-green'
                                    }`}>
                                    {user.role}
                                </span>
                            </div>
                            <p className="text-slate-400 text-xs md:text-sm truncate">{user.email}</p>
                        </div>
                    </div>

                    {/* Copy Button */}
                    <button
                        className="w-full sm:w-auto border border-dashed border-brand-green text-brand-green px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-brand-light transition-colors flex items-center justify-center gap-2"
                        onClick={() => navigator.clipboard.writeText(user.displayId)}
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
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                className="w-1/2 md:flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-brand-green transition-colors text-slate-700 font-medium"
                                placeholder="First Name"
                            />
                            <input
                                type="text"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                className="w-1/2 md:flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-brand-green transition-colors text-slate-700 font-medium"
                                placeholder="Last Name"
                            />
                        </div>
                    </div>

                    {/* User ID (With Edit Button) */}
                    <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-6">
                        <label className="w-full md:w-24 font-bold text-sm text-slate-700">User ID</label>
                        <div className="flex-1 relative flex gap-2">
                            <div className="relative flex-1">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 mt-2 w-5 h-5 bg-brand-green rounded-full flex items-center justify-center text-white text-[10px] z-10">
                                    <i className="fa-solid fa-star text-[8px]"></i>
                                </div>
                                <input
                                    type="text"
                                    value={maid}
                                    onChange={(e) => setMaid(e.target.value)}
                                    readOnly={!isIdEditable}
                                    className={`w-full border rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-brand-green transition-colors font-medium ${isIdEditable ? 'bg-white border-gray-200 text-slate-700' : 'bg-gray-50 border-gray-200 text-slate-500 cursor-default'}`}
                                    placeholder="N/A"
                                />
                            </div>
                            {!isIdEditable && (
                                <button
                                    onClick={handleEditId}
                                    className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-slate-600 rounded-xl text-xs font-bold transition-colors"
                                    title="Edit User ID"
                                >
                                    <i className="fa-solid fa-pen"></i>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Password Input */}
                    <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-6">
                        <label className="w-full md:w-24 font-bold text-sm text-slate-700">Password</label>
                        <div className="flex-1 relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Leave empty to keep current"
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
                    <button
                        onClick={handleDeleteAccount}
                        disabled={isLoading}
                        className="w-full sm:w-auto bg-[#d66d6d] text-white px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-red-500 transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                    >
                        <i className="fa-regular fa-trash-can"></i> {isLoading ? 'Processing...' : 'Delete Account'}
                    </button>
                    <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                        <button
                            onClick={handleActionClose}
                            className="w-full sm:w-auto border border-gray-300 text-slate-600 px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={isLoading}
                            className="w-full sm:w-auto bg-[#2d3748] text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-black transition-colors shadow-lg shadow-slate-200 disabled:opacity-50"
                        >
                            {isLoading ? 'Saving...' : 'Save changes'}
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
});

export default SettingModal;