import React from 'react';
import { Modal } from '../../components/Modal';

export const ConfirmacaoRotaModal = ({ isOpen, onClose, onAppend, onCreateNew, regions }) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Rota Existente Detectada" maxWidth="max-w-lg" closeOnBackdropClick={false} closeOnEscape={false} showCloseButton={false}>
            <div className="space-y-4">
                <p className="text-gray-300">
                    Já existe uma rota aberta para a(s) seguinte(s) região(ões):
                </p>
                <div className="flex flex-wrap gap-2 bg-gray-900/50 p-3 rounded-lg">
                    {regions.map(r => (
                        <span key={r} className="px-2.5 py-1 text-xs font-medium rounded-full bg-gray-700 text-gray-300">{r}</span>
                    ))}
                </div>
                <p className="text-gray-300 pt-2">
                    Você deseja adicionar os chamados selecionados a essa(s) rota(s) ou criar uma(s) nova(s) rota(s) separada(s)?
                </p>
            </div>
            <div className="flex justify-end space-x-3 pt-6 mt-4 border-t border-gray-700">
                <button type="button" name="cancel" onClick={onClose} className="px-5 py-2 text-sm font-semibold text-gray-300 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors">Cancelar</button>
                <button type="button" name="createNew" onClick={onCreateNew} className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-500 transition-colors">Criar Novas Rotas</button>
                <button type="button" name="addToExisting" onClick={onAppend} className="px-5 py-2 text-sm font-semibold text-white bg-green-600 rounded-lg hover:bg-green-500 transition-colors">Adicionar às Existentes</button>
            </div>
        </Modal>
    );
};