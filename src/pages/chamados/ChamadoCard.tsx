import React, { useState } from 'react';
import { BriefcaseIcon, GraduationCapIcon, CalendarPlusIcon, DollarSignIcon, CheckCheckIcon, Edit2Icon, Trash2Icon, CheckCircle2Icon, PhoneIcon, MapPinIcon, PrinterIcon, WhatsAppIcon, DownloadIcon, CreditCardIcon, XIcon, PlusIcon } from '../../components/Icons';

export const statusConfig: { [key: string]: { color: string; label: string; } } = {
    'Aberto': { color: 'blue', label: 'Aberto' },
    'Em Andamento': { color: 'yellow', label: 'Em Andamento' },
    'Concluído': { color: 'green', label: 'Concluído' },
    'Cancelado': { color: 'gray', label: 'Cancelado' },
};

export const typeConfig: { [key: string]: { icon: React.FC<any>; color: string; label: string; } } = {
    'Chamado de Serviço': { icon: BriefcaseIcon, color: 'red', label: 'Chamado de Serviço' },
    'Treinamento': { icon: GraduationCapIcon, color: 'blue', label: 'Treinamento' },
    'Agendamento': { icon: CalendarPlusIcon, color: 'green', label: 'Agendamento' },
};

interface ChamadoCardProps {
    chamado: any;
    context: 'chamados' | 'rotas';
    onEdit?: (chamado: any) => void;
    onDelete?: (chamado: any) => void;
    onFaturar?: (chamado: any) => void;
    isSelected?: boolean;
    onToggleSelect?: (id: number) => void;
    onFinish?: (chamado: any) => void;
    onPrint?: (chamado: any) => void;
    onWhatsApp?: (chamado: any) => void;
    onDownloadPdf?: (chamado: any) => void;
}

const formatCurrency = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);

export const ChamadoCard: React.FC<ChamadoCardProps> = ({ chamado, context, onEdit, onDelete, onFaturar, isSelected, onToggleSelect, onFinish, onPrint, onWhatsApp, onDownloadPdf }) => {
    
    const typeInfo = typeConfig[chamado.request_type] || { icon: BriefcaseIcon, color: 'purple', label: chamado.request_type };
    const TypeIcon = typeInfo.icon;
    const statusInfo = statusConfig[chamado.status] || statusConfig['Cancelado'];
    
    const totalValue = chamado.items?.reduce((acc, item) => acc + item.totalPrice, 0) || 0;
    const paidAmount = chamado.payments?.reduce((acc, p) => acc + p.amount, 0) || 0;
    const remainingAmount = totalValue - paidAmount;

    const isSelectable = context === 'chamados';

    const clientAddress = chamado.client?.address ? [chamado.client.address.neighborhood, chamado.client.address.city].filter(Boolean).join(', ') : '';

    const handleCardClick = (e) => {
        if ((e.target as HTMLElement).closest('button, input, a')) {
            return;
        }
        if (isSelectable && onToggleSelect) {
            onToggleSelect(chamado.id);
        }
    };

    return (
        <div 
            className={`relative bg-gray-800 rounded-xl p-5 flex flex-col justify-between shadow-lg hover:shadow-blue-500/10 hover:-translate-y-1 transition-all duration-300 border-l-4 ${isSelectable ? 'cursor-pointer' : ''} ${isSelected ? 'ring-2 ring-blue-500' : 'ring-0 ring-transparent'}`} 
            style={{ borderColor: `var(--color-${typeInfo.color}-500)` }}
            onClick={handleCardClick}
        >
            <div>
                <div className="flex justify-between items-start mb-3">
                    <div className="pr-8">
                        <div className="flex items-center gap-2 mb-2">
                           <TypeIcon className={`w-6 h-6 text-${typeInfo.color}-400`} />
                           <span className={`text-sm font-semibold text-${typeInfo.color}-300`}>{typeInfo.label}</span>
                        </div>
                        <h3 className="font-bold text-white text-lg leading-tight">{chamado.client_name}</h3>
                        <p className="text-xs text-gray-500 mt-1">Aberto em: {new Date(chamado.created_at).toLocaleDateString()}</p>
                    </div>
                    
                    <div className="flex items-center gap-2 flex-shrink-0 mt-1">
                        <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full bg-${statusInfo.color}-500/20 text-${statusInfo.color}-300`}>{statusInfo.label}</span>
                        {isSelectable && (
                            <div className={`transition-opacity duration-200 ${isSelected ? 'opacity-100' : 'opacity-0'}`}>
                                <input
                                    type="checkbox"
                                    checked={isSelected}
                                    readOnly
                                    className="h-5 w-5 rounded bg-gray-700 border-gray-500 text-blue-500 focus:ring-blue-500"
                                    style={{ pointerEvents: 'none' }}
                                />
                            </div>
                        )}
                    </div>
                </div>

                <div className="space-y-3 mb-4 min-h-[60px]">
                    <p className="text-gray-300 text-sm break-words">{chamado.problem_description || `Agendado para ${new Date(chamado.preferred_date).toLocaleString()}`}</p>
                    
                    {(clientAddress || chamado.client?.phone) && (
                        <div className="pt-3 border-t border-gray-700/50 space-y-1.5">
                            {clientAddress && (
                                <div className="flex items-center gap-2 text-sm text-gray-300">
                                    <MapPinIcon className="w-4 h-4 flex-shrink-0 text-gray-400" />
                                    <span>{clientAddress}</span>
                                </div>
                            )}
                            {chamado.client?.phone && (
                                <div className="flex items-center gap-2 text-sm text-gray-300">
                                    <PhoneIcon className="w-4 h-4 flex-shrink-0 text-gray-400" />
                                    <span>{chamado.client.phone}</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <div className="mt-auto pt-3 border-t border-gray-700/50">
                {totalValue > 0 && (
                    <div className="mb-4">
                        <div className="grid grid-cols-3 text-center text-sm">
                            <div>
                                <p className="text-gray-400 text-xs">Total</p>
                                <p className="font-semibold text-white">{formatCurrency(totalValue)}</p>
                            </div>
                            <div>
                                <p className="text-gray-400 text-xs">Adiantado</p>
                                <p className="font-semibold text-green-400">{formatCurrency(paidAmount)}</p>
                            </div>
                            <div>
                                <p className="text-gray-400 text-xs">Restante</p>
                                <p className="font-semibold text-yellow-400">{formatCurrency(remainingAmount)}</p>
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex justify-end items-center gap-3">
                     {onDownloadPdf && (
                        <button onClick={(e) => { e.stopPropagation(); onDownloadPdf(chamado); }} className="p-3 bg-gray-500/10 text-gray-400 rounded-md hover:bg-gray-500/20 transition-colors" aria-label={`Salvar PDF do chamado de ${chamado.client_name}`}><DownloadIcon className="w-5 h-5" /></button>
                    )}
                     {onWhatsApp && (
                        <button onClick={(e) => { e.stopPropagation(); onWhatsApp(chamado); }} className="p-3 bg-green-500/10 text-green-400 rounded-md hover:bg-green-500/20 transition-colors" aria-label={`Enviar por WhatsApp para ${chamado.client_name}`}><WhatsAppIcon className="w-5 h-5" /></button>
                    )}
                     {onPrint && (
                        <button onClick={(e) => { e.stopPropagation(); onPrint(chamado); }} className="p-3 bg-gray-500/10 text-gray-400 rounded-md hover:bg-gray-500/20 transition-colors" aria-label={`Imprimir chamado de ${chamado.client_name}`}><PrinterIcon className="w-5 h-5" /></button>
                    )}
                    {context === 'chamados' && onFaturar && (
                        chamado.invoiced ? (
                            <span className="flex items-center text-xs text-green-400"><CheckCheckIcon className="w-5 h-5 mr-1"/> Faturado</span>
                        ) : (
                            <button onClick={(e) => { e.stopPropagation(); onFaturar(chamado); }} className="p-3 bg-green-500/10 text-green-400 rounded-md hover:bg-green-500/20 transition-colors" aria-label={`Faturar chamado de ${chamado.client_name}`}><DollarSignIcon className="w-5 h-5" /></button>
                        )
                    )}
                    {context === 'rotas' && onFinish && (
                        chamado.invoiced ? (
                             <span className="flex items-center text-xs text-green-400"><CheckCheckIcon className="w-5 h-5 mr-1"/> Faturado</span>
                        ) : (
                             <button onClick={(e) => { e.stopPropagation(); onFinish(chamado); }} className="p-3 bg-green-500/10 text-green-400 rounded-md hover:bg-green-500/20 transition-colors" aria-label={`Finalizar chamado de ${chamado.client_name}`}><CheckCircle2Icon className="w-5 h-5" /></button>
                        )
                    )}
                    {onEdit && <button onClick={(e) => { e.stopPropagation(); onEdit(chamado); }} className="p-3 bg-blue-500/10 text-blue-400 rounded-md hover:bg-blue-500/20 transition-colors" aria-label={`Editar chamado de ${chamado.client_name}`}><Edit2Icon className="w-5 h-5" /></button>}
                    {onDelete && <button onClick={(e) => { e.stopPropagation(); onDelete(chamado); }} className="p-3 bg-red-500/10 text-red-400 rounded-md hover:bg-red-500/20 transition-colors" aria-label={`Excluir chamado de ${chamado.client_name}`}><Trash2Icon className="w-5 h-5" /></button>}
                </div>
            </div>
        </div>
    );
};