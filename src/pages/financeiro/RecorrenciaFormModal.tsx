import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Modal } from '../../components/Modal';
import { InputField } from '../../components/Generic';
import { supabaseService } from '../../services/storage';
import { capitalizeWords } from '../../utils/helpers';
import { SpinnerIcon } from '../../components/Icons';

export const RecorrenciaFormModal = ({ isOpen, onClose, onSave, entry, addLog, isSaving }) => {
    const today = new Date().toISOString().split('T')[0];
    const initialFormState = {
        type: 'R',
        entity_id: null,
        description: '',
        amount: '',
        account_plan: '',
        cost_center: '',
        payment_method: '',
        frequency: 'Mensal',
        due_day: 10,
        start_date: today,
        end_condition: 'indefinido', // 'indefinido', 'data', 'ocorrencias'
        end_date: '',
        occurrences: '',
        status: 'Ativo',
    };

    const [formData, setFormData] = useState(initialFormState);
    const [entities, setEntities] = useState([]);
    const [isSearchingEntity, setIsSearchingEntity] = useState(!entry);
    const [entitySearchTerm, setEntitySearchTerm] = useState('');
    const [isEntityListOpen, setIsEntityListOpen] = useState(false);
    const [highlightedEntityIndex, setHighlightedEntityIndex] = useState(-1);
    const entitySearchRef = useRef(null);

    const fetchEntities = useCallback(async (type) => {
        const fetcher = type === 'R' ? supabaseService.getClientes : supabaseService.getFornecedores;
        const data = await fetcher();
        setEntities(data);
    }, []);

    useEffect(() => {
        if (isOpen) {
            const entryType = entry ? entry.type : 'R';
            fetchEntities(entryType);

            if (entry) {
                let end_condition = 'indefinido';
                if (entry.end_date) end_condition = 'data';
                if (entry.occurrences) end_condition = 'ocorrencias';

                setFormData({
                    ...initialFormState,
                    ...entry,
                    amount: String(entry.amount).replace('.', ','),
                    start_date: new Date(entry.start_date).toISOString().split('T')[0],
                    end_date: entry.end_date ? new Date(entry.end_date).toISOString().split('T')[0] : '',
                    end_condition,
                });
                setEntitySearchTerm(entry.entity_name || '');
                setIsSearchingEntity(false);
            } else {
                setFormData(initialFormState);
                setEntitySearchTerm('');
                setIsSearchingEntity(true);
            }
        }
    }, [entry, isOpen, fetchEntities]);
    
    useEffect(() => {
        // Fetch new entities when type changes
        if (isOpen && !entry) { // Only on creation
            fetchEntities(formData.type);
            setFormData(prev => ({...prev, entity_id: null}));
            setEntitySearchTerm('');
            setIsSearchingEntity(true);
        }
    }, [formData.type, isOpen, entry, fetchEntities]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };
    
    const handleEntitySearchChange = (e) => {
        setEntitySearchTerm(e.target.value);
        setIsEntityListOpen(true);
        setHighlightedEntityIndex(-1);
        if (formData.entity_id) setFormData(p => ({ ...p, entity_id: null }));
    };

    const handleEntitySelect = (entity) => {
        setFormData(p => ({ ...p, entity_id: entity.id }));
        setEntitySearchTerm(entity.trade_name || entity.legal_name);
        setIsEntityListOpen(false);
        setIsSearchingEntity(false);
    };

    const filteredEntities = useMemo(() => {
        if (!entitySearchTerm) return [];
        return entities.filter(e =>
            ((e.legal_name || '').toLowerCase().includes(entitySearchTerm.toLowerCase())) ||
            (e.trade_name && e.trade_name.toLowerCase().includes(entitySearchTerm.toLowerCase()))
        ).slice(0, 5);
    }, [entitySearchTerm, entities]);
    
    const handleSubmit = (e) => {
        e.preventDefault();
        const amountNumber = parseFloat(formData.amount.replace(',', '.')) || 0;

        const dataToSave = {
            ...formData,
            id: entry?.id,
            amount: amountNumber,
            due_day: parseInt(String(formData.due_day), 10),
            end_date: formData.end_condition === 'data' ? formData.end_date : null,
            occurrences: formData.end_condition === 'ocorrencias' ? parseInt(String(formData.occurrences), 10) : null,
        };
        
        delete (dataToSave as any).end_condition;
        delete (dataToSave as any).entity_name;

        onSave(dataToSave);
    };

    const isReceita = formData.type === 'R';
    const entityLabel = isReceita ? 'Cliente' : 'Fornecedor';

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={entry ? 'Editar Recorrência' : 'Nova Recorrência'} maxWidth="max-w-3xl" closeOnBackdropClick={false}>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="flex rounded-lg bg-gray-700 p-1">
                    <button type="button" onClick={() => setFormData(p => ({ ...p, type: 'R'}))} className={`flex-1 py-1.5 text-sm font-semibold rounded-md transition-colors ${isReceita ? 'bg-green-500 text-white' : 'text-gray-300 hover:bg-gray-600'}`}>Receita</button>
                    <button type="button" onClick={() => setFormData(p => ({ ...p, type: 'P'}))} className={`flex-1 py-1.5 text-sm font-semibold rounded-md transition-colors ${!isReceita ? 'bg-red-500 text-white' : 'text-gray-300 hover:bg-gray-600'}`}>Despesa</button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div>
                        {isSearchingEntity ? (
                            <div className="relative" ref={entitySearchRef}>
                                <InputField label={entityLabel} id="entitySearch" name="entitySearch" value={entitySearchTerm} onChange={handleEntitySearchChange} required />
                                {isEntityListOpen && filteredEntities.length > 0 && (
                                    <ul className="absolute z-20 w-full bg-gray-600 border border-gray-500 rounded-md mt-1 max-h-40 overflow-y-auto shadow-lg">
                                        {filteredEntities.map(e => <li key={e.id} onClick={() => handleEntitySelect(e)} className="px-3 py-2 cursor-pointer text-white hover:bg-gray-500">{e.trade_name || e.legal_name}</li>)}
                                    </ul>
                                )}
                            </div>
                        ) : (
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">{entityLabel}</label>
                                <div className="flex items-center justify-between bg-gray-700 rounded-lg px-4 py-2"><span className="text-white font-medium">{entitySearchTerm}</span><button type="button" onClick={() => setIsSearchingEntity(true)} className="text-sm font-semibold text-blue-400 hover:text-blue-300">Trocar</button></div>
                            </div>
                        )}
                    </div>
                    <InputField label="Descrição" id="description" name="description" value={formData.description} onChange={handleChange} required />
                </div>
                
                 <fieldset><legend className="text-sm font-medium text-gray-400 mb-2">Detalhes Financeiros</legend>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <InputField label="Valor (R$)" id="amount" name="amount" value={formData.amount} onChange={handleChange} required inputMode="decimal" />
                        <InputField label="Forma de Pagamento Padrão" id="payment_method" name="payment_method" value={formData.payment_method} onChange={handleChange} />
                        <InputField label="Plano de Contas" id="account_plan" name="account_plan" value={formData.account_plan} onChange={handleChange} />
                        <InputField label="Centro de Custo (Opcional)" id="cost_center" name="cost_center" value={formData.cost_center} onChange={handleChange} />
                    </div>
                </fieldset>

                <fieldset><legend className="text-sm font-medium text-gray-400 mb-2">Configuração da Recorrência</legend>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div><label className="block text-sm text-gray-300 mb-1">Frequência</label><select name="frequency" value={formData.frequency} onChange={handleChange} className="w-full bg-gray-700 custom-select rounded-lg p-2"><option>Mensal</option><option>Trimestral</option><option>Semestral</option><option>Anual</option></select></div>
                        <InputField label="Dia do Vencimento" id="due_day" name="due_day" type="number" min="1" max="31" value={formData.due_day} onChange={handleChange} required />
                        <InputField label="Data de Início" id="start_date" name="start_date" type="date" value={formData.start_date} onChange={handleChange} required />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                        <div><label className="block text-sm text-gray-300 mb-1">Término</label><select name="end_condition" value={formData.end_condition} onChange={handleChange} className="w-full bg-gray-700 custom-select rounded-lg p-2"><option value="indefinido">Indefinido</option><option value="data">Data Específica</option><option value="ocorrencias">Nº de Ocorrências</option></select></div>
                        {formData.end_condition === 'data' && <InputField label="Data Final" id="end_date" name="end_date" type="date" value={formData.end_date} onChange={handleChange} />}
                        {formData.end_condition === 'ocorrencias' && <InputField label="Nº de Ocorrências" id="occurrences" name="occurrences" type="number" min="1" value={formData.occurrences} onChange={handleChange} />}
                    </div>
                </fieldset>
                
                <div className="flex justify-end space-x-3 pt-6 border-t border-gray-700">
                    <button type="button" onClick={onClose} className="px-5 py-2 text-sm font-semibold text-gray-300 bg-gray-700 rounded-lg hover:bg-gray-600">Cancelar</button>
                    <button type="submit" disabled={isSaving} className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-500 flex items-center justify-center w-24 disabled:opacity-50">
                        {isSaving ? <SpinnerIcon className="w-5 h-5" /> : 'Salvar'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};