import React, { useState, useMemo, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import { useAuth } from '../../context/AuthContext';

const HistoryRow = ({ item, onStatusClick, onDelete, onEdit, onShare, isAdmin }) => {
    const [fetchedUsername, setFetchedUsername] = useState('Loading...');

    useEffect(() => {
        const fetchUsername = async () => {
            try {
                // item.phone holds MaID as strings, or we pass raw MaID
                const res = await axiosClient.get(`/data/user-by-maid/${item.rawMaID}/`);
                if (res.data && res.data.Username) {
                    setFetchedUsername(res.data.Username);
                } else {
                    setFetchedUsername(`Unknown (${item.rawMaID})`);
                }
            } catch (err) {
                console.error("Failed to fetch user", err);
                setFetchedUsername(`Unverified (${item.id})`);
            }
        };
        if (item.rawMaID) {
            fetchUsername();
        }
    }, [item.rawMaID]);

    return (
        <tr className="border-b border-gray-50 hover:bg-emerald-50/30 transition-colors group">
            <td className="py-4 pl-4 md:pl-0">
                <div className="flex items-center gap-3">
                    {/* AVATAR */}
                    <div className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center bg-brand-green/10 text-brand-green font-bold text-sm border border-brand-green/20">
                        {item.avatarChars}
                    </div>
                    <div className="flex flex-col">
                        {/* Display fetched username */}
                        <span className="font-bold text-slate-700">{fetchedUsername}</span>
                        <span className="text-[10px] text-slate-400">{item.date}</span>
                    </div>
                </div>
            </td>
            <td className="py-4 text-slate-500 text-xs font-mono">{item.rawMaID}</td>
            <td className="py-4 cursor-pointer" onClick={() => onStatusClick(item)}>
                {/* Snapshot Column: "Open" / "Closed" */}
                <span className={`text-[10px] font-bold px-3 py-1.5 rounded-md hover:opacity-80 transition-opacity ${item.rawTrangThaiAnh ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'
                    }`}>
                    {item.rawTrangThaiAnh ? 'Open' : 'Closed'}
                </span>
            </td>
            <td className="py-4">
                {/* Status Column: Accepted(0) / Failed(1) */}
                <span className={`text-xs font-bold transition-colors ${item.rawTrangThai ? 'text-brand-green' : 'text-red-500'
                    }`}>
                    {item.rawTrangThai ? 'Accepted' : 'Failed'}
                </span>
            </td>
            <td className="py-4 text-right pr-4 md:pr-0">
                <div className="flex items-center justify-end gap-4 text-slate-400">
                    <button onClick={() => onEdit(item)} className="hover:text-brand-green transition-colors"><i className="fa-solid fa-pen"></i></button>
                    <button onClick={() => onDelete(item.id)} className="hover:text-red-500 transition-colors"><i className="fa-regular fa-trash-can"></i></button>
                    <button onClick={() => onShare(item.id)} className="hover:text-blue-500 transition-colors"><i className="fa-solid fa-share-nodes"></i></button>
                </div>
            </td>
        </tr>
    );
};

const HistoryPage = () => {
    const { user } = useAuth(); // Auth Context
    const [sessions, setSessions] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [showImageModal, setShowImageModal] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);

    const itemsPerPage = 10;

    const isAdmin = user?.QuyenHan === 'admin';

    const fetchHistory = async () => {
        try {
            const res = await axiosClient.get('/data/history/');
            if (res.data) {
                const formatted = res.data.map((item) => ({
                    id: item.MaLS,
                    rawMaID: item.MaID,
                    username: `Session: ${item.MaLS}`,
                    avatarChars: `S${item.MaLS % 10}${String.fromCharCode(65 + (item.MaLS % 26))}`,
                    date: new Date(item.ThoiDiemVao).toLocaleString(),
                    rawTrangThaiAnh: item.TrangThaiAnh,
                    rawTrangThai: item.TrangThai,
                    image: item.AnhXacMinh || 'https://via.placeholder.com/600x400?text=No+Image'
                }));
                setSessions(formatted);
            }
        } catch (err) {
            console.error("Failed to fetch history", err);
        }
    };

    useEffect(() => {
        fetchHistory();
    }, []);

    // Filter Logic
    const filteredSessions = useMemo(() => {
        const term = searchTerm.toLowerCase();
        return sessions.filter(item =>
            (item.rawMaID && item.rawMaID.toString().includes(term)) ||
            item.id.toString().includes(term)
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

    const handleDelete = async (id) => {
        if (!isAdmin) {
            alert("You do not have permission to edit");
            return;
        }
        if (window.confirm('Are you sure you want to delete this session?')) {
            try {
                await axiosClient.delete(`/data/history/${id}/`);
                setSessions(prev => prev.filter(item => item.id !== id));
            } catch (error) {
                alert("Failed to delete: " + error.message);
            }
        }
    };

    const handleEdit = async (item) => {
        if (!isAdmin) {
            alert("You do not have permission to edit");
            return;
        }
        // "Edit button should allow you to modify the session ID with some basic information"
        // I will prompt for 'MaID' update as a basic info.
        const newMaID = prompt("Enter new User ID (MaID) for this session:", item.rawMaID);
        if (newMaID !== null && newMaID !== String(item.rawMaID)) {
            try {
                await axiosClient.put(`/data/history/${item.id}/`, { MaID: parseInt(newMaID) });
                alert("Updated successfully");
                fetchHistory(); // Refresh to show changes (especially if username assumes change)
            } catch (error) {
                const errorMsg = error.response?.data?.error || error.message;
                alert("Failed to update: " + errorMsg);
            }
        }
    };

    const handleShare = (id) => {
        navigator.clipboard.writeText(id.toString());
        alert("Session ID copied to clipboard!");
    };

    const handleActionClick = (action) => {
        if (action === 'Filter') {
            setShowFilterOptions(!showFilterOptions);
        } else if (action === 'Download') {
            // Download JSON
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(sessions));
            const downloadAnchorNode = document.createElement('a');
            downloadAnchorNode.setAttribute("href", dataStr);
            downloadAnchorNode.setAttribute("download", "history_data.json");
            document.body.appendChild(downloadAnchorNode);
            downloadAnchorNode.click();
            downloadAnchorNode.remove();
        } else if (action === 'Print') {
            window.print();
        } else if (action === 'Fullscreen') {
            // "temporarily displays nothing when pressed"
        } else {
            // Settings, etc.
        }
    };

    const handleStatusClick = (session) => {
        setSelectedImage(session.image);
        setShowImageModal(true);
    };

    const closeImageModal = () => {
        setShowImageModal(false);
        setSelectedImage(null);
    };

    return (
        <div className="flex-1 p-2 md:p-6 overflow-hidden flex flex-col h-full animate-[fadeIn_0.3s_ease-out] relative">

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
                                placeholder="Search Session ID..."
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
                        <div className="flex items-center gap-4 md:gap-5 text-slate-500 relative">

                            {/* Filter Dropdown */}
                            <div className="relative">
                                <button onClick={() => handleActionClick('Filter')} className={`hover:text-brand-green transition-colors`} title="Filter"><i className="fa-solid fa-filter"></i></button>
                            </div>
                            <button onClick={() => handleActionClick('Print')} className="hover:text-brand-green hidden md:block transition-colors" title="Print"><i className="fa-solid fa-print"></i></button>
                            <button onClick={() => handleActionClick('Download')} className="hover:text-brand-green transition-colors" title="Download JSON"><i className="fa-solid fa-download"></i></button>
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
                                <th className="py-4 font-bold text-xs text-slate-800 w-[20%] bg-white">ID Numbers</th>
                                <th className="py-4 font-bold text-xs text-slate-800 w-[15%] bg-white">Snapshot</th>
                                <th className="py-4 font-bold text-xs text-slate-800 w-[15%] bg-white">Status</th>
                                <th className="py-4 pr-4 md:pr-0 font-bold text-xs text-slate-800 w-[20%] text-right bg-white">Actions</th>
                            </tr>
                        </thead>

                        <tbody className="text-sm">
                            {currentItems.length > 0 ? (
                                currentItems.map((item) => (
                                    <HistoryRow
                                        key={item.id}
                                        item={item}
                                        onStatusClick={handleStatusClick}
                                        onDelete={handleDelete}
                                        onEdit={handleEdit}
                                        onShare={handleShare}
                                        isAdmin={isAdmin}
                                    />
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

            {/* --- IMAGE VERIFICATION MODAL --- */}
            {showImageModal && (
                <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
                    <div className="bg-white rounded-2xl shadow-2xl overflow-hidden max-w-2xl w-full flex flex-col max-h-[90%]">
                        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h3 className="font-bold text-slate-700">Verification Image</h3>
                            <button onClick={closeImageModal} className="w-8 h-8 rounded-full bg-gray-200 hover:bg-red-100 hover:text-red-500 flex items-center justify-center transition-colors">
                                <i className="fa-solid fa-xmark"></i>
                            </button>
                        </div>
                        <div className="p-4 flex-1 bg-black flex items-center justify-center overflow-hidden">
                            <img src={selectedImage} alt="Verification" className="max-w-full max-h-[60vh] object-contain rounded-lg" />
                        </div>
                        <div className="p-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50">
                            <button onClick={closeImageModal} className="px-4 py-2 rounded-lg text-sm font-bold text-slate-500 hover:bg-gray-200 transition-colors">Close</button>
                            <a href={selectedImage} download="verification_image.jpg" target="_blank" rel="noreferrer" className="px-4 py-2 rounded-lg text-sm font-bold bg-brand-green text-white hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-200">
                                Download High Res
                            </a>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HistoryPage;