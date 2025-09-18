import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/Modal';
import { InputField } from '../../components/Generic';
import { CreditCardIcon } from '../../components/Icons';

export const PagamentoModal = ({ isOpen, onClose, onConfirm, entry }) => {
    const today = new Date().toISOString().split('T')[0];
    const totalAmount = entry?.amount || 0;
    const paidAmount = entry?.paid_amount || 0;
    const pendingAmount = totalAmount - paidAmount;

    const [amountToPay, setAmountToPay] = useState(pendingAmount.toFixed(2).replace('.', ','));
    const [paymentDate, setPaymentDate] = useState(today);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            setAmountToPay(pendingAmount.toFixed(2).replace('.', ','));
            setPaymentDate(today);
            setError('');
        }
    }, [isOpen, pendingAmount]);

    const formatCurrency = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

    const handleSubmit = (e) => {
        e.preventDefault();
        const amountNumber = parseFloat(amountToPay.replace(',', '.')) || 0;

        if (amountNumber <= 0) {
            setError('O valor do pagamento deve ser maior que zero.');
            return;
        }
        if (amountNumber > pendingAmount) {
            setError(`O valor do pagamento não pode ser maior que o valor pendente (${formatCurrency(pendingAmount)}).`);
            return;
        }
        setError('');
        onConfirm({
            financeiroId: entry.id,
            amountPaid: amountNumber,
            paymentDate: paymentDate,
        });
    };
    
    const preventSubmitOnEnter = (e: React.KeyboardEvent<HTMLFormElement>) => {
        if (e.key === 'Enter' && (e.target as HTMLElement).tagName.toLowerCase() === 'input') {
            e.preventDefault();
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Registrar Pagamento" maxWidth="max-w-md" closeOnBackdropClick={false} closeOnEscape={false} showCloseButton={false}>
            <form onSubmit={handleSubmit} onKeyDown={preventSubmitOnEnter} className="space-y-6">
                <div className="bg-gray-900/50 p-4 rounded-lg text-center">
                    <p className="text-sm text-gray-400">Lançamento para</p>
                    <p className="text-lg font-semibold text-white truncate">{entry?.entity_name}</p>
                    <p className="text-sm text-gray-300 mt-1">{entry?.description}</p>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                        <p className="text-xs text-gray-400">Total</p>
                        <p className="font-semibold text-white">{formatCurrency(totalAmount)}</p>
                    </div>
                     <div>
                        <p className="text-xs text-gray-400">Pago</p>
                        <p className="font-semibold text-green-400">{formatCurrency(paidAmount)}</p>
                    </div>
                     <div>
                        <p className="text-xs text-gray-400">Pendente</p>
                        <p className="font-semibold text-yellow-400">{formatCurrency(pendingAmount)}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-gray-700">
                    <InputField label="Valor a Pagar (R$)" id="amountToPay" name="amountToPay" value={amountToPay} onChange={(e) => setAmountToPay(e.target.value.replace(/[^0-9,]/g, ''))} required inputMode="decimal" />
                    <InputField label="Data do Pagamento" id="paymentDate" name="paymentDate" type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} required />
                </div>
                {error && <p className="text-red-400 text-sm text-center -mt-2">{error}</p>}
                <div className="flex justify-end space-x-3 pt-6 border-t border-gray-700">
                    <button type="button" name="formCancel" onClick={onClose} className="px-5 py-2 text-sm font-semibold text-gray-300 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors">Cancelar</button>
                    <button type="submit" name="formSave" className="flex items-center px-5 py-2 text-sm font-semibold text-white bg-green-600 rounded-lg hover:bg-green-500 transition-colors">
                        <CreditCardIcon className="w-6 h-6 mr-2" />
                        Confirmar Pagamento
                    </button>
                </div>
            </form>
        </Modal>
    );
};