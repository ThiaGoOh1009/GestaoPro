import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { backend } from '../../services/storage';
import { SpinnerIcon, RouteIcon, Trash2Icon, ArrowLeftIcon, CheckCircle2Icon } from '../../components/Icons';
import { DeleteConfirmationModal } from '../../components/Modal';
import { ChamadoCard } from '../chamados/ChamadoCard';
import { ChamadoFormModal } from '../chamados/ChamadoFormModal';
import { FaturamentoModal } from '../chamados/FaturamentoModal';

export const RotasPage = ({ addLog }) => {
    const [rotas, setRotas] = useState([]);
    const [chamados, setChamados] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('Aberta'); // 'Aberta' or 'Finalizada'
    
    const [selectedRota, setSelectedRota] = useState(null);
    const [chamadosNaRota, setChamadosNaRota] = useState([]);
    
    const [isDeleteRotaModalOpen, setDeleteRotaModalOpen] = useState(false);
    const [rotaToDelete, setRotaToDelete] = useState(null);

    const [isChamadoFormOpen, setChamadoFormOpen] = useState(false);
    const [chamadoToEdit, setChamadoToEdit] = useState(null);
    
    const [isFaturamentoModalOpen, setFaturamentoModalOpen] = useState(false);
    const [chamadoToInvoice, setChamadoToInvoice] = useState(null);

    const [isDeleteChamadoModalOpen, setDeleteChamadoModalOpen] = useState(false);
    const [chamadoToDelete, setChamadoToDelete] = useState(null);

    const loadData = useCallback(async (showLoading = true) => {
        if (showLoading) setLoading(true);
        try {
            const [rotasData, chamadosData] = await Promise.all([
                backend.getRotas(),
                backend.getChamados(),
            ]);
            setRotas(rotasData);
            setChamados(chamadosData);
            if (showLoading) addLog(`Carregadas ${rotasData.length} rotas.`);
        } catch (error) {
            addLog(`Erro ao carregar rotas: ${error.message}`);
        } finally {
            if (showLoading) setLoading(false);
        }
    }, [addLog]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    useEffect(() => {
        if (selectedRota) {
            const chamadosDetails = selectedRota.chamadoIds
                .map(id => chamados.find(c => c.id === id))
                .filter(Boolean);
            setChamadosNaRota(chamadosDetails);
        } else {
            setChamadosNaRota([]);
        }
    }, [selectedRota, chamados]);

    const handleSelectRota = (rota) => setSelectedRota(rota);
    const handleBackToRotas = () => setSelectedRota(null);

    // Rota Actions
    const handleOpenDeleteRotaModal = (rota) => { setRotaToDelete(rota); setDeleteRotaModalOpen(true); };
    const handleConfirmDeleteRota = async () => {
        if (!rotaToDelete) return;
        try {
            await backend.updateChamados(rotaToDelete.chamadoIds, { inRoute: false });
            await backend.deleteRota(rotaToDelete.id);
            addLog(`Rota "${rotaToDelete.region}" excluída e chamados liberados.`);
            handleBackToRotas();
            loadData(false);
        } catch(e) { addLog(`Erro ao deletar rota: ${e.message}`); }
        setDeleteRotaModalOpen(false);
        setRotaToDelete(null);
    };

    // Chamado Actions
    const handleEditChamado = (chamado) => { setChamadoToEdit(chamado); setChamadoFormOpen(true); };
    const handleFinishChamado = (chamado) => { setChamadoToInvoice(chamado); setFaturamentoModalOpen(true); };
    const handleDeleteChamado = (chamado) => { setChamadoToDelete(chamado); setDeleteChamadoModalOpen(true); };
    
    const handleConfirmFaturamento = async (paymentMethod) => {
        if (!chamadoToInvoice) return;
        try {
            await backend.invoiceChamado(chamadoToInvoice, paymentMethod);
            addLog(`Chamado #${chamadoToInvoice.id} finalizado.`);
            
            // Reload data to get the latest state of rotas and chamados
            const rotasData = await backend.getRotas();
            const chamadosData = await backend.getChamados();
            setRotas(rotasData);
            setChamados(chamadosData);

            // Check the status of the CURRENTLY selected route from the NEWLY fetched data
            const updatedCurrentRota = rotasData.find(r => r.id === selectedRota.id);

            if (updatedCurrentRota && updatedCurrentRota.status === 'Finalizada') {
                addLog(`Rota "${updatedCurrentRota.region}" finalizada. Retornando para a lista de rotas.`);
                handleBackToRotas();
            }

        } catch (error) {
            const err = error as Error;
            addLog(`Erro ao finalizar chamado: ${err.message}`);
            alert(`Erro ao finalizar chamado: ${err.message}`);
        }
        setFaturamentoModalOpen(false);
        setChamadoToInvoice(null);
    };

    const handleConfirmDeleteChamado = async () => {
        if (!chamadoToDelete) return;
        try {
            await backend.deleteChamado(chamadoToDelete.id);
            addLog(`Chamado #${chamadoToDelete.id} excluído.`);
            // Optimistic update
            const updatedChamados = chamados.filter(c => c.id !== chamadoToDelete.id);
            setChamados(updatedChamados);
            const updatedRota = { ...selectedRota, chamadoIds: selectedRota.chamadoIds.filter(id => id !== chamadoToDelete.id) };
            setSelectedRota(updatedRota);
            // Also update the full rota in storage
            const allRotas = await backend.getRotas();
            const rotaIndex = allRotas.findIndex(r => r.id === selectedRota.id);
            if (rotaIndex > -1) {
                allRotas[rotaIndex] = updatedRota;
                await backend.saveRotas(allRotas);
            }
        } catch(e) { addLog(`Erro ao excluir chamado: ${e.message}`); }
        setDeleteChamadoModalOpen(false);
        setChamadoToDelete(null);
    };

    const handleSaveChamado = async (chamadoData) => {
        try {
            await backend.saveChamado(chamadoData);
            addLog(`Chamado #${chamadoData.id} atualizado.`);
            // Optimistic update
            const updatedChamados = chamados.map(c => c.id === chamadoData.id ? {...c, ...chamadoData} : c);
            setChamados(updatedChamados);
        } catch(e) { addLog(`Erro ao salvar chamado: ${e.message}`); }
        setChamadoFormOpen(false);
        setChamadoToEdit(null);
    };
    
    const filteredRotas = useMemo(() => {
        return rotas.filter(r => r.status === filterStatus).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [rotas, filterStatus]);

    if (loading) {
        return <div className="flex justify-center items-center h-full"><SpinnerIcon className="w-8 h-8 text-white" /></div>;
    }

    if (selectedRota) {
        const isRotaFinished = selectedRota.status === 'Finalizada';
        return (
             <>
                <header className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <button onClick={handleBackToRotas} className="p-2 text-gray-400 rounded-full hover:bg-gray-700 hover:text-white transition-colors" aria-label="Voltar para a lista de rotas">
                            <ArrowLeftIcon className="w-6 h-6" />
                        </button>
                        <div>
                            <h2 className="text-3xl font-bold text-white">{selectedRota.region}</h2>
                            <p className="text-gray-400 mt-1">{chamadosNaRota.length} chamado(s) nesta rota.</p>
                        </div>
                    </div>
                    {isRotaFinished ? (
                         <span className="flex items-center px-4 py-2 text-sm font-semibold text-green-300 bg-green-500/20 rounded-lg">
                            <CheckCircle2Icon className="w-5 h-5 mr-2"/>Rota Finalizada
                        </span>
                    ) : (
                        <button onClick={() => handleOpenDeleteRotaModal(selectedRota)} className="flex items-center px-4 py-2 text-sm font-semibold text-red-400 bg-red-500/10 rounded-lg hover:bg-red-500/20 transition-colors">
                            <Trash2Icon className="w-4 h-4 mr-2" />
                            Excluir Rota
                        </button>
                    )}
                </header>
                {chamadosNaRota.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {chamadosNaRota.map(chamado => (
                            <ChamadoCard
                                key={chamado.id}
                                chamado={chamado}
                                context="rotas"
                                onEdit={!isRotaFinished ? handleEditChamado : undefined}
                                onFinish={!isRotaFinished ? handleFinishChamado : undefined}
                                onDelete={!isRotaFinished ? handleDeleteChamado : undefined}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 bg-gray-800 rounded-lg">
                        <RouteIcon className="mx-auto w-12 h-12 text-gray-500" />
                        <h3 className="mt-4 text-lg font-medium text-white">Nenhum chamado nesta rota</h3>
                        <p className="mt-1 text-sm text-gray-400">Esta rota está vazia. Você pode excluí-la ou voltar.</p>
                    </div>
                )}
                 {isChamadoFormOpen && <ChamadoFormModal isOpen={isChamadoFormOpen} onClose={() => setChamadoFormOpen(false)} onSave={handleSaveChamado} chamado={chamadoToEdit} addLog={addLog} isClientLocked={true} />}
                 {isFaturamentoModalOpen && <FaturamentoModal isOpen={isFaturamentoModalOpen} onClose={() => setFaturamentoModalOpen(false)} onConfirm={handleConfirmFaturamento} chamado={chamadoToInvoice} />}
                 <DeleteConfirmationModal isOpen={isDeleteChamadoModalOpen} onClose={() => setDeleteChamadoModalOpen(false)} onConfirm={handleConfirmDeleteChamado} bodyText={`Tem certeza que deseja excluir o chamado para "${chamadoToDelete?.clientName}"? Esta ação não pode ser desfeita.`} />
             </>
        )
    }

    return (
        <>
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
                <div>
                    <h2 className="text-3xl font-bold text-white">Rotas de Atendimento</h2>
                    <p className="text-gray-400 mt-1">Selecione uma rota para ver os detalhes e gerenciar os chamados.</p>
                </div>
                 <div className="flex rounded-lg bg-gray-800 p-1 mt-4 sm:mt-0">
                    <button
                        onClick={() => setFilterStatus('Aberta')}
                        className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors ${filterStatus === 'Aberta' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}
                    >
                        Abertas
                    </button>
                    <button
                        onClick={() => setFilterStatus('Finalizada')}
                        className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors ${filterStatus === 'Finalizada' ? 'bg-green-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}
                    >
                        Finalizadas
                    </button>
                </div>
            </header>

            {filteredRotas.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredRotas.map(rota => {
                        const isFinished = rota.status === 'Finalizada';
                        return (
                            <div 
                                key={rota.id} 
                                onClick={() => handleSelectRota(rota)} 
                                className={`bg-gray-800 rounded-xl p-6 shadow-lg hover:shadow-blue-500/10 transition-all duration-300 cursor-pointer flex flex-col justify-between ${isFinished ? 'ring-1 ring-green-500/50 opacity-75' : 'hover:ring-2 ring-blue-500'}`}
                            >
                                <div>
                                    <div className="flex justify-between items-start">
                                        <h3 className="text-xl font-bold text-white mb-2">{rota.region}</h3>
                                        {isFinished ? <CheckCircle2Icon className="w-6 h-6 text-green-500"/> : <RouteIcon className="w-6 h-6 text-gray-500"/>}
                                    </div>
                                    <p className="text-sm text-gray-400">
                                        <span className="font-semibold text-gray-200">{rota.chamadoIds.length}</span> chamado(s)
                                    </p>
                                </div>
                                <div className="mt-4 pt-4 border-t border-gray-700/50">
                                    <p className="text-xs text-gray-500">Criada em: {new Date(rota.createdAt).toLocaleDateString()}</p>
                                </div>
                            </div>
                        )
                    })}
                </div>
            ) : (
                <div className="text-center py-12 bg-gray-800 rounded-lg">
                    <RouteIcon className="mx-auto w-12 h-12 text-gray-500" />
                    <h3 className="mt-4 text-lg font-medium text-white">Nenhuma rota {filterStatus === 'Aberta' ? 'aberta' : 'finalizada'}</h3>
                    <p className="mt-1 text-sm text-gray-400">{filterStatus === 'Aberta' ? 'Vá para a página de Chamados para criar uma nova rota.' : 'Nenhuma rota foi finalizada ainda.'}</p>
                </div>
            )}
            
            <DeleteConfirmationModal isOpen={isDeleteRotaModalOpen} onClose={() => setDeleteRotaModalOpen(false)} onConfirm={handleConfirmDeleteRota} bodyText={`Tem certeza que deseja excluir a rota para "${rotaToDelete?.region}"? Os chamados serão liberados e voltarão para a lista principal.`} />
        </>
    );
};