import React from 'react';

const TopUsers = ({ users = [] }) => {
    // Transform API data to Component format
    // Data check: If no users provided (loading or empty), default to empty list
    const usersData = (users || []).map((u, index) => ({
        id: index + 1,
        name: u.NGUOI_DUNG?.Username || 'Unknown',
        initials: (u.NGUOI_DUNG?.Username || '?').substring(0, 2).toUpperCase(),
        visits: Math.floor(Math.random() * 100) + 10, // Mock 
        activity: Math.floor(Math.random() * 100),    // Mock
        color: index % 3 === 0 ? 'bg-brand-light text-brand-green border-brand-green/20' :
            index % 3 === 1 ? 'bg-orange-50 text-orange-500 border-orange-200' :
                'bg-teal-50 text-teal-500 border-teal-200',
        progressColor: index % 3 === 0 ? 'bg-[#5e5ce6]' :
            index % 3 === 1 ? 'bg-[#ff6b6b]' :
                'bg-[#37bb98]'
    }));

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