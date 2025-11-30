import React from 'react';
import BannerImage from '../../assets/banner.png';

const Banner = () => {
  return (
    <div className="bg-brand-light relative rounded-3xl md:rounded-[2rem] p-6 md:p-8 flex justify-between items-center overflow-hidden min-h-[180px] w-full shrink-0 shadow-sm transition-all hover:shadow-md duration-300">
      
      {/* --- Left Content: Text & Info --- */}
      <div className="z-10 relative max-w-[60%] md:max-w-[55%]">
        
        {/* Greeting */}
        <h2 className="font-poppins font-bold text-2xl md:text-3xl text-brand-dark mb-2 leading-tight">
          Hello, Quang Minh!
        </h2>
        
        {/* Subtext */}
        <p className="text-brand-dark/80 text-xs md:text-sm mb-6 font-medium">
          Welcome to the Greenhouse, we are GreenSphere and what do you need us to provide today?
        </p>
        
        {/* Weather Info Widget */}
        <div className="flex flex-wrap items-center gap-2 md:gap-6">
          <div className="flex items-center gap-3 bg-transparent p-2 pr-4 rounded-2xl">
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-brand-dark shadow-md text-xl">
                 <i className="fa-solid fa-temperature-half"></i>
            </div>
            <div>
              <span className="block text-xl md:text-2xl font-bold text-brand-dark leading-none">
                +25°C
              </span>
              <p className="text-[10px] md:text-xs font-bold text-brand-dark/60 uppercase tracking-wider mt-0.5">
                Outdoor
              </p>
            </div>
          </div>

          {/* Weather Condition */}
          <div className="flex items-center gap-2 bg-white/60 p-2 px-3 rounded-xl backdrop-blur-sm border border-white/10 shadow-sm">
            <i className="fa-solid fa-cloud text-brand-dark text-lg"></i>
            <span className="text-xs md:text-sm font-bold text-brand-dark whitespace-nowrap">
                Fuzzy cloudy
            </span>
          </div>
          
        </div>
      </div>

      {/* --- Right Content: Decor Image --- */}
      <div className="absolute -right-8 -bottom-8 md:-right-12 md:-bottom-12 lg:-right-16 lg:-bottom-16 w-60 md:w-96 lg:w-[500px] opacity-90 pointer-events-none select-none transition-all duration-500">
        <img 
          src={BannerImage} 
          alt="Decoration Trees" 
          className="w-full object-contain drop-shadow-2xl"
        />
      </div>
      
    </div>
  );
};

export default Banner;