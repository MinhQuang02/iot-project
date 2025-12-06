import React, { useState, useMemo } from 'react';

// 1. Mock Data
const MOCK_MEMBERS = Array.from({ length: 35 }, (_, i) => ({
    id: i + 1,
    username: i === 0 ? 'mphanquang06' : `user_member_${i}`,
    fullName: i === 0 ? 'Quang Minh' : (i % 2 === 0 ? `Nguyen Van ${String.fromCharCode(65 + i % 26)}` : `Tran Thi ${String.fromCharCode(66 + i % 26)}`),
    role: i === 0 ? 'Administrator' : 'Member',
    phone: `09${i % 10}-${123 + i}-${456 + i}`,
    verified: i % 5 !== 0,
}));

const MembersPage = () => {
    // 2. State
    const [members, setMembers] = useState(MOCK_MEMBERS);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // 3. Filter Logic
    const filteredMembers = useMemo(() => {
        const term = searchTerm.toLowerCase();
        return members.filter(member => 
            member.username.toLowerCase().includes(term) ||
            member.fullName.toLowerCase().includes(term) ||
            member.phone.includes(term)
        );
    }, [members, searchTerm]);

    // 4. Pagination Logic
    const totalItems = filteredMembers.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredMembers.slice(indexOfFirstItem, indexOfLastItem);

    // Helpers
    const getInitials = (name) => name ? name.charAt(0).toUpperCase() : '?';

    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1);
    };

    const handleDelete = (id) => {
        if (window.confirm('Are you sure you want to remove this member?')) {
            setMembers(prev => prev.filter(m => m.id !== id));
        }
    };

    const handleAction = (action) => alert(`${action} clicked!`);

    return (
        <div className="flex-1 p-2 md:p-6 overflow-hidden flex flex-col h-full animate-[fadeIn_0.3s_ease-out]">
            <div className="bg-white rounded-xl md:rounded-[30px] shadow-sm border border-gray-100 flex-1 flex flex-col overflow-hidden">
                
                {/* --- TOOLBAR --- */}
                <div className="p-4 md:p-6 pb-4 border-b border-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-4 flex-shrink-0">
                    
                    {/* Left: View Mode & Search */}
                    <div className="flex items-center gap-2 md:gap-4 w-full md:w-auto">
                        <div className="flex bg-gray-100 rounded-lg p-1 flex-shrink-0">
                            <button className="p-2 rounded-md bg-white shadow-sm text-slate-700 transition-all"><i className="fa-solid fa-table-cells-large"></i></button>
                            <button className="p-2 rounded-md text-slate-400 hover:text-slate-600 transition-all"><i className="fa-solid fa-list"></i></button>
                        </div>
                        <div className="relative flex-1 md:flex-none">
                            <input 
                                type="text" 
                                placeholder="Search members..." 
                                value={searchTerm}
                                onChange={handleSearch}
                                className="pl-4 pr-10 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-brand-green w-full md:w-64 transition-all"
                            />
                            <i className="fa-solid fa-magnifying-glass absolute right-3 top-1/2 -translate-y-1/2 mt-0.5 text-slate-400 text-sm"></i>
                        </div>
                    </div>

                    {/* Center: Pagination (Desktop only) */}
                    <div className="hidden lg:flex items-center gap-2 text-sm text-slate-500">
                        <button 
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className={`flex items-center gap-1 hover:text-brand-green transition-colors ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            <i className="fa-solid fa-arrow-left text-xs"></i> Previous
                        </button>
                        
                        <div className="flex items-center gap-1 mx-2">
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                <button
                                    key={page}
                                    onClick={() => setCurrentPage(page)}
                                    className={`w-7 h-7 flex items-center justify-center rounded-md text-xs transition-colors ${
                                        currentPage === page 
                                        ? 'bg-brand-green text-white font-bold' 
                                        : 'hover:bg-gray-100 text-slate-600'
                                    }`}
                                >
                                    {page}
                                </button>
                            ))}
                        </div>

                        <button 
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className={`flex items-center gap-1 hover:text-brand-green transition-colors ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            Next <i className="fa-solid fa-arrow-right text-xs"></i>
                        </button>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center justify-between md:justify-end gap-4 w-full md:w-auto">
                        <div className="flex items-center gap-4">
                            <button onClick={() => handleAction('Print')} className="text-slate-400 hover:text-brand-green transition-colors"><i className="fa-solid fa-print"></i></button>
                            <button onClick={() => handleAction('Download')} className="text-slate-400 hover:text-brand-green transition-colors"><i className="fa-solid fa-download"></i></button>
                        </div>
                        <button 
                            onClick={() => handleAction('Add Member')}
                            className="bg-brand-green hover:bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors whitespace-nowrap shadow-md shadow-emerald-100"
                        >
                            New Member <i className="fa-solid fa-plus"></i>
                        </button>
                    </div>
                </div>

                {/* --- TABLE CONTENT --- */}
                <div className="flex-1 overflow-y-auto custom-scroll px-0 md:px-6 pb-6">
                    <table className="w-full min-w-[800px] border-collapse">
                        <thead className="sticky top-0 bg-white z-10 shadow-sm md:shadow-none">
                            <tr className="text-left border-b border-gray-100">
                                <th className="py-4 pl-4 md:pl-0 font-bold text-xs text-slate-800 w-[25%] bg-white">User Sessions</th>
                                <th className="py-4 font-bold text-xs text-slate-800 w-[20%] bg-white">Name</th>
                                <th className="py-4 font-bold text-xs text-slate-800 w-[20%] bg-white">ID Users</th>
                                <th className="py-4 font-bold text-xs text-slate-800 w-[15%] bg-white">Status</th>
                                <th className="py-4 pr-4 md:pr-0 font-bold text-xs text-slate-800 w-[20%] text-right bg-white">Actions</th>
                            </tr>
                        </thead>
                        
                        <tbody className="text-sm">
                            {currentItems.length > 0 ? (
                                currentItems.map((member) => (
                                    <tr key={member.id} className="border-b border-gray-50 hover:bg-emerald-50/30 transition-colors group">
                                        
                                        {/* User Info */}
                                        <td className="py-4 pl-4 md:pl-0">
                                            <div className="flex items-center gap-3">
                                                {/* Avatar Initials */}
                                                <div className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center bg-brand-green/10 text-brand-green font-bold text-lg border border-brand-green/20">
                                                    {getInitials(member.username)}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-slate-700">{member.username}</span>
                                                    <span className={`text-[10px] ${member.role === 'Administrator' ? 'text-brand-green font-bold' : 'text-slate-400'}`}>
                                                        {member.role}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Full Name */}
                                        <td className="py-4 font-medium text-slate-700">{member.fullName}</td>

                                        {/* ID / Phone */}
                                        <td className="py-4 text-slate-500 font-mono text-xs">{member.phone}</td>

                                        {/* Status */}
                                        <td className="py-4">
                                            <span className={`text-[10px] font-bold px-3 py-1.5 rounded-md ${
                                                member.verified 
                                                ? 'bg-emerald-100 text-emerald-600' 
                                                : 'bg-gray-100 text-gray-500'
                                            }`}>
                                                {member.verified ? 'Verified' : 'Pending'}
                                            </span>
                                        </td>

                                        {/* Actions */}
                                        <td className="py-4 text-right pr-4 md:pr-0">
                                            <div className="flex items-center justify-end gap-3 text-slate-400">
                                                <button onClick={() => handleAction(`Edit ${member.id}`)} className="hover:text-brand-green transition-colors"><i className="fa-solid fa-pen"></i></button>
                                                <button onClick={() => handleDelete(member.id)} className="hover:text-red-500 transition-colors"><i className="fa-regular fa-trash-can"></i></button>
                                                <button onClick={() => handleAction(`Share ${member.id}`)} className="hover:text-blue-500 transition-colors"><i className="fa-solid fa-share-nodes"></i></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="py-8 text-center text-slate-400 italic">
                                        No members found matching "{searchTerm}"
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

export default MembersPage;