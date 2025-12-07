import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { GoogleLogin } from '@react-oauth/google';

const Signup = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    username: '',
    password: ''
  });
  const [error, setError] = useState('');

  const { register, googleLogin } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const userData = {
      first_name: formData.firstName,
      last_name: formData.lastName,
      email: formData.email,
      username: formData.username,
      password: formData.password
    };

    const res = await register(userData);
    if (res.success) {
      navigate('/');
    } else {
      setError(res.error);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    const res = await googleLogin(credentialResponse.credential);
    if (res.success) {
      navigate('/');
    } else {
      setError(res.error);
    }
  };

  return (
    <div className="flex h-screen w-full bg-white overflow-hidden">

      {/* --- LEFT SIDE: IMAGE (New Reliable Nature Vibe) --- */}
      <div className="hidden md:block md:w-[60%] lg:w-[65%] relative">
        <img
          src="https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?q=80&w=2074&auto=format&fit=crop"
          alt="Nature Background"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/20"></div>

        <div className="absolute bottom-10 left-10 text-white p-6 max-w-lg hidden lg:block">
          <h2 className="text-4xl font-bold mb-4">Join GreenSphere Today.</h2>
          <p className="text-lg opacity-95">Start managing your greenhouse environment smarter and more efficiently.</p>
        </div>
      </div>

      {/* --- RIGHT SIDE: FORM (Compact & No Scroll) --- */}
      <div className="w-full md:w-[40%] lg:w-[35%] flex items-center justify-center p-6 md:p-10 relative">
        <div className="w-full max-w-md space-y-5">

          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Register</h1>
            <p className="text-slate-500 text-sm">Create your account to get started.</p>
            {error && <p className="text-red-500 text-sm font-bold">{error}</p>}
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>

            {/* 1. Name Section (Split Columns) */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Enter your name</label>
              <div className="flex gap-3">
                <input
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  type="text"
                  placeholder="First name"
                  className="w-1/2 bg-gray-100 border-none rounded-xl px-4 py-3 text-sm font-medium text-slate-700 placeholder:text-slate-400 focus:ring-2 focus:ring-brand-green/50 focus:bg-white transition-all outline-none"
                />
                <input
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  type="text"
                  placeholder="Last name"
                  className="w-1/2 bg-gray-100 border-none rounded-xl px-4 py-3 text-sm font-medium text-slate-700 placeholder:text-slate-400 focus:ring-2 focus:ring-brand-green/50 focus:bg-white transition-all outline-none"
                />
              </div>
            </div>

            {/* 2. Email Section */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Email</label>
              <input
                name="email"
                value={formData.email}
                onChange={handleChange}
                type="email"
                placeholder="Enter your email"
                className="w-full bg-gray-100 border-none rounded-xl px-4 py-3 text-sm font-medium text-slate-700 placeholder:text-slate-400 focus:ring-2 focus:ring-brand-green/50 focus:bg-white transition-all outline-none"
              />
            </div>

            {/* 3. Username Section */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Username</label>
              <input
                name="username"
                value={formData.username}
                onChange={handleChange}
                type="text"
                placeholder="Enter your username"
                className="w-full bg-gray-100 border-none rounded-xl px-4 py-3 text-sm font-medium text-slate-700 placeholder:text-slate-400 focus:ring-2 focus:ring-brand-green/50 focus:bg-white transition-all outline-none"
              />
            </div>

            {/* 4. Password Section */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Password</label>
              <div className="relative">
                <input
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a password"
                  className="w-full bg-gray-100 border-none rounded-xl px-4 py-3 text-sm font-medium text-slate-700 placeholder:text-slate-400 focus:ring-2 focus:ring-brand-green/50 focus:bg-white transition-all outline-none pr-10"
                />
                <i
                  onClick={() => setShowPassword(!showPassword)}
                  className={`fa-regular ${showPassword ? "fa-eye-slash" : "fa-eye"} absolute right-4 top-1/2 -translate-y-1/2 mt-2.25 text-slate-400 cursor-pointer hover:text-brand-green transition-colors select-none`}
                ></i>
              </div>
            </div>

            {/* Register Button */}
            <button className="w-full bg-brand-green hover:bg-emerald-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-brand-green/30 active:scale-[0.98] mt-2">
              Register
            </button>

            {/* Divider & Google Button (Compact) */}
            <div className="relative border-t border-gray-100 my-3"></div>

            <div className="w-full flex justify-center">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => {
                  setError('Google Login Failed');
                }}
                width="100%"
                theme="filled_black"
                shape="pill"
              />
            </div>

            {/* Footer */}
            <div className="text-center pt-2">
              <span className="text-sm font-medium text-slate-500">Already have an account? </span>
              <Link to="/login" className="text-sm font-bold text-brand-green hover:underline">
                Sign in now
              </Link>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
};

export default Signup;
