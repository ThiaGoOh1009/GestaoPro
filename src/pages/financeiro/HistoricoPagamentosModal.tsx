import React, { useState, useEffect } from 'react';
import { Modal, ConfirmationModal } from '../../components/Modal';
import { supabaseService } from '../../services/storage';
import { SpinnerIcon, Trash2Icon } from '../../components/Icons';

export const HistoricoPagamentosModal = ({ isOpen, onClose, entry, onActionComplete, addLog }) => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isConfirmOpen, setConfirmOpen] = useState(false);
    const [paymentToReverse, setPaymentToReverse] = useState(null);

    const loadHistory = () => {
        if (entry) {
            setLoading(true);
            supabaseService.getPaymentHistoryForEntry(entry.id)
                .then(setHistory)
                .catch(err => console.error("Failed to fetch payment history:", err))
                .finally(() => setLoading(false));
        }
    };

    useEffect(() => {
        if (isOpen) {
            loadHistory();
        }
    }, [isOpen, entry]);
    
    const formatCurrency = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

    const handleReverseClick = (payment) => {
        setPaymentToReverse(payment);
        setConfirmOpen(true);
    };

    const handleConfirmReverse = async () => {
        if (!paymentToReverse) return;
        try {
            addLog(`Iniciando estorno do pagamento ID ${paymentToReverse.id} no valor de ${formatCurrency(paymentToReverse.amount_paid)}.`);
            await supabaseService.reversePayment({
                paymentHistoryId: paymentToReverse.id,
                financeiroId: entry.id,
                amountToReverse: paymentToReverse.amount_paid,
            });
            addLog('Estorno concluído com sucesso.');
            setConfirmOpen(false);
            setPaymentToReverse(null);
            if (onActionComplete) {
                onActionComplete();
            } else {
                onClose(); // Fallback
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : "Erro desconhecido";
            addLog(`ERRO ao estornar pagamento: ${message}`);
            alert(`Erro ao estornar: ${message}`);
            setConfirmOpen(false);
        }
    };

    return (
        <>
            <Modal isOpen={isOpen} onClose={onClose} title="Histórico de Pagamentos" maxWidth="max-w-lg">
                <div className="space-y-4">
                    <div className="bg-gray-900/50 p-4 rounded-lg">
                        <p className="text-sm text-gray-400 truncate">Lançamento: {entry?.description}</p>
                        <p className="text-base font-semibold text-white truncate">{entry?.entity_name}</p>
                    </div>
                    {loading ? (
                        <div className="flex justify-center items-center py-8">
                            <SpinnerIcon className="w-8 h-8 text-white" />
                        </div>
                    ) : history.length > 0 ? (
                        <div className="max-h-80 overflow-y-auto pr-2 sidebar-scroll">
                            <table className="w-full text-sm text-left text-gray-300">
                                <thead className="text-xs text-gray-400 uppercase bg-gray-800 sticky top-0">
                                    <tr>
                                        <th scope="col" className="px-4 py-3">Data</th>
                                        <th scope="col" className="px-4 py-3 text-right">Valor Pago</th>
                                        <th scope="col" className="px-4 py-3 text-right">Ação</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {history.map(payment => (
                                        <tr key={payment.id} className="bg-gray-800/50 border-b border-gray-700/50">
                                            <td className="px-4 py-3">{new Date(payment.payment_date).toLocaleDateString()}</td>
                                            <td className="px-4 py-3 text-right font-semibold text-green-400">{formatCurrency(payment.amount_paid)}</td>
                                            <td className="px-4 py-3 text-right">
                                                <button onClick={() => handleReverseClick(payment)} className="text-red-500 hover:text-red-400 transition-colors" title="Extornar Pagamento">
                                                    <Trash2Icon className="w-6 h-6" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p className="text-center text-gray-500 py-8">Nenhum histórico de pagamento encontrado.</p>
                    )}
                    <div className="flex justify-end pt-4 mt-2 border-t border-gray-700">
                        <button type="button" name="formClose" onClick={onClose} className="px-5 py-2 text-sm font-semibold text-gray-300 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors">Fechar</button>
                    </div>
                </div>
            </Modal>
            <ConfirmationModal
                isOpen={isConfirmOpen}
                onClose={() => setConfirmOpen(false)}
                onConfirm={handleConfirmReverse}
                title="Confirmar Estorno"
                bodyText={`Tem certeza que deseja estornar o pagamento de ${formatCurrency(paymentToReverse?.amount_paid || 0)}? Esta ação não pode ser desfeita.`}
                confirmButtonText="Confirmar Estorno"
                confirmButtonClass="bg-red-600 hover:bg-red-500"
            />
        </>
    );
};