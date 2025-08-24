import React from 'react';
import { Modal } from '../../components/Modal';
import { RouteIcon, PlusSquareIcon } from '../../components/Icons';

const GroupingIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M11 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"/>
        <path d="M11 5a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"/>
        <path d="M12 5v14"/>
        <path d="M5 12a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"/>
        <path d="M19 12a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"/>
        <path d="M5 12h14"/>
    </svg>
);


export const GroupingStrategyModal = ({ isOpen, onClose, onSeparateByRegion, onGroupAsSingle, onAddToExisting }) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Como Deseja Criar a Rota?" maxWidth="max-w-xl">
            <div className="space-y-6">
                <p className="text-gray-300 text-center">
                    Escolha como os chamados selecionados serão organizados.
                </p>
                <div className="space-y-4">
                    <button 
                        onClick={onSeparateByRegion}
                        className="w-full flex items-center text-left p-4 bg-gray-700/50 rounded-lg text-white hover:bg-gray-700 hover:ring-2 hover:ring-blue-500 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <RouteIcon className="w-8 h-8 mr-4 text-blue-400 flex-shrink-0"/>
                        <div>
                            <h3 className="font-semibold">Separar por Região (Padrão)</h3>
                            <p className="text-sm text-gray-400 mt-1">Cria uma rota para cada região dos chamados selecionados.</p>
                        </div>
                    </button>
                    <button
                        onClick={onGroupAsSingle}
                        className="w-full flex items-center text-left p-4 bg-gray-700/50 rounded-lg text-white hover:bg-gray-700 hover:ring-2 hover:ring-green-500 transition-all focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                        <GroupingIcon className="w-8 h-8 mr-4 text-green-400 flex-shrink-0" />
                        <div>
                            <h3 className="font-semibold">Agrupar em Rota Única</h3>
                            <p className="text-sm text-gray-400 mt-1">Junta todos os chamados em uma única rota personalizada.</p>
                        </div>
                    </button>
                    <button
                        onClick={onAddToExisting}
                        className="w-full flex items-center text-left p-4 bg-gray-700/50 rounded-lg text-white hover:bg-gray-700 hover:ring-2 hover:ring-purple-500 transition-all focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                        <PlusSquareIcon className="w-8 h-8 mr-4 text-purple-400 flex-shrink-0" />
                        <div>
                            <h3 className="font-semibold">Adicionar a Rota Existente</h3>
                            <p className="text-sm text-gray-400 mt-1">Anexa os chamados a uma rota que já está aberta.</p>
                        </div>
                    </button>
                </div>
            </div>
        </Modal>
    );
};