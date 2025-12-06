import React from 'react';
import { Link } from 'react-router-dom';

const ForgotPassword = () => {
  return (
    <div className="flex min-h-screen w-full bg-white">
      
      {/* --- LEFT SIDE: IMAGE --- */}
      <div className="hidden md:block md:w-[60%] lg:w-[65%] relative">
        <img 
          src="https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=2000&auto=format&fit=crop"
          alt="Greenhouse Background" 
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/10"></div>
      </div>

      {/* --- RIGHT SIDE: FORM --- */}
      <div className="w-full md:w-[40%] lg:w-[35%] flex items-center justify-center p-8 md:p-12 lg:p-16">
        <div className="w-full max-w-md space-y-8 animate-[fadeIn_0.5s_ease-out]">
          
          {/* Header */}
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-slate-900">Forgot Password?</h1>
            <p className="text-slate-500 text-sm leading-relaxed">
              Don't worry! It happens. Please enter the email address associated with your account.
            </p>
          </div>

          <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
            
            {/* Email Input */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Email</label>
              <input 
                type="email" 
                placeholder="Enter your email" 
                className="w-full bg-gray-100 border-none rounded-xl px-4 py-3.5 text-sm font-medium text-slate-700 placeholder:text-slate-400 focus:ring-2 focus:ring-brand-green/50 focus:bg-white transition-all outline-none"
              />
            </div>

            {/* Submit Button */}
            <button className="w-full bg-brand-green hover:bg-emerald-500 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-brand-green/30 active:scale-[0.98]">
              Send recovery link
            </button>
            
            {/* Return Link */}
            <div className="pt-2">
                <Link 
                    to="/login" 
                    className="inline-flex items-center gap-2 text-sm font-bold text-slate-700 hover:text-brand-green transition-colors group"
                >
                    <i className="fa-solid fa-arrow-left text-xs transition-transform group-hover:-translate-x-1"></i>
                    Return to the Login
                </Link>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;