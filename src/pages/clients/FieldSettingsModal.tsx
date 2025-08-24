import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/Modal';
import { Switch } from '../../components/Generic';
import { SettingsIcon } from '../../components/Icons';

export const FieldSettingsModal = ({ isOpen, onClose, onSave, initialSettings }) => {
    const [settings, setSettings] = useState(initialSettings);
    useEffect(() => { if (isOpen) setSettings(initialSettings); }, [isOpen, initialSettings]);
    
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Configuração de Campos" maxWidth="max-w-md">
            <div className="space-y-4">
                <div className="flex items-start bg-gray-900/50 p-4 rounded-lg"><SettingsIcon className="w-6 h-6 text-gray-400 mr-4 mt-1 flex-shrink-0" /><p className="text-sm text-gray-400">Defina quais campos devem ser de preenchimento obrigatório no cadastro de clientes.</p></div>
                <div className="space-y-3 pt-2"><Switch label="Email Obrigatório" enabled={settings.email} onChange={() => setSettings(p => ({ ...p, email: !p.email }))} /><Switch label="Telefone Obrigatório" enabled={settings.phone} onChange={() => setSettings(p => ({ ...p, phone: !p.phone }))} /></div>
            </div>
            <div className="flex justify-end space-x-3 pt-6 mt-4 border-t border-gray-700">
                <button type="button" onClick={onClose} className="px-5 py-2 text-sm font-semibold text-gray-300 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors">Cancelar</button>
                <button type="button" onClick={() => onSave(settings)} className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-500 transition-colors">Salvar</button>
            </div>
        </Modal>
    );
};
