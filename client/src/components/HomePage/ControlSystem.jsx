import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const ControlSystem = () => {
    const [displayText, setDisplayText] = useState("Welcome to Greenhouse");
    const [inputValue, setInputValue] = useState("");
    const [isDoorOpen, setIsDoorOpen] = useState(true);
    const [isLightOn, setIsLightOn] = useState(true);

    const { user } = useAuth();
    const navigate = useNavigate();

    const today = new Date().toLocaleDateString('en-GB', {
        day: 'numeric', month: 'short', year: 'numeric'
    });

    const handleUpdateDisplay = () => {
        if (!user) {
            navigate('/login');
            return;
        }
        if (inputValue.trim() !== "") {
            setDisplayText(inputValue);
            setInputValue("");
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') handleUpdateDisplay();
    };

    const ToggleButton = ({ label, iconClass, isOn, onToggle }) => (
        <div
            className={`border transition-colors duration-300 rounded-2xl 
            p-5  /* <--- ĐÃ TĂNG TỪ p-3 LÊN p-5 ĐỂ CAO HƠN */
            flex flex-col 
            gap-3 /* <--- ĐÃ TĂNG TỪ gap-1.5 LÊN gap-3 CHO THOÁNG */
            cursor-pointer select-none ${isOn ? 'border-brand-green/30 bg-brand-light/20' : 'border-gray-200 hover:bg-gray-50'
                }`}
            onClick={onToggle}
        >
            <div className="flex justify-between items-start">
                <i className={`${iconClass} text-2xl /* <--- TĂNG TỪ text-xl LÊN text-2xl */ transition-colors ${isOn ? 'text-brand-green' : 'text-slate-400'}`}></i>

                <div className="flex items-center gap-1.5">
                    <span className={`text-[10px] font-bold transition-colors ${isOn ? 'text-brand-green' : 'text-slate-400'}`}>
                        {isOn ? 'ON' : 'OFF'}
                    </span>
                    <div className={`w-9 h-5 /* <--- TĂNG KÍCH THƯỚC NÚT GẠT CHÚT XÍU */ rounded-full relative transition-colors duration-300 ${isOn ? 'bg-brand-green/20' : 'bg-gray-200'}`}>
                        <div className={`absolute top-0.5 w-4 h-4 rounded-full shadow-sm transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${isOn
                            ? 'bg-brand-green left-[calc(100%-1.125rem)]'
                            : 'bg-white left-0.5'
                            }`}></div>
                    </div>
                </div>
            </div>
            <span className={`text-sm /* <--- TĂNG TỪ text-xs LÊN text-sm */ font-bold transition-colors ${isOn ? 'text-slate-700' : 'text-slate-400'}`}>
                {label}
            </span>
        </div>
    );

    return (
        <div className="bg-white rounded-3xl md:rounded-[2rem] p-5 border border-gray-100 shadow-sm shrink-0 w-full md:w-auto md:min-w-[320px] flex flex-col justify-between">

            {/* Header */}
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-lg text-slate-700">Control System</h3>
                <div className="flex items-center gap-2 bg-gray-50 px-2 py-1 rounded-lg border border-gray-100">
                    <span className="text-[10px] font-bold text-slate-500">{today}</span>
                    <i className="fa-regular fa-clock text-brand-green text-[10px]"></i>
                </div>
            </div>

            {/* Display Screen */}
            <div className="mb-4 group">
                <h4 className="font-bold text-xs text-slate-700 mb-2 flex items-center gap-2">
                    Displaying:
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                </h4>
                <div className="bg-brand-light/30 border border-brand-green/20 rounded-xl p-3 text-center min-h-[50px] flex items-center justify-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-brand-green/50 to-transparent opacity-50"></div>
                    <span className="text-brand-green font-bold text-sm break-words line-clamp-2 transition-all duration-300">
                        {displayText}
                    </span>
                </div>
            </div>

            {/* Change Display Input */}
            <div className="relative mb-5">
                <label className="absolute -top-2 left-3 bg-white px-1 text-[10px] font-bold text-brand-green z-10">
                    Change display
                </label>
                <div className="relative">
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Enter text..."
                        className="w-full border-2 border-brand-green/20 rounded-xl py-2.5 pl-4 pr-10 text-xs font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-brand-green transition-all"
                    />
                    <button
                        onClick={handleUpdateDisplay}
                        disabled={!inputValue.trim()}
                        className="absolute right-1.5 top-1/2 -translate-y-1/2 mt-3.5 bg-brand-green disabled:bg-gray-300 text-white rounded-full w-7 h-7 flex items-center justify-center hover:bg-emerald-600 transition-colors shadow-sm active:scale-95"
                    >
                        <i className="fa-solid fa-arrow-right text-[10px]"></i>
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-auto">
                <ToggleButton
                    label="Door System"
                    iconClass="fa-solid fa-door-open"
                    isOn={isDoorOpen}
                    onToggle={() => {
                        if (!user) return navigate('/login');
                        setIsDoorOpen(!isDoorOpen);
                    }}
                />

                <ToggleButton
                    label="Lights"
                    iconClass="fa-regular fa-lightbulb"
                    isOn={isLightOn}
                    onToggle={() => {
                        if (!user) return navigate('/login');
                        setIsLightOn(!isLightOn);
                    }}
                />
            </div>

        </div>
    );
};

export default ControlSystem;