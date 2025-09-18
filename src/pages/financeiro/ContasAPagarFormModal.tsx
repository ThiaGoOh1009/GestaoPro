import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Modal } from '../../components/Modal';
import { InputField } from '../../components/Generic';
import { supabaseService } from '../../services/storage';
import { capitalizeWords } from '../../utils/helpers';

export const FinanceiroFormModal = ({ isOpen, onClose, onSave, entry, defaultType = 'R', addLog }) => {
    const today = new Date().toISOString().split('T')[0];
    const initialFormState = {
        type: defaultType,
        entity_id: null,
        description: '',
        amount: '',
        due_date: today,
        status: 'Pendente',
        paid_amount: '',
        payment_date: '',
        installments: 1, // Novo campo para parcelas
    };

    const [formData, setFormData] = useState(initialFormState);
    const [entities, setEntities] = useState([]);

    // State for searchable entity input
    const [isSearchingEntity, setIsSearchingEntity] = useState(!entry);
    const [entitySearchTerm, setEntitySearchTerm] = useState('');
    const [isEntityListOpen, setIsEntityListOpen] = useState(false);
    const [highlightedEntityIndex, setHighlightedEntityIndex] = useState(-1);
    const entitySearchRef = useRef(null);

    useEffect(() => {
        if (isOpen) {
            const entryType = entry ? entry.type : defaultType;
            const fetchEntities = async () => {
                if (entryType === 'R') {
                    const clients = await supabaseService.getClientes();
                    setEntities(clients);
                    addLog('Lista de clientes carregada.');
                } else {
                    const suppliers = await supabaseService.getFornecedores();
                    setEntities(suppliers);
                    addLog('Lista de fornecedores carregada.');
                }
            };
            fetchEntities();

            if (entry) {
                setFormData({
                    ...initialFormState,
                    ...entry,
                    amount: String(entry.amount).replace('.', ','),
                    paid_amount: entry.paid_amount ? String(entry.paid_amount).replace('.', ',') : '',
                    due_date: new Date(entry.due_date).toISOString().split('T')[0],
                    payment_date: entry.payment_date ? new Date(entry.payment_date).toISOString().split('T')[0] : '',
                    installments: 1, // Não permite alterar parcelas ao editar
                });
                setEntitySearchTerm(entry.entity_name || '');
                setIsSearchingEntity(false);
                addLog(`Carregando dados para editar lançamento: ${entry.description}`);
            } else {
                setFormData({ ...initialFormState, type: defaultType });
                setEntitySearchTerm('');
                setIsSearchingEntity(true);
            }
        }
    }, [entry, isOpen, addLog, defaultType]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (entitySearchRef.current && !entitySearchRef.current.contains(event.target)) {
                setIsEntityListOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === 'amount' || name === 'paid_amount') {
            setFormData(prev => ({ ...prev, [name]: value.replace(/[^0-9,]/g, '') }));
        } else if (name === 'installments') {
            setFormData(prev => ({ ...prev, [name]: parseInt(value, 10) || 1 }));
        }
        else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleStatusChange = (e) => {
        const newStatus = e.target.value;
        setFormData(prev => {
            const updated = { ...prev, status: newStatus };
            if (!entry && newStatus === 'Pago') {
                if (!updated.payment_date) {
                    updated.payment_date = today;
                }
                if (!updated.paid_amount && updated.amount) {
                    updated.paid_amount = updated.amount;
                }
            }
            return updated;
        });
    };

    const handleEntitySearchChange = (e) => {
        const term = capitalizeWords(e.target.value);
        setEntitySearchTerm(term);
        setIsEntityListOpen(true);
        setHighlightedEntityIndex(-1);
        if (formData.entity_id) {
            setFormData(p => ({ ...p, entity_id: null }));
        }
    };

    const handleEntitySelect = (entity) => {
        if (!entity) return;
        const entityName = entity.trade_name || entity.legal_name;
        setFormData(p => ({ ...p, entity_id: entity.id }));
        setEntitySearchTerm(entityName);
        setIsEntityListOpen(false);
        setIsSearchingEntity(false);
        setHighlightedEntityIndex(-1);
    };

    const filteredEntities = useMemo(() => {
        if (!entitySearchTerm) return [];
        return entities.filter(e =>
            (e.legal_name.toLowerCase().includes(entitySearchTerm.toLowerCase())) ||
            (e.trade_name && e.trade_name.toLowerCase().includes(entitySearchTerm.toLowerCase()))
        ).slice(0, 5);
    }, [entitySearchTerm, entities]);

    const handleEntityKeyDown = (e) => {
        if (isEntityListOpen && filteredEntities.length > 0) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setHighlightedEntityIndex(prev => (prev + 1) % filteredEntities.length);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setHighlightedEntityIndex(prev => (prev - 1 + filteredEntities.length) % filteredEntities.length);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (highlightedEntityIndex > -1) {
                    handleEntitySelect(filteredEntities[highlightedEntityIndex]);
                }
            } else if (e.key === 'Tab' && highlightedEntityIndex > -1) {
                handleEntitySelect(filteredEntities[highlightedEntityIndex]);
            } else if (e.key === 'Escape') {
                setIsEntityListOpen(false);
            }
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const amountNumber = parseFloat(formData.amount.replace(',', '.')) || 0;
        const paidAmountNumber = parseFloat(formData.paid_amount.replace(',', '.')) || 0;
        
        const dataToSave = {
            ...formData,
            id: entry?.id,
            amount: amountNumber,
            paid_amount: paidAmountNumber,
            payment_date: formData.payment_date || null,
        };
        delete (dataToSave as any).entity_name;
        delete (dataToSave as any).entity;

        onSave(dataToSave);
    };
    
    const preventSubmitOnEnter = (e: React.KeyboardEvent<HTMLFormElement>) => {
        if (e.key === 'Enter' && (e.target as HTMLElement).tagName.toLowerCase() === 'input') {
            e.preventDefault();
        }
    };

    const isReceivable = formData.type === 'R';
    const modalTitle = entry ? 'Editar Lançamento' : 'Novo Lançamento';
    const entityLabel = isReceivable ? 'Cliente' : 'Fornecedor';

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={modalTitle} maxWidth="max-w-xl" closeOnBackdropClick={false} closeOnEscape={false} showCloseButton={false}>
            <form onSubmit={handleSubmit} onKeyDown={preventSubmitOnEnter} className="space-y-6">
                <div ref={entitySearchRef}>
                    {isSearchingEntity ? (
                        <div className="relative">
                            <InputField 
                                label={entityLabel} 
                                id="entity-search" 
                                name="entitySearch" 
                                value={entitySearchTerm} 
                                onChange={handleEntitySearchChange} 
                                onKeyDown={handleEntityKeyDown} 
                                onFocus={() => setIsEntityListOpen(true)} 
                                placeholder="Digite para buscar..." 
                                required={!formData.entity_id} 
                                autoComplete="off" 
                            />
                            {isEntityListOpen && filteredEntities.length > 0 && (
                                <ul className="absolute z-20 w-full bg-gray-600 border border-gray-500 rounded-md mt-1 max-h-40 overflow-y-auto shadow-lg">
                                    {filteredEntities.map((e, index) => (
                                        <li 
                                            key={e.id} 
                                            onClick={() => handleEntitySelect(e)} 
                                            className={`px-3 py-2 cursor-pointer text-white ${index === highlightedEntityIndex ? 'bg-blue-500' : 'hover:bg-gray-500'}`}
                                        >
                                            {e.trade_name || e.legal_name}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    ) : (
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">{entityLabel}</label>
                            <div className="flex items-center justify-between bg-gray-700 rounded-lg px-4 py-2 border border-gray-600 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-400">
                                <span className="text-white font-medium">{entitySearchTerm}</span>
                                <button type="button" onClick={() => { setIsSearchingEntity(true); setEntitySearchTerm(''); }} className="text-sm font-semibold text-blue-400 hover:text-blue-300" tabIndex={-1}>
                                    Trocar
                                </button>
                            </div>
                        </div>
                    )}
                    <input type="hidden" name="entity_id" value={formData.entity_id || ''} />
                </div>

                <InputField label="Descrição" id="description" name="description" value={formData.description} onChange={handleChange} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <InputField label="Valor Total (R$)" id="amount" name="amount" value={formData.amount} onChange={handleChange} required placeholder="Ex: 1500,00" inputMode="decimal" />
                     <InputField label="Data de Vencimento" id="due_date" name="due_date" type="date" value={formData.due_date} onChange={handleChange} required />
                </div>
                 {!entry && (
                    <InputField label="Número de Parcelas" id="installments" name="installments" type="number" min="1" value={formData.installments} onChange={handleChange} />
                )}
                 <div>
                    <label htmlFor="status" className="block text-sm font-medium text-gray-300 mb-1">Status</label>
                    <select id="status" name="status" value={formData.status} onChange={handleStatusChange} required disabled={!!entry} className="w-full bg-gray-700 custom-select text-white rounded-lg px-4 py-2 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-70 disabled:bg-gray-700/50">
                        <option>Pendente</option>
                        <option>Pago</option>
                    </select>
                </div>
                {formData.status === 'Pago' && !entry && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-700/50 rounded-lg">
                        <InputField 
                            label="Valor Pago (R$)" 
                            id="paid_amount" 
                            name="paid_amount" 
                            value={formData.paid_amount} 
                            onChange={handleChange} 
                            placeholder="Deixe em branco para valor total" 
                            inputMode="decimal"
                            required={!entry && formData.status === 'Pago'}
                        />
                        <InputField 
                            label="Data do Pagamento" 
                            id="payment_date" 
                            name="payment_date" 
                            type="date" 
                            value={formData.payment_date} 
                            onChange={handleChange}
                            required={!entry && formData.status === 'Pago'}
                        />
                    </div>
                )}
                <div className="flex justify-end space-x-3 pt-6 border-t border-gray-700">
                    <button type="button" name="formCancel" onClick={onClose} className="px-5 py-2 text-sm font-semibold text-gray-300 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors">Cancelar</button>
                    <button type="submit" name="formSave" className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-500 transition-colors">Salvar</button>
                </div>
            </form>
        </Modal>
    );
};