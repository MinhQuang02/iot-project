import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const Signup = () => {
  // State quản lý hiển thị mật khẩu
  const [showPassword, setShowPassword] = useState(false);

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
          </div>

          <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
            
            {/* 1. Name Section (Split Columns) */}
            <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Enter your name</label>
                <div className="flex gap-3">
                    <input 
                        type="text" 
                        placeholder="First name" 
                        className="w-1/2 bg-gray-100 border-none rounded-xl px-4 py-3 text-sm font-medium text-slate-700 placeholder:text-slate-400 focus:ring-2 focus:ring-brand-green/50 focus:bg-white transition-all outline-none"
                    />
                    <input 
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
                type="email" 
                placeholder="Enter your email" 
                className="w-full bg-gray-100 border-none rounded-xl px-4 py-3 text-sm font-medium text-slate-700 placeholder:text-slate-400 focus:ring-2 focus:ring-brand-green/50 focus:bg-white transition-all outline-none"
              />
            </div>

            {/* 3. Username Section */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Username</label>
              <input 
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

            <button className="w-full bg-[#2d3748] hover:bg-black text-white font-bold py-3 rounded-xl transition-all shadow-lg flex items-center justify-center gap-3 active:scale-[0.98]">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M23.766 12.2764C23.766 11.4607 23.6999 10.6406 23.5588 9.83807H12.24V14.4591H18.7217C18.4528 15.9494 17.5885 17.2678 16.323 18.1056V21.1039H20.19C22.4608 19.0139 23.7662 15.9274 23.766 12.2764Z" fill="#4285F4"/>
                <path d="M12.24 24.0008C15.4765 24.0008 18.2059 22.9382 20.1904 21.1039L16.3235 18.1055C15.2517 18.8375 13.8627 19.252 12.2445 19.252C9.11388 19.252 6.45946 17.1399 5.50705 14.3003H1.5166V17.3912C3.55371 21.4434 7.7029 24.0008 12.24 24.0008Z" fill="#34A853"/>
                <path d="M5.50253 14.3003C5.00236 12.8099 5.00236 11.1961 5.50253 9.70575V6.61481H1.51649C-0.18551 10.0056 -0.18551 14.0004 1.51649 17.3912L5.50253 14.3003Z" fill="#FBBC05"/>
                <path d="M12.24 4.74966C13.9509 4.7232 15.6044 5.36697 16.8434 6.54867L20.2695 3.12262C18.1001 1.0855 15.2208 -0.034466 12.24 0.000808666C7.7029 0.000808666 3.55371 2.55822 1.5166 6.61481L5.50264 9.70575C6.45064 6.86173 9.10947 4.74966 12.24 4.74966Z" fill="#EA4335"/>
              </svg>
              Or sign in with Google
            </button>

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