import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { backend, storage } from '../../services/storage';
import { ClientTableSkeleton, StatusBadge } from '../../components/Generic';
import { SearchIcon, SettingsIcon, PlusIcon, Edit2Icon, Trash2Icon } from '../../components/Icons';
import { ClientFormModal } from './ClientFormModal';
import { DeleteConfirmationModal } from '../../components/Modal';
import { FieldSettingsModal } from './FieldSettingsModal';

export const ClientsPage = ({ addLog }) => {
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [isFormModalOpen, setFormModalOpen] = useState(false);
    const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
    const [isSettingsModalOpen, setSettingsModalOpen] = useState(false);
    const [selectedClient, setSelectedClient] = useState(null);
    const [fieldSettings, setFieldSettings] = useState({ email: false, phone: false });

    const loadClients = useCallback(async () => {
        setLoading(true);
        setError(null);
        try { const data = await backend.getClientes(); setClients(data); }
        catch (err) { setError(err.message); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { loadClients(); setFieldSettings(storage.loadClientFieldSettings()); }, [loadClients]);

    const handleOpenAddModal = () => { setSelectedClient(null); setFormModalOpen(true); };
    const handleOpenEditModal = (c) => { setSelectedClient(c); setFormModalOpen(true); };
    const handleOpenDeleteModal = (c) => { setSelectedClient(c); setDeleteModalOpen(true); };
    const handleCloseModals = () => { setFormModalOpen(false); setDeleteModalOpen(false); setSettingsModalOpen(false); setSelectedClient(null); };

    const handleSaveClient = async (clientData) => {
        try {
            const updated = await backend.saveCliente(clientData);
            setClients(updated);
            addLog(`Cliente "${clientData.legalName}" foi salvo com sucesso.`);
            handleCloseModals();
        }
        catch (err) { 
            addLog(`ERRO ao salvar cliente: ${err.message}`);
            alert(`Erro ao salvar cliente: ${err.message}`); 
        }
    };

    const handleConfirmDelete = async () => { 
        if (selectedClient) {
             const updated = await backend.deleteCliente(selectedClient.id); 
             setClients(updated);
             addLog(`Cliente "${selectedClient.legalName}" foi excluído.`);
        }
        handleCloseModals(); 
    };
    const handleSaveSettings = (newSettings) => { setFieldSettings(newSettings); storage.saveClientFieldSettings(newSettings); setSettingsModalOpen(false); };

    const filteredClients = useMemo(() => clients.filter(c => Object.values(c).some(val => typeof val === 'string' && val.toLowerCase().includes(searchTerm.toLowerCase()))), [clients, searchTerm]);

    return (
        <>
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
                <div><h2 className="text-3xl font-bold text-white">Clientes</h2><p className="text-gray-400 mt-1">Gerencie seus clientes e informações de contato.</p></div>
                <div className="flex items-center space-x-2 mt-4 sm:mt-0 w-full sm:w-auto">
                    <div className="relative flex-grow sm:flex-grow-0"><span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400"><SearchIcon className="w-5 h-5"/></span><input type="search" placeholder="Buscar..." className="w-full sm:w-64 bg-gray-800 text-white rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" onChange={(e) => setSearchTerm(e.target.value)} /></div>
                    <button onClick={() => setSettingsModalOpen(true)} className="p-2 text-gray-400 bg-gray-800 rounded-lg hover:bg-gray-700 hover:text-white transition-colors" aria-label="Configurar Campos"><SettingsIcon className="w-5 h-5" /></button>
                    <button onClick={handleOpenAddModal} className="flex items-center justify-center px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-500 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-blue-500"><PlusIcon className="w-4 h-4 mr-2" />Adicionar</button>
                </div>
            </header>
            <div className="bg-gray-800 rounded-xl shadow-lg">
                {loading ? <ClientTableSkeleton /> : error ? <div className="p-8 text-center text-red-400">{error}</div> : (
                    <div className="overflow-x-auto"><table className="w-full text-sm text-left text-gray-300">
                        <thead className="text-xs text-gray-400 uppercase bg-gray-800 border-b border-gray-700"><tr className="border-b border-gray-700/50"><th scope="col" className="px-6 py-4">Cliente</th><th scope="col" className="px-6 py-4 hidden md:table-cell">Localização</th><th scope="col" className="px-6 py-4 hidden sm:table-cell">Telefone</th><th scope="col" className="px-6 py-4">Status</th><th scope="col" className="px-6 py-4 text-right">Ações</th></tr></thead>
                        <tbody>{filteredClients.map((client) => {
                            const displayName = client.tradeName || client.legalName;
                            return (<tr key={client.id} className="bg-gray-800 border-b border-gray-700/50 hover:bg-gray-700/50 transition-colors">
                                <th scope="row" className="px-6 py-4 font-medium text-white whitespace-nowrap"><div className="flex items-center">
                                    <img className="w-10 h-10 rounded-full object-cover bg-gray-700" src={`https://i.pravatar.cc/100?u=${client.id}`} alt={displayName} />
                                    <div className="pl-3"><div className="text-base font-semibold">{displayName}</div><div className="font-normal text-gray-400">{client.customerType === 'PJ' ? client.legalName : client.document}</div></div>
                                </div></th>
                                <td className="px-6 py-4 hidden md:table-cell">{client.address?.city && client.address?.state ? `${client.address.city}, ${client.address.state}` : 'N/A'}</td>
                                <td className="px-6 py-4 hidden sm:table-cell">{client.phone || 'N/A'}</td>
                                <td className="px-6 py-4"><StatusBadge status={client.status} /></td>
                                <td className="px-6 py-4 text-right"><div className="flex items-center justify-end space-x-3"><button onClick={() => handleOpenEditModal(client)} className="text-blue-400 hover:text-blue-300 transition-colors" aria-label={`Editar ${displayName}`}><Edit2Icon className="w-5 h-5" /></button><button onClick={() => handleOpenDeleteModal(client)} className="text-red-500 hover:text-red-400 transition-colors" aria-label={`Excluir ${displayName}`}><Trash2Icon className="w-5 h-5" /></button></div></td>
                            </tr>);
                        })}</tbody>
                    </table></div>
                )}
                {!loading && filteredClients.length === 0 && <div className="p-8 text-center text-gray-400">{clients.length > 0 ? `Nenhum cliente encontrado com o termo "${searchTerm}".` : 'Nenhum cliente cadastrado. Adicione um para começar.'}</div>}
            </div>
            {isFormModalOpen && <ClientFormModal isOpen={isFormModalOpen} onClose={handleCloseModals} onSave={handleSaveClient} client={selectedClient} fieldSettings={fieldSettings} addLog={addLog} />}
            <DeleteConfirmationModal isOpen={isDeleteModalOpen} onClose={handleCloseModals} onConfirm={handleConfirmDelete} bodyText={`Tem certeza que deseja excluir o cliente "${selectedClient?.tradeName || selectedClient?.legalName}"? Esta ação não pode ser desfeita.`} />
            <FieldSettingsModal isOpen={isSettingsModalOpen} onClose={() => setSettingsModalOpen(false)} onSave={handleSaveSettings} initialSettings={fieldSettings} />
        </>
    );
};