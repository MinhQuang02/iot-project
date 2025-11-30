import React from 'react';

const TopUsers = () => {
    // Mock Data cho danh sách người dùng
    const usersData = [
        { 
            id: 1, 
            name: 'minhq', 
            initials: 'MQ', 
            visits: 152, 
            activity: 85, 
            color: 'bg-brand-light text-brand-green border-brand-green/20',
            progressColor: 'bg-[#5e5ce6]'
        },
        { 
            id: 2, 
            name: 'huup', 
            initials: 'HP', 
            visits: 98, 
            activity: 60, 
            color: 'bg-orange-50 text-orange-500 border-orange-200',
            progressColor: 'bg-[#ff6b6b]' 
        },
        { 
            id: 3, 
            name: 'anhq', 
            initials: 'AQ', 
            visits: 45, 
            activity: 45, 
            color: 'bg-teal-50 text-teal-500 border-teal-200',
            progressColor: 'bg-[#37bb98]' 
        },
    ];

    return (
        <div className="bg-white rounded-[1.5rem] md:rounded-[2rem] p-5 md:p-6 shadow-sm border border-gray-100 flex flex-col min-h-[350px] md:min-h-0 hover:shadow-lg transition-shadow duration-300 h-full">
            
            {/* Header: Title & Filter */}
            <div className="flex justify-between items-center mb-5 flex-shrink-0">
                <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                    <span className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center text-purple-500">
                        <i className="fa-solid fa-users"></i>
                    </span>
                    Top Users
                </h3>
                <div className="flex bg-gray-100 rounded-lg p-1 gap-1">
                    <button className="px-3 py-1 bg-white text-[10px] font-bold text-slate-800 rounded shadow-sm transition-all">Weekly</button>
                    <button className="px-3 py-1 text-[10px] font-bold text-slate-400 hover:text-slate-600 transition-colors">Monthly</button>
                </div>
            </div>

            {/* Table Header Labels */}
            <div className="grid grid-cols-12 gap-4 text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-4 px-2">
                <div className="col-span-4">User Name</div>
                <div className="col-span-5">Activity Level</div>
                <div className="col-span-3 text-right">Visits</div>
            </div>

            {/* User List (Scrollable Area) */}
            <div className="flex-1 overflow-y-auto scrollbar-hide flex flex-col gap-4 pr-1 min-h-0">
                {usersData.map((user) => (
                    <div key={user.id} className="grid grid-cols-12 gap-4 items-center group p-2 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer">
                        
                        {/* User Name & Avatar */}
                        <div className="col-span-4 flex items-center gap-2 md:gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border ${user.color}`}>
                                {user.initials}
                            </div>
                            <span className="text-xs font-bold text-slate-700 truncate">{user.name}</span>
                        </div>

                        {/* Activity Progress Bar */}
                        <div className="col-span-5">
                            <div className="flex items-center gap-2">
                                <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                    <div 
                                        className={`h-full rounded-full ${user.progressColor}`} 
                                        style={{ width: `${user.activity}%` }}
                                    ></div>
                                </div>
                                <span className="hidden md:block text-[9px] font-bold text-slate-400 w-6 text-right">
                                    {user.activity}%
                                </span>
                            </div>
                        </div>

                        {/* Visit Count Badge */}
                        <div className="col-span-3 text-right">
                            <span className="text-xs font-bold text-slate-700 bg-white border border-gray-100 px-2 py-1 rounded-md shadow-sm group-hover:border-gray-300 transition-colors">
                                {user.visits}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
            
            {/* Footer Link */}
            <div className="mt-2 text-center pt-2 border-t border-gray-50">
                <span className="text-[10px] text-slate-400 cursor-pointer hover:text-brand-green font-bold transition-colors">
                    View All Users <i className="fa-solid fa-arrow-right ml-1"></i>
                </span>
            </div>
        </div>
    );
};

export default TopUsers;