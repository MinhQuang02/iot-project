import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const StatusCard = ({ icon, label, defaultStatus = false }) => {
    const [isOn, setIsOn] = useState(defaultStatus);
    const { user } = useAuth();
    const navigate = useNavigate();

    return (
        <div
            onClick={() => {
                if (!user) {
                    navigate('/login');
                    return;
                }
                setIsOn(!isOn);
            }}
            className={`
                rounded-3xl p-3 flex-1 min-w-[100px] flex flex-col justify-between cursor-pointer border transition-all duration-300
                ${isOn
                    ? 'bg-white border-emerald-200 shadow-sm'
                    : 'bg-white border-gray-100 hover:border-gray-200'
                }
            `}
        >
            <div className="flex justify-between items-start">
                <div className={`
                    w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-300
                    ${isOn ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-50 text-slate-300'}
                `}>
                    <i className={`${icon} text-sm`}></i>
                </div>

                <div className="flex items-center gap-1.5">
                    <span className={`text-[9px] font-bold ${isOn ? 'text-emerald-600' : 'text-gray-300'}`}>
                        {isOn ? 'ON' : 'OFF'}
                    </span>
                    <div className={`
                        w-7 h-3.5 rounded-full relative transition-colors duration-300
                        ${isOn ? 'bg-emerald-500' : 'bg-gray-200'}
                    `}>
                        <div className={`
                            absolute top-0.5 w-2.5 h-2.5 rounded-full shadow-sm transition-all duration-300 bg-white
                            ${isOn ? 'translate-x-[8px]' : 'translate-x-[2px]'} 
                        `}></div>
                    </div>
                </div>
            </div>
            <span className={`font-bold text-xs md:text-sm transition-colors ${isOn ? 'text-slate-700' : 'text-slate-400'}`}>
                {label}
            </span>
        </div>
    );
};

const TemperatureGauge = ({ value }) => {
    const radius = 60;
    const circumference = Math.PI * radius;
    const percentage = (value / 50);
    const strokeDashoffset = circumference * (1 - percentage);

    return (
        <div className="relative flex flex-col items-center justify-center w-full h-full animate-[fadeIn_0.5s_ease-out]">
            <div className="relative w-40 h-20 overflow-hidden mb-1">
                <svg className="w-full h-full transform scale-100 origin-bottom" viewBox="0 0 160 80">
                    <path d="M 20 80 A 60 60 0 0 1 140 80" fill="none" stroke="#f1f5f9" strokeWidth="10" strokeLinecap="round" />
                    <path
                        d="M 20 80 A 60 60 0 0 1 140 80"
                        fill="none" stroke="url(#tempGradient)" strokeWidth="10" strokeLinecap="round"
                        strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
                        className="transition-all duration-1000 ease-out"
                    />
                    <defs>
                        <linearGradient id="tempGradient">
                            <stop offset="0%" stopColor="#37bb98" />
                            <stop offset="100%" stopColor="#fbbf24" />
                        </linearGradient>
                    </defs>
                </svg>
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-2 h-2 bg-slate-700 rounded-full z-20 ring-2 ring-white"></div>
            </div>
            <div className="text-center -mt-1">
                <span className="text-3xl font-bold text-slate-800">{value}</span>
                <span className="text-xs font-bold text-slate-400 ml-0.5">°C</span>
            </div>
            <div className="w-40 flex justify-between px-4 mt-1 text-[10px] font-bold text-slate-300">
                <span>0°</span>
                <span>50°</span>
            </div>
        </div>
    );
};

const HumidityChart = ({ value }) => {
    const radius = 50;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (value / 100) * circumference;

    return (
        <div className="relative flex flex-col items-center justify-center w-full h-full animate-[fadeIn_0.5s_ease-out]">
            <div className="relative w-28 h-28">
                <svg className="w-full h-full transform -rotate-90">
                    <circle cx="56" cy="56" r={radius} stroke="#f1f5f9" strokeWidth="8" fill="none" />
                    <circle
                        cx="56" cy="56" r={radius} stroke="#3b82f6" strokeWidth="8" fill="none" strokeLinecap="round"
                        strokeDasharray={circumference} strokeDashoffset={offset}
                        className="transition-all duration-1000 ease-out"
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <i className="fa-solid fa-droplet text-blue-500 text-lg mb-0.5 animate-bounce"></i>
                    <span className="text-xl font-bold text-slate-800">{value}%</span>
                </div>
            </div>
            <p className="mt-2 text-xs font-bold text-slate-400">Moisture Level</p>
        </div>
    );
};

// --- MAIN COMPONENT ---
const Status = () => {
    const [viewMode, setViewMode] = useState('temp');
    const [activeModal, setActiveModal] = useState(null);

    const toggleModal = (modalName) => {
        if (activeModal === modalName) {
            setActiveModal(null);
        } else {
            setActiveModal(modalName);
        }
    };


    // --- REAL DATA INTEGRATION ---
    const [sensorData, setSensorData] = React.useState({ temperature: 0, humidity: 0 });

    React.useEffect(() => {
        // Poll sensor data every 5 seconds
        const fetchSensors = async () => {
            try {
                // Assuming you have an api instance exported from services/api
                // If not imported, we need to import it at the top. 
                // For now, I'll use fetch with the known URL, but using 'api' instance is better if available.
                const token = localStorage.getItem('access_token');
                if (!token) return;

                const response = await fetch('http://127.0.0.1:8000/api/device/sensors/', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (response.ok) {
                    const data = await response.json();
                    if (data.temperature !== null) {
                        setSensorData({
                            temperature: data.temperature || 0,
                            humidity: data.humidity || 0
                        });
                    }
                }
            } catch (error) {
                console.error("Sensor fetch error:", error);
            }
        };

        fetchSensors(); // Initial fetch
        const interval = setInterval(fetchSensors, 5000);
        return () => clearInterval(interval);
    }, []);

    const MonitorContent = () => (
        <>
            <div className="flex justify-between items-center flex-shrink-0 mb-1">
                <div className="flex items-center gap-2">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${viewMode === 'temp' ? 'bg-orange-50 text-orange-500' : 'bg-blue-50 text-blue-500'}`}>
                        <i className={`fa-solid ${viewMode === 'temp' ? 'fa-temperature-high' : 'fa-droplet'} text-xs`}></i>
                    </div>
                    <span className={`font-bold text-xs md:text-sm transition-colors ${viewMode === 'temp' ? 'text-orange-500' : 'text-blue-500'}`}>
                        {viewMode === 'temp' ? 'Temperature' : 'Humidity'}
                    </span>
                </div>

                <div className="bg-gray-100 p-0.5 rounded-lg flex items-center">
                    <button
                        onClick={() => setViewMode('temp')}
                        className={`px-2 py-1 rounded-md text-[9px] font-bold transition-all ${viewMode === 'temp' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-400'}`}
                    >
                        Temp
                    </button>
                    <button
                        onClick={() => setViewMode('humidity')}
                        className={`px-2 py-1 rounded-md text-[9px] font-bold transition-all ${viewMode === 'humidity' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-400'}`}
                    >
                        Humid
                    </button>
                </div>
            </div>

            <div className="flex-1 flex items-center justify-center min-h-0 overflow-hidden">
                {viewMode === 'temp' ? <TemperatureGauge value={sensorData.temperature} /> : <HumidityChart value={sensorData.humidity} />}
            </div>
        </>
    );

    return (
        <div className="flex-1 flex flex-col gap-3 min-h-0 w-full relative">

            {/* Header Section */}
            <div className="flex justify-between items-end flex-shrink-0">
                <h3 className="hidden md:block font-bold text-lg text-slate-700">My Greenhouse</h3>

                <div className="flex gap-2 w-full md:w-auto justify-end">
                    <span className="hidden md:flex bg-white px-2 py-1 rounded-lg text-[10px] font-bold text-slate-600 shadow-sm border border-slate-100 items-center">
                        <i className="fa-solid fa-droplet text-blue-500 mr-1"></i> {sensorData.humidity}%
                    </span>
                    <span className="hidden md:flex bg-white px-2 py-1 rounded-lg text-[10px] font-bold text-slate-600 shadow-sm border border-slate-100 items-center">
                        <i className="fa-solid fa-temperature-three-quarters text-orange-500 mr-1"></i> {sensorData.temperature}°C
                    </span>

                    <span className="hidden md:flex bg-white px-2 py-1 rounded-lg text-[10px] font-bold text-slate-600 shadow-sm border border-slate-100 items-center cursor-pointer hover:bg-gray-50">
                        All <i className="fa-solid fa-chevron-down ml-1 text-[8px] opacity-60"></i>
                    </span>
                </div>
            </div>

            {/* Content Grid (DESKTOP ONLY) */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3 min-h-0">

                {/* Desktop: Col 1 Status Cards */}
                <div className="hidden md:flex col-span-1 flex-col justify-between gap-3 h-full">
                    <StatusCard icon="fa-solid fa-bolt" label="Temperature" defaultStatus={true} />
                    <StatusCard icon="fa-solid fa-wind" label="Humidity" defaultStatus={false} />
                    <StatusCard icon="fa-solid fa-door-open" label="Door System" defaultStatus={false} />
                </div>

                {/* Desktop: Col 2 & 3 Main Display */}
                <div className="hidden md:flex col-span-1 md:col-span-2 bg-white rounded-[1.5rem] border border-gray-100 p-4 flex-col relative h-[240px] md:h-auto shadow-sm z-0">
                    <MonitorContent />
                </div>
            </div>


            {/* --- MOBILE FLOATING ACTION BUTTONS (FIXED POSITION) --- */}
            <div className="md:hidden fixed bottom-4 left-4 z-50 flex gap-4">

                {/* Button 1: Controls */}
                <button
                    onClick={() => toggleModal('controls')}
                    className={`
                        w-12 h-12 rounded-full shadow-lg shadow-emerald-100 flex items-center justify-center transition-all duration-300 active:scale-90
                        ${activeModal === 'controls' ? 'bg-slate-700 text-white rotate-90' : 'bg-emerald-500 text-white hover:bg-emerald-600'}
                    `}
                >
                    {activeModal === 'controls' ? <i className="fa-solid fa-xmark text-lg"></i> : <i className="fa-solid fa-sliders text-lg"></i>}
                </button>

                {/* Button 2: Monitor */}
                <button
                    onClick={() => toggleModal('monitor')}
                    className={`
                        w-12 h-12 rounded-full shadow-lg shadow-orange-100 flex items-center justify-center transition-all duration-300 active:scale-90
                        ${activeModal === 'monitor' ? 'bg-slate-700 text-white rotate-90' : 'bg-orange-500 text-white hover:bg-orange-600'}
                    `}
                >
                    {activeModal === 'monitor' ? <i className="fa-solid fa-xmark text-lg"></i> : <i className="fa-solid fa-chart-pie text-lg"></i>}
                </button>
            </div>

            {/* --- MODALS OVERLAY --- */}

            {/* 1. CONTROLS MODAL */}
            {activeModal === 'controls' && (
                <>
                    <div className="fixed inset-0 z-40 md:hidden bg-slate-900/10 backdrop-blur-[1px]" onClick={() => setActiveModal(null)}></div>
                    <div className="md:hidden fixed bottom-20 left-4 z-50 w-[260px] bg-white rounded-2xl p-4 shadow-2xl border border-gray-100 animate-[scaleIn_0.25s_ease-out_origin-bottom-left]">
                        <div className="flex justify-between items-center mb-3 pb-2 border-b border-gray-50">
                            <h4 className="font-bold text-slate-700 text-sm">Control Panel</h4>
                            <span className="text-[10px] bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded-full font-bold">Active</span>
                        </div>
                        <div className="flex flex-col gap-3">
                            <StatusCard icon="fa-solid fa-bolt" label="Temperature" defaultStatus={true} />
                            <StatusCard icon="fa-solid fa-wind" label="Humidity" defaultStatus={false} />
                            <StatusCard icon="fa-solid fa-door-open" label="Door System" defaultStatus={false} />
                        </div>
                        {/* Mũi tên */}
                        <div className="absolute -bottom-2 left-4 w-4 h-4 bg-white rotate-45 border-b border-r border-gray-100"></div>
                    </div>
                </>
            )}

            {/* 2. MONITOR MODAL */}
            {activeModal === 'monitor' && (
                <>
                    <div className="fixed inset-0 z-40 md:hidden bg-slate-900/10 backdrop-blur-[1px]" onClick={() => setActiveModal(null)}></div>
                    <div className="md:hidden fixed bottom-20 left-4 z-50 w-[300px] h-[300px] bg-white rounded-2xl p-4 shadow-2xl border border-gray-100 flex flex-col animate-[scaleIn_0.25s_ease-out_origin-bottom-left]">
                        <div className="flex justify-between items-center mb-2 pb-2 border-b border-gray-50">
                            <h4 className="font-bold text-slate-700 text-sm">Greenhouse Monitor</h4>
                            <span className="text-[10px] bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full font-bold">Live</span>
                        </div>

                        <MonitorContent />

                        <div className="absolute -bottom-2 left-[80px] w-4 h-4 bg-white rotate-45 border-b border-r border-gray-100"></div>
                    </div>
                </>
            )}

        </div>
    );
};

export default Status;