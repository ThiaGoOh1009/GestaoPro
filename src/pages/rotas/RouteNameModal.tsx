import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/Modal';
import { InputField } from '../../components/Generic';

interface RouteNameModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (name: string) => void;
}

export const RouteNameModal: React.FC<RouteNameModalProps> = ({ isOpen, onClose, onSave }) => {
    const [routeName, setRouteName] = useState('Rota Personalizada');

    useEffect(() => {
        if (isOpen) {
            // Reset to default when modal opens
            setRouteName('Rota Personalizada');
            // Auto-focus and select text for quick editing
            setTimeout(() => {
                const input = document.getElementById('routeName') as HTMLInputElement;
                input?.focus();
                input?.select();
            }, 100);
        }
    }, [isOpen]);

    const handleSave = () => {
        if (routeName.trim()) {
            onSave(routeName.trim());
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        handleSave();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Nome da Rota Agrupada" maxWidth="max-w-md" closeOnBackdropClick={false} closeOnEscape={false} showCloseButton={false}>
            <form onSubmit={handleSubmit} className="space-y-6">
                <p className="text-sm text-gray-400">
                    Por favor, insira um nome para a nova rota que agrupará todos os chamados selecionados.
                </p>
                <InputField
                    label="Nome da Rota"
                    id="routeName"
                    name="routeName"
                    value={routeName}
                    onChange={(e) => setRouteName(e.target.value)}
                    required
                />
                <div className="flex justify-end space-x-3 pt-6 border-t border-gray-700">
                    <button type="button" name="cancel" onClick={onClose} className="px-5 py-2 text-sm font-semibold text-gray-300 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors">
                        Cancelar
                    </button>
                    <button 
                        type="submit" 
                        name="saveRoute"
                        disabled={!routeName.trim()}
                        className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Salvar Rota
                    </button>
                </div>
            </form>
        </Modal>
    );
};