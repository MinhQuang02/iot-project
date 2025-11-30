import React from 'react';

const Temperature = () => {
    // Dữ liệu tháng cho trục hoành (X-axis)
    const months = ['Jan', 'Mar', 'May', 'Jul', 'Sep', 'Nov'];

    return (
        <div className="bg-white rounded-[1.5rem] md:rounded-[2rem] p-5 md:p-6 shadow-sm border border-gray-100 flex flex-col relative group hover:shadow-lg transition-shadow duration-300 min-h-[280px] md:min-h-0 h-full">
            
            {/* Header: Icon, Title & Filter */}
            <div className="flex justify-between items-start mb-2">
                <div>
                    <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                        <span className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-500">
                            <i className="fa-solid fa-temperature-half"></i>
                        </span>
                        Temperature
                    </h3>
                </div>
                <select className="text-xs font-bold text-slate-500 bg-gray-50 border-none rounded-lg px-2 py-1 outline-none cursor-pointer hover:bg-gray-100 transition-colors">
                    <option>This Year</option>
                    <option>Last Year</option>
                </select>
            </div>

            {/* Chart Area */}
            <div className="flex-1 relative w-full flex flex-col justify-end min-h-0">
                
                {/* Floating Stats */}
                <div className="absolute top-0 md:top-4 right-0 md:right-4 flex flex-col gap-1 items-end z-10 pointer-events-none">
                    <span className="text-2xl font-bold text-slate-800">24°C</span>
                    <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full">Current Avg</span>
                </div>

                {/* SVG Chart */}
                <svg viewBox="0 0 500 200" preserveAspectRatio="none" className="w-full h-40 md:h-[85%] overflow-visible mt-6 md:mt-0">
                    <defs>
                        <linearGradient id="tempGradient" x1="0" x2="0" y1="0" y2="1">
                            <stop offset="0%" stopColor="#fb923c" stopOpacity="0.2"/> 
                            <stop offset="100%" stopColor="#fb923c" stopOpacity="0"/>
                        </linearGradient>
                    </defs>
                    
                    {/* Grid Lines */}
                    <line x1="0" y1="50" x2="500" y2="50" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4"/>
                    <line x1="0" y1="100" x2="500" y2="100" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4"/>
                    <line x1="0" y1="150" x2="500" y2="150" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4"/>

                    {/* Chart Line & Fill */}
                    <path 
                        d="M0,150 C50,150 50,100 100,100 C150,100 150,180 200,180 C250,180 250,40 300,40 C350,40 350,140 400,140 C450,140 450,200 500,200 L500,200 L0,200 Z" 
                        fill="url(#tempGradient)" 
                    />
                    <path 
                        d="M0,150 C50,150 50,100 100,100 C150,100 150,180 200,180 C250,180 250,40 300,40 C350,40 350,140 400,140 C450,140 450,200 500,200" 
                        fill="none" 
                        stroke="#fb923c" 
                        strokeWidth="3" 
                        strokeLinecap="round"
                    />
                    
                    {/* Highlight Dot */}
                    <circle cx="300" cy="40" r="5" fill="white" stroke="#fb923c" strokeWidth="3" className="drop-shadow-md"/>
                </svg>

                {/* X-Axis Labels */}
                <div className="flex justify-between text-[10px] text-slate-400 mt-2 px-2 font-medium">
                    {months.map((month, index) => (
                        <span key={index}>{month}</span>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Temperature;