import React, { useState, useEffect, useCallback, useMemo } from 'react';
import ReactDOM from 'react-dom/client';
import ReactDOMServer from 'react-dom/server';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { supabaseService } from '../../services/storage';
import { SearchIcon, PlusIcon, DollarSignIcon, RouteIcon, PrinterIcon, AlertCircleIcon } from '../../components/Icons';
import { ChamadoFormModal } from './ChamadoFormModal';
import { DeleteConfirmationModal, Modal } from '../../components/Modal';
import { FaturamentoModal } from './FaturamentoModal';
import { ConfirmacaoRotaModal } from '../rotas/ConfirmacaoRotaModal';
import { GroupingStrategyModal } from '../rotas/GroupingStrategyModal';
import { RouteNameModal } from '../rotas/RouteNameModal';
import { SelectExistingRouteModal } from '../rotas/SelectExistingRouteModal';
import { ChamadoCard, statusConfig, typeConfig } from './ChamadoCard';
import { ChamadoPrintLayout } from './ChamadoPrintLayout';

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
        return { totalValue: total, clientName: chamados[0].client_name };
    }, [chamados]);

    const formatCurrency = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

    const handleSubmit = () => {
        onConfirm(paymentMethod);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Faturar Chamados em Lote" maxWidth="max-w-lg" closeOnBackdropClick={false} closeOnEscape={false} showCloseButton={false}>
            <div className="space-y-6">
                <div className="bg-gray-900/50 p-4 rounded-lg text-center">
                    <p className="text-sm text-gray-400">Total de {chamados.length} chamado(s) para</p>
                    <p className="text-lg font-semibold text-white">{clientName}</p>
                    <p className="text-4xl font-bold text-green-400 mt-2">{formatCurrency(totalValue)}</p>
                </div>
                <div>
                    <span className="block text-sm font-medium text-gray-300 mb-2">Método de Pagamento</span>
                    <div className="flex rounded-lg bg-gray-700 p-1">
                        <button type="button" name="paymentMethodVista" onClick={() => setPaymentMethod('À Vista')} className={`flex-1 py-1.5 text-sm font-semibold rounded-md transition-colors ${paymentMethod === 'À Vista' ? 'bg-blue-500 text-white' : 'text-gray-300 hover:bg-gray-600'}`}>À Vista (Caixa)</button>
                        <button type="button" name="paymentMethodPrazo" onClick={() => setPaymentMethod('A Prazo')} className={`flex-1 py-1.5 text-sm font-semibold rounded-md transition-colors ${paymentMethod === 'A Prazo' ? 'bg-purple-500 text-white' : 'text-gray-300 hover:bg-gray-600'}`}>A Prazo (Financeiro)</button>
                    </div>
                </div>
                <div className="text-sm text-gray-400 bg-gray-700/50 p-3 rounded-md">
                    {paymentMethod === 'À Vista' ? 'O valor será lançado como uma entrada no Caixa.' : 'Será criada uma conta a receber no Financeiro.'}
                </div>
            </div>
            <div className="flex justify-end space-x-3 pt-6 mt-4 border-t border-gray-700">
                <button type="button" name="formCancel" onClick={onClose} className="px-5 py-2 text-sm font-semibold text-gray-300 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors">Cancelar</button>
                <button type="button" name="formConfirm" onClick={handleSubmit} className="flex items-center px-5 py-2 text-sm font-semibold text-white bg-green-600 rounded-lg hover:bg-green-500 transition-colors">
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
    const [requestTypes, setRequestTypes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({ status: 'TodosAbertos', requestType: 'Todos', region: 'Todas', billingType: 'Todos' });
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
    const [isSaving, setIsSaving] = useState(false);

    const loadData = useCallback(async (showLoadingSpinner = true) => {
        if (showLoadingSpinner) setLoading(true);
        setError(null);
        try {
            const [chamadosData, clientsData, requestTypesData] = await Promise.all([
                supabaseService.getChamados(), 
                supabaseService.getClientes(),
                supabaseService.getRequestTypes()
            ]);
            
            const enrichedChamados = chamadosData.map(chamado => {
                const client = clientsData.find(c => c.id === chamado.entity_id);
                return {
                    ...chamado,
                    client: client || null, // Anexa a entidade completa do cliente ao chamado
                };
            });
            
            setChamados(enrichedChamados);
            setClients(clientsData); // Mantém a lista de clientes separada para outras lógicas se necessário
            setRequestTypes(requestTypesData);
            if(showLoadingSpinner) addLog(`${chamadosData.length} chamados, ${clientsData.length} clientes e ${requestTypesData.length} tipos de solicitação carregados.`);
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            setError(message);
            addLog(`ERRO ao carregar dados: ${message}`);
        } finally { if (showLoadingSpinner) setLoading(false); }
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
            const region = chamado.client?.address?.region || 'Sem Região';
            if (!acc[region]) {
                acc[region] = [];
            }
            acc[region].push(chamado.id);
            return acc;
        }, {} as Record<string, number[]>);
    
        const existingRoutes = await supabaseService.getRotas();
        const routesToUpsert: any[] = [];
    
        Object.keys(chamadosByRegion).forEach(region => {
            const chamadoIds = chamadosByRegion[region];
            const existingRoute = append ? existingRoutes.find(r => r.region === region && r.status === 'Aberta') : undefined;
    
            if (existingRoute) {
                const existingIds = Array.isArray(existingRoute.chamado_ids) ? existingRoute.chamado_ids : [];
                routesToUpsert.push({
                    ...existingRoute,
                    chamado_ids: [...new Set([...existingIds, ...chamadoIds])]
                });
            } else {
                routesToUpsert.push({ region, chamado_ids: chamadoIds, status: 'Aberta' });
            }
        });
    
        if(routesToUpsert.length > 0) {
            await supabaseService.saveRotas(routesToUpsert);
            await supabaseService.updateChamados(Array.from(selectedChamados), { in_route: true });
            
            addLog(`Rotas salvas. ${selectedChamados.size} chamados adicionados.`);
            setSelectedChamados(new Set());
            loadData(false);
        }
    };

    const processRoutesByRegion = async () => {
        const chamadosToRoute = chamados.filter(c => selectedChamados.has(c.id));
        const regions = [...new Set(chamadosToRoute.map(c => c.client?.address.region).filter(Boolean))];
        const allOpenRoutes = await supabaseService.getRotas();
        const openRoutes = allOpenRoutes.filter(r => r.status === 'Aberta');
        
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
        const allRoutes = await supabaseService.getRotas();
        const open = allRoutes.filter(r => r.status === 'Aberta');
        setOpenRoutes(open);
        setSelectRouteModalOpen(true);
    };

    const handleConfirmAddToExisting = async (routeId) => {
        const allRoutes = await supabaseService.getRotas();
        const routeToUpdate = allRoutes.find(r => r.id === routeId);

        if (!routeToUpdate) {
            addLog(`ERRO: Rota com ID ${routeId} não encontrada.`);
            alert('Erro: A rota selecionada não foi encontrada.');
            handleCloseModals();
            return;
        }
        
        const chamadosToAdd = Array.from(selectedChamados);
        const existingChamadoIds = Array.isArray(routeToUpdate.chamado_ids) ? routeToUpdate.chamado_ids : [];
        const updatedRoute = { 
            ...routeToUpdate,
            chamado_ids: [...new Set([...existingChamadoIds, ...chamadosToAdd])]
        };
        
        await supabaseService.saveRotas([updatedRoute]);
        await supabaseService.updateChamados(Array.from(selectedChamados), { in_route: true });
        
        addLog(`${chamadosToAdd.length} chamado(s) adicionados à rota existente "${updatedRoute.region}".`);
        setSelectedChamados(new Set());
        handleCloseModals();
        loadData(false);
    };

    const handleSaveGroupedRoute = async (routeName) => {
        const chamadoIds = Array.from(selectedChamados);
        const newRoute = {
            region: routeName.trim(),
            chamado_ids: chamadoIds,
            status: 'Aberta'
        };

        await supabaseService.saveRotas([newRoute]);
        await supabaseService.updateChamados(chamadoIds, { in_route: true });
        
        addLog(`Rota agrupada "${newRoute.region}" salva com ${chamadoIds.length} chamados.`);
        setSelectedChamados(new Set());
        handleCloseModals();
        loadData(false);
    };

    const handleSaveChamado = async (chamadoData) => {
        if (isSaving) return;
        setIsSaving(true);
        try {
            const [savedChamado] = await supabaseService.saveChamado(chamadoData);
            if (!savedChamado) throw new Error("Falha ao salvar o chamado, nenhum dado retornado.");
            
            addLog(`Chamado para "${savedChamado.client_name}" salvo com sucesso.`);
            handleCloseModals();
            await loadData(false); // Refetch data without full page loader
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            addLog(`ERRO ao salvar chamado: ${message}`);
            alert(`Erro ao salvar chamado: ${message}`);
        } finally {
            setIsSaving(false);
        }
    };

    const handleConfirmDelete = async () => {
        if (selectedChamado) {
            await supabaseService.deleteChamado(selectedChamado.id);
            addLog(`Chamado para "${selectedChamado.client_name}" foi excluído.`);
            handleCloseModals();
            loadData(false);
        }
    };

    const handleConfirmFaturamento = async (paymentMethod) => {
        if (selectedChamado) {
            try {
                await supabaseService.invoiceChamado(selectedChamado, paymentMethod);
                addLog(`Chamado #${selectedChamado.id} faturado (${paymentMethod}).`);
                loadData(false);
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
                await supabaseService.bulkInvoiceChamados(chamadosToInvoice, paymentMethod);
                addLog(`${chamadosToInvoice.length} chamados faturados (${paymentMethod}).`);
                loadData(false);
            } catch (error) {
                const message = error instanceof Error ? error.message : String(error);
                addLog(`ERRO ao faturar chamados em lote: ${message}`);
                alert(`Erro ao faturar: ${message}`);
            }
        }
        setSelectedChamados(new Set());
        handleCloseModals();
    };

    const handleAddPayment = async (paymentData) => {
        try {
            await supabaseService.addPaymentToChamado(paymentData);
            addLog(`Adiantamento de ${paymentData.amount} adicionado ao chamado #${paymentData.chamado_id}.`);
            loadData(false);
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            addLog(`ERRO ao adicionar adiantamento: ${message}`);
            alert(`Erro ao adicionar adiantamento: ${message}`);
        }
    };

    const handleDeletePayment = async (paymentId, chamadoId) => {
        try {
            await supabaseService.deletePayment(paymentId);
            addLog(`Adiantamento removido do chamado #${chamadoId}.`);
            loadData(false);
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            addLog(`ERRO ao remover adiantamento: ${message}`);
            alert(`Erro ao remover adiantamento: ${message}`);
        }
    };
    
    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({...prev, [name]: value}));
    };
    
    const availableRegions = useMemo(() => {
        const regionSet = new Set<string>();
        chamados.forEach(chamado => {
            if (chamado.client?.address?.region) {
                regionSet.add(chamado.client.address.region);
            }
        });
        return ['Todas', ...Array.from(regionSet).sort()];
    }, [chamados]);

    const filteredChamados = useMemo(() => {
        return chamados.filter(c => {
            const searchMatch = searchTerm === '' || (c.client_name || '').toLowerCase().includes(searchTerm.toLowerCase()) || (c.problem_description && c.problem_description.toLowerCase().includes(searchTerm.toLowerCase()));
            
            let statusMatch;
            if (filters.status === 'Disponiveis') {
                statusMatch = (c.status === 'Aberto' || c.status === 'Em Andamento') && !c.in_route;
            } else if (filters.status === 'TodosAbertos') {
                statusMatch = c.status === 'Aberto' || c.status === 'Em Andamento';
            } else {
                statusMatch = filters.status === 'Todos' || c.status === filters.status;
            }
            
            const typeMatch = filters.requestType === 'Todos' || c.request_type === filters.requestType;
            const billingMatch = filters.billingType === 'Todos' || c.billing_type === filters.billingType;

            const clientRegion = c.client?.address?.region;
            const regionMatch = filters.region === 'Todas' || (clientRegion && clientRegion === filters.region);
            
            return searchMatch && statusMatch && typeMatch && regionMatch && billingMatch;
        });
    }, [chamados, searchTerm, filters]);

    const areAllSelectedFromSameClient = useMemo(() => {
        if (selectedChamados.size < 2) return true;
        const selectedArray = Array.from(selectedChamados);
        const firstChamado = chamados.find(c => c.id === selectedArray[0]);
        if (!firstChamado) return false;
        const firstClientId = firstChamado.entity_id;
        return selectedArray.every(chamadoId => {
            const chamado = chamados.find(c => c.id === chamadoId);
            return chamado && chamado.entity_id === firstClientId;
        });
    }, [selectedChamados, chamados]);

    const areSelectedInvoiced = useMemo(() => {
        if (selectedChamados.size === 0) return false;
        return Array.from(selectedChamados).some(chamadoId => {
            const chamado = chamados.find(c => c.id === chamadoId);
            return chamado?.invoiced;
        });
    }, [selectedChamados, chamados]);

    const handlePrintChamado = async (chamado) => {
        addLog(`Gerando impressão para o chamado #${chamado.id}.`);
        
        const companyData = await supabaseService.getCompanyProfile();

        const printContent = ReactDOMServer.renderToString(
            <React.StrictMode>
                <ChamadoPrintLayout chamado={chamado} companyData={companyData} />
            </React.StrictMode>
        );
    
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(`
                <!DOCTYPE html>
                <html lang="pt-BR">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Ordem de Serviço #${String(chamado.id).padStart(6, '0')}</title>
                    <style>
                        body {
                            margin: 20px;
                            -webkit-print-color-adjust: exact;
                            color-adjust: exact;
                        }
                        @page {
                            size: A4;
                            margin: 1cm;
                        }
                    </style>
                </head>
                <body>
                    ${printContent}
                </body>
                </html>
            `);
            printWindow.document.close();
            printWindow.focus();
            setTimeout(() => {
                printWindow.print();
                printWindow.close();
            }, 250);
        } else {
            alert('Seu navegador bloqueou a abertura da janela de impressão. Por favor, habilite pop-ups para este site.');
            addLog('ERRO: Pop-up de impressão bloqueado pelo navegador.');
        }
    };

    const generatePdf = async (chamado) => {
        const companyData = await supabaseService.getCompanyProfile();
        const printContainer = document.createElement('div');
        printContainer.id = 'print-container-temp';

        Object.assign(printContainer.style, {
            position: 'fixed',
            top: '0',
            left: '0',
            width: '210mm',
            height: '297mm',
            zIndex: '-9999',
            backgroundColor: 'white',
        });

        document.body.appendChild(printContainer);

        const root = ReactDOM.createRoot(printContainer);
        root.render(
            <React.StrictMode>
                <ChamadoPrintLayout chamado={chamado} companyData={companyData} />
            </React.StrictMode>
        );

        await new Promise(resolve => setTimeout(resolve, 500));

        try {
            const canvas = await html2canvas(printContainer, {
                scale: 2,
                useCORS: true,
                backgroundColor: '#ffffff',
            });

            const imgData = canvas.toDataURL('image/jpeg', 0.98);
            const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
            return pdf;
        } finally {
            root.unmount();
            if (document.body.contains(printContainer)) {
                document.body.removeChild(printContainer);
            }
        }
    };
    
    const handleDownloadPdfChamado = async (chamado) => {
        addLog(`Gerando PDF para download do chamado #${chamado.id}.`);
        try {
            const pdf = await generatePdf(chamado);
            pdf.save(`OS_${String(chamado.id).padStart(6, '0')}.pdf`);
            addLog(`PDF do chamado #${chamado.id} baixado com sucesso.`);
        } catch (error) {
            console.error("Erro ao gerar PDF:", error);
            const message = error instanceof Error ? error.message : String(error);
            addLog(`ERRO (Geração de PDF): ${message}`);
            alert('Ocorreu um erro ao gerar o PDF.');
        }
    };
    
    const handleSendWhatsApp = async (chamado) => {
        addLog(`Preparando PDF e mensagem do chamado #${chamado.id} para envio via WhatsApp.`);
    
        try {
            const pdf = await generatePdf(chamado);
            const pdfBlob = pdf.output('blob');
    
            const link = document.createElement('a');
            link.href = URL.createObjectURL(pdfBlob);
            link.download = `OS_${String(chamado.id).padStart(6, '0')}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(link.href);
            addLog(`PDF do chamado #${chamado.id} baixado para anexo.`);
    
        } catch (error) {
            console.error("Erro ao gerar PDF para WhatsApp:", error);
            const message = error instanceof Error ? error.message : String(error);
            addLog(`ERRO (Geração de PDF para WhatsApp): ${message}`);
            alert('Ocorreu um erro ao gerar o PDF. A mensagem não será enviada.');
            return;
        }
    
        const clientPhone = chamado.client?.whatsapp || chamado.client?.phone;
        if (!clientPhone) {
            alert('O cliente deste chamado não possui um número de WhatsApp ou telefone cadastrado.');
            addLog(`Falha no envio via WhatsApp: Telefone do cliente #${chamado.entity_id} não encontrado.`);
            return;
        }
    
        const cleanedPhone = clientPhone.replace(/\D/g, '');
        const whatsappPhone = cleanedPhone.length > 11 ? cleanedPhone : `55${cleanedPhone}`;
    
        const scheduledDate = chamado.preferred_date
            ? `\n*Data/Hora Agendada:* ${new Date(chamado.preferred_date).toLocaleString('pt-BR')}`
            : '';
    
        const message = `Olá ${chamado.client.contact_name || chamado.client_name},
    
Segue um resumo da sua solicitação. O documento completo com todos os detalhes (Ordem de Serviço) foi baixado em seu dispositivo, por favor, anexe-o a esta conversa.

*Nº do Chamado:* ${String(chamado.id).padStart(6, '0')}
*Tipo de Serviço:* ${chamado.request_type}
*Status:* ${chamado.status}${scheduledDate}

Agradecemos o seu contato!`;
    
        const encodedMessage = encodeURIComponent(message);
        const whatsappUrl = `https://wa.me/${whatsappPhone}?text=${encodedMessage}`;
    
        window.open(whatsappUrl, '_blank');
        addLog(`URL do WhatsApp para o chamado #${chamado.id} aberta.`);
    };

    const handleGenerateReport = () => {
        addLog(`Gerando relatório para ${filteredChamados.length} chamados.`);

        const ReportCard = ({ chamado }) => {
            const typeInfo = typeConfig[chamado.request_type] || { color: 'purple', label: chamado.request_type };
            const statusInfo = statusConfig[chamado.status] || { color: 'gray', label: 'Desconhecido' };
            const totalValue = chamado.items?.reduce((acc, item) => acc + item.totalPrice, 0) || 0;
            const formatCurrency = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

            const typeColor = {
                red: '#dc2626',
                blue: '#2563eb',
                green: '#16a34a',
                purple: '#8b5cf6',
            }[typeInfo.color] || '#6b7280';

            return (
                <div className="card-item flex-col break-inside-avoid p-1.5 mb-1.5 border rounded-md shadow-sm">
                    <div className="flex justify-between items-start pb-1 border-b">
                        <div className="flex-grow pr-1">
                            <p className={`text-[9px] font-semibold leading-tight`} style={{ color: typeColor }}>{typeInfo.label}</p>
                            <h3 className="font-bold text-sm leading-tight">{chamado.client_name}</h3>
                            <p className="text-[9px] text-gray-500 leading-tight">Aberto em: {new Date(chamado.created_at).toLocaleDateString()}</p>
                        </div>
                        <span className={`px-1.5 py-0.5 text-[9px] font-semibold rounded-full bg-${statusInfo.color}-100 text-${statusInfo.color}-700 flex-shrink-0`}>
                            {statusInfo.label}
                        </span>
                    </div>
                    <div className="py-1 space-y-1">
                        <p className="text-[10px] text-gray-700 leading-snug">{chamado.problem_description || 'Nenhuma descrição do problema fornecida.'}</p>
                        
                        {chamado.equipment && (
                            <div className="pt-1 border-t border-gray-200">
                                <p className="text-[9px] text-gray-500 leading-tight">Equipamento:</p>
                                <p className="text-[10px] text-gray-700 font-medium leading-snug">{chamado.equipment}</p>
                            </div>
                        )}
                        
                        {chamado.solution_description && (
                            <div className="pt-1 border-t border-gray-200">
                                <p className="text-[9px] text-gray-500 leading-tight">Relato Técnico:</p>
                                <p className="text-[10px] text-gray-700 leading-snug">{chamado.solution_description}</p>
                            </div>
                        )}
                    </div>
                    {chamado.items && chamado.items.length > 0 && (
                         <div className="pt-1 mt-1 border-t">
                            <h4 className="text-[10px] font-semibold mb-0.5">Itens/Serviços:</h4>
                            <ul className="text-[9px] list-disc list-inside text-gray-600 space-y-0.5">
                               {chamado.items.map((item, index) => (
                                    <li key={index} className="leading-tight">{item.quantity}x {item.name} - {formatCurrency(item.totalPrice)}</li>
                               ))}
                            </ul>
                        </div>
                    )}
                    {totalValue > 0 && (
                        <div className="flex justify-between items-center pt-1 mt-1 border-t">
                            <span className="text-[10px] font-semibold">Total:</span>
                            <span className="text-xs font-bold">{formatCurrency(totalValue)}</span>
                        </div>
                    )}
                </div>
            );
        };

        const reportContent = ReactDOMServer.renderToString(
            <React.StrictMode>
                {filteredChamados.map(chamado => <ReportCard key={chamado.id} chamado={chamado} />)}
            </React.StrictMode>
        );
        
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(`
                <!DOCTYPE html>
                <html lang="pt-BR">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Relatório de Chamados</title>
                    <script src="https://cdn.tailwindcss.com"></script>
                    <style>
                        body {
                            font-family: sans-serif;
                            -webkit-print-color-adjust: exact; /* For Chrome, Safari */
                            color-adjust: exact; /* For Firefox */
                        }
                        @media print {
                            body {
                                margin: 1rem;
                            }
                            .report-container {
                                column-count: 3;
                                column-gap: 1rem;
                            }
                            .card-item {
                                page-break-inside: avoid;
                                -webkit-column-break-inside: avoid;
                                break-inside: avoid-page;
                            }
                        }
                        @page {
                            size: A4;
                            margin: 1cm;
                        }
                        .bg-red-100 { background-color: #fee2e2 !important; } .text-red-700 { color: #b91c1c !important; }
                        .bg-blue-100 { background-color: #dbeafe !important; } .text-blue-700 { color: #1d4ed8 !important; }
                        .bg-green-100 { background-color: #dcfce7 !important; } .text-green-700 { color: #15803d !important; }
                        .bg-yellow-100 { background-color: #fef9c3 !important; } .text-yellow-700 { color: #a16207 !important; }
                        .bg-gray-100 { background-color: #f3f4f6 !important; } .text-gray-700 { color: #374151 !important; }
                    </style>
                </head>
                <body>
                    <header class="mb-8 text-center">
                        <h1 class="text-3xl font-bold">Relatório de Chamados</h1>
                        <p class="text-gray-600">Gerado em: ${new Date().toLocaleString('pt-BR')}</p>
                    </header>
                    <main class="report-container">
                        ${reportContent}
                    </main>
                </body>
                </html>
            `);
            printWindow.document.close();
            printWindow.focus();
            // Delay print to ensure all content and styles are loaded
            setTimeout(() => {
                printWindow.print();
                printWindow.close();
            }, 500);
        } else {
            alert('Seu navegador bloqueou a abertura da janela de impressão. Por favor, habilite pop-ups para este site.');
            addLog('ERRO: Pop-up de impressão bloqueado pelo navegador.');
        }
    };

    if (error) {
        return (
            <>
                <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                    <div>
                        <h2 className="text-3xl font-bold text-white">Chamados</h2>
                        <p className="text-gray-400 mt-1">Gerencie, filtre e organize os chamados de seus clientes.</p>
                    </div>
                </header>
                <div className="bg-red-900/50 border border-red-700 rounded-xl p-6">
                    <div className="flex items-start gap-4">
                        <AlertCircleIcon className="w-8 h-8 text-red-400 flex-shrink-0 mt-1" />
                        <div>
                            <h3 className="text-xl font-semibold text-red-200">Erro ao Carregar Chamados</h3>
                            <p className="text-red-300 mt-2">
                                Não foi possível carregar os dados. Isso geralmente acontece quando há uma inconsistência com a estrutura do banco de dados (tabelas/colunas faltando) ou políticas de segurança (RLS) estão bloqueando o acesso.
                            </p>
                            <p className="text-sm text-gray-300 mt-4">
                                <strong>Detalhes do Erro:</strong> {error}
                            </p>
                            <div className="mt-6 bg-gray-900/50 p-4 rounded-lg">
                                <h4 className="font-semibold text-white">Solução Recomendada:</h4>
                                <p className="text-sm text-gray-300 mt-2">
                                    Por favor, vá para a página de <strong className="text-white">Configurações do Banco</strong> para verificar e sincronizar o esquema do seu banco de dados. Verifique também as políticas de RLS para as tabelas 'chamados', 'item' e 'request_types'.
                                </p>
                                <p className="text-sm text-gray-400 mt-2">
                                    Menu: Cadastros &gt; Config. do Banco
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <style dangerouslySetInnerHTML={{__html: `
            :root { --color-red-500: #ef4444; --color-blue-500: #3b82f6; --color-green-500: #22c55e; --color-yellow-500: #eab308; --color-gray-500: #6b7280; --color-purple-500: #8b5cf6; }
            .text-red-300 { color: #fca5a5; } .text-red-400 { color: #f87171; }
            .bg-red-500\\/20 { background-color: rgba(239, 68, 68, 0.2); }
            .text-blue-300 { color: #93c5fd; } .text-blue-400 { color: #60a5fa; }
            .bg-blue-500\\/20 { background-color: rgba(59, 130, 246, 0.2); }
            .text-green-300 { color: #86efac; } .text-green-400 { color: #4ade80; }
            .bg-green-500\\/20 { background-color: rgba(34, 197, 94, 0.2); }
            .text-yellow-300 { color: #fde047; } .text-yellow-400 { color: #facc15; }
            .bg-yellow-500\\/20 { background-color: rgba(234, 179, 8, 0.2); }
            .text-gray-300 { color: #d1d5db; }
            .bg-gray-500\\/20 { background-color: rgba(107, 114, 128, 0.2); }
            .text-purple-300 { color: #c4b5fd; } .text-purple-400 { color: #a78bfa; }
            .bg-purple-500\\/20 { background-color: rgba(139, 92, 246, 0.2); }
            `}} />

            {isFormModalOpen ? (
                <ChamadoFormModal 
                    isOpen={isFormModalOpen}
                    onClose={handleCloseModals}
                    onSave={handleSaveChamado}
                    chamado={selectedChamado}
                    addLog={addLog}
                    onAddPayment={handleAddPayment}
                    onDeletePayment={handleDeletePayment}
                    isSaving={isSaving}
                />
            ) : (
                <>
                    <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                        <div>
                            <h2 className="text-3xl font-bold text-white">Chamados</h2>
                            <p className="text-gray-400 mt-1">Gerencie, filtre e organize os chamados de seus clientes.</p>
                        </div>
                        <div className="flex items-center justify-end space-x-2 w-full sm:w-auto">
                            <div className="relative flex-grow sm:flex-grow-0">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400"><SearchIcon className="w-5 h-5"/></span>
                                <input type="search" name="chamadoSearch" placeholder="Buscar por cliente ou descrição..." className="w-full sm:w-64 bg-gray-800 text-white rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" onChange={(e) => setSearchTerm(e.target.value)} />
                            </div>
                            <button name="addChamado" onClick={handleOpenAddModal} className="flex items-center justify-center px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-500 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-blue-500"><PlusIcon className="w-4 h-4 mr-2" />Adicionar</button>
                        </div>
                    </header>
                    
                    <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4 p-4 bg-gray-800/50 rounded-lg border border-gray-700/50">
                        <div className="flex items-center gap-x-6 gap-y-4 flex-wrap">
                            <div>
                                <label htmlFor="status" className="text-sm font-medium text-gray-400 mr-2">Status:</label>
                                <select id="status" name="status" value={filters.status} onChange={handleFilterChange} className="bg-gray-700 text-white rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 custom-select text-sm">
                                    <option value="TodosAbertos">Todos Abertos</option>
                                    <option value="Disponiveis">Disponíveis p/ Rota</option>
                                    <option value="Todos">Todos Status</option>
                                    <option value="Aberto">Aberto</option>
                                    <option value="Em Andamento">Em Andamento</option>
                                    <option value="Concluído">Concluído</option>
                                    <option value="Cancelado">Cancelado</option>
                                </select>
                            </div>
                            <div>
                                <label htmlFor="requestType" className="text-sm font-medium text-gray-400 mr-2">Tipo:</label>
                                <select id="requestType" name="requestType" value={filters.requestType} onChange={handleFilterChange} className="bg-gray-700 text-white rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 custom-select text-sm">
                                    <option value="Todos">Todos os Tipos</option>
                                    {requestTypes.map(rt => <option key={rt.id} value={rt.name}>{rt.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="region" className="text-sm font-medium text-gray-400 mr-2">Região:</label>
                                <select id="region" name="region" value={filters.region} onChange={handleFilterChange} className="bg-gray-700 text-white rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 custom-select text-sm">
                                    {availableRegions.map(region => <option key={region} value={region}>{region}</option>)}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="billingType" className="text-sm font-medium text-gray-400 mr-2">Faturamento:</label>
                                <select id="billingType" name="billingType" value={filters.billingType} onChange={handleFilterChange} className="bg-gray-700 text-white rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 custom-select text-sm">
                                    <option value="Todos">Todos</option>
                                    <option value="Particular">Particular</option>
                                    <option value="Empresa">Empresa</option>
                                </select>
                            </div>
                        </div>
                        {selectedChamados.size > 0 && (
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-gray-300">{selectedChamados.size} selecionado(s)</span>
                                {areAllSelectedFromSameClient && !areSelectedInvoiced && (
                                    <button name="bulkInvoice" onClick={() => setBulkFaturamentoModalOpen(true)} className="flex items-center text-xs px-2 py-1 bg-green-600 hover:bg-green-500 text-white rounded-md transition-colors" title="Faturar Selecionados"><DollarSignIcon className="w-4 h-4 mr-1"/> Faturar</button>
                                )}
                                <button name="createRoute" onClick={handleCreateRouteClick} className="flex items-center text-xs px-2 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-md transition-colors" title="Criar Rota com Selecionados"><RouteIcon className="w-4 h-4 mr-1"/> Criar Rota</button>
                            </div>
                        )}
                    </div>
                    <div className="flex items-center justify-end mb-4">
                        <button onClick={handleGenerateReport} className="flex items-center text-sm text-gray-300 hover:text-white bg-gray-700 hover:bg-gray-600 px-3 py-1.5 rounded-lg transition-colors">
                            <PrinterIcon className="w-4 h-4 mr-2" /> Gerar Relatório
                        </button>
                    </div>

                    {loading ? <p>Carregando...</p> : (
                        filteredChamados.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {filteredChamados.map(chamado => (
                                    <ChamadoCard 
                                        key={chamado.id} 
                                        chamado={chamado}
                                        context="chamados"
                                        isSelected={selectedChamados.has(chamado.id)}
                                        onToggleSelect={handleToggleSelect}
                                        onEdit={handleOpenEditModal} 
                                        onDelete={handleOpenDeleteModal}
                                        onFaturar={handleOpenFaturamentoModal}
                                        onPrint={handlePrintChamado}
                                        onWhatsApp={handleSendWhatsApp}
                                        onDownloadPdf={handleDownloadPdfChamado}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 bg-gray-800 rounded-lg">
                                <h3 className="text-lg font-medium text-white">Nenhum chamado encontrado</h3>
                                <p className="mt-1 text-sm text-gray-400">{chamados.length > 0 ? 'Tente ajustar seus filtros para encontrar o que procura.' : 'Adicione um novo chamado para começar.'}</p>
                            </div>
                        )
                    )}
                </>
            )}

            {/* These modals remain as true modals */}
            <DeleteConfirmationModal isOpen={isDeleteModalOpen} onClose={handleCloseModals} onConfirm={handleConfirmDelete} bodyText={`Tem certeza que deseja excluir o chamado para "${selectedChamado?.client_name}"? Esta ação não pode ser desfeita.`} />
            {isFaturamentoModalOpen && <FaturamentoModal isOpen={isFaturamentoModalOpen} onClose={handleCloseModals} onConfirm={handleConfirmFaturamento} chamado={selectedChamado} />}
            {isBulkFaturamentoModalOpen && <BulkFaturamentoModal isOpen={isBulkFaturamentoModalOpen} onClose={handleCloseModals} onConfirm={handleConfirmBulkFaturamento} chamados={chamados.filter(c => selectedChamados.has(c.id))} />}
            {isConfirmRotaModalOpen && <ConfirmacaoRotaModal isOpen={isConfirmRotaModalOpen} onClose={handleCloseModals} regions={overlappingRegions} onAppend={() => saveRoutesByRegion(true)} onCreateNew={() => saveRoutesByRegion(false)} />}
            {isGroupingModalOpen && <GroupingStrategyModal isOpen={isGroupingModalOpen} onClose={handleCloseModals} onSeparateByRegion={handleSelectSeparateByRegion} onGroupAsSingle={handleSelectGroupAsSingle} onAddToExisting={handleSelectAddToExisting} />}
            {isRouteNameModalOpen && <RouteNameModal isOpen={isRouteNameModalOpen} onClose={handleCloseModals} onSave={handleSaveGroupedRoute} />}
            {isSelectRouteModalOpen && <SelectExistingRouteModal isOpen={isSelectRouteModalOpen} onClose={handleCloseModals} onConfirm={handleConfirmAddToExisting} openRoutes={openRoutes} />}
        </>
    );
};