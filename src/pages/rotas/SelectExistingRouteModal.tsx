import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/Modal';

interface Rota {
    id: number;
    region: string;
    chamadoIds: number[];
    createdAt: string;
    status: string;
}

interface SelectExistingRouteModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (routeId: number) => void;
    openRoutes: Rota[];
}

export const SelectExistingRouteModal: React.FC<SelectExistingRouteModalProps> = ({ isOpen, onClose, onConfirm, openRoutes }) => {
    const [selectedRouteId, setSelectedRouteId] = useState<number | null>(null);

    useEffect(() => {
        if (!isOpen) {
            setSelectedRouteId(null);
        }
    }, [isOpen]);

    const handleConfirm = () => {
        if (selectedRouteId !== null) {
            onConfirm(selectedRouteId);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Adicionar a Rota Existente" maxWidth="max-w-lg">
            <div className="space-y-4">
                <p className="text-gray-300">Selecione uma das rotas abertas abaixo para adicionar os chamados.</p>
                <div className="max-h-60 overflow-y-auto space-y-2 pr-2 sidebar-scroll">
                    {openRoutes.length > 0 ? (
                        openRoutes.map(route => (
                            <label key={route.id} className={`flex items-center p-4 rounded-lg border-2 cursor-pointer transition-colors ${selectedRouteId === route.id ? 'bg-blue-900/50 border-blue-500' : 'bg-gray-700/50 border-transparent hover:border-gray-500'}`}>
                                <input
                                    type="radio"
                                    name="existing-route"
                                    value={route.id}
                                    checked={selectedRouteId === route.id}
                                    onChange={() => setSelectedRouteId(route.id)}
                                    className="h-4 w-4 text-blue-600 bg-gray-700 border-gray-600 focus:ring-blue-500"
                                />
                                <div className="ml-4">
                                    <p className="font-semibold text-white">{route.region}</p>
                                    <p className="text-sm text-gray-400">{route.chamadoIds.length} chamado(s) na rota</p>
                                </div>
                            </label>
                        ))
                    ) : (
                        <div className="text-center py-8 text-gray-500">Nenhuma rota aberta encontrada.</div>
                    )}
                </div>
            </div>
            <div className="flex justify-end space-x-3 pt-6 mt-4 border-t border-gray-700">
                <button type="button" onClick={onClose} className="px-5 py-2 text-sm font-semibold text-gray-300 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors">Cancelar</button>
                <button
                    type="button"
                    onClick={handleConfirm}
                    disabled={selectedRouteId === null}
                    className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-500 transition-colors disabled:opacity-50"
                >
                    Adicionar à Rota
                </button>
            </div>
        </Modal>
    );
};