import React, { useState, useMemo, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import { useAuth } from '../../context/AuthContext';

const MembersPage = () => {
    const { user } = useAuth();
    // 2. State
    const [members, setMembers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newMemberUsername, setNewMemberUsername] = useState('');

    const itemsPerPage = 10;
    const isAdmin = user?.QuyenHan === 'admin';

    const fetchMembers = async () => {
        try {
            const res = await axiosClient.get('/data/members/');
            if (res.data) {
                const formatted = res.data.map(m => ({
                    id: m.MaTV,
                    username: m.NGUOI_DUNG?.Username || 'N/A',
                    fullName: `${m.NGUOI_DUNG?.TenND || ''} ${m.NGUOI_DUNG?.HoND || ''}`.trim(),
                    role: m.NGUOI_DUNG?.QuyenHan === 'admin' ? 'Administrator' : 'Member',
                    numberID: m.NGUOI_DUNG?.Email || 'Card not yet registered',
                    verified: m.TrangThai
                }));
                setMembers(formatted);
            }
        } catch (err) {
            console.error("Failed to fetch members", err);
        }
    };

    useEffect(() => {
        fetchMembers();
    }, []);


    // 3. Filter Logic
    const filteredMembers = useMemo(() => {
        const term = searchTerm.toLowerCase();
        return members.filter(member =>
            member.username.toLowerCase().includes(term) ||
            member.fullName.toLowerCase().includes(term) ||
            (member.numberID && member.numberID.toString().includes(term))
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

    const handleDelete = async (id) => {
        if (!isAdmin) {
            alert("You do not have permission to delete members.");
            return;
        }
        if (window.confirm('Are you sure you want to remove this member?')) {
            try {
                await axiosClient.delete(`/data/members/${id}/`);
                setMembers(prev => prev.filter(m => m.id !== id));
            } catch (error) {
                alert("Failed to delete member: " + (error.response?.data?.error || error.message));
            }
        }
    };

    const handleEdit = async (member) => {
        if (!isAdmin) {
            alert("You do not have permission to edit members.");
            return;
        }
        // Admin edits status: Pending -> Verified
        // Toggle logic or just verify?
        // Prompt says "The admin's edit button changes a user's status from pending to verified."
        // I will assume it creates a toggle or simply sets to True.

        if (member.verified) {
            if (!window.confirm("User is already verified. Do you want to set status back to Pending?")) return;
        }

        const newStatus = !member.verified;
        try {
            await axiosClient.put(`/data/members/${member.id}/`, { TrangThai: newStatus });
            alert(`Member status updated to ${newStatus ? 'Verified' : 'Pending'}`);
            fetchMembers();
        } catch (error) {
            alert("Failed to update status: " + (error.response?.data?.error || error.message));
        }
    };

    const handleShare = (idStr) => {
        navigator.clipboard.writeText(idStr);
        alert("ID copied to clipboard!");
    };

    const handleAction = (action) => {
        if (action === 'Print') {
            window.print();
        } else if (action === 'Download') {
            // Download JSON
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(members));
            const downloadAnchorNode = document.createElement('a');
            downloadAnchorNode.setAttribute("href", dataStr);
            downloadAnchorNode.setAttribute("download", "members_data.json");
            document.body.appendChild(downloadAnchorNode);
            downloadAnchorNode.click();
            downloadAnchorNode.remove();
        } else if (action === 'Add Member') {
            setShowAddModal(true);
        }
    };

    const submitAddMember = async () => {
        if (!newMemberUsername.trim()) return;
        try {
            await axiosClient.post('/data/members/', { username: newMemberUsername });
            alert("Member request submitted successfully!");
            setShowAddModal(false);
            setNewMemberUsername('');
            fetchMembers();
        } catch (error) {
            alert("Failed to add member: " + (error.response?.data?.error || error.message));
        }
    };

    return (
        <div className="flex-1 p-2 md:p-6 overflow-hidden flex flex-col h-full animate-[fadeIn_0.3s_ease-out] relative">
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
                            {/* Simplified Pagination for space */}
                            <span className="font-bold text-slate-700">{currentPage}</span> / {totalPages || 1}
                        </div>

                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages || totalPages === 0}
                            className={`flex items-center gap-1 hover:text-brand-green transition-colors ${currentPage === totalPages || totalPages === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            Next <i className="fa-solid fa-arrow-right text-xs"></i>
                        </button>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center justify-between md:justify-end gap-4 w-full md:w-auto">
                        <div className="flex items-center gap-4">
                            <button onClick={() => handleAction('Print')} className="text-slate-400 hover:text-brand-green transition-colors" title="Print"><i className="fa-solid fa-print"></i></button>
                            <button onClick={() => handleAction('Download')} className="text-slate-400 hover:text-brand-green transition-colors" title="Download JSON"><i className="fa-solid fa-download"></i></button>
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
                                <th className="py-4 font-bold text-xs text-slate-800 w-[20%] bg-white">Email</th>
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

                                        {/* ID / numberID */}
                                        <td className="py-4 text-slate-500 font-mono text-xs">{member.numberID}</td>

                                        {/* Status */}
                                        <td className="py-4">
                                            <span className={`text-[10px] font-bold px-3 py-1.5 rounded-md ${member.verified
                                                ? 'bg-emerald-100 text-emerald-600'
                                                : 'bg-gray-100 text-gray-500'
                                                }`}>
                                                {member.verified ? 'Verified' : 'Pending'}
                                            </span>
                                        </td>

                                        {/* Actions */}
                                        <td className="py-4 text-right pr-4 md:pr-0">
                                            <div className="flex items-center justify-end gap-3 text-slate-400">
                                                <button onClick={() => handleEdit(member)} className="hover:text-brand-green transition-colors"><i className="fa-solid fa-pen"></i></button>
                                                <button onClick={() => handleDelete(member.id)} className="hover:text-red-500 transition-colors"><i className="fa-regular fa-trash-can"></i></button>
                                                <button onClick={() => handleShare(member.numberID || member.username)} className="hover:text-blue-500 transition-colors"><i className="fa-solid fa-share-nodes"></i></button>
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

            {/* --- ADD MEMBER MODAL --- */}
            {showAddModal && (
                <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 flex flex-col gap-4">
                        <h3 className="text-lg font-bold text-slate-800">Add New Member</h3>
                        <p className="text-sm text-slate-500">Enter the User ID (Username) to add them to the member list.</p>

                        <input
                            type="text"
                            className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-brand-green"
                            placeholder="Username"
                            value={newMemberUsername}
                            onChange={(e) => setNewMemberUsername(e.target.value)}
                        />

                        <div className="flex justify-end gap-3 mt-2">
                            <button
                                onClick={() => { setShowAddModal(false); setNewMemberUsername(''); }}
                                className="px-4 py-2 rounded-lg text-sm font-bold text-slate-500 hover:bg-gray-100 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={submitAddMember}
                                className="px-4 py-2 rounded-lg text-sm font-bold bg-brand-green text-white hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-200"
                            >
                                Submit Request
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MembersPage;