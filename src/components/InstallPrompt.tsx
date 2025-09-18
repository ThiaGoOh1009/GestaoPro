import React from 'react';
import { XIcon } from './Icons';

interface InstallPromptProps {
    onInstall: () => void;
    onDismiss: () => void;
}

export const InstallPrompt: React.FC<InstallPromptProps> = ({ onInstall, onDismiss }) => {
    return (
        <div className="install-prompt-banner fixed bottom-4 left-1/2 -translate-x-1/2 w-11/12 max-w-md bg-gray-800 border border-gray-700 rounded-xl shadow-2xl z-[200] p-4 flex items-center gap-4">
            <div className="flex-shrink-0 w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-2xl">🚀</span>
            </div>
            <div className="flex-grow">
                <h4 className="font-bold text-white">Instale o GestaoPro</h4>
                <p className="text-sm text-gray-300">Adicione à sua tela inicial para acesso rápido.</p>
            </div>
            <div className="flex items-center gap-2">
                 <button 
                    onClick={onInstall}
                    className="flex-shrink-0 px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-500 transition-colors"
                    aria-label="Instalar aplicativo"
                >
                    Instalar
                </button>
                 <button 
                    onClick={onDismiss}
                    className="flex-shrink-0 p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-full transition-colors"
                    aria-label="Dispensar"
                >
                    <XIcon className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
};
