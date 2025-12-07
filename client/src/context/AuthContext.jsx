import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadUser = async () => {
            const token = localStorage.getItem('access_token');
            if (token) {
                try {
                    const res = await api.get('auth/me/');
                    setUser(res.data);
                } catch (error) {
                    console.error("Failed to load user", error);
                    localStorage.removeItem('access_token');
                    localStorage.removeItem('refresh_token');
                }
            }
            setLoading(false);
        };
        loadUser();
    }, []);

    const login = async (username, email, password) => {
        try {
            const res = await api.post('auth/login/', { username, email, password });
            const { user, tokens } = res.data;
            localStorage.setItem('access_token', tokens.access);
            localStorage.setItem('refresh_token', tokens.refresh);
            setUser(user);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.response?.data?.error || 'Login failed' };
        }
    };

    const register = async (userData) => {
        try {
            const res = await api.post('auth/register/', userData);
            const { user, tokens } = res.data;
            localStorage.setItem('access_token', tokens.access);
            localStorage.setItem('refresh_token', tokens.refresh);
            setUser(user);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.response?.data?.error || 'Registration failed' };
        }
    };

    const googleLogin = async (token) => {
        try {
            const res = await api.post('auth/google/', { token });
            const { user, tokens } = res.data;
            localStorage.setItem('access_token', tokens.access);
            localStorage.setItem('refresh_token', tokens.refresh);
            setUser(user);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.response?.data?.error || 'Google Login failed' };
        }
    };

    const forgotPassword = async (email) => {
        try {
            await api.post('auth/forgot-password/', { email });
            return { success: true };
        } catch (error) {
            return { success: false, error: error.response?.data?.error || 'Request failed' };
        }
    };

    const resetPassword = async (token, newPassword) => {
        try {
            await api.post('auth/reset-password/', { token, new_password: newPassword });
            return { success: true };
        } catch (error) {
            return { success: false, error: error.response?.data?.error || 'Reset failed' };
        }
    }

    const logout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, register, googleLogin, logout, forgotPassword, resetPassword, loading }}>
            {children}
        </AuthContext.Provider>
    );
};
