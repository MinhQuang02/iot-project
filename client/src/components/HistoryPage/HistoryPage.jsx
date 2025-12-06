import React, { useState, useMemo } from 'react';

const MOCK_DATA = Array.from({ length: 25 }, (_, i) => ({
    id: i + 1,
    username: i % 2 === 0 ? `User_Test_${i}` : `Mphanquang${i}`,
    date: `16 Nov, 2025 - 15:${10 + i}:00`,
    phone: `090-${100 + i}-${8888}`,
    status: i % 3 === 0 ? 'Closed' : 'Open', 
    verified: i % 4 !== 0, 
}));

const HistoryPage = () => {
    const [sessions, setSessions] = useState(MOCK_DATA);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const filteredSessions = useMemo(() => {
        return sessions.filter(item => 
            item.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.phone.includes(searchTerm)
        );
    }, [sessions, searchTerm]);

    const totalItems = filteredSessions.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredSessions.slice(indexOfFirstItem, indexOfLastItem);

    // Handlers
    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1);
    };

    const handleNextPage = () => {
        if (currentPage < totalPages) setCurrentPage(prev => prev + 1);
    };

    const handlePrevPage = () => {
        if (currentPage > 1) setCurrentPage(prev => prev - 1);
    };

    const handleDelete = (id) => {
        if (window.confirm('Are you sure you want to delete this session?')) {
            setSessions(prev => prev.filter(item => item.id !== id));
        }
    };

    const handleActionClick = (action) => {
        alert(`Action: ${action} triggered!`);
    };

    const getInitials = (name) => {
        return name ? name.charAt(0).toUpperCase() : '?';
    };

    return (
        <div className="flex-1 p-2 md:p-6 overflow-hidden flex flex-col h-full animate-[fadeIn_0.3s_ease-out]">
            
            <div className="bg-white rounded-xl md:rounded-[30px] shadow-sm border border-gray-100 flex-1 flex flex-col overflow-hidden">
                
                {/* --- TOOLBAR --- */}
                <div className="p-4 md:p-6 pb-4 border-b border-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-4 flex-shrink-0">
                    
                    {/* Left: Settings & Search */}
                    <div className="flex items-center gap-2 md:gap-4 w-full md:w-auto">
                        <button 
                            onClick={() => handleActionClick('Settings')}
                            className="p-2 text-slate-500 hover:text-brand-green hidden md:block transition-colors"
                        >
                            <i className="fa-solid fa-gear text-lg"></i>
                        </button>
                        <div className="relative flex-1 md:flex-none">
                            <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 mt-2.5 text-slate-400 text-sm"></i>
                            <input 
                                type="text" 
                                placeholder="Search username or ID users..." 
                                value={searchTerm}
                                onChange={handleSearch}
                                className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-brand-green w-full md:w-64 transition-all"
                            />
                        </div>
                    </div>

                    {/* Right: Pagination & Tools */}
                    <div className="flex items-center justify-between md:justify-end gap-4 md:gap-6 w-full md:w-auto overflow-x-auto">
                        
                        {/* Pagination Controls */}
                        <div className="flex items-center gap-4 text-xs text-slate-500 font-medium whitespace-nowrap">
                            <span>
                                {totalItems === 0 ? 0 : indexOfFirstItem + 1} - {Math.min(indexOfLastItem, totalItems)} of {totalItems}
                            </span>
                            <div className="flex gap-4">
                                <button 
                                    onClick={handlePrevPage} 
                                    disabled={currentPage === 1}
                                    className={`hover:text-brand-green transition-colors ${currentPage === 1 ? 'opacity-30 cursor-not-allowed' : ''}`}
                                >
                                    <i className="fa-solid fa-chevron-left"></i>
                                </button>
                                <button 
                                    onClick={handleNextPage} 
                                    disabled={currentPage === totalPages || totalItems === 0}
                                    className={`hover:text-brand-green transition-colors ${currentPage === totalPages || totalItems === 0 ? 'opacity-30 cursor-not-allowed' : ''}`}
                                >
                                    <i className="fa-solid fa-chevron-right"></i>
                                </button>
                            </div>
                        </div>
                        
                        <div className="hidden md:block h-4 w-px bg-gray-300"></div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-4 md:gap-5 text-slate-500">
                            <button onClick={() => handleActionClick('Filter')} className="hover:text-brand-green transition-colors" title="Filter"><i className="fa-solid fa-filter"></i></button>
                            <button onClick={() => handleActionClick('Print')} className="hover:text-brand-green hidden md:block transition-colors" title="Print"><i className="fa-solid fa-print"></i></button>
                            <button onClick={() => handleActionClick('Download')} className="hover:text-brand-green transition-colors" title="Export"><i className="fa-solid fa-download"></i></button>
                            <button onClick={() => handleActionClick('Fullscreen')} className="hover:text-brand-green hidden md:block transition-colors" title="Full Screen"><i className="fa-solid fa-expand"></i></button>
                        </div>
                    </div>
                </div>

                {/* --- TABLE CONTENT --- */}
                <div className="flex-1 overflow-y-auto custom-scroll px-0 md:px-6 pb-6">
                    <table className="w-full min-w-[800px] border-collapse">
                        <thead className="sticky top-0 bg-white z-10 shadow-sm md:shadow-none">
                            <tr className="text-left border-b border-gray-100">
                                <th className="py-4 pl-4 md:pl-0 font-bold text-xs text-slate-800 w-[30%] bg-white">User Sessions</th>
                                <th className="py-4 font-bold text-xs text-slate-800 w-[20%] bg-white">ID Users</th>
                                <th className="py-4 font-bold text-xs text-slate-800 w-[15%] bg-white">Snapshot</th>
                                <th className="py-4 font-bold text-xs text-slate-800 w-[15%] bg-white">Status</th>
                                <th className="py-4 pr-4 md:pr-0 font-bold text-xs text-slate-800 w-[20%] text-right bg-white">Actions</th>
                            </tr>
                        </thead>
                        
                        <tbody className="text-sm">
                            {currentItems.length > 0 ? (
                                currentItems.map((item) => (
                                    <tr key={item.id} className="border-b border-gray-50 hover:bg-emerald-50/30 transition-colors group">
                                        <td className="py-4 pl-4 md:pl-0">
                                            <div className="flex items-center gap-3">
                                                
                                                {/* --- AVATAR CHỮ CÁI ĐẦU --- */}
                                                <div className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center bg-brand-green/10 text-brand-green font-bold text-lg border border-brand-green/20">
                                                    {getInitials(item.username)}
                                                </div>

                                                <div className="flex flex-col">
                                                    <span className="font-bold text-slate-700">{item.username}</span>
                                                    <span className="text-[10px] text-slate-400">{item.date}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 text-slate-500 text-xs font-mono">{item.phone}</td>
                                        <td className={`py-4 text-xs font-bold cursor-pointer hover:underline ${item.status === 'Open' ? 'text-brand-green' : 'text-red-400'}`}>
                                            {item.status}
                                        </td>
                                        <td className="py-4">
                                            <span className={`text-[10px] font-bold px-3 py-1.5 rounded-md ${
                                                item.verified 
                                                ? 'bg-emerald-100 text-emerald-600' 
                                                : 'bg-gray-100 text-gray-500'
                                            }`}>
                                                {item.verified ? 'Verified' : 'Pending'}
                                            </span>
                                        </td>
                                        <td className="py-4 text-right pr-4 md:pr-0">
                                            {/* --- ACTIONS LUÔN HIỂN THỊ (Bỏ opacity-0) --- */}
                                            <div className="flex items-center justify-end gap-4 text-slate-400">
                                                <button onClick={() => handleActionClick(`Edit ID ${item.id}`)} className="hover:text-brand-green transition-colors"><i className="fa-solid fa-pen"></i></button>
                                                <button onClick={() => handleDelete(item.id)} className="hover:text-red-500 transition-colors"><i className="fa-regular fa-trash-can"></i></button>
                                                <button onClick={() => handleActionClick(`Share ID ${item.id}`)} className="hover:text-blue-500 transition-colors"><i className="fa-solid fa-share-nodes"></i></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="py-8 text-center text-slate-400 italic">
                                        No results found for "{searchTerm}"
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default HistoryPage;