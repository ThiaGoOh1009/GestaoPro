import React, { useState, useEffect, useCallback } from 'react';
import { backend } from '../../services/storage';
import { PlusIcon, Edit2Icon, Trash2Icon, RouteIcon, CheckCheckIcon } from '../../components/Icons';
import { RegiaoFormModal } from './RegiaoFormModal';
import { DeleteConfirmationModal } from '../../components/Modal';

const RegiaoCard = ({ regiao, onEdit, onDelete }) => (
    <div className="bg-gray-800 rounded-xl p-5 flex flex-col justify-between shadow-lg hover:shadow-blue-500/10 hover:-translate-y-1 transition-all duration-300">
        <div>
            <div className="flex justify-between items-start mb-4">
                <h3 className="font-bold text-white text-lg">{regiao.name}</h3>
                <div className="flex items-center space-x-3">
                    <button onClick={() => onEdit(regiao)} className="text-blue-400 hover:text-blue-300 transition-colors" aria-label={`Editar ${regiao.name}`}><Edit2Icon className="w-5 h-5" /></button>
                    <button onClick={() => onDelete(regiao)} className="text-red-500 hover:text-red-400 transition-colors" aria-label={`Excluir ${regiao.name}`}><Trash2Icon className="w-5 h-5" /></button>
                </div>
            </div>
            <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto sidebar-scroll pr-2">
                {regiao.neighborhoods.length > 0 ? (
                    regiao.neighborhoods.sort((a,b) => a.localeCompare(b)).map(bairro => (
                        <span key={bairro} className="px-2.5 py-1 text-xs font-medium rounded-full bg-gray-700 text-gray-300">{bairro}</span>
                    ))
                ) : (
                    <p className="text-sm text-gray-500 italic">Nenhum bairro cadastrado.</p>
                )}
            </div>
        </div>
    </div>
);


export const RegioesPage = ({ addLog }) => {
    const [regioes, setRegioes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [pendingNeighborhoods, setPendingNeighborhoods] = useState([]);
    const [assignments, setAssignments] = useState<{ [key: string]: string }>({});

    const [isFormModalOpen, setFormModalOpen] = useState(false);
    const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
    const [selectedRegiao, setSelectedRegiao] = useState(null);

    const loadData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [regioesData, pendingData] = await Promise.all([
                backend.getRegioes(),
                backend.getPendingNeighborhoods()
            ]);
            setRegioes(regioesData);
            setPendingNeighborhoods(pendingData);
            setAssignments({}); // Reset assignments on reload
            addLog(`${regioesData.length} regiões e ${pendingData.length} bairros pendentes carregados.`);
        } catch (err) {
            setError(err.message);
            addLog(`ERRO ao carregar dados de regiões: ${err.message}`);
        } finally {
            setLoading(false);
        }
    }, [addLog]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleOpenAddModal = () => { setSelectedRegiao(null); setFormModalOpen(true); };
    const handleOpenEditModal = (r) => { setSelectedRegiao(r); setFormModalOpen(true); };
    const handleOpenDeleteModal = (r) => { setSelectedRegiao(r); setDeleteModalOpen(true); };
    const handleCloseModals = () => { setFormModalOpen(false); setDeleteModalOpen(false); setSelectedRegiao(null); };

    const handleSaveRegiao = async (regiaoData) => {
        try {
            const updated = await backend.saveRegiao(regiaoData);
            setRegioes(updated);
            addLog(`Região "${regiaoData.name}" foi salva com sucesso.`);
            handleCloseModals();
        } catch (err) {
            addLog(`ERRO ao salvar região: ${err.message}`);
            alert(`Erro ao salvar região: ${err.message}`);
        }
    };

    const handleConfirmDelete = async () => {
        if (selectedRegiao) {
            const updated = await backend.deleteRegiao(selectedRegiao.id);
            setRegioes(updated);
            addLog(`Região "${selectedRegiao.name}" foi excluída.`);
        }
        handleCloseModals();
    };
    
    const handleAssignNeighborhood = async (neighborhood) => {
        const regionId = assignments[neighborhood];
        if (!regionId) {
            alert("Por favor, selecione uma região para atribuir.");
            return;
        }

        const regionToUpdate = regioes.find(r => r.id === parseInt(regionId, 10));
        if (!regionToUpdate) return;
        
        try {
            const updatedRegion = {
                ...regionToUpdate,
                neighborhoods: [...regionToUpdate.neighborhoods, neighborhood].sort((a, b) => a.localeCompare(b))
            };
            await backend.saveRegiao(updatedRegion);
            await backend.deletePendingNeighborhood(neighborhood);
            await backend.updateClientsRegion(neighborhood, updatedRegion.name);

            addLog(`Bairro "${neighborhood}" atribuído à região "${updatedRegion.name}" e clientes atualizados.`);
            loadData();
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            addLog(`ERRO ao atribuir bairro: ${errorMessage}`);
            alert(`Erro ao atribuir bairro: ${errorMessage}`);
        }
    };

    return (
        <>
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
                <div>
                    <h2 className="text-3xl font-bold text-white">Regiões e Bairros</h2>
                    <p className="text-gray-400 mt-1">Gerencie as regiões de atendimento e seus bairros.</p>
                </div>
                <button onClick={handleOpenAddModal} className="flex items-center justify-center px-4 py-2 mt-4 sm:mt-0 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-500 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-blue-500">
                    <PlusIcon className="w-4 h-4 mr-2" />
                    Adicionar Região
                </button>
            </header>
            
            {loading ? (<p className="text-center text-gray-400">Carregando...</p>) : 
             error ? (<div className="p-8 text-center text-red-400">{error}</div>) : 
             (<>
                {pendingNeighborhoods.length > 0 && (
                 <div className="bg-yellow-900/50 border border-yellow-700 rounded-xl shadow-lg p-6 mb-8">
                     <h3 className="text-xl font-semibold text-yellow-200 mb-4">Bairros Pendentes de Região</h3>
                     <p className="text-sm text-yellow-300 mb-4">Atribua estes bairros a uma região existente para organizar seus clientes.</p>
                     <ul className="space-y-3">
                        {pendingNeighborhoods.sort((a,b) => a.localeCompare(b)).map(bairro => (
                            <li key={bairro} className="flex flex-col sm:flex-row justify-between items-center bg-gray-700/50 p-3 rounded-lg gap-3">
                                <span className="font-medium text-white flex-grow text-left w-full sm:w-auto">{bairro}</span>
                                <div className="flex items-center space-x-3 w-full sm:w-auto">
                                    <select 
                                        value={assignments[bairro] || ''} 
                                        onChange={(e) => setAssignments(prev => ({...prev, [bairro]: e.target.value}))}
                                        className="w-full sm:w-64 bg-gray-900 text-white rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 custom-select"
                                        aria-label={`Selecionar região para ${bairro}`}
                                    >
                                        <option value="" disabled>Selecione uma região</option>
                                        {regioes.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                                    </select>
                                    <button 
                                        onClick={() => handleAssignNeighborhood(bairro)} 
                                        className="flex items-center text-xs px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-md transition-colors" 
                                        title="Atribuir à Região"
                                    >
                                        <CheckCheckIcon className="w-4 h-4 mr-1.5"/> Atribuir
                                    </button>
                                </div>
                            </li>
                        ))}
                     </ul>
                 </div>
                )}
                
                {regioes.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {regioes.map(regiao => (
                            <RegiaoCard key={regiao.id} regiao={regiao} onEdit={handleOpenEditModal} onDelete={handleOpenDeleteModal} />
                        ))}
                    </div>
                ) : (
                    !pendingNeighborhoods.length && (
                        <div className="text-center py-12 bg-gray-800 rounded-lg">
                            <RouteIcon className="mx-auto w-12 h-12 text-gray-500" />
                            <h3 className="mt-4 text-lg font-medium text-white">Nenhuma região cadastrada</h3>
                            <p className="mt-1 text-sm text-gray-400">Comece adicionando uma nova região de atendimento.</p>
                            <div className="mt-6">
                                <button onClick={handleOpenAddModal} className="flex items-center mx-auto justify-center px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-500 transition-colors">
                                    <PlusIcon className="w-4 h-4 mr-2" />
                                    Adicionar Região
                                </button>
                            </div>
                        </div>
                    )
                )}
             </>)
            }

            {isFormModalOpen && <RegiaoFormModal isOpen={isFormModalOpen} onClose={handleCloseModals} onSave={handleSaveRegiao} regiao={selectedRegiao} />}
            <DeleteConfirmationModal isOpen={isDeleteModalOpen} onClose={handleCloseModals} onConfirm={handleConfirmDelete} bodyText={`Tem certeza que deseja excluir a região "${selectedRegiao?.name}"? Esta ação não pode ser desfeita.`} />
        </>
    );
};