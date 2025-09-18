import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabaseService, storage } from '../../services/storage';
import { ClientTableSkeleton, StatusBadge } from '../../components/Generic';
import { SearchIcon, SettingsIcon, PlusIcon, Trash2Icon, EyeIcon } from '../../components/Icons';
import { ClientFormModal } from './ClientFormModal';
import { DeleteConfirmationModal } from '../../components/Modal';
import { FieldSettingsModal } from './FieldSettingsModal';

const ClientCard = ({ client, onEdit, onDelete }) => {
    const displayName = client.trade_name || client.legal_name;
    return (
        <div className="bg-gray-800 rounded-lg p-4 border-l-4 border-blue-500 mb-4 shadow-md" data-dev-id={`ClientsPage-ClientCard-${client.id}`}>
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="font-bold text-white text-lg">{displayName}</h3>
                    <p className="text-sm text-gray-400">{client.customer_type === 'PJ' ? client.legal_name : client.document}</p>
                    {client.contact_name && <p className="text-sm text-gray-300 mt-2">Contato: {client.contact_name}</p>}
                </div>
                <div className="flex flex-col items-end space-y-2 flex-shrink-0">
                    <StatusBadge status={client.status} />
                    <div className="flex items-center space-x-2">
                        <button name={`viewClient-${client.id}`} onClick={() => onEdit(client)} className="p-3 text-gray-400 hover:text-white rounded-full hover:bg-gray-700 transition-colors" aria-label={`Visualizar ${displayName}`} data-dev-id={`ClientsPage-ClientCard-edit-${client.id}`}><EyeIcon className="w-6 h-6" /></button>
                        <button name={`deleteClient-${client.id}`} onClick={() => onDelete(client)} className="p-3 text-red-500 hover:text-red-400 rounded-full hover:bg-gray-700 transition-colors" aria-label={`Excluir ${displayName}`} data-dev-id={`ClientsPage-ClientCard-delete-${client.id}`}><Trash2Icon className="w-6 h-6" /></button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const ClientsPage = ({ addLog }) => {
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [isFormModalOpen, setFormModalOpen] = useState(false);
    const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
    const [isSettingsModalOpen, setSettingsModalOpen] = useState(false);
    const [selectedEntidade, setSelectedEntidade] = useState(null);
    const [fieldSettings, setFieldSettings] = useState({ email: false, phone: false });
    const [isSaving, setIsSaving] = useState(false);

    const loadClients = useCallback(async () => {
        setLoading(true);
        setError(null);
        try { const data = await supabaseService.getClientes(); setClients(data); }
        catch (err) { setError(err.message); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { loadClients(); setFieldSettings(storage.loadClientFieldSettings()); }, [loadClients]);

    const handleOpenAddModal = () => { setSelectedEntidade(null); setFormModalOpen(true); addLog('Abrindo modal para adicionar cliente.'); };
    const handleOpenEditModal = (c) => { setSelectedEntidade(c); setFormModalOpen(true); addLog(`Abrindo modal para editar cliente: ${c.legal_name}`); };
    const handleOpenDeleteModal = (c) => { setSelectedEntidade(c); setDeleteModalOpen(true); addLog(`Abrindo modal para excluir cliente: ${c.legal_name}`); };
    const handleCloseModals = () => { setFormModalOpen(false); setDeleteModalOpen(false); setSettingsModalOpen(false); setSelectedEntidade(null); };

    const handleSaveClient = async (clientData) => {
        if (isSaving) return;
        setIsSaving(true);
        try {
            await supabaseService.saveEntidade(clientData);
            addLog(`Cliente "${clientData.legal_name}" foi salvo com sucesso.`);
            handleCloseModals();
            loadClients(); // Reload the whole list
        }
        catch (err) { 
            const message = err instanceof Error ? err.message : String(err);
            addLog(`ERRO ao salvar cliente: ${message}`);
            alert(`Erro ao salvar cliente: ${message}`); 
        } finally {
            setIsSaving(false);
        }
    };

    const handleConfirmDelete = async () => { 
        if (selectedEntidade) {
             await supabaseService.deleteEntidade(selectedEntidade.id); 
             addLog(`Cliente "${selectedEntidade.legal_name}" foi excluído.`);
             loadClients(); // Recarrega a lista
        }
        handleCloseModals(); 
    };
    const handleSaveSettings = (newSettings) => { setFieldSettings(newSettings); storage.saveClientFieldSettings(newSettings); setSettingsModalOpen(false); addLog('Configurações de campos salvas.'); };

    const filteredClients = useMemo(() => clients.filter(c => Object.values(c).some(val => typeof val === 'string' && val.toLowerCase().includes(searchTerm.toLowerCase()))), [clients, searchTerm]);

    return (
        <>
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
                <div><h2 className="text-3xl font-bold text-white">Clientes</h2><p className="text-gray-400 mt-1">Gerencie seus clientes e informações de contato.</p></div>
                <div className="flex items-center space-x-2 mt-4 sm:mt-0 w-full sm:w-auto">
                    <div className="relative flex-grow sm:flex-grow-0"><span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400"><SearchIcon className="w-5 h-5"/></span><input type="search" name="clientSearch" placeholder="Buscar..." className="w-full sm:w-64 bg-gray-800 text-white rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" onChange={(e) => setSearchTerm(e.target.value)} data-dev-id="ClientsPage-search-input" /></div>
                    <button name="clientFieldSettings" onClick={() => {setSettingsModalOpen(true); addLog('Abrindo modal de configurações de campos.');}} className="p-2 text-gray-400 bg-gray-800 rounded-lg hover:bg-gray-700 hover:text-white transition-colors" aria-label="Configurar Campos" data-dev-id="ClientsPage-settings-button"><SettingsIcon className="w-6 h-6" /></button>
                    <button name="addClient" onClick={handleOpenAddModal} className="flex items-center justify-center px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-500 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-blue-500" data-dev-id="ClientsPage-add-button"><PlusIcon className="w-6 h-6 mr-2" />Adicionar</button>
                </div>
            </header>
            <div className="bg-gray-800 rounded-xl shadow-lg">
                {loading ? <ClientTableSkeleton /> : error ? <div className="p-8 text-center text-red-400">{error}</div> : (
                    <>
                        {/* Desktop Table View */}
                        <div className="overflow-x-auto hidden md:block"><table className="w-full text-sm text-left text-gray-300">
                            <thead className="text-xs text-gray-400 uppercase bg-gray-800 border-b border-gray-700"><tr className="border-b border-gray-700/50"><th scope="col" className="px-6 py-4">Cliente</th><th scope="col" className="px-6 py-4">Status</th><th scope="col" className="px-6 py-4 text-right">Ações</th></tr></thead>
                            <tbody>{filteredClients.map((client) => {
                                const displayName = client.trade_name || client.legal_name;
                                return (<tr key={client.id} className="bg-gray-800 border-b border-gray-700/50 hover:bg-gray-700/50 transition-colors" data-dev-id={`ClientsPage-table-row-${client.id}`}>
                                    <th scope="row" className="px-6 py-4 font-medium text-white whitespace-nowrap">
                                        <div>
                                            <div className="text-base font-semibold">{displayName}</div>
                                            <div className="font-normal text-gray-400">{client.customer_type === 'PJ' ? client.legal_name : client.document}</div>
                                            {client.contact_name && <div className="font-normal text-gray-300 text-xs mt-1">Contato: {client.contact_name}</div>}
                                        </div>
                                    </th>
                                    <td className="px-6 py-4"><StatusBadge status={client.status} /></td>
                                    <td className="px-6 py-4 text-right"><div className="flex items-center justify-end space-x-3">
                                        <button name={`editClient-${client.id}`} onClick={() => handleOpenEditModal(client)} className="p-2 text-blue-400 hover:text-blue-300 transition-colors" aria-label={`Visualizar ${displayName}`} data-dev-id={`ClientsPage-table-edit-${client.id}`}><EyeIcon className="w-6 h-6" /></button>
                                        <button name={`deleteClient-${client.id}`} onClick={() => handleOpenDeleteModal(client)} className="p-2 text-red-500 hover:text-red-400 transition-colors" aria-label={`Excluir ${displayName}`} data-dev-id={`ClientsPage-table-delete-${client.id}`}><Trash2Icon className="w-6 h-6" /></button>
                                    </div></td>
                                </tr>);
                            })}</tbody>
                        </table></div>

                        {/* Mobile Card View */}
                        <div className="md:hidden p-4">
                            {filteredClients.map(client => (
                                <ClientCard key={client.id} client={client} onEdit={handleOpenEditModal} onDelete={handleOpenDeleteModal} />
                            ))}
                        </div>
                    </>
                )}
                {!loading && filteredClients.length === 0 && <div className="p-8 text-center text-gray-400">{clients.length > 0 ? `Nenhum cliente encontrado com o termo "${searchTerm}".` : 'Nenhum cliente cadastrado. Adicione um para começar.'}</div>}
            </div>
            {isFormModalOpen && <ClientFormModal isOpen={isFormModalOpen} onClose={handleCloseModals} onSave={handleSaveClient} client={selectedEntidade} fieldSettings={fieldSettings} addLog={addLog} isSaving={isSaving} />}
            <DeleteConfirmationModal isOpen={isDeleteModalOpen} onClose={handleCloseModals} onConfirm={handleConfirmDelete} bodyText={`Tem certeza que deseja excluir o cliente "${selectedEntidade?.trade_name || selectedEntidade?.legal_name}"? Esta ação não pode ser desfeita.`} />
            <FieldSettingsModal isOpen={isSettingsModalOpen} onClose={() => setSettingsModalOpen(false)} onSave={handleSaveSettings} initialSettings={fieldSettings} />
        </>
    );
};