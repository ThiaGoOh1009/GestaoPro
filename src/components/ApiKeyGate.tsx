import React, { useState } from 'react';
import { SpinnerIcon } from './Icons';

interface ApiKeyGateProps {
    onKeySubmit: (key: string) => void;
    error: string | null;
    loading: boolean;
}

export const ApiKeyGate: React.FC<ApiKeyGateProps> = ({ onKeySubmit, error, loading }) => {
    const [apiKey, setApiKey] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (apiKey.trim()) {
            onKeySubmit(apiKey.trim());
        }
    };

    return (
        <div className="flex items-center justify-center h-screen bg-gray-900 text-gray-200">
            <div className="w-full max-w-md p-8 space-y-8 bg-gray-800 rounded-2xl shadow-2xl">
                <div>
                    <h2 className="text-3xl font-bold text-center text-white">Configuração Necessária</h2>
                    <p className="mt-2 text-center text-sm text-gray-400">
                        Para utilizar os recursos de mapa, por favor, insira sua chave da API do Google Maps.
                    </p>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div>
                        <label htmlFor="google-maps-api-key" className="sr-only">Google Maps API Key</label>
                        <input
                            id="google-maps-api-key"
                            name="apiKey"
                            type="text"
                            autoComplete="off"
                            required
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Cole sua chave da API aqui"
                        />
                    </div>
                    
                    {error && (
                        <div className="p-3 bg-red-900/50 border border-red-700/50 rounded-lg">
                            <p className="text-sm text-red-300 text-center">{error}</p>
                        </div>
                    )}

                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-blue-500 disabled:bg-blue-800 disabled:cursor-wait"
                        >
                            {loading ? <SpinnerIcon className="w-5 h-5" /> : 'Continuar'}
                        </button>
                    </div>
                </form>
                <div className="text-xs text-gray-500 text-center pt-4 border-t border-gray-700">
                    <p>Sua chave de API é salva apenas no seu navegador para esta sessão e não é enviada para nossos servidores.</p>
                </div>
            </div>
        </div>
    );
};
