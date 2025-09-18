import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabaseService } from '../../services/storage';
import { ClientTableSkeleton, StatusBadge } from '../../components/Generic';
import { SearchIcon, PlusIcon, Trash2Icon, EyeIcon } from '../../components/Icons';
import { FornecedorFormModal } from './FornecedorFormModal';
import { DeleteConfirmationModal } from '../../components/Modal';

const FornecedorCard = ({ fornecedor, onEdit, onDelete }) => {
    const displayName = fornecedor.trade_name || fornecedor.legal_name;
    return (
        <div className="bg-gray-800 rounded-lg p-4 border-l-4 border-purple-500 mb-4 shadow-md">
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="font-bold text-white text-lg">{displayName}</h3>
                    <p className="text-sm text-gray-400">{fornecedor.customer_type === 'PJ' ? fornecedor.legal_name : fornecedor.document}</p>
                    {fornecedor.contact_name && <p className="text-sm text-gray-300 mt-2">Contato: {fornecedor.contact_name}</p>}
                </div>
                <div className="flex flex-col items-end space-y-2 flex-shrink-0">
                    <StatusBadge status={fornecedor.status} />
                    <div className="flex items-center space-x-2">
                        <button name={`viewFornecedor-${fornecedor.id}`} onClick={() => onEdit(fornecedor)} className="p-3 text-gray-400 hover:text-white rounded-full hover:bg-gray-700 transition-colors" aria-label={`Visualizar ${displayName}`}><EyeIcon className="w-6 h-6" /></button>
                        <button name={`deleteFornecedor-${fornecedor.id}`} onClick={() => onDelete(fornecedor)} className="p-3 text-red-500 hover:text-red-400 rounded-full hover:bg-gray-700 transition-colors" aria-label={`Excluir ${displayName}`}><Trash2Icon className="w-6 h-6" /></button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const FornecedoresPage = ({ addLog }) => {
    const [fornecedores, setFornecedores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [isFormModalOpen, setFormModalOpen] = useState(false);
    const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
    const [selectedEntidade, setSelectedEntidade] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    const loadFornecedores = useCallback(async () => {
        setLoading(true);
        setError(null);
        try { const data = await supabaseService.getFornecedores(); setFornecedores(data); }
        catch (err) { setError(err.message); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { loadFornecedores(); }, [loadFornecedores]);

    const handleOpenAddModal = () => { setSelectedEntidade(null); setFormModalOpen(true); };
    const handleOpenEditModal = (f) => { setSelectedEntidade(f); setFormModalOpen(true); };
    const handleOpenDeleteModal = (f) => { setSelectedEntidade(f); setDeleteModalOpen(true); };
    const handleCloseModals = () => { setFormModalOpen(false); setDeleteModalOpen(false); setSelectedEntidade(null); };

    const handleSaveFornecedor = async (fornecedorData) => {
        if (isSaving) return;
        setIsSaving(true);
        try {
            await supabaseService.saveEntidade(fornecedorData);
            addLog(`Fornecedor "${fornecedorData.legal_name}" foi salvo com sucesso.`);
            handleCloseModals();
            loadFornecedores(); // Reload the whole list
        }
        catch (err) { 
            const message = err instanceof Error ? err.message : String(err);
            addLog(`ERRO ao salvar fornecedor: ${message}`);
            alert(`Erro ao salvar fornecedor: ${message}`); 
        } finally {
            setIsSaving(false);
        }
    };

    const handleConfirmDelete = async () => { 
        if (selectedEntidade) {
             await supabaseService.deleteEntidade(selectedEntidade.id); 
             addLog(`Fornecedor "${selectedEntidade.legal_name}" foi excluído.`);
             loadFornecedores();
        }
        handleCloseModals(); 
    };

    const filteredFornecedores = useMemo(() => fornecedores.filter(f => Object.values(f).some(val => typeof val === 'string' && val.toLowerCase().includes(searchTerm.toLowerCase()))), [fornecedores, searchTerm]);

    return (
        <>
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
                <div><h2 className="text-3xl font-bold text-white">Fornecedores</h2><p className="text-gray-400 mt-1">Gerencie seus fornecedores e parceiros.</p></div>
                <div className="flex items-center space-x-2 mt-4 sm:mt-0 w-full sm:w-auto">
                    <div className="relative flex-grow sm:flex-grow-0"><span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400"><SearchIcon className="w-5 h-5"/></span><input type="search" name="fornecedorSearch" placeholder="Buscar..." className="w-full sm:w-64 bg-gray-800 text-white rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" onChange={(e) => setSearchTerm(e.target.value)} /></div>
                    <button name="addFornecedor" onClick={handleOpenAddModal} className="flex items-center justify-center px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-500 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-blue-500"><PlusIcon className="w-6 h-6 mr-2" />Adicionar</button>
                </div>
            </header>
            <div className="bg-gray-800 rounded-xl shadow-lg">
                {loading ? <ClientTableSkeleton /> : error ? <div className="p-8 text-center text-red-400">{error}</div> : (
                    <>
                        {/* Desktop Table View */}
                        <div className="overflow-x-auto hidden md:block"><table className="w-full text-sm text-left text-gray-300">
                            <thead className="text-xs text-gray-400 uppercase bg-gray-800 border-b border-gray-700"><tr className="border-b border-gray-700/50"><th scope="col" className="px-6 py-4">Fornecedor</th><th scope="col" className="px-6 py-4">Status</th><th scope="col" className="px-6 py-4 text-right">Ações</th></tr></thead>
                            <tbody>{filteredFornecedores.map((fornecedor) => {
                                const displayName = fornecedor.trade_name || fornecedor.legal_name;
                                return (<tr key={fornecedor.id} className="bg-gray-800 border-b border-gray-700/50 hover:bg-gray-700/50 transition-colors">
                                    <th scope="row" className="px-6 py-4 font-medium text-white whitespace-nowrap">
                                        <div>
                                            <div className="text-base font-semibold">{displayName}</div>
                                            <div className="font-normal text-gray-400">{fornecedor.customer_type === 'PJ' ? fornecedor.legal_name : fornecedor.document}</div>
                                            {fornecedor.contact_name && <div className="font-normal text-gray-300 text-xs mt-1">Contato: {fornecedor.contact_name}</div>}
                                        </div>
                                    </th>
                                    <td className="px-6 py-4"><StatusBadge status={fornecedor.status} /></td>
                                    <td className="px-6 py-4 text-right"><div className="flex items-center justify-end space-x-3">
                                        <button name={`editFornecedor-${fornecedor.id}`} onClick={() => handleOpenEditModal(fornecedor)} className="p-2 text-blue-400 hover:text-blue-300 transition-colors" aria-label={`Visualizar ${displayName}`}><EyeIcon className="w-6 h-6" /></button>
                                        <button name={`deleteFornecedor-${fornecedor.id}`} onClick={() => handleOpenDeleteModal(fornecedor)} className="p-2 text-red-500 hover:text-red-400 transition-colors" aria-label={`Excluir ${displayName}`}><Trash2Icon className="w-6 h-6" /></button>
                                    </div></td>
                                </tr>);
                            })}</tbody>
                        </table></div>

                        {/* Mobile Card View */}
                        <div className="md:hidden p-4">
                            {filteredFornecedores.map(fornecedor => (
                                <FornecedorCard key={fornecedor.id} fornecedor={fornecedor} onEdit={handleOpenEditModal} onDelete={handleOpenDeleteModal} />
                            ))}
                        </div>
                    </>
                )}
                {!loading && filteredFornecedores.length === 0 && <div className="p-8 text-center text-gray-400">{fornecedores.length > 0 ? `Nenhum fornecedor encontrado com o termo "${searchTerm}".` : 'Nenhum fornecedor cadastrado. Adicione um para começar.'}</div>}
            </div>
            {isFormModalOpen && <FornecedorFormModal isOpen={isFormModalOpen} onClose={handleCloseModals} onSave={handleSaveFornecedor} fornecedor={selectedEntidade} addLog={addLog} isSaving={isSaving} />}
            <DeleteConfirmationModal isOpen={isDeleteModalOpen} onClose={handleCloseModals} onConfirm={handleConfirmDelete} bodyText={`Tem certeza que deseja excluir o fornecedor "${selectedEntidade?.trade_name || selectedEntidade?.legal_name}"? Esta ação não pode ser desfeita.`} />
        </>
    );
};