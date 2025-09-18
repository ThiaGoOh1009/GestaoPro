import React, { useEffect } from 'react';
import { IconWrapper } from './Icons';

export const Modal = ({ isOpen, onClose, title, children, maxWidth = 'max-w-md', closeOnBackdropClick = true, closeOnEscape = true, showCloseButton = true }) => {
    useEffect(() => {
        if (!closeOnEscape) return;
        const handleEsc = (event) => { if (event.key === 'Escape') onClose(); };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose, closeOnEscape]);
    
    if (!isOpen) return null;

    const handleBackdropClick = () => {
        if (closeOnBackdropClick) {
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex justify-center items-center p-4 modal-enter" onClick={handleBackdropClick} aria-modal="true" role="dialog">
            <div className={`bg-gray-800 rounded-xl shadow-2xl w-full ${maxWidth} modal-content-enter flex flex-col max-h-[95vh]`} onClick={e => e.stopPropagation()}>
                <header className="flex-shrink-0 flex justify-between items-center p-5 border-b border-gray-700">
                    <h3 className="text-xl font-semibold text-white">{title}</h3>
                    {showCloseButton && (
                        <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors" aria-label="Close modal" data-dev-id="Modal-close-button"><IconWrapper><path d="M18 6 6 18" /><path d="m6 6 12 12" /></IconWrapper></button>
                    )}
                </header>
                <div className="p-6 overflow-y-auto">{children}</div>
            </div>
        </div>
    );
};

export const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, bodyText, confirmButtonText = 'Confirmar', confirmButtonClass = 'bg-blue-600 hover:bg-blue-500' }) => (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="max-w-lg" closeOnBackdropClick={false} closeOnEscape={false} showCloseButton={false}>
        <p className="text-gray-300">{bodyText}</p>
        <div className="flex justify-end space-x-3 pt-6 mt-2">
            <button type="button" name="modalCancel" onClick={onClose} data-dev-id="ConfirmationModal-cancel-button" className="px-5 py-2 text-sm font-semibold text-gray-300 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors">Cancelar</button>
            <button type="button" name="modalConfirm" onClick={onConfirm} data-dev-id="ConfirmationModal-confirm-button" className={`px-5 py-2 text-sm font-semibold text-white rounded-lg transition-colors ${confirmButtonClass}`}>{confirmButtonText}</button>
        </div>
    </Modal>
);

export const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm, bodyText }) => (
    <ConfirmationModal
        isOpen={isOpen}
        onClose={onClose}
        onConfirm={onConfirm}
        title="Confirmar Exclusão"
        bodyText={bodyText || 'Tem certeza que deseja excluir o item? Esta ação não pode ser desfeita.'}
        confirmButtonText="Excluir"
        confirmButtonClass="bg-red-600 hover:bg-red-500"
    />
);