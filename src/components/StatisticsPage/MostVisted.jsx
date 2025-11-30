import React from 'react';

const MostVisited = () => {
    // Dữ liệu cho biểu đồ cột (Mock Data)
    const activityData = [
        { day: 'Mon', height: '40%', color: 'bg-blue-100/50', hover: 'hover:bg-blue-200' },
        { day: 'Tue', height: '60%', color: 'bg-brand-light', hover: 'hover:bg-brand-green/20' },
        { day: 'Wed', height: '80%', color: 'bg-orange-100/50', hover: 'hover:bg-orange-200' },
        { day: 'Thu', height: '50%', color: 'bg-blue-100/50', hover: 'hover:bg-blue-200' },
        { day: 'Fri', height: '90%', color: 'bg-brand-green', shadow: 'shadow-lg shadow-brand-green/30', isHighlight: true },
        { day: 'Sat', height: '45%', color: 'bg-orange-100/50', hover: 'hover:bg-orange-200' },
        { day: 'Sun', height: '70%', color: 'bg-blue-100/50', hover: 'hover:bg-blue-200' },
    ];

    return (
        <div className="bg-white rounded-[1.5rem] md:rounded-[2rem] p-5 md:p-6 shadow-sm border border-gray-100 flex flex-col min-h-[350px] md:min-h-0 hover:shadow-lg transition-shadow duration-300 h-full">
            
            {/* Header */}
            <div className="flex justify-between items-center mb-4 flex-shrink-0">
                <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                    <span className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-500">
                        <i className="fa-solid fa-chart-pie"></i>
                    </span>
                    Monthly Activity
                </h3>
                <i className="fa-solid fa-ellipsis text-slate-400 cursor-pointer p-2 hover:bg-gray-50 rounded-full transition-colors"></i>
            </div>

            {/* Content Area */}
            <div className="flex-1 flex flex-col md:flex-row gap-6 min-h-0">
                
                {/* Left Column: Bar Chart */}
                <div className="w-full md:w-[65%] flex flex-col justify-end h-48 md:h-auto">
                    <div className="flex items-end justify-between gap-2 md:gap-3 h-full pb-2 border-b border-gray-100">
                        {activityData.map((item, index) => (
                            <div 
                                key={index}
                                className={`w-full rounded-t-lg transition-all relative group/bar ${item.color} ${item.hover || ''} ${item.shadow || ''}`}
                                style={{ height: item.height }}
                            >
                                {/* Tooltip on Hover (Optional) */}
                                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover/bar:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                                    {item.height}
                                </div>
                            </div>
                        ))}
                    </div>
                    
                    {/* X-Axis Labels */}
                    <div className="flex justify-between text-[10px] text-slate-400 mt-2 font-medium">
                        {activityData.map((item, index) => (
                            <span key={index} className={item.isHighlight ? 'text-brand-green font-bold' : ''}>
                                {item.day}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Right Column: Donut Chart & Legend */}
                <div className="w-full md:w-[35%] flex flex-col items-center justify-center relative border-t md:border-t-0 md:border-l border-dashed border-gray-200 pt-4 md:pt-0 md:pl-4">
                    <div className="flex flex-row md:flex-col items-center gap-6 md:gap-0">
                        
                        {/* Donut Chart SVG */}
                        <div className="relative w-24 h-24 md:w-28 md:h-28 flex items-center justify-center">
                            <svg className="w-full h-full transform -rotate-90">
                                {/* Background Circle */}
                                <circle cx="50%" cy="50%" r="42%" stroke="#f1f5f9" strokeWidth="12" fill="none"/>
                                {/* Green Segment */}
                                <circle 
                                    cx="50%" cy="50%" r="42%" 
                                    stroke="#37bb98" strokeWidth="12" fill="none" 
                                    strokeDasharray="289" strokeDashoffset="100" 
                                    strokeLinecap="round"
                                />
                                {/* Orange Segment */}
                                <circle 
                                    cx="50%" cy="50%" r="42%" 
                                    stroke="#fb923c" strokeWidth="12" fill="none" 
                                    strokeDasharray="289" strokeDashoffset="240" 
                                    strokeLinecap="round" 
                                    className="opacity-80"
                                />
                            </svg>
                            
                            {/* Center Text */}
                            <div className="absolute text-center">
                                <span className="block text-2xl font-bold text-slate-800">75%</span>
                                <span className="text-[9px] text-slate-400 font-bold uppercase">Efficiency</span>
                            </div>
                        </div>

                        {/* Legend */}
                        <div className="flex flex-col md:flex-row gap-3 md:mt-4">
                            <div className="flex items-center gap-1 text-[10px] text-slate-500 font-bold">
                                <span className="w-2 h-2 rounded-full bg-brand-green"></span> Used
                            </div>
                            <div className="flex items-center gap-1 text-[10px] text-slate-500 font-bold">
                                <span className="w-2 h-2 rounded-full bg-orange-400"></span> Idle
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default MostVisited;