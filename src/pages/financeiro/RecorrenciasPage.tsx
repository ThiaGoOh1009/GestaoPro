import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabaseService } from '../../services/storage';
import { PlusIcon, Edit2Icon, Trash2Icon, SpinnerIcon, CalendarPlusIcon } from '../../components/Icons';
import { RecorrenciaFormModal } from './RecorrenciaFormModal';
import { DeleteConfirmationModal } from '../../components/Modal';

const formatCurrency = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);

const statusConfig = {
    'Ativo': { bg: 'bg-green-500/20', text: 'text-green-300' },
    'Pausado': { bg: 'bg-yellow-500/20', text: 'text-yellow-300' },
    'Concluído': { bg: 'bg-gray-500/20', text: 'text-gray-300' },
};

const RecorrenciaCard = ({ entry, onEdit, onDelete }) => {
    const isReceita = entry.type === 'R';
    const statusStyle = statusConfig[entry.status] || { bg: 'bg-gray-500/20', text: 'text-gray-300' };

    return (
        <div className={`bg-gray-800 rounded-lg p-4 border-l-4 ${isReceita ? 'border-green-500' : 'border-red-500'}`}>
            <div className="flex justify-between items-start gap-4">
                <div className="flex-grow">
                    <p className={`font-bold text-lg ${isReceita ? 'text-green-300' : 'text-red-300'}`}>{formatCurrency(entry.amount)}</p>
                    <p className="text-white font-semibold mt-1">{entry.description}</p>
                    <p className="text-sm text-gray-400">{entry.entity_name}</p>
                </div>
                <div className="flex-shrink-0 text-right">
                    <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${statusStyle.bg} ${statusStyle.text}`}>{entry.status}</span>
                </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-700/50 flex justify-between items-center">
                 <div className="text-sm text-gray-300">
                    <p>{entry.frequency}</p>
                    <p className="text-xs text-gray-400">Próximo vencimento: Dia {entry.due_day}</p>
                </div>
                <div className="flex items-center space-x-2">
                    <button onClick={() => onEdit(entry)} className="p-3 text-blue-400 hover:text-blue-300 transition-colors rounded-full hover:bg-gray-700" aria-label={`Editar ${entry.description}`}><Edit2Icon className="w-5 h-5" /></button>
                    <button onClick={() => onDelete(entry)} className="p-3 text-red-500 hover:text-red-400 transition-colors rounded-full hover:bg-gray-700" aria-label={`Excluir ${entry.description}`}><Trash2Icon className="w-5 h-5" /></button>
                </div>
            </div>
        </div>
    );
};


export const RecorrenciasPage = ({ addLog }) => {
    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isFormModalOpen, setFormModalOpen] = useState(false);
    const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
    const [selectedEntry, setSelectedEntry] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const data = await supabaseService.getRecurringEntries();
            setEntries(data);
            addLog(`${data.length} lançamentos recorrentes carregados.`);
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Erro desconhecido';
            addLog(`Erro ao carregar lançamentos recorrentes: ${message}`);
        } finally {
            setLoading(false);
        }
    }, [addLog]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleOpenFormModal = (entry = null) => {
        setSelectedEntry(entry);
        setFormModalOpen(true);
    };

    const handleOpenDeleteModal = (entry) => {
        setSelectedEntry(entry);
        setDeleteModalOpen(true);
    };

    const handleCloseModals = () => {
        setSelectedEntry(null);
        setFormModalOpen(false);
        setDeleteModalOpen(false);
    };

    const handleSaveEntry = async (entryData) => {
        if (isSaving) return;
        setIsSaving(true);
        try {
            await supabaseService.saveRecurringEntry(entryData);
            addLog(`Lançamento recorrente "${entryData.description}" salvo com sucesso.`);
            handleCloseModals();
            loadData();
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Erro desconhecido';
            addLog(`Erro ao salvar lançamento recorrente: ${message}`);
            alert(`Erro ao salvar: ${message}`);
        } finally {
            setIsSaving(false);
        }
    };

    const handleConfirmDelete = async () => {
        if (!selectedEntry) return;
        try {
            await supabaseService.deleteRecurringEntry(selectedEntry.id);
            addLog(`Lançamento recorrente "${selectedEntry.description}" excluído.`);
            handleCloseModals();
            loadData();
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Erro desconhecido';
            addLog(`Erro ao excluir: ${message}`);
            alert(`Erro ao excluir: ${message}`);
        }
    };

    return (
        <>
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-white">Lançamentos Recorrentes</h2>
                    <p className="text-gray-400 mt-1">Gerencie suas receitas e despesas periódicas.</p>
                </div>
                <button onClick={() => handleOpenFormModal()} className="flex items-center justify-center px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-500 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-blue-500">
                    <PlusIcon className="w-4 h-4 mr-2" />
                    Adicionar Recorrência
                </button>
            </header>
            
            {loading ? (
                <div className="flex justify-center p-8"><SpinnerIcon className="w-8 h-8 text-white mx-auto" /></div>
            ) : entries.length > 0 ? (
                 <div className="bg-gray-800 rounded-xl shadow-lg">
                    {/* Desktop Table View */}
                    <div className="overflow-x-auto hidden md:block">
                        <table className="w-full text-sm text-left text-gray-300">
                            <thead className="text-xs text-gray-400 uppercase bg-gray-800 border-b border-gray-700">
                                <tr>
                                    <th scope="col" className="px-6 py-4">Descrição</th>
                                    <th scope="col" className="px-6 py-4">Valor</th>
                                    <th scope="col" className="px-6 py-4">Frequência</th>
                                    <th scope="col" className="px-6 py-4">Status</th>
                                    <th scope="col" className="px-6 py-4 text-right">Ações</th>
                                </tr>
                            </thead>
                             <tbody>
                                {entries.map(entry => {
                                    const isReceita = entry.type === 'R';
                                    const statusStyle = statusConfig[entry.status] || { bg: 'bg-gray-500/20', text: 'text-gray-300' };
                                    return (
                                        <tr key={entry.id} className="bg-gray-800 border-b border-gray-700/50 hover:bg-gray-700/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-semibold text-white">{entry.description}</div>
                                                <div className="text-xs text-gray-400">{entry.entity_name}</div>
                                            </td>
                                            <td className={`px-6 py-4 font-semibold ${isReceita ? 'text-green-400' : 'text-red-400'}`}>
                                                {formatCurrency(entry.amount)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div>{entry.frequency}</div>
                                                <div className="text-xs text-gray-400">Próximo: Dia {entry.due_day}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${statusStyle.bg} ${statusStyle.text}`}>{entry.status}</span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end space-x-3">
                                                    <button onClick={() => handleOpenFormModal(entry)} className="p-2 text-blue-400 hover:text-blue-300 transition-colors" aria-label={`Editar ${entry.description}`}><Edit2Icon className="w-5 h-5" /></button>
                                                    <button onClick={() => handleOpenDeleteModal(entry)} className="p-2 text-red-500 hover:text-red-400 transition-colors" aria-label={`Excluir ${entry.description}`}><Trash2Icon className="w-5 h-5" /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                     {/* Mobile Card View */}
                    <div className="md:hidden p-4 space-y-4">
                         {entries.map(entry => (
                            <RecorrenciaCard 
                                key={entry.id} 
                                entry={entry} 
                                onEdit={handleOpenFormModal} 
                                onDelete={handleOpenDeleteModal}
                            />
                        ))}
                    </div>
                </div>
            ) : (
                <div className="text-center py-12 bg-gray-800 rounded-xl">
                    <CalendarPlusIcon className="mx-auto w-12 h-12 text-gray-500" />
                    <h3 className="mt-4 text-lg font-medium text-white">Nenhuma recorrência cadastrada</h3>
                    <p className="mt-1 text-sm text-gray-400">Adicione uma nova receita ou despesa recorrente para começar.</p>
                </div>
            )}


            {isFormModalOpen && (
                <RecorrenciaFormModal
                    isOpen={isFormModalOpen}
                    onClose={handleCloseModals}
                    onSave={handleSaveEntry}
                    entry={selectedEntry}
                    addLog={addLog}
                    isSaving={isSaving}
                />
            )}
            <DeleteConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={handleCloseModals}
                onConfirm={handleConfirmDelete}
                bodyText={`Tem certeza que deseja excluir o lançamento recorrente "${selectedEntry?.description}"? Esta ação não pode ser desfeita.`}
            />
        </>
    );
};