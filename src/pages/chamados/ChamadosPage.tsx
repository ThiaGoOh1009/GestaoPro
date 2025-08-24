import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { backend } from '../../services/storage';
import { SearchIcon, PlusIcon, DollarSignIcon, RouteIcon } from '../../components/Icons';
import { ChamadoFormModal } from './ChamadoFormModal';
import { DeleteConfirmationModal, Modal } from '../../components/Modal';
import { FaturamentoModal } from './FaturamentoModal';
import { ConfirmacaoRotaModal } from '../rotas/ConfirmacaoRotaModal';
import { GroupingStrategyModal } from '../rotas/GroupingStrategyModal';
import { RouteNameModal } from '../rotas/RouteNameModal';
import { SelectExistingRouteModal } from '../rotas/SelectExistingRouteModal';
import { ChamadoCard, statusConfig, typeConfig } from './ChamadoCard';

// Modal for Bulk Invoicing
const BulkFaturamentoModal = ({ isOpen, onClose, onConfirm, chamados }) => {
    const [paymentMethod, setPaymentMethod] = useState('À Vista');

    const { totalValue, clientName } = useMemo(() => {
        if (!chamados || chamados.length === 0) {
            return { totalValue: 0, clientName: '' };
        }
        const total = chamados.reduce((acc, chamado) => {
            const chamadoTotal = chamado.items?.reduce((itemAcc, item) => itemAcc + item.totalPrice, 0) || 0;
            return acc + chamadoTotal;
        }, 0);
        return { totalValue: total, clientName: chamados[0].clientName };
    }, [chamados]);

    const formatCurrency = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

    const handleSubmit = () => {
        onConfirm(paymentMethod);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Faturar Chamados em Lote" maxWidth="max-w-lg">
            <div className="space-y-6">
                <div className="bg-gray-900/50 p-4 rounded-lg text-center">
                    <p className="text-sm text-gray-400">Total de {chamados.length} chamado(s) para</p>
                    <p className="text-lg font-semibold text-white">{clientName}</p>
                    <p className="text-4xl font-bold text-green-400 mt-2">{formatCurrency(totalValue)}</p>
                </div>
                <div>
                    <span className="block text-sm font-medium text-gray-300 mb-2">Método de Pagamento</span>
                    <div className="flex rounded-lg bg-gray-700 p-1">
                        <button type="button" onClick={() => setPaymentMethod('À Vista')} className={`flex-1 py-1.5 text-sm font-semibold rounded-md transition-colors ${paymentMethod === 'À Vista' ? 'bg-blue-500 text-white' : 'text-gray-300 hover:bg-gray-600'}`}>À Vista (Caixa)</button>
                        <button type="button" onClick={() => setPaymentMethod('A Prazo')} className={`flex-1 py-1.5 text-sm font-semibold rounded-md transition-colors ${paymentMethod === 'A Prazo' ? 'bg-purple-500 text-white' : 'text-gray-300 hover:bg-gray-600'}`}>A Prazo (Financeiro)</button>
                    </div>
                </div>
                <div className="text-sm text-gray-400 bg-gray-700/50 p-3 rounded-md">
                    {paymentMethod === 'À Vista' ? 'O valor será lançado como uma entrada no Caixa.' : 'Será criada uma conta a receber no Financeiro.'}
                </div>
            </div>
            <div className="flex justify-end space-x-3 pt-6 mt-4 border-t border-gray-700">
                <button type="button" onClick={onClose} className="px-5 py-2 text-sm font-semibold text-gray-300 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors">Cancelar</button>
                <button type="button" onClick={handleSubmit} className="flex items-center px-5 py-2 text-sm font-semibold text-white bg-green-600 rounded-lg hover:bg-green-500 transition-colors">
                    <DollarSignIcon className="w-4 h-4 mr-2" />
                    Confirmar Faturamento
                </button>
            </div>
        </Modal>
    );
};


export const ChamadosPage = ({ addLog, onNavigate }) => {
    const [chamados, setChamados] = useState<any[]>([]);
    const [clients, setClients] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({ status: 'Abertos', requestType: 'Todos', region: 'Todas' });
    const [selectedChamados, setSelectedChamados] = useState<Set<number>>(new Set());
    const [isConfirmRotaModalOpen, setConfirmRotaModalOpen] = useState(false);
    const [isGroupingModalOpen, setGroupingModalOpen] = useState(false);
    const [isRouteNameModalOpen, setRouteNameModalOpen] = useState(false);
    const [isSelectRouteModalOpen, setSelectRouteModalOpen] = useState(false);
    const [openRoutes, setOpenRoutes] = useState<any[]>([]);
    const [overlappingRegions, setOverlappingRegions] = useState<string[]>([]);
    
    const [isFormModalOpen, setFormModalOpen] = useState(false);
    const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
    const [isFaturamentoModalOpen, setFaturamentoModalOpen] = useState(false);
    const [isBulkFaturamentoModalOpen, setBulkFaturamentoModalOpen] = useState(false);
    const [selectedChamado, setSelectedChamado] = useState(null);

    const loadData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [chamadosData, clientsData] = await Promise.all([backend.getChamados(), backend.getClientes()]);
            setChamados(chamadosData);
            setClients(clientsData);
            addLog(`${chamadosData.length} chamados e ${clientsData.length} clientes carregados.`);
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            setError(message);
            addLog(`ERRO ao carregar dados: ${message}`);
        } finally { setLoading(false); }
    }, [addLog]);

    useEffect(() => { loadData(); }, [loadData]);

    const handleOpenAddModal = () => { setSelectedChamado(null); setFormModalOpen(true); };
    const handleOpenEditModal = (c) => { setSelectedChamado(c); setFormModalOpen(true); };
    const handleOpenDeleteModal = (c) => { setSelectedChamado(c); setDeleteModalOpen(true); };
    const handleOpenFaturamentoModal = (c) => { setSelectedChamado(c); setFaturamentoModalOpen(true); };

    const handleCloseModals = () => { 
        setFormModalOpen(false); 
        setDeleteModalOpen(false);
        setFaturamentoModalOpen(false);
        setBulkFaturamentoModalOpen(false);
        setConfirmRotaModalOpen(false);
        setGroupingModalOpen(false);
        setRouteNameModalOpen(false);
        setSelectRouteModalOpen(false);
        setSelectedChamado(null); 
    };
    
    const handleToggleSelect = (chamadoId) => {
        setSelectedChamados(prev => {
            const newSelection = new Set(prev);
            if (newSelection.has(chamadoId)) {
                newSelection.delete(chamadoId);
            } else {
                newSelection.add(chamadoId);
            }
            return newSelection;
        });
    };

    const saveRoutesByRegion = async (append) => {
        const chamadosToRoute = chamados.filter(c => selectedChamados.has(c.id));
        const chamadosByRegion = chamadosToRoute.reduce((acc: Record<string, number[]>, chamado) => {
            const client = clients.find(cl => cl.id === chamado.clientId);
            const region = client?.address?.region || 'Sem Região';
            if (!acc[region]) {
                acc[region] = [];
            }
            acc[region].push(chamado.id);
            return acc;
        }, {} as Record<string, number[]>);

        const openRoutes = await backend.getRotas();
        const routesToSave = Array.isArray(openRoutes) ? [...openRoutes] : [];

        Object.entries(chamadosByRegion).forEach(([region, chamadoIds]) => {
            const existingRoute = append ? routesToSave.find(r => r.region === region && r.status === 'Aberta') : null;
            if (existingRoute) {
                const existingIds = Array.isArray(existingRoute.chamadoIds) ? existingRoute.chamadoIds : [];
                existingRoute.chamadoIds = [...new Set([...existingIds, ...chamadoIds])];
            } else {
                routesToSave.push({ id: Date.now() + Math.random(), region, chamadoIds, createdAt: new Date().toISOString(), status: 'Aberta' });
            }
        });

        await backend.saveRotas(routesToSave);
        await backend.updateChamados(Array.from(selectedChamados), { inRoute: true });
        
        addLog(`Rotas salvas. ${selectedChamados.size} chamados adicionados.`);
        setSelectedChamados(new Set());
        loadData();
    };

    const processRoutesByRegion = async () => {
        const chamadosToRoute = chamados.filter(c => selectedChamados.has(c.id));
        const regions = [...new Set(chamadosToRoute.map(c => clients.find(cl => cl.id === c.clientId)?.address.region).filter(Boolean))];
        const openRoutes = (await backend.getRotas()).filter(r => r.status === 'Aberta');
        
        const overlaps = regions.filter(region => openRoutes.some(r => r.region === region));

        if (overlaps.length > 0) {
            setOverlappingRegions(overlaps as string[]);
            setConfirmRotaModalOpen(true);
        } else {
            await saveRoutesByRegion(false); // Create new routes directly
        }
    };
    
    const handleCreateRouteClick = () => {
        if (selectedChamados.size === 0) return;
        setGroupingModalOpen(true);
    };

    const handleSelectSeparateByRegion = () => {
        handleCloseModals();
        processRoutesByRegion();
    };

    const handleSelectGroupAsSingle = () => {
        setGroupingModalOpen(false);
        setRouteNameModalOpen(true);
    };

    const handleSelectAddToExisting = async () => {
        handleCloseModals();
        const allRoutes = await backend.getRotas();
        const open = allRoutes.filter(r => r.status === 'Aberta');
        setOpenRoutes(open);
        setSelectRouteModalOpen(true);
    };

    const handleConfirmAddToExisting = async (routeId) => {
        const allRoutes = await backend.getRotas();
        const routeIndex = allRoutes.findIndex(r => r.id === routeId);

        if (routeIndex === -1) {
            addLog(`ERRO: Rota com ID ${routeId} não encontrada.`);
            alert('Erro: A rota selecionada não foi encontrada.');
            handleCloseModals();
            return;
        }

        const updatedRoute = { ...allRoutes[routeIndex] };
        const chamadosToAdd = Array.from(selectedChamados);
        const existingChamadoIds = Array.isArray(updatedRoute.chamadoIds) ? updatedRoute.chamadoIds : [];
        updatedRoute.chamadoIds = [...new Set([...existingChamadoIds, ...chamadosToAdd])];
        allRoutes[routeIndex] = updatedRoute;

        await backend.saveRotas(allRoutes);
        await backend.updateChamados(chamadosToAdd, { inRoute: true });
        
        addLog(`${chamadosToAdd.length} chamado(s) adicionados à rota existente "${updatedRoute.region}".`);
        setSelectedChamados(new Set());
        handleCloseModals();
        loadData();
    };

    const handleSaveGroupedRoute = async (routeName) => {
        const chamadoIds = Array.from(selectedChamados);
        const newRoute = {
            id: Date.now(),
            region: routeName.trim(),
            chamadoIds: chamadoIds,
            createdAt: new Date().toISOString(),
            status: 'Aberta'
        };

        const openRoutes = await backend.getRotas();
        const routesToSave = [...openRoutes, newRoute];
        await backend.saveRotas(routesToSave);
        await backend.updateChamados(chamadoIds, { inRoute: true });
        
        addLog(`Rota agrupada "${newRoute.region}" salva com ${chamadoIds.length} chamados.`);
        setSelectedChamados(new Set());
        handleCloseModals();
        loadData();
    };

    const handleSaveChamado = async (chamadoData) => {
        try {
            const updated = await backend.saveChamado(chamadoData);
            setChamados(updated);
            addLog(`Chamado para "${chamadoData.clientName}" foi salvo com sucesso.`);
            handleCloseModals();
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            addLog(`ERRO ao salvar chamado: ${message}`);
            alert(`Erro ao salvar chamado: ${message}`);
        }
    };

    const handleConfirmDelete = async () => {
        if (selectedChamado) {
            const updated = await backend.deleteChamado(selectedChamado.id);
            setChamados(updated);
            addLog(`Chamado para "${selectedChamado.clientName}" foi excluído.`);
        }
        handleCloseModals();
    };

    const handleConfirmFaturamento = async (paymentMethod) => {
        if (selectedChamado) {
            try {
                const updatedChamados = await backend.invoiceChamado(selectedChamado, paymentMethod);
                setChamados(updatedChamados);
                addLog(`Chamado #${selectedChamado.id} faturado (${paymentMethod}).`);
            } catch (error) {
                const message = error instanceof Error ? error.message : String(error);
                addLog(`ERRO ao faturar chamado: ${message}`);
                alert(`Erro ao faturar: ${message}`);
            }
        }
        handleCloseModals();
    };

    const handleConfirmBulkFaturamento = async (paymentMethod) => {
        const chamadosToInvoice = chamados.filter(c => selectedChamados.has(c.id));
        if (chamadosToInvoice.length > 0) {
            try {
                const updatedChamados = await backend.bulkInvoiceChamados(chamadosToInvoice, paymentMethod);
                setChamados(updatedChamados);
                addLog(`${chamadosToInvoice.length} chamados faturados (${paymentMethod}).`);
            } catch (error) {
                const message = error instanceof Error ? error.message : String(error);
                addLog(`ERRO ao faturar chamados em lote: ${message}`);
                alert(`Erro ao faturar: ${message}`);
            }
        }
        setSelectedChamados(new Set());
        handleCloseModals();
    };
    
    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({...prev, [name]: value}));
    };
    
    const availableRegions = useMemo(() => {
        const openChamados = chamados.filter(c => (c.status === 'Aberto' || c.status === 'Em Andamento') && !c.inRoute);
        const regionSet = new Set<string>();
        openChamados.forEach(chamado => {
            const client = clients.find(cl => cl.id === chamado.clientId);
            if (client?.address?.region) {
                regionSet.add(client.address.region);
            }
        });
        return ['Todas', ...Array.from(regionSet).sort()];
    }, [chamados, clients]);

    const filteredChamados = useMemo(() => {
        return chamados.filter(c => {
            const searchMatch = searchTerm === '' || c.clientName.toLowerCase().includes(searchTerm.toLowerCase()) || (c.problemDescription && c.problemDescription.toLowerCase().includes(searchTerm.toLowerCase()));
            
            let statusMatch;
            if (filters.status === 'Abertos') {
                statusMatch = (c.status === 'Aberto' || c.status === 'Em Andamento') && !c.inRoute;
            } else {
                statusMatch = filters.status === 'Todos' || c.status === filters.status;
            }

            const typeMatch = filters.requestType === 'Todos' || c.requestType === filters.requestType;

            const client = clients.find(cl => cl.id === c.clientId);
            const clientRegion = client?.address?.region;
            const regionMatch = filters.region === 'Todas' || (clientRegion && clientRegion === filters.region);
            
            return searchMatch && statusMatch && typeMatch && regionMatch;
        });
    }, [chamados, clients, searchTerm, filters]);

    const areAllSelectedFromSameClient = useMemo(() => {
        if (selectedChamados.size < 2) return true;
        const selectedArray = Array.from(selectedChamados);
        const firstChamado = chamados.find(c => c.id === selectedArray[0]);
        if (!firstChamado) return false;
        const firstClientId = firstChamado.clientId;
        return selectedArray.every(chamadoId => {
            const chamado = chamados.find(c => c.id === chamadoId);
            return chamado && chamado.clientId === firstClientId;
        });
    }, [selectedChamados, chamados]);

    const areSelectedInvoiced = useMemo(() => {
        if (selectedChamados.size === 0) return false;
        return Array.from(selectedChamados).some(chamadoId => {
            const chamado = chamados.find(c => c.id === chamadoId);
            return chamado?.invoiced;
        });
    }, [selectedChamados, chamados]);

    return (
        <>
        <style dangerouslySetInnerHTML={{__html: `
        :root { --color-red-500: #ef4444; --color-blue-500: #3b82f6; --color-green-500: #22c55e; --color-yellow-500: #eab308; --color-gray-500: #6b7280; --color-purple-500: #8b5cf6; }
        .text-red-300 { color: #fca5a5; } .text-red-400 { color: #f87171; }
        .text-blue-300 { color: #93c5fd; } .text-blue-400 { color: #60a5fa; }
        .text-green-300 { color: #86efac; } .text-green-400 { color: #4ade80; }
        .text-yellow-300 { color: #fde047; }
        .text-purple-300 { color: #c4b5fd; } .text-purple-400 { color: #a78bfa; }
        .bg-blue-500\\/20 { background-color: rgba(59, 130, 246, 0.2); }
        .bg-yellow-500\\/20 { background-color: rgba(234, 179, 8, 0.2); }
        .bg-green-500\\/20 { background-color: rgba(34, 197, 94, 0.2); }
        .bg-gray-500\\/20 { background-color: rgba(107, 114, 128, 0.2); }
        `}} />
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
                <div>
                    <h2 className="text-3xl font-bold text-white">Gestão de Chamados</h2>
                    <p className="text-gray-400 mt-1">Centralize e organize todas as solicitações.</p>
                </div>
                 <div className="flex items-center space-x-2 mt-4 sm:mt-0">
                    <button onClick={handleOpenAddModal} className="flex items-center justify-center px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-500 transition-colors"><PlusIcon className="w-4 h-4 mr-2" />Novo Chamado</button>
                </div>
            </header>
            
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4 p-4 bg-gray-800/50 rounded-lg border border-gray-700/50">
                <div className="relative w-full md:w-auto flex-grow"><span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400"><SearchIcon className="w-5 h-5"/></span><input type="search" placeholder="Buscar por cliente ou descrição..." className="w-full bg-gray-700 text-white rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" onChange={(e) => setSearchTerm(e.target.value)} /></div>
                <div className="flex items-center gap-4 flex-wrap">
                    <select name="status" value={filters.status} onChange={handleFilterChange} className="bg-gray-700 text-white rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 custom-select text-sm">
                        <option value="Abertos">Disponíveis para Rota</option>
                        <option value="Todos">Todos Status</option>
                        {Object.keys(statusConfig).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                     <select name="region" value={filters.region} onChange={handleFilterChange} className="bg-gray-700 text-white rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 custom-select text-sm">
                        {availableRegions.map(region => <option key={region} value={region}>{region}</option>)}
                    </select>
                    <select name="requestType" onChange={handleFilterChange} className="bg-gray-700 text-white rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 custom-select text-sm"><option value="Todos">Todos os Tipos</option>{Object.keys(typeConfig).map(t => <option key={t} value={t}>{t}</option>)}</select>
                </div>
            </div>

            {loading ? (<p className="text-center text-gray-400">Carregando chamados...</p>) : 
             error ? (<div className="p-8 text-center text-red-400">{error}</div>) :
             filteredChamados.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredChamados.map(chamado => (
                        <ChamadoCard 
                            key={chamado.id} 
                            chamado={chamado} 
                            context="chamados"
                            onEdit={handleOpenEditModal} 
                            onDelete={handleOpenDeleteModal} 
                            onFaturar={handleOpenFaturamentoModal}
                            isSelected={selectedChamados.has(chamado.id)}
                            onToggleSelect={handleToggleSelect}
                        />
                    ))}
                </div>
             ) : (
                <div className="p-8 text-center text-gray-400 bg-gray-800 rounded-lg">
                    {chamados.length > 0 ? 'Nenhum chamado encontrado com os filtros aplicados.' : 'Nenhum chamado cadastrado. Crie um para começar.'}
                </div>
             )}

            {selectedChamados.size > 0 && (
                 <div className="fixed bottom-6 right-6 z-30 flex flex-col items-end gap-3">
                    <div className="relative group">
                        <button 
                            onClick={() => {
                                if (areAllSelectedFromSameClient && !areSelectedInvoiced) {
                                    setBulkFaturamentoModalOpen(true);
                                }
                            }}
                            disabled={!areAllSelectedFromSameClient || areSelectedInvoiced}
                            className="flex items-center justify-center px-6 py-3 text-base font-semibold text-white bg-green-600 rounded-full shadow-lg hover:bg-green-500 transition-transform transform hover:scale-105 disabled:bg-gray-500 disabled:cursor-not-allowed disabled:transform-none"
                        >
                            <DollarSignIcon className="w-5 h-5 mr-2" />
                            Faturar ({selectedChamados.size})
                        </button>
                        {(!areAllSelectedFromSameClient || areSelectedInvoiced) && (
                             <div className="absolute bottom-full mb-2 right-0 w-64 p-2 text-xs text-white bg-gray-900 rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                {!areAllSelectedFromSameClient && "Para faturamento em lote, todos os chamados devem ser do mesmo cliente."}
                                {areSelectedInvoiced && "Um ou mais chamados selecionados já foram faturados."}
                            </div>
                        )}
                    </div>
                    <button 
                        onClick={handleCreateRouteClick}
                        className="flex items-center justify-center px-6 py-3 text-base font-semibold text-white bg-blue-600 rounded-full shadow-lg hover:bg-blue-500 transition-transform transform hover:scale-105"
                    >
                        <RouteIcon className="w-5 h-5 mr-2" />
                        Criar Rota ({selectedChamados.size})
                    </button>
                </div>
            )}
            
            {isFormModalOpen && <ChamadoFormModal isOpen={isFormModalOpen} onClose={handleCloseModals} onSave={handleSaveChamado} chamado={selectedChamado} addLog={addLog} />}
            {isFaturamentoModalOpen && <FaturamentoModal isOpen={isFaturamentoModalOpen} onClose={handleCloseModals} onConfirm={handleConfirmFaturamento} chamado={selectedChamado} />}
            {isBulkFaturamentoModalOpen && <BulkFaturamentoModal isOpen={isBulkFaturamentoModalOpen} onClose={handleCloseModals} onConfirm={handleConfirmBulkFaturamento} chamados={chamados.filter(c => selectedChamados.has(c.id))} />}
            <DeleteConfirmationModal isOpen={isDeleteModalOpen} onClose={handleCloseModals} onConfirm={handleConfirmDelete} bodyText={`Tem certeza que deseja excluir o chamado para "${selectedChamado?.clientName}"? Esta ação não pode ser desfeita.`} />
            <ConfirmacaoRotaModal 
                isOpen={isConfirmRotaModalOpen} 
                onClose={handleCloseModals}
                onAppend={() => { saveRoutesByRegion(true); handleCloseModals(); }}
                onCreateNew={() => { saveRoutesByRegion(false); handleCloseModals(); }}
                regions={overlappingRegions} 
            />
            <GroupingStrategyModal 
                isOpen={isGroupingModalOpen}
                onClose={handleCloseModals}
                onSeparateByRegion={handleSelectSeparateByRegion}
                onGroupAsSingle={handleSelectGroupAsSingle}
                onAddToExisting={handleSelectAddToExisting}
            />
            <RouteNameModal 
                isOpen={isRouteNameModalOpen}
                onClose={handleCloseModals}
                onSave={handleSaveGroupedRoute}
            />
            <SelectExistingRouteModal
                isOpen={isSelectRouteModalOpen}
                onClose={handleCloseModals}
                onConfirm={handleConfirmAddToExisting}
                openRoutes={openRoutes}
            />
        </>
    );
};