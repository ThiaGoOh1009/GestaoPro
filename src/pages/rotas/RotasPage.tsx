import React, { useState, useEffect, useCallback, useMemo } from 'react';
import ReactDOM from 'react-dom/client';
import ReactDOMServer from 'react-dom/server';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { supabaseService } from '../../services/storage';
import { SpinnerIcon, RouteIcon, Trash2Icon, ArrowLeftIcon, CheckCircle2Icon, PrinterIcon } from '../../components/Icons';
import { DeleteConfirmationModal } from '../../components/Modal';
import { ChamadoCard } from '../chamados/ChamadoCard';
import { ChamadoFormModal } from '../chamados/ChamadoFormModal';
import { FaturamentoModal } from '../chamados/FaturamentoModal';
import { ChamadoPrintLayout } from '../chamados/ChamadoPrintLayout';

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
    const [isSaving, setIsSaving] = useState(false);

    const loadData = useCallback(async (showLoading = true) => {
        if (showLoading) setLoading(true);
        try {
            const [rotasData, chamadosData] = await Promise.all([
                supabaseService.getRotas(),
                supabaseService.getChamados(),
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
            const chamadosDetails = (selectedRota.chamado_ids || [])
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
            await supabaseService.updateChamados(rotaToDelete.chamado_ids, { in_route: false });
            await supabaseService.deleteRota(rotaToDelete.id);
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
            await supabaseService.invoiceChamado(chamadoToInvoice, paymentMethod);
            addLog(`Chamado #${chamadoToInvoice.id} finalizado.`);
            
            const [rotasData, chamadosData] = await Promise.all([supabaseService.getRotas(), supabaseService.getChamados()]);
            setRotas(rotasData);
            setChamados(chamadosData);

            const updatedCurrentRota = rotasData.find(r => r.id === selectedRota.id);

            if (updatedCurrentRota && updatedCurrentRota.status === 'Finalizada') {
                addLog(`Rota "${updatedCurrentRota.region}" finalizada. Retornando para la lista de rotas.`);
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
            await supabaseService.deleteChamado(chamadoToDelete.id);
            addLog(`Chamado #${chamadoToDelete.id} excluído.`);
            
            const allRotas = await supabaseService.getRotas();
            const rotaOfChamado = allRotas.find(r => r.id === selectedRota.id);
            if(rotaOfChamado) {
                rotaOfChamado.chamado_ids = rotaOfChamado.chamado_ids.filter(id => id !== chamadoToDelete.id);
                await supabaseService.saveRotas([rotaOfChamado]);
            }
            loadData(false);
        } catch(e) { addLog(`Erro ao excluir chamado: ${e.message}`); }
        setDeleteChamadoModalOpen(false);
        setChamadoToDelete(null);
    };

    const handleSaveChamado = async (chamadoData) => {
        if (isSaving) return;
        setIsSaving(true);
        try {
            const [savedChamado] = await supabaseService.saveChamado(chamadoData);
            if (!savedChamado) throw new Error("Falha ao atualizar o chamado.");
            
            addLog(`Chamado #${savedChamado.id} atualizado.`);
            setChamadoFormOpen(false);
            setChamadoToEdit(null);
            loadData(false); // Refetch all data to ensure consistency
        } catch(e) { 
            const message = e instanceof Error ? e.message : String(e);
            addLog(`Erro ao salvar chamado: ${message}`); 
            alert(`Erro ao salvar chamado: ${message}`);
        } finally {
            setIsSaving(false);
        }
    };

    const handleAddPayment = async (paymentData) => {
        try {
            await supabaseService.addPaymentToChamado(paymentData);
            addLog(`Adiantamento adicionado ao chamado #${paymentData.chamado_id}.`);
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
    
    const filteredRotas = useMemo(() => {
        return rotas.filter(r => r.status === filterStatus).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
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
                        <button name="backToRotas" onClick={handleBackToRotas} className="p-2 text-gray-400 rounded-full hover:bg-gray-700 hover:text-white transition-colors" aria-label="Voltar para a lista de rotas">
                            <ArrowLeftIcon className="w-6 h-6" />
                        </button>
                        <div>
                            <h2 className="text-3xl font-bold text-white">{selectedRota.region}</h2>
                            <p className="text-gray-400 mt-1">{chamadosNaRota.length} chamado(s) nesta rota.</p>
                        </div>
                    </div>
                    {isRotaFinished ? (
                         <span className="flex items-center px-4 py-2 text-sm font-semibold text-green-300 bg-green-500/20 rounded-lg">
                            <CheckCircle2Icon className="w-6 h-6 mr-2"/>Rota Finalizada
                        </span>
                    ) : (
                        <button name="deleteRota" onClick={() => handleOpenDeleteRotaModal(selectedRota)} className="flex items-center px-4 py-2 text-sm font-semibold text-red-400 bg-red-500/10 rounded-lg hover:bg-red-500/20 transition-colors">
                            <Trash2Icon className="w-6 h-6 mr-2" />
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
                                onPrint={handlePrintChamado}
                                onWhatsApp={handleSendWhatsApp}
                                onDownloadPdf={handleDownloadPdfChamado}
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
                 {isChamadoFormOpen && <ChamadoFormModal isOpen={isChamadoFormOpen} onClose={() => setChamadoFormOpen(false)} onSave={handleSaveChamado} chamado={chamadoToEdit} addLog={addLog} isClientLocked={true} onAddPayment={handleAddPayment} onDeletePayment={handleDeletePayment} isSaving={isSaving} />}
                 {isFaturamentoModalOpen && <FaturamentoModal isOpen={isFaturamentoModalOpen} onClose={() => setFaturamentoModalOpen(false)} onConfirm={handleConfirmFaturamento} chamado={chamadoToInvoice} />}
                 <DeleteConfirmationModal isOpen={isDeleteChamadoModalOpen} onClose={() => setDeleteChamadoModalOpen(false)} onConfirm={handleConfirmDeleteChamado} bodyText={`Tem certeza que deseja excluir o chamado para "${chamadoToDelete?.client_name}"? Esta ação não pode ser desfeita.`} />
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
                        name="filterRotasAbertas"
                        onClick={() => setFilterStatus('Aberta')}
                        className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors ${filterStatus === 'Aberta' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}
                    >
                        Abertas
                    </button>
                    <button
                        name="filterRotasFinalizadas"
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
                                        <span className="font-semibold text-gray-200">{rota.chamado_ids?.length || 0}</span> chamado(s)
                                    </p>
                                </div>
                                <div className="mt-4 pt-4 border-t border-gray-700/50">
                                    <p className="text-xs text-gray-500">Criada em: {new Date(rota.created_at).toLocaleDateString()}</p>
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
            
            <DeleteConfirmationModal isOpen={isDeleteRotaModalOpen} onClose={() => setDeleteRotaModalOpen(false)} onConfirm={handleConfirmDeleteRota} bodyText={`Tem certeza que deseja excluir a rota para "${rotaToDelete?.region}"? Os chamados serão liberados e voltarão para la lista principal.`} />
        </>
    );
};