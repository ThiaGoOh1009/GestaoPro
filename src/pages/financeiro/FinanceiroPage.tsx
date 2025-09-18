import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { supabaseService } from '../../services/storage';
import { PlusIcon, Edit2Icon, Trash2Icon, SearchIcon, CreditCardIcon, EyeIcon } from '../../components/Icons';
import { FinanceiroFormModal } from './ContasAPagarFormModal';
import { DeleteConfirmationModal, ConfirmationModal } from '../../components/Modal';
import { PagamentoModal } from './PagamentoModal';
import { HistoricoPagamentosModal } from './HistoricoPagamentosModal';

const statusConfig: { [key: string]: { bg: string, text: string } } = {
    'Pendente': { bg: 'bg-yellow-500/20', text: 'text-yellow-300' },
    'Pago': { bg: 'bg-green-500/20', text: 'text-green-300' },
    'Vencido': { bg: 'bg-red-500/20', text: 'text-red-300' },
};

const formatCurrency = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const FinanceiroCard = ({ entry, isReceberPage, onPay, onHistory, onEdit, onDelete }) => {
    const statusStyle = statusConfig[entry.status] || { bg: 'bg-gray-500/20', text: 'text-gray-300' };
    const pendingAmount = entry.amount - (entry.paid_amount || 0);

    return (
        <div className={`bg-gray-800 rounded-lg p-4 border-l-4 ${isReceberPage ? 'border-green-500' : 'border-red-500'}`}>
            <div className="flex justify-between items-start gap-4">
                {/* Main Content */}
                <div className="flex-grow">
                    <div className="flex justify-between items-start">
                        <div className="flex-grow pr-2">
                            <p className="font-bold text-white text-lg">{entry.entity_name}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                            <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${statusStyle.bg} ${statusStyle.text}`}>{entry.status}</span>
                            <p className="text-xs text-gray-400 mt-1">Vence: {new Date(entry.due_date).toLocaleDateString()}</p>
                        </div>
                    </div>
                    <p className="text-sm text-gray-400 mt-1">{entry.description}</p>

                    <div className="grid grid-cols-3 gap-x-2 mt-4 pt-4 border-t border-gray-700/50 text-xs text-center">
                        <div>
                            <p className="text-gray-400">Total</p>
                            <p className="text-white font-semibold">{formatCurrency(entry.amount)}</p>
                        </div>
                        <div>
                            <p className="text-gray-400">Pago</p>
                            <p className="font-semibold text-green-400">{formatCurrency(entry.paid_amount || 0)}</p>
                        </div>
                        <div>
                            <p className="text-gray-400">Pendente</p>
                            <p className={`font-semibold ${pendingAmount > 0 ? (isReceberPage ? 'text-yellow-400' : 'text-red-400') : 'text-green-400'}`}>
                                {formatCurrency(pendingAmount)}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col items-stretch space-y-2 flex-shrink-0 w-32">
                     {(entry.paid_amount > 0) && (
                        <button onClick={() => onHistory(entry)} className="w-full flex items-center justify-center text-sm py-2.5 px-3 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-md transition-colors"><EyeIcon className="w-5 h-5 mr-2"/> Histórico</button>
                    )}
                    {(entry.status === 'Pendente' || entry.status === 'Vencido') && (
                        <button onClick={() => onPay(entry)} className="w-full flex items-center justify-center text-sm py-2.5 px-3 bg-green-600 hover:bg-green-500 text-white rounded-md transition-colors"><CreditCardIcon className="w-5 h-5 mr-2"/> Pagar</button>
                    )}
                    <button onClick={() => onEdit(entry)} className="w-full flex items-center justify-center text-sm py-2.5 px-3 bg-blue-600 hover:bg-blue-500 text-white rounded-md transition-colors"><Edit2Icon className="w-5 h-5 mr-2"/> Editar</button>
                    <button onClick={() => onDelete(entry)} className="w-full flex items-center justify-center text-sm py-2.5 px-3 bg-red-600 hover:bg-red-500 text-white rounded-md transition-colors"><Trash2Icon className="w-5 h-5 mr-2"/> Excluir</button>
                </div>
            </div>
        </div>
    );
};


export const FinanceiroPage = ({ addLog, defaultTab = 'R' }: { addLog: (message: string) => void; defaultTab?: 'R' | 'P' }) => {
    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isFormModalOpen, setFormModalOpen] = useState(false);
    const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
    const [isPagamentoModalOpen, setPagamentoModalOpen] = useState(false);
    const [isHistoricoModalOpen, setHistoricoModalOpen] = useState(false);
    const [selectedEntry, setSelectedEntry] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('Abertos');
    const [isSaving, setIsSaving] = useState(false);

    const isReceberPage = defaultTab === 'R';
    const pageTitle = isReceberPage ? 'Contas a Receber' : 'Contas a Pagar';
    const pageDescription = isReceberPage ? 'Gerencie suas contas a receber.' : 'Gerencie suas contas a pagar.';

    const loadFinancialEntries = useCallback(async () => {
        setLoading(true);
        try {
            const data = await supabaseService.getFinanceiroEntries();
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const processedData = data.map(entry => {
                const dueDate = new Date(entry.due_date);
                if (entry.status === 'Pendente' && dueDate < today) {
                    return { ...entry, status: 'Vencido' };
                }
                return entry;
            });
            setEntries(processedData);
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Erro desconhecido';
            addLog(`Erro ao carregar lançamentos: ${message}`);
        } finally {
            setLoading(false);
        }
    }, [addLog]);

    useEffect(() => {
        loadFinancialEntries();
    }, [loadFinancialEntries]);

    const handleOpenFormModal = (entry = null) => { setSelectedEntry(entry); setFormModalOpen(true); };
    const handleOpenDeleteModal = (entry) => { setSelectedEntry(entry); setDeleteModalOpen(true); };
    const handleOpenPagamentoModal = (entry) => { setSelectedEntry(entry); setPagamentoModalOpen(true); };
    const handleOpenHistoricoModal = (entry) => { setSelectedEntry(entry); setHistoricoModalOpen(true); };
    
    const handleCloseModals = () => {
        setSelectedEntry(null);
        setFormModalOpen(false);
        setDeleteModalOpen(false);
        setPagamentoModalOpen(false);
        setHistoricoModalOpen(false);
    };

    const handleActionComplete = () => {
        handleCloseModals();
        loadFinancialEntries();
    }

    const handleSaveEntry = async (entryData) => {
        if (isSaving) return;
        setIsSaving(true);
        try {
            await supabaseService.saveFinanceiroEntry(entryData);
            addLog(`Lançamento "${entryData.description}" salvo com sucesso.`);
            handleActionComplete();
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Erro desconhecido';
            addLog(`Erro ao salvar lançamento: ${message}`);
            alert(`Erro ao salvar: ${message}`);
        } finally {
            setIsSaving(false);
        }
    };
    
    const handleConfirmDelete = async () => {
        if (!selectedEntry) return;
        try {
            await supabaseService.deleteFinanceiroEntry(selectedEntry.id);
            addLog(`Lançamento "${selectedEntry.description}" excluído.`);
            handleActionComplete();
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Erro desconhecido';
            addLog(`Erro ao excluir: ${message}`);
            alert(`Erro ao excluir: ${message}`);
        }
    };
    
    const handleMakePayment = async (paymentData) => {
        try {
            await supabaseService.makePayment(paymentData);
            addLog(`Pagamento de ${paymentData.amountPaid} para "${selectedEntry.description}" registrado.`);
            handleActionComplete();
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Erro desconhecido';
            addLog(`Erro ao registrar pagamento: ${message}`);
            alert(`Erro ao registrar pagamento: ${message}`);
        }
    };

    const filteredEntries = useMemo(() => {
        let filtered = entries.filter(e => e.type === defaultTab);
        
        if (statusFilter !== 'Todos') {
            if (statusFilter === 'Abertos') {
                filtered = filtered.filter(e => e.status === 'Pendente' || e.status === 'Vencido');
            } else {
                filtered = filtered.filter(e => e.status === statusFilter);
            }
        }

        if (searchTerm) {
            const lowercasedTerm = searchTerm.toLowerCase();
            filtered = filtered.filter(e =>
                (e.description || '').toLowerCase().includes(lowercasedTerm) ||
                (e.entity_name && e.entity_name.toLowerCase().includes(lowercasedTerm))
            );
        }

        return filtered;
    }, [entries, defaultTab, statusFilter, searchTerm]);

    const totals = useMemo(() => {
        const relevantEntries = entries.filter(e => e.type === defaultTab);
        const total = relevantEntries.reduce((acc, e) => acc + e.amount, 0);
        const paid = relevantEntries.reduce((acc, e) => acc + (e.paid_amount || 0), 0);
        const pending = total - paid;
        return { total, paid, pending };
    }, [entries, defaultTab]);


    return (
        <>
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-white">{pageTitle}</h2>
                    <p className="text-gray-400 mt-1">{pageDescription}</p>
                </div>
                <div className="flex items-center justify-end space-x-2 w-full md:w-auto">
                    <div className="relative flex-grow md:flex-grow-0">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400"><SearchIcon className="w-5 h-5"/></span>
                        <input type="search" placeholder="Buscar..." className="w-full md:w-64 bg-gray-800 text-white rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>
                     <button onClick={() => handleOpenFormModal()} className="flex items-center justify-center px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-500 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-blue-500"><PlusIcon className="w-4 h-4 mr-2" />Adicionar</button>
                </div>
            </header>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                 <div className="bg-gray-800 p-4 rounded-lg text-center"><p className="text-sm text-gray-400">Valor Total</p><p className="text-2xl font-bold text-white">{formatCurrency(totals.total)}</p></div>
                 <div className="bg-gray-800 p-4 rounded-lg text-center"><p className="text-sm text-gray-400">Total Quitado</p><p className="text-2xl font-bold text-green-400">{formatCurrency(totals.paid)}</p></div>
                 <div className="bg-gray-800 p-4 rounded-lg text-center"><p className="text-sm text-gray-400">Total Pendente</p><p className="text-2xl font-bold text-yellow-400">{formatCurrency(totals.pending)}</p></div>
            </div>

            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center space-x-2 bg-gray-800 p-1 rounded-lg">
                    {['Abertos', 'Pendente', 'Pago', 'Vencido', 'Todos'].map(status => (
                        <button key={status} onClick={() => setStatusFilter(status)} className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors ${statusFilter === status ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>
                            {status}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? <p>Carregando...</p> : filteredEntries.length > 0 ? (
                <div className="space-y-4">
                    {filteredEntries.map(entry => (
                        <FinanceiroCard
                            key={entry.id}
                            entry={entry}
                            isReceberPage={isReceberPage}
                            onPay={handleOpenPagamentoModal}
                            onHistory={handleOpenHistoricoModal}
                            onEdit={handleOpenFormModal}
                            onDelete={handleOpenDeleteModal}
                        />
                    ))}
                </div>
            ) : (
                <div className="text-center py-12 bg-gray-800 rounded-lg">
                    <p className="text-gray-400">Nenhum lançamento encontrado com os filtros atuais.</p>
                </div>
            )}
            
            {isFormModalOpen && <FinanceiroFormModal isOpen={isFormModalOpen} onClose={handleCloseModals} onSave={handleSaveEntry} entry={selectedEntry} defaultType={defaultTab} addLog={addLog} />}
            <DeleteConfirmationModal isOpen={isDeleteModalOpen} onClose={handleCloseModals} onConfirm={handleConfirmDelete} bodyText={`Tem certeza que deseja excluir o lançamento "${selectedEntry?.description}"? Esta ação não pode ser desfeita.`} />
            {isPagamentoModalOpen && <PagamentoModal isOpen={isPagamentoModalOpen} onClose={handleCloseModals} onConfirm={handleMakePayment} entry={selectedEntry} />}
            {isHistoricoModalOpen && <HistoricoPagamentosModal isOpen={isHistoricoModalOpen} onClose={handleCloseModals} entry={selectedEntry} onActionComplete={handleActionComplete} addLog={addLog} />}
        </>
    );
};