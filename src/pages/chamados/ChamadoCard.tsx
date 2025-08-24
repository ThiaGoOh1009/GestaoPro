import React from 'react';
import { BriefcaseIcon, GraduationCapIcon, CalendarPlusIcon, DollarSignIcon, CheckCheckIcon, Edit2Icon, Trash2Icon, CheckCircle2Icon } from '../../components/Icons';

export const statusConfig: { [key: string]: { color: string; label: string; } } = {
    'Aberto': { color: 'blue', label: 'Aberto' },
    'Em Andamento': { color: 'yellow', label: 'Em Andamento' },
    'Concluído': { color: 'green', label: 'Concluído' },
    'Cancelado': { color: 'gray', label: 'Cancelado' },
};

export const typeConfig = {
    'Chamado de Serviço': { icon: BriefcaseIcon, color: 'red' },
    'Treinamento': { icon: GraduationCapIcon, color: 'blue' },
    'Agendamento': { icon: CalendarPlusIcon, color: 'green' },
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
}

export const ChamadoCard: React.FC<ChamadoCardProps> = ({ chamado, context, onEdit, onDelete, onFaturar, isSelected, onToggleSelect, onFinish }) => {
    const TypeIcon = typeConfig[chamado.requestType]?.icon || BriefcaseIcon;
    const statusInfo = statusConfig[chamado.status] || statusConfig['Cancelado'];
    const typeInfo = typeConfig[chamado.requestType];
    const formatCurrency = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    const totalValue = chamado.items?.reduce((acc, item) => acc + item.totalPrice, 0) || 0;
    const isSelectable = context === 'chamados';

    const handleCardClick = () => {
        if (isSelectable && onToggleSelect) {
            onToggleSelect(chamado.id);
        }
    };

    return (
        <div 
            className={`relative bg-gray-800 rounded-xl p-5 flex flex-col justify-between shadow-lg hover:shadow-blue-500/10 hover:-translate-y-1 transition-all duration-300 border-l-4 ${isSelectable ? 'cursor-pointer' : ''} ${isSelected ? 'ring-2 ring-blue-500' : ''}`} 
            style={{ borderColor: `var(--color-${typeInfo.color}-500)` }}
            onClick={handleCardClick}
        >
            {isSelectable && isSelected && (
                 <div className="absolute top-3 right-3 z-10">
                    <input
                        type="checkbox"
                        checked={isSelected}
                        readOnly
                        className="h-5 w-5 rounded bg-gray-700 border-gray-500 text-blue-500 focus:ring-blue-500 pointer-events-none"
                    />
                </div>
            )}
            <div>
                <div className="flex justify-between items-start mb-3">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                           <TypeIcon className={`w-5 h-5 text-${typeInfo.color}-400`} />
                           <span className={`text-sm font-semibold text-${typeInfo.color}-300`}>{chamado.requestType}</span>
                        </div>
                        <h3 className="font-bold text-white text-lg">{chamado.clientName}</h3>
                        <p className="text-sm text-gray-400 mt-1">Aberto em: {new Date(chamado.createdAt).toLocaleDateString()}</p>
                        <span className={`mt-2 inline-block px-2.5 py-0.5 text-xs font-semibold rounded-full bg-${statusInfo.color}-500/20 text-${statusInfo.color}-300`}>{statusInfo.label}</span>
                    </div>
                </div>
                <p className="text-gray-300 text-sm mb-4 break-words min-h-[40px]">{chamado.problemDescription || `Agendado para ${new Date(chamado.preferredDate).toLocaleString()}`}</p>
            </div>
            <div className="flex justify-between items-center pt-3 border-t border-gray-700/50">
                <span className="text-lg font-semibold text-white">{formatCurrency(totalValue)}</span>
                <div className="flex items-center space-x-2">
                    {context === 'chamados' && onFaturar && (
                        chamado.invoiced ? (
                            <span className="flex items-center text-xs text-green-400"><CheckCheckIcon className="w-4 h-4 mr-1"/> Faturado</span>
                        ) : (
                            <button onClick={(e) => { e.stopPropagation(); onFaturar(chamado); }} className="p-1.5 bg-green-500/10 text-green-400 rounded-md hover:bg-green-500/20 transition-colors" aria-label={`Faturar chamado de ${chamado.clientName}`}><DollarSignIcon className="w-4 h-4" /></button>
                        )
                    )}
                    {context === 'rotas' && onFinish && (
                        chamado.invoiced ? (
                             <span className="flex items-center text-xs text-green-400"><CheckCheckIcon className="w-4 h-4 mr-1"/> Faturado</span>
                        ) : (
                             <button onClick={(e) => { e.stopPropagation(); onFinish(chamado); }} className="p-1.5 bg-green-500/10 text-green-400 rounded-md hover:bg-green-500/20 transition-colors" aria-label={`Finalizar chamado de ${chamado.clientName}`}><CheckCircle2Icon className="w-4 h-4" /></button>
                        )
                    )}
                    {onEdit && <button onClick={(e) => { e.stopPropagation(); onEdit(chamado); }} className="p-1.5 bg-blue-500/10 text-blue-400 rounded-md hover:bg-blue-500/20 transition-colors" aria-label={`Editar chamado de ${chamado.clientName}`}><Edit2Icon className="w-4 h-4" /></button>}
                    {onDelete && <button onClick={(e) => { e.stopPropagation(); onDelete(chamado); }} className="p-1.5 bg-red-500/10 text-red-400 rounded-md hover:bg-red-500/20 transition-colors" aria-label={`Excluir chamado de ${chamado.clientName}`}><Trash2Icon className="w-4 h-4" /></button>}
                </div>
            </div>
        </div>
    );
};