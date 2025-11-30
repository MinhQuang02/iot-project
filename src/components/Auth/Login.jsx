import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import imageSrc from '../../assets/login_image.jpg';

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);

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
          </div>

          <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
            
            {/* Input: Login (Email/User) */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Login</label>
              <input 
                type="text" 
                placeholder="Enter email or username" 
                className="w-full bg-gray-100 border-none rounded-xl px-4 py-3.5 text-sm font-medium text-slate-700 placeholder:text-slate-400 focus:ring-2 focus:ring-brand-green/50 focus:bg-white transition-all outline-none"
              />
            </div>

            {/* Input: Password */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Password</label>
              <div className="relative">
                <input 
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
              <Link to="/">Sign in</Link>
            </button>

            {/* Divider */}
            <div className="relative border-t border-gray-100 my-6"></div>

            {/* Google Button */}
            <button className="w-full bg-[#2d3748] hover:bg-black text-white font-bold py-3.5 rounded-xl transition-all shadow-lg flex items-center justify-center gap-3 active:scale-[0.98]">
              {/* Google Icon SVG */}
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M23.766 12.2764C23.766 11.4607 23.6999 10.6406 23.5588 9.83807H12.24V14.4591H18.7217C18.4528 15.9494 17.5885 17.2678 16.323 18.1056V21.1039H20.19C22.4608 19.0139 23.7662 15.9274 23.766 12.2764Z" fill="#4285F4"/>
                <path d="M12.24 24.0008C15.4765 24.0008 18.2059 22.9382 20.1904 21.1039L16.3235 18.1055C15.2517 18.8375 13.8627 19.252 12.2445 19.252C9.11388 19.252 6.45946 17.1399 5.50705 14.3003H1.5166V17.3912C3.55371 21.4434 7.7029 24.0008 12.24 24.0008Z" fill="#34A853"/>
                <path d="M5.50253 14.3003C5.00236 12.8099 5.00236 11.1961 5.50253 9.70575V6.61481H1.51649C-0.18551 10.0056 -0.18551 14.0004 1.51649 17.3912L5.50253 14.3003Z" fill="#FBBC05"/>
                <path d="M12.24 4.74966C13.9509 4.7232 15.6044 5.36697 16.8434 6.54867L20.2695 3.12262C18.1001 1.0855 15.2208 -0.034466 12.24 0.000808666C7.7029 0.000808666 3.55371 2.55822 1.5166 6.61481L5.50264 9.70575C6.45064 6.86173 9.10947 4.74966 12.24 4.74966Z" fill="#EA4335"/>
              </svg>
              Or sign in with Google
            </button>

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