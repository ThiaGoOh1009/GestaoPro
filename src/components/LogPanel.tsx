import React, { useState, useEffect, useRef } from 'react';
import { IconWrapper } from './Icons';

export const LogPanel = ({ isOpen, onClose, logs, onClear }) => {
    const scrollRef = useRef(null);
    const panelRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);
    const [position, setPosition] = useState({ x: window.innerWidth - 404, y: window.innerHeight - (window.innerHeight * 0.4) - 20 });
    const offsetRef = useRef({ x: 0, y: 0 });

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = 0;
        }
    }, [logs]);

    const handleMouseDown = (e) => {
        if (e.target.tagName === 'BUTTON' || e.target.closest('button')) return;
        setIsDragging(true);
        const panelRect = panelRef.current.getBoundingClientRect();
        offsetRef.current = {
            x: e.clientX - panelRect.left,
            y: e.clientY - panelRect.top,
        };
        e.preventDefault();
    };

    useEffect(() => {
        const handleMouseMove = (e) => {
            if (!isDragging) return;
            const panelWidth = panelRef.current?.offsetWidth || 0;
            const panelHeight = panelRef.current?.offsetHeight || 0;
            const newX = Math.max(0, Math.min(e.clientX - offsetRef.current.x, window.innerWidth - panelWidth));
            const newY = Math.max(0, Math.min(e.clientY - offsetRef.current.y, window.innerHeight - panelHeight));
            setPosition({ x: newX, y: newY });
        };

        const handleMouseUp = () => setIsDragging(false);

        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp, { once: true });
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging]);

    if (!isOpen) return null;

    return (
        <div
            ref={panelRef}
            className="fixed w-96 max-w-[90vw] bg-gray-800/80 backdrop-blur-sm border border-gray-700 rounded-lg shadow-2xl z-[100] flex flex-col max-h-[40vh]"
            style={{ top: `${position.y}px`, left: `${position.x}px` }}
        >
            <header
                className="flex-shrink-0 flex justify-between items-center p-3 border-b border-gray-700 cursor-move"
                onMouseDown={handleMouseDown}
                data-dev-id="LogPanel-header"
            >
                <h4 className="font-semibold text-sm text-white">Painel de Logs</h4>
                <div className="flex items-center space-x-2">
                    <button onClick={onClear} className="px-3 py-1 text-xs text-gray-300 bg-gray-700 hover:bg-gray-600 rounded transition-colors" aria-label="Limpar logs" data-dev-id="LogPanel-clear-button">Limpar</button>
                    <button onClick={onClose} className="p-1 text-gray-400 hover:text-white transition-colors" aria-label="Fechar painel" data-dev-id="LogPanel-close-button"><IconWrapper className="w-4 h-4"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></IconWrapper></button>
                </div>
            </header>
            <div ref={scrollRef} className="p-3 overflow-y-auto text-xs space-y-2" data-dev-id="LogPanel-content">
                {logs.length === 0 ? (<p className="text-gray-500 italic text-center py-4">Nenhuma ação registrada.</p>) : (
                    logs.map((log, index) => (
                        <div key={index} className="flex items-start bg-gray-900/50 p-2 rounded-md">
                            <span className="text-gray-500 mr-2 flex-shrink-0">[{log.timestamp.toLocaleTimeString()}]</span>
                            <p className="text-gray-300 break-words font-mono">{log.message}</p>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};