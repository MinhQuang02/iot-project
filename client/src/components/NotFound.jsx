import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] p-4 text-center animate-[fadeIn_0.5s_ease-out]">

      {/* 404 Text */}
      <h1 className="text-8xl font-black text-slate-200 tracking-tighter mb-2 select-none">
        404
      </h1>
      
      {/* Message */}
      <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mb-3">
        Page Not Found
      </h2>
      <p className="text-slate-500 max-w-md mb-8 font-medium">
        Oops! It seems you've wandered into a part of the forest that doesn't exist on our map.
      </p>

      {/* Action Button */}
      <Link 
        to="/" 
        className="inline-flex items-center justify-center gap-2 bg-brand-green text-white px-8 py-3.5 rounded-xl font-bold hover:bg-[#2d9e80] transition-all transform hover:scale-105 shadow-lg shadow-green-200/50"
      >
        <i className="fa-solid fa-house"></i>
        <span>Back to Home</span>
      </Link>

    </div>
  );
};

export default NotFound;