import React, { useRef, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Maximize, RotateCcw } from 'lucide-react';

const ToolIframeWrapper = () => {
    const navigate = useNavigate();
    const { grade, id } = useParams();
    const wrapperRef = useRef(null);
    const iframeRef = useRef(null);
    const [key, setKey] = useState(0);

    const url = `/tools/${grade}/${encodeURIComponent(id)}.html`;

    const toggleFullScreen = () => {
        if (!document.fullscreenElement) {
            wrapperRef.current.requestFullscreen().catch(err => {
                alert(`Lỗi khi mở toàn màn hình: ${err.message}`);
            });
        } else {
            document.exitFullscreen();
        }
    };
    
    const refreshIframe = () => {
        setKey(prev => prev + 1);
    };

    return (
        <div ref={wrapperRef} className="w-full h-screen bg-[#111] flex flex-col">
            <header className="h-[60px] bg-gray-900 flex items-center justify-between px-4 border-b border-gray-800 shrink-0">
                <button 
                    onClick={() => {
                        if (document.fullscreenElement) document.exitFullscreen();
                        navigate('/models');
                    }}
                    className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors font-bold"
                >
                    <ArrowLeft className="w-5 h-5" /> Về Kho Công Cụ
                </button>
                <div className="flex gap-4 items-center">
                    <span className="text-emerald-500 font-bold hidden sm:inline">Công Cụ: {id.replace(/-/g, ' ').toUpperCase()}</span>
                    <button 
                        onClick={refreshIframe}
                        className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-3 py-2 rounded-lg transition-colors font-bold"
                        title="Tải lại công cụ"
                    >
                        <RotateCcw className="w-4 h-4" />
                    </button>
                    <button 
                        onClick={toggleFullScreen}
                        className="flex items-center gap-2 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white px-4 py-2 rounded-lg transition-colors font-bold"
                    >
                        <Maximize className="w-4 h-4" /> Toàn Màn Hình
                    </button>
                </div>
            </header>
            <div className="flex-1 w-full h-full relative bg-white">
                <iframe 
                    key={key}
                    ref={iframeRef}
                    src={url}
                    className="w-full h-full border-0 block"
                    title={`Model ${id}`}
                    allow="autoplay; fullscreen"
                />
            </div>
        </div>
    );
};

export default ToolIframeWrapper;
