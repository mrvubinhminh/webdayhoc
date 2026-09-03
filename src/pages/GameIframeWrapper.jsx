import React, { useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Maximize } from 'lucide-react';

const GameIframeWrapper = () => {
    const navigate = useNavigate();
    const { gameId } = useParams();
    const wrapperRef = useRef(null);
    const iframeRef = useRef(null);

    const gameUrls = {
        'chinh-phuc-dinh-cao': '/games/chinh-phuc-dinh-cao.html',
    'co-ca-ngua': '/games/co-ca-ngua.html',
        'hanh-tinh-xanh': '/games/hanh-tinh-xanh.html',
        'duong-dua-tri-thuc': '/games/duong-dua-tri-thuc.html',
        'hanh-trinh-giai-cuu': '/games/hanh-trinh-giai-cuu.html',
        'xay-dung-de-che': '/games/xay-dung-de-che.html',
        'chiem-linh-lanh-tho': '/games/chiem-linh-lanh-tho.html',
        'dai-chien-cau-tuyet': '/games/dai-chien-cau-tuyet.html',
        'dua-thuyen-toc-do': '/games/dua-thuyen-toc-do.html',
        'dua-xe-toc-do': '/games/dua-xe-toc-do.html',
        'mat-ma-da-vinci': '/games/mat-ma-da-vinci.html',
        'xay-cau-vuot-song': '/games/xay-cau-vuot-song.html',
        'alchemy-lab': '/games/alchemy-lab.html',
        'bong-ro': '/games/bong-ro.html',
        'space-defender': '/games/space-defender.html',
        'radar-sweeper': '/games/radar-sweeper.html'
    };

    const url = gameUrls[gameId];

    const toggleFullScreen = () => {
        if (!document.fullscreenElement) {
            wrapperRef.current.requestFullscreen().catch(err => {
                alert(`Lỗi khi mở toàn màn hình: ${err.message}`);
            });
        } else {
            document.exitFullscreen();
        }
    };

    const handleIframeLoad = () => {
        try {
            const iframeWindow = iframeRef.current.contentWindow;
            if (iframeWindow) {
                // Ghi đè hàm goHome và returnToMenu của iframe HTML
                iframeWindow.goHome = function() {
                    window.parent.postMessage('EXIT_GAME', '*');
                };
                iframeWindow.returnToMenu = function() {
                    window.parent.postMessage('EXIT_GAME', '*');
                };
            }
        } catch (e) {
            console.log("Cannot inject script into iframe", e);
        }
    };

    useEffect(() => {
        const handleMessage = (e) => {
            if (e.data === 'EXIT_GAME') {
                if (document.fullscreenElement) {
                    document.exitFullscreen();
                }
                navigate('/games');
            }
        };
        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [navigate]);

    if (!url) {
        return <div className="text-white text-center mt-20">Trò chơi không tồn tại!</div>;
    }

    return (
        <div ref={wrapperRef} className="w-full h-screen bg-[#111] flex flex-col">
            <header className="h-[60px] bg-gray-900 flex items-center justify-between px-4 border-b border-gray-800 shrink-0">
                <button 
                    onClick={() => {
                        if (document.fullscreenElement) document.exitFullscreen();
                        navigate('/games');
                    }}
                    className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors font-bold"
                >
                    <ArrowLeft className="w-5 h-5" /> Về Kho Trò Chơi
                </button>
                <button 
                    onClick={toggleFullScreen}
                    className="flex items-center gap-2 bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white px-4 py-2 rounded-lg transition-colors font-bold"
                >
                    <Maximize className="w-4 h-4" /> Toàn Màn Hình
                </button>
            </header>
            <div className="flex-1 w-full h-full relative">
                <iframe 
                    ref={iframeRef}
                    onLoad={handleIframeLoad}
                    src={url}
                    className="w-full h-full border-0 block"
                    title={gameId}
                    allow="autoplay; fullscreen"
                />
            </div>
        </div>
    );
};

export default GameIframeWrapper;
