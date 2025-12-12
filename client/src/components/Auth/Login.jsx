import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { GoogleLogin } from '@react-oauth/google';
import imageSrc from '../../assets/login_image.jpg';

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');

  const { login, googleLogin } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await login(null, formData.email, formData.password);
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
    <div className="flex min-h-screen w-full bg-white">

      {/* --- LEFT SIDE: IMAGE --- */}
      <div className="hidden md:block md:w-[60%] lg:w-[65%] relative">
        <img
          src={imageSrc}
          alt="Greenhouse"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/10"></div>
      </div>

      {/* --- RIGHT SIDE: FORM --- */}
      <div className="w-full md:w-[40%] lg:w-[35%] flex items-center justify-center p-8 md:p-12 lg:p-16 overflow-y-auto">
        <div className="w-full max-w-md space-y-8">

          {/* Header */}
          <div className="mb-10">
            <h1 className="text-4xl font-bold text-slate-900 mb-2">Log In</h1>
            {error && <p className="text-red-500 text-sm font-bold">{error}</p>}
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>

            {/* Input: Login (Email/User) */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Email</label>
              <input
                name="email"
                value={formData.email}
                onChange={handleChange}
                type="text"
                placeholder="Enter email"
                className="w-full bg-gray-100 border-none rounded-xl px-4 py-3.5 text-sm font-medium text-slate-700 placeholder:text-slate-400 focus:ring-2 focus:ring-brand-green/50 focus:bg-white transition-all outline-none"
              />
            </div>

            {/* Input: Password */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Password</label>
              <div className="relative">
                <input
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter password"
                  className="w-full bg-gray-100 border-none rounded-xl px-4 py-3.5 text-sm font-medium text-slate-700 placeholder:text-slate-400 focus:ring-2 focus:ring-brand-green/50 focus:bg-white transition-all outline-none pr-10"
                />
                <i
                  onClick={() => setShowPassword(!showPassword)}
                  className={`fa-regular ${showPassword ? "fa-eye-slash" : "fa-eye"} absolute right-4 top-1/2 -translate-y-1/2 mt-2.25 text-slate-400 cursor-pointer hover:text-brand-green transition-colors select-none`}
                ></i>
              </div>
            </div>

            {/* Row: Remember me & Forgot Password */}
            <div className="flex items-center justify-between">

              {/* Custom Toggle Switch */}
              <div
                className="flex items-center gap-2 cursor-pointer group"
                onClick={() => setRememberMe(!rememberMe)}
              >
                <div className={`w-9 h-5 rounded-full relative transition-colors duration-300 ease-in-out ${rememberMe ? 'bg-brand-green' : 'bg-gray-200'}`}>
                  <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-300 ease-in-out ${rememberMe ? 'translate-x-2' : 'translate-x-0'}`}></div>
                </div>
                <span className="text-xs font-bold text-slate-600 group-hover:text-slate-800 select-none">Remember me</span>
              </div>

              {/* Forgot Password Link */}
              <Link to="/forgot-password" className="text-xs font-bold text-brand-green hover:underline">
                Forgot password?
              </Link>
            </div>

            {/* Sign In Button */}
            <button className="w-full bg-brand-green hover:bg-emerald-500 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-brand-green/30 active:scale-[0.98]">
              Sign in
            </button>

            {/* Divider */}
            <div className="relative border-t border-gray-100 my-6"></div>

            {/* Google Button Wrapper */}
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
            <div className="text-center pt-4">
              <span className="text-sm font-medium text-slate-500">Dont have an account? </span>
              <Link to="/signup" className="text-sm font-bold text-brand-green hover:underline">
                Sign up now
              </Link>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
