import React from 'react';
import { LandmarkIcon } from '../../components/Icons';

export const CaixaPage = () => {
    return (
        <div>
            <header className="mb-8">
                <h2 className="text-3xl font-bold text-white">Caixa</h2>
            </header>
             <div className="text-center py-12 bg-gray-800 rounded-lg">
                <LandmarkIcon className="mx-auto w-12 h-12 text-gray-500" />
                <h3 className="mt-4 text-lg font-medium text-white">Funcionalidade Movida</h3>
                <p className="mt-1 text-sm text-gray-400">
                    A funcionalidade de Caixa agora faz parte do novo módulo unificado "Financeiro".
                </p>
                 <p className="mt-1 text-sm text-gray-400">
                    Por favor, utilize a página "Financeiro" para visualizar todos os lançamentos.
                </p>
            </div>
        </div>
    );
};