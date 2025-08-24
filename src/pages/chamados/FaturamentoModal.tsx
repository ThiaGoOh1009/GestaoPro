import React, { useState } from 'react';
import { Modal } from '../../components/Modal';
import { DollarSignIcon } from '../../components/Icons';

export const FaturamentoModal = ({ isOpen, onClose, onConfirm, chamado }) => {
    const [paymentMethod, setPaymentMethod] = useState('À Vista');

    if (!chamado) return null;

    const totalValue = chamado.items?.reduce((acc, item) => acc + item.totalPrice, 0) || 0;
    const formatCurrency = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

    const handleSubmit = () => {
        onConfirm(paymentMethod);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Faturar Chamado" maxWidth="max-w-lg">
            <div className="space-y-6">
                <div className="bg-gray-900/50 p-4 rounded-lg text-center">
                    <p className="text-sm text-gray-400">Total do Chamado para</p>
                    <p className="text-lg font-semibold text-white">{chamado.clientName}</p>
                    <p className="text-4xl font-bold text-green-400 mt-2">{formatCurrency(totalValue)}</p>
                </div>

                <div>
                    <span className="block text-sm font-medium text-gray-300 mb-2">Método de Pagamento</span>
                    <div className="flex rounded-lg bg-gray-700 p-1">
                        <button
                            type="button"
                            onClick={() => setPaymentMethod('À Vista')}
                            className={`flex-1 py-1.5 text-sm font-semibold rounded-md transition-colors ${paymentMethod === 'À Vista' ? 'bg-blue-500 text-white' : 'text-gray-300 hover:bg-gray-600'}`}
                        >
                            À Vista (Caixa)
                        </button>
                        <button
                            type="button"
                            onClick={() => setPaymentMethod('A Prazo')}
                            className={`flex-1 py-1.5 text-sm font-semibold rounded-md transition-colors ${paymentMethod === 'A Prazo' ? 'bg-purple-500 text-white' : 'text-gray-300 hover:bg-gray-600'}`}
                        >
                            A Prazo (Financeiro)
                        </button>
                    </div>
                </div>

                <div className="text-sm text-gray-400 bg-gray-700/50 p-3 rounded-md">
                    {paymentMethod === 'À Vista'
                        ? 'O valor será lançado como uma entrada no Caixa.'
                        : 'Será criada uma conta a receber no Financeiro.'
                    }
                </div>
            </div>

            <div className="flex justify-end space-x-3 pt-6 mt-4 border-t border-gray-700">
                <button type="button" onClick={onClose} className="px-5 py-2 text-sm font-semibold text-gray-300 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors">Cancelar</button>
                <button
                    type="button"
                    onClick={handleSubmit}
                    className="flex items-center px-5 py-2 text-sm font-semibold text-white bg-green-600 rounded-lg hover:bg-green-500 transition-colors"
                >
                    <DollarSignIcon className="w-4 h-4 mr-2" />
                    Confirmar Faturamento
                </button>
            </div>
        </Modal>
    );
};
