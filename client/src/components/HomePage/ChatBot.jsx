import React, { useState, useEffect, useRef } from 'react';

const ChatBot = () => {
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const [isOpen, setIsOpen] = useState(false);
    const [inputValue, setInputValue] = useState("");
    const [messages, setMessages] = useState([
        {
            id: 1,
            text: "I'm doing well, thank you! How can I help you today?",
            sender: 'bot',
            time: '08:16 AM'
        }
    ]);

    const messagesEndRef = useRef(null);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768);
            if (window.innerWidth >= 768) setIsOpen(false);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isOpen]);

    const handleSend = async () => {
        if (!inputValue.trim()) return;

        const userText = inputValue;
        const msgId = Date.now();
        const newMessage = {
            id: msgId,
            text: userText,
            sender: 'user',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        setMessages((prev) => [...prev, newMessage]);
        setInputValue("");

        try {
            // Using fetch to call the Django Backend
            const response = await fetch('http://127.0.0.1:8000/api/chat/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message: userText }),
            });

            const data = await response.json();

            if (response.ok) {
                const botReply = {
                    id: Date.now() + 1,
                    text: data.reply || "I didn't get a response.",
                    sender: 'bot',
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                };
                setMessages((prev) => [...prev, botReply]);
            } else {
                throw new Error(data.message || 'Error communicating with server');
            }
        } catch (error) {
            console.error("Chat Error:", error);
            const errorReply = {
                id: Date.now() + 1,
                text: "Sorry, I'm having trouble connecting to the server.",
                sender: 'bot',
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
            setMessages((prev) => [...prev, errorReply]);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') handleSend();
    };

    // Refactor: Converted from Component to Render Function to prevent focus loss
    const renderChatContent = () => (
        <>
            {/* Header */}
            <div className="bg-brand-green p-4 flex justify-between items-center shrink-0">
                <h3 className="font-bold text-white/90">Chatbot</h3>
                <div className="flex items-center gap-3">
                    <i className="fa-solid fa-robot text-white text-lg"></i>
                    {isMobile && (
                        <button onClick={() => setIsOpen(false)} className="text-white hover:text-gray-200">
                            <i className="fa-solid fa-xmark text-xl"></i>
                        </button>
                    )}
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 p-4 overflow-y-auto custom-scroll bg-white flex flex-col gap-4">
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex gap-3 items-start ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}>

                        {/* Avatar */}
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.sender === 'bot' ? 'bg-blue-100' : 'bg-brand-light'
                            }`}>
                            <i className={`fa-solid ${msg.sender === 'bot' ? 'fa-headset text-brand-green' : 'fa-user text-slate-600'} text-sm`}></i>
                        </div>

                        {/* Message Bubble */}
                        <div className={`max-w-[75%]`}>
                            <span className={`text-xs font-bold text-slate-700 block mb-1 ${msg.sender === 'user' ? 'text-right' : 'text-left'}`}>
                                {msg.sender === 'bot' ? 'Assistant' : 'You'}
                            </span>
                            <div className={`p-3 text-sm text-slate-700 shadow-sm ${msg.sender === 'bot'
                                ? 'bg-brand-light rounded-r-xl rounded-bl-xl'
                                : 'bg-white border border-gray-100 rounded-l-xl rounded-br-xl'
                                }`}>
                                {msg.text}
                            </div>
                            <span className={`text-[10px] text-slate-400 block mt-1 ${msg.sender === 'user' ? 'text-left' : 'text-right'}`}>
                                {msg.time}
                            </span>
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-3 border-t border-gray-100 flex items-center gap-3 shrink-0 bg-white">
                <i className="fa-solid fa-paperclip text-slate-400 cursor-pointer hover:text-brand-green"></i>
                <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Reply..."
                    className="flex-1 bg-transparent text-sm focus:outline-none placeholder-slate-400"
                />
                <i className="fa-regular fa-image text-slate-400 text-sm cursor-pointer hover:text-brand-green"></i>
                <button
                    onClick={handleSend}
                    className="bg-brand-green w-8 h-8 rounded-full flex items-center justify-center text-white hover:bg-brand-dark transition-colors transform active:scale-90"
                >
                    <i className="fa-solid fa-paper-plane text-xs"></i>
                </button>
            </div>
        </>
    );

    if (isMobile) {
        return (
            <>
                {/* Floating Button */}
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-brand-green text-white shadow-lg flex items-center justify-center transition-transform hover:scale-110 active:scale-95 ${isOpen ? 'rotate-90 opacity-0 pointer-events-none' : 'rotate-0 opacity-100'}`}
                >
                    <i className="fa-solid fa-robot text-2xl"></i>
                </button>

                {/* Mobile Modal Chat Window */}
                <div className={`fixed bottom-6 right-6 z-50 w-[90%] max-w-[350px] h-[450px] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300 origin-bottom-right ${isOpen ? 'scale-100 opacity-100 translate-y-0' : 'scale-0 opacity-0 translate-y-10 pointer-events-none'
                    }`}>
                    {renderChatContent()}
                </div>

                {isOpen && (
                    <div onClick={() => setIsOpen(false)} className="fixed inset-0 bg-black/20 z-40 backdrop-blur-[1px]"></div>
                )}
            </>
        );
    }

    return (
        <div className="bg-white rounded-3xl md:rounded-[2rem] border border-gray-100 shadow-sm flex-1 flex flex-col overflow-hidden min-h-[250px] w-full">
            {renderChatContent()}
        </div>
    );
};

export default ChatBot;