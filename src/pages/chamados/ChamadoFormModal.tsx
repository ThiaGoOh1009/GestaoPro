import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Modal, ConfirmationModal } from '../../components/Modal';
import { supabaseService } from '../../services/storage';
import { PlusIcon, XIcon, MicIcon, SparklesIcon, SpinnerIcon, UploadIcon, TrashIcon, CreditCardIcon, Edit2Icon, ArrowLeftIcon } from '../../components/Icons';
import { GoogleGenAI } from '@google/genai';
import { capitalizeWords } from '../../utils/helpers';


const formatCurrency = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);

// --- Standard Label Components ---

const FloatingLabelInput = ({ id, label, type = 'text', required = false, ...props }) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium text-gray-300 mb-1.5">
            {label}{required && <span className="text-red-400 ml-1">*</span>}
        </label>
        <input
            id={id}
            type={type}
            {...props}
            className="block w-full h-11 px-4 text-base text-white bg-gray-700 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
        />
    </div>
);

const FloatingLabelSelect = ({ id, label, required = false, children, ...props }) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium text-gray-300 mb-1.5">
            {label}{required && <span className="text-red-400 ml-1">*</span>}
        </label>
        <select
            id={id}
            {...props}
            className="block w-full h-11 px-4 text-base text-white bg-gray-700 rounded-lg border border-gray-600 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 custom-select"
        >
            {children}
        </select>
    </div>
);

const FloatingLabelTextarea = ({ id, label, required = false, onCorrect, isCorrecting, onRecordStart, onRecordStop, isRecording, ...props }: { id: string; label: string; required?: boolean; onCorrect?: () => void; isCorrecting?: boolean; onRecordStart?: () => void; onRecordStop?: () => void; isRecording?: boolean; [key: string]: any; }) => (
     <div>
        <div className="flex justify-between items-center mb-1.5">
             <label htmlFor={id} className="block text-sm font-medium text-gray-300">
                {label}{required && <span className="text-red-400 ml-1">*</span>}
            </label>
             {(onCorrect || onRecordStart) && (
                 <div className="flex items-center space-x-2">
                    {onRecordStart && <button type="button" onMouseDown={onRecordStart} onMouseUp={onRecordStop} onTouchStart={onRecordStart} onTouchEnd={onRecordStop} className={`p-1.5 rounded-full transition-colors ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-600/50 text-gray-300 hover:bg-gray-500'}`} aria-label={isRecording ? 'Parar Gravação' : 'Segure para Gravar Voz'}><MicIcon className="w-4 h-4"/></button>}
                    {onCorrect && <button type="button" onClick={onCorrect} disabled={isCorrecting} className="p-1.5 text-gray-300 bg-gray-600/50 rounded-full hover:bg-gray-500 hover:text-white disabled:opacity-50" aria-label="Corrigir com IA">{isCorrecting ? <SpinnerIcon className="w-4 h-4"/> : <SparklesIcon className="w-4 h-4"/>}</button>}
                </div>
            )}
        </div>
        <textarea 
            id={id} 
            {...props} 
            className="block w-full px-4 py-2.5 text-base text-white bg-gray-700 rounded-lg border border-gray-600 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
    </div>
);

const FloatingLabelSearch = ({ id, label, required = false, value, onChange, onKeyDown, onFocus, suggestions, onSelect, highlightedIndex, ...props }) => (
    <div className="relative">
        <FloatingLabelInput id={id} label={label} required={required} value={value} onChange={onChange} onKeyDown={onKeyDown} onFocus={onFocus} {...props} />
        {suggestions.length > 0 && (
            <ul className="absolute z-20 w-full bg-gray-600 border border-gray-500 rounded-md mt-1 max-h-40 overflow-y-auto shadow-lg">
                {suggestions.map((item, index) => (
                    <li key={item.id} onClick={() => onSelect(item)} className={`px-3 py-2 cursor-pointer text-white ${index === highlightedIndex ? 'bg-blue-500' : 'hover:bg-gray-500'}`}>
                        {item.trade_name || item.name || item.legal_name} {item.type && <span className="text-xs text-gray-400">({item.type})</span>}
                    </li>
                ))}
            </ul>
        )}
    </div>
);
// --- End Standard Label Components ---


const ItemInput = ({ onAddItem }) => {
    const [products, setProducts] = useState([]);
    const [item, setItem] = useState({ productId: null, name: '', quantity: 1, unitPrice: '' });
    const [searchTerm, setSearchTerm] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [highlightedProductIndex, setHighlightedProductIndex] = useState(-1);
    const componentRef = useRef(null);

    useEffect(() => {
        supabaseService.getProdutos().then(setProducts);
    }, []);
    
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (componentRef.current && !componentRef.current.contains(event.target)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredProducts = useMemo(() => (
        searchTerm ? products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase())).slice(0, 5) : []
    ), [products, searchTerm]);

    const handleProductSelect = (product) => {
        if (!product) return;
        setItem({ 
            productId: product.id, 
            name: product.name, 
            quantity: 1, 
            unitPrice: product.price.toString().replace('.', ',')
        });
        setSearchTerm(product.name);
        setShowSuggestions(false);
        setHighlightedProductIndex(-1);
        setTimeout(() => document.getElementById('item-quantity')?.focus(), 0);
    };

    const handleAddItem = async () => {
        const unitPrice = parseFloat(item.unitPrice.replace(',', '.')) || 0;
        const quantity = item.quantity > 0 ? item.quantity : 1;
        
        if (item.productId) {
            if (quantity <= 0) return;
            onAddItem({ ...item, quantity, unitPrice: unitPrice, totalPrice: quantity * unitPrice });
        } else {
            const newItemName = searchTerm.trim();
            if (!newItemName) { alert('Selecione um produto ou digite um novo nome.'); return; }
            if (unitPrice <= 0) { alert('Informe um valor unitário.'); return; }
            await supabaseService.addTemporaryProduct({ name: newItemName, price: unitPrice });
            onAddItem({ productId: null, name: newItemName, quantity, unitPrice, totalPrice: quantity * unitPrice });
        }
        setItem({ productId: null, name: '', quantity: 1, unitPrice: '' });
        setSearchTerm('');
    };
    
    const handleProductSearchKeyDown = (e) => {
        if (showSuggestions && filteredProducts.length > 0) {
            if (e.key === 'ArrowDown') { e.preventDefault(); setHighlightedProductIndex(prev => (prev + 1) % filteredProducts.length); } 
            else if (e.key === 'ArrowUp') { e.preventDefault(); setHighlightedProductIndex(prev => (prev - 1 + filteredProducts.length) % filteredProducts.length); } 
            else if (e.key === 'Enter' || e.key === 'Tab') { if (highlightedProductIndex > -1) { e.preventDefault(); handleProductSelect(filteredProducts[highlightedProductIndex]); } } 
            else if (e.key === 'Escape') { setShowSuggestions(false); setHighlightedProductIndex(-1); }
        }
    };

    const inputClasses = "block w-full h-11 px-4 text-base text-white bg-gray-800 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400";

    return (
        <div className="bg-gray-700/50 p-3 rounded-lg" ref={componentRef}>
            <div className="grid grid-cols-12 gap-3 items-center">
                <div className="col-span-12 sm:col-span-5 relative">
                    <input id="item-name" placeholder="Buscar Produto ou Adicionar Novo" value={searchTerm} onChange={(e) => { const term = e.target.value; setSearchTerm(term); setShowSuggestions(true); setHighlightedProductIndex(-1); if (item.productId && item.name !== term) setItem(p => ({...p, productId: null, name: '', unitPrice: ''})); }} onFocus={() => setShowSuggestions(true)} onKeyDown={handleProductSearchKeyDown} autoComplete="off" className={inputClasses} />
                    {showSuggestions && filteredProducts.length > 0 && (
                        <ul className="absolute z-10 w-full bg-gray-600 border border-gray-500 rounded-md mt-1 max-h-40 overflow-y-auto shadow-lg">{filteredProducts.map((p, index) => (<li key={p.id} onClick={() => handleProductSelect(p)} className={`px-3 py-2 cursor-pointer hover:bg-gray-500 text-white text-sm ${index === highlightedProductIndex ? 'bg-blue-500' : ''}`}>{p.name}</li>))}</ul>
                    )}
                </div>
                <div className="col-span-4 sm:col-span-2"><input id="item-quantity" placeholder="Qtde." type="number" min="1" value={item.quantity} onChange={e => setItem(p => ({ ...p, quantity: parseInt(e.target.value, 10) || 1 }))} className={inputClasses} /></div>
                <div className="col-span-4 sm:col-span-2"><input id="item-price" placeholder="Vlr. Unit." value={item.unitPrice} onChange={e => setItem(p => ({...p, unitPrice: e.target.value.replace(/[^0-9,]/g, '') }))} inputMode="decimal" className={inputClasses}/></div>
                <div className="col-span-4 sm:col-span-3"><button type="button" onClick={handleAddItem} className="w-full h-11 flex items-center justify-center px-4 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-500 transition-colors"><PlusIcon className="w-4 h-4 sm:mr-2"/> <span className="hidden sm:inline">Adicionar</span></button></div>
            </div>
        </div>
    );
};

const ItemsTable = ({ items, onRemoveItem, onItemChange, tableHeaders, isEditable }) => (
    <div className="overflow-x-auto"><table className="w-full text-sm text-left text-gray-300">
        <thead className="text-xs text-gray-400 uppercase bg-gray-800"><tr className="border-b border-gray-700/50">
            {tableHeaders.map(header => <th key={header} scope="col" className="px-4 py-2">{header}</th>)}
            <th scope="col" className="px-4 py-2 text-right">Ação</th>
        </tr></thead>
        <tbody>{items.map((item, index) => (
            <tr key={index} className="bg-gray-800/50 border-b border-gray-700/50">
                <td className="px-4 py-2 font-medium text-white">{item.name}</td>
                <td className="px-4 py-2">{isEditable ? (<input type="number" inputMode="numeric" value={item.quantity} onChange={(e) => onItemChange(index, 'quantity', parseInt(e.target.value, 10))} className="w-16 bg-gray-900 text-white rounded-md px-2 py-1 border border-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500" min="1"/>) : (item.quantity)}</td>
                {tableHeaders.includes('Vlr. Unit.') && (<td className="px-4 py-2">{isEditable ? (<input type="text" inputMode="decimal" value={String(item.unitPrice).replace('.', ',')} onChange={(e) => onItemChange(index, 'unitPrice', e.target.value)} className="w-24 bg-gray-900 text-white rounded-md px-2 py-1 border border-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="0,00"/>) : (formatCurrency(item.unitPrice))}</td>)}
                {tableHeaders.includes('Vlr. Total') && (<td className="px-4 py-2 font-semibold">{formatCurrency(item.totalPrice)}</td>)}
                <td className="px-4 py-2 text-right">{isEditable && (<button type="button" onClick={() => onRemoveItem(index)} className="text-red-500 hover:text-red-400"><XIcon className="w-4 h-4"/></button>)}</td>
            </tr>
        ))}</tbody>
    </table></div>
);


export const ChamadoFormModal = ({ isOpen, onClose, onSave, chamado, addLog, isClientLocked = false, onAddPayment, onDeletePayment, isSaving }) => {
    const initialFormState = { entity_id: null, client_name: '', request_type: 'Chamado de Serviço', billing_type: 'Particular', status: 'Aberto', priority: 'Média', equipment: '', serial_number: '', observations: '', items: [], payments: [], training_type: '', other_training: '', participants: 1, preferred_date: '', scheduling_type: '', estimated_duration: '', audio_files: [] };
    const [formData, setFormData] = useState(initialFormState);
    const [clients, setClients] = useState([]);
    const [requestTypes, setRequestTypes] = useState([]);
    const [isCorrecting, setIsCorrecting] = useState({ problem: false, solution: false });
    const [isRecording, setIsRecording] = useState({ problem: false, solution: false });
    const recognitionRef = useRef(null);
    const fileInputRef = useRef(null);
    const [isSearchingClient, setIsSearchingClient] = useState(!chamado && !isClientLocked);
    const [clientSearchTerm, setClientSearchTerm] = useState('');
    const [isClientListOpen, setIsClientListOpen] = useState(false);
    const [highlightedClientIndex, setHighlightedClientIndex] = useState(-1);
    const clientSearchRef = useRef(null);
    const [allEquipamentos, setAllEquipamentos] = useState([]);
    const [equipmentSearchTerm, setEquipmentSearchTerm] = useState('');
    const [isEquipmentListOpen, setIsEquipmentListOpen] = useState(false);
    const [highlightedEquipmentIndex, setHighlightedEquipmentIndex] = useState(-1);
    const equipmentSearchRef = useRef(null);
    const [isTranscribing, setIsTranscribing] = useState(false);
    const [isStatusConfirmModalOpen, setStatusConfirmModalOpen] = useState(false);
    const [technicalReports, setTechnicalReports] = useState<{problem: string; solution: string}[]>([]);
    const [currentProblem, setCurrentProblem] = useState('');
    const [currentSolution, setCurrentSolution] = useState('');
    const [editingSolutionIndex, setEditingSolutionIndex] = useState<number | null>(null);
    const isConcludedOrCanceled = useMemo(() => chamado ? ['Concluído', 'Cancelado'].includes(chamado.status) || chamado.invoiced : false, [chamado]);
    const totalValue = useMemo(() => formData.items.reduce((acc, item) => acc + (item.totalPrice || 0), 0), [formData.items]);

    useEffect(() => { const handleEsc = (event: KeyboardEvent) => { if (event.key === 'Escape') { onClose(); } }; window.addEventListener('keydown', handleEsc); return () => window.removeEventListener('keydown', handleEsc); }, [onClose]);
    useEffect(() => { if (isOpen) { supabaseService.getClientes().then(c => { setClients(c); addLog('Lista de clientes carregada.'); }); supabaseService.getEquipamentos().then(e => { setAllEquipamentos(e); addLog('Lista de equipamentos carregada.'); }); supabaseService.getRequestTypes().then(rt => { setRequestTypes(rt); addLog('Tipos de solicitação carregados.'); }); if (chamado) { const formDataToLoad = { ...initialFormState, ...chamado }; formDataToLoad.audio_files = formDataToLoad.audio_files || []; const splitAndClean = (text) => text ? text.split(/\n--\[item\]--\n|\n/).map(s => s.trim().replace(/^\d+\.?[ \t]*/, '')).filter(Boolean) : []; const problems = splitAndClean(chamado.problem_description); const solutions = splitAndClean(chamado.solution_description); const reports = problems.map((problem, index) => ({ problem, solution: solutions[index] || '' })); setTechnicalReports(reports); setFormData(formDataToLoad); setClientSearchTerm(chamado.client_name || ''); setEquipmentSearchTerm(chamado.equipment || ''); setIsSearchingClient(false); addLog(`Carregando dados para editar chamado: ${chamado.id}`); } else { setFormData(initialFormState); setTechnicalReports([]); setCurrentProblem(''); setCurrentSolution(''); setEditingSolutionIndex(null); setClientSearchTerm(''); setEquipmentSearchTerm(''); setIsSearchingClient(!isClientLocked); addLog(`Abrindo formulário para novo chamado.`); if (!isClientLocked) setTimeout(() => clientSearchRef.current?.querySelector('input')?.focus(), 100); } } }, [chamado, isOpen, addLog, isClientLocked]);
    useEffect(() => { const handleClickOutside = (event) => { if (clientSearchRef.current && !clientSearchRef.current.contains(event.target)) setIsClientListOpen(false); if (equipmentSearchRef.current && !equipmentSearchRef.current.contains(event.target)) setIsEquipmentListOpen(false); }; document.addEventListener('mousedown', handleClickOutside); return () => document.removeEventListener('mousedown', handleClickOutside); }, []);
    const handleChange = (e) => { const { name, value } = e.target; const finalValue = ['other_training', 'estimated_duration'].includes(name) ? capitalizeWords(value) : value; setFormData(p => ({ ...p, [name]: finalValue })); };
    const handleClientSearchChange = (e) => { const term = capitalizeWords(e.target.value); setClientSearchTerm(term); setIsClientListOpen(true); setHighlightedClientIndex(-1); if (formData.entity_id) setFormData(p => ({ ...p, entity_id: null, client_name: '' })); };
    const handleClientSelect = (client) => { if (!client) return; const clientName = client.trade_name || client.legal_name; setFormData(p => ({...p, entity_id: client.id, client_name: clientName })); setClientSearchTerm(clientName); setIsClientListOpen(false); setIsSearchingClient(false); setHighlightedClientIndex(-1); };
    const handleEquipmentSearchChange = (e) => { const term = capitalizeWords(e.target.value); setEquipmentSearchTerm(term); setIsEquipmentListOpen(true); setHighlightedEquipmentIndex(-1); setFormData(p => ({...p, equipment: term })); };
    const handleEquipmentSelect = (equipamento) => { if (!equipamento) return; setFormData(p => ({...p, equipment: equipamento.name })); setEquipmentSearchTerm(equipamento.name); setIsEquipmentListOpen(false); setHighlightedEquipmentIndex(-1); };
    const filteredClients = useMemo(() => !clientSearchTerm ? [] : clients.filter(c => ((c.legal_name || '').toLowerCase().includes(clientSearchTerm.toLowerCase())) || (c.trade_name && c.trade_name.toLowerCase().includes(clientSearchTerm.toLowerCase()))).slice(0, 5), [clientSearchTerm, clients]);
    const filteredEquipamentos = useMemo(() => !equipmentSearchTerm ? [] : allEquipamentos.filter(e => e.name && e.name.toLowerCase().includes(equipmentSearchTerm.toLowerCase())).slice(0, 5), [equipmentSearchTerm, allEquipamentos]);
    const handleClientKeyDown = (e) => { if (isClientListOpen && filteredClients.length > 0) { if (e.key === 'ArrowDown') { e.preventDefault(); setHighlightedClientIndex(prev => (prev + 1) % filteredClients.length); } else if (e.key === 'ArrowUp') { e.preventDefault(); setHighlightedClientIndex(prev => (prev - 1 + filteredClients.length) % filteredClients.length); } else if (e.key === 'Enter') { e.preventDefault(); if (highlightedClientIndex > -1) handleClientSelect(filteredClients[highlightedClientIndex]); } else if (e.key === 'Tab' && highlightedClientIndex > -1) handleClientSelect(filteredClients[highlightedClientIndex]); else if (e.key === 'Escape') setIsClientListOpen(false); } };
    const handleEquipmentKeyDown = (e) => { if (isEquipmentListOpen && (filteredEquipamentos.length > 0 || equipmentSearchTerm)) { if (e.key === 'ArrowDown' && filteredEquipamentos.length > 0) { e.preventDefault(); setHighlightedEquipmentIndex(prev => (prev + 1) % filteredEquipamentos.length); } else if (e.key === 'ArrowUp' && filteredEquipamentos.length > 0) { e.preventDefault(); setHighlightedEquipmentIndex(prev => (prev - 1 + filteredEquipamentos.length) % filteredEquipamentos.length); } else if (e.key === 'Enter') { e.preventDefault(); if (highlightedEquipmentIndex > -1) handleEquipmentSelect(filteredEquipamentos[highlightedEquipmentIndex]); else setIsEquipmentListOpen(false); } else if (e.key === 'Tab' && highlightedEquipmentIndex > -1) handleEquipmentSelect(filteredEquipamentos[highlightedEquipmentIndex]); else if (e.key === 'Escape') setIsEquipmentListOpen(false); } };
    const handleAddItem = (item) => { setFormData(p => ({ ...p, items: [...p.items, item] })); };
    const handleRemoveItem = (index) => { const removedItem = formData.items[index]; setFormData(p => ({...p, items: p.items.filter((_, i) => i !== index)})); addLog(`Item '${removedItem.name}' removido.`); };
    const handleItemChange = (index, field, value) => { const updatedItems = [...formData.items]; const itemToUpdate = { ...updatedItems[index] }; if (field === 'quantity') itemToUpdate.quantity = value > 0 ? value : 1; else if (field === 'unitPrice') itemToUpdate.unitPrice = parseFloat(String(value).replace(',', '.')) || 0; itemToUpdate.totalPrice = (itemToUpdate.quantity || 1) * (itemToUpdate.unitPrice || 0); updatedItems[index] = itemToUpdate; setFormData(p => ({ ...p, items: updatedItems })); addLog(`Item '${itemToUpdate.name}' atualizado: ${field} para ${value}.`); };
    const handleAudioUpload = (e) => { const files = e.target.files; if (!files || files.length === 0) return; let pending = 0; const processFile = (file) => { if (!file.type.startsWith('audio/')) return; pending++; if (pending > 0) setIsTranscribing(true); const reader = new FileReader(); reader.onload = async (loadEvent) => { const dataUrl = loadEvent.target.result as string; setFormData(p => ({ ...p, audio_files: [...p.audio_files, { name: file.name, dataUrl }] })); try { const ai = new GoogleGenAI({ apiKey: process.env.API_KEY }); const audioPart = { inlineData: { mimeType: file.type, data: dataUrl.split(',')[1] } }; const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: { parts: [{ text: "Transcreva o áudio:" }, audioPart] } }); const transcription = response.text || ''; if (transcription) setTechnicalReports(prev => [...prev, { problem: transcription.trim(), solution: '' }]); } catch (err) { setTechnicalReports(prev => [...prev, { problem: `[Erro na transcrição de ${file.name}]`, solution: '' }]); } finally { pending--; if (pending === 0) setIsTranscribing(false); } }; reader.readAsDataURL(file); }; Array.from(files).forEach(processFile); if (fileInputRef.current) fileInputRef.current.value = ''; };
    const removeAudio = (index) => { const removed = formData.audio_files[index]; setFormData(p => ({ ...p, audio_files: p.audio_files.filter((_, i) => i !== index) })); if(fileInputRef.current) fileInputRef.current.value = ''; addLog(`Áudio "${removed.name}" removido.`); };
    const executeSave = async (data) => { const name = (data.equipment || '').trim(); if (name && !allEquipamentos.some(e => e.name.toLowerCase() === name.toLowerCase())) { await supabaseService.addTemporaryEquipamento(name); } onSave({ ...data, id: chamado?.id, problem_description: technicalReports.map(r => r.problem).join('\n--\[item\]--\n'), solution_description: technicalReports.map(r => r.solution).join('\n--\[item\]--\n') }); };
    const handleSubmit = async (e) => { e.preventDefault(); if (isSaving) return; if (!formData.entity_id) { alert('É necessário selecionar um cliente.'); return; } if (chamado?.id && chamado.status === 'Aberto' && formData.status === 'Aberto') { setStatusConfirmModalOpen(true); return; } const data = { ...formData }; if ((data.request_type === 'Agendamento' || data.request_type === 'Treinamento') && !data.preferred_date) { const now = new Date(); now.setMinutes(now.getMinutes() - now.getTimezoneOffset()); data.preferred_date = now.toISOString().slice(0, 16); } executeSave(data); };
    const handleSaveWithStatusChange = () => { setStatusConfirmModalOpen(false); const data = { ...formData, status: 'Em Andamento' }; if ((data.request_type === 'Agendamento' || data.request_type === 'Treinamento') && !data.preferred_date) { const now = new Date(); now.setMinutes(now.getMinutes() - now.getTimezoneOffset()); data.preferred_date = now.toISOString().slice(0, 16); } executeSave(data); };
    const handleSaveWithoutStatusChange = () => { setStatusConfirmModalOpen(false); const data = { ...formData }; if ((data.request_type === 'Agendamento' || data.request_type === 'Treinamento') && !data.preferred_date) { const now = new Date(); now.setMinutes(now.getMinutes() - now.getTimezoneOffset()); data.preferred_date = now.toISOString().slice(0, 16); } executeSave(data); };
    const preventSubmitOnEnter = (e) => { if (e.key === 'Enter' && (e.target as HTMLElement).tagName.toLowerCase() === 'input') e.preventDefault(); };
    const selectedEquipment = useMemo(() => allEquipamentos.find(e => e.name.toLowerCase() === formData.equipment.toLowerCase()), [formData.equipment, allEquipamentos]);
    const showSerialField = formData.equipment && (!selectedEquipment || selectedEquipment.type === 'Equipamento');
    const handleAddProblem = () => { if (!currentProblem.trim()) return; setTechnicalReports(prev => [...prev, { problem: currentProblem.trim(), solution: '' }]); setCurrentProblem(''); };
    const handleDeleteProblem = (index) => { if (!window.confirm("Remover este problema?")) return; setTechnicalReports(prev => prev.filter((_, i) => i !== index)); if (editingSolutionIndex === index) { setEditingSolutionIndex(null); setCurrentSolution(''); } };
    const handleEditSolution = (index) => { setEditingSolutionIndex(index); setCurrentSolution(technicalReports[index].solution); };
    const handleSaveCurrentSolution = () => { if (editingSolutionIndex === null || !currentSolution.trim()) return; const newReports = [...technicalReports]; newReports[editingSolutionIndex].solution = currentSolution.trim(); setTechnicalReports(newReports); setCurrentSolution(''); setEditingSolutionIndex(null); };
    const modalTitle = chamado ? 'Editar Chamado' : 'Novo Chamado';
    const modalSubtitle = chamado ? `Editando #${String(chamado.id).padStart(6, '0')}` : 'Preencha os detalhes da solicitação.';
    
    const handleAIAssistance = async (field: 'problem' | 'solution') => {
        const textToCorrect = field === 'problem' ? currentProblem : currentSolution;
        if (!textToCorrect.trim()) return;
        setIsCorrecting(p => ({ ...p, [field]: true }));
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const prompt = `Corrija a ortografia e a gramática do seguinte texto, mantendo o sentido original. Retorne apenas o texto corrigido: "${textToCorrect}"`;
            const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt, });
            const correctedText = (response.text || '').trim();
            if (field === 'problem') setCurrentProblem(correctedText); else setCurrentSolution(correctedText);
        } catch (err) { alert(`Ocorreu um erro ao usar a IA: ${err.message}`);
        } finally { setIsCorrecting(p => ({ ...p, [field]: false })); }
    };

    const handleRecordStart = (field: 'problem' | 'solution') => {
        if (!('webkitSpeechRecognition' in window)) { alert('Seu navegador não suporta a gravação de voz.'); return; }
        if (recognitionRef.current) { (recognitionRef.current as any).stop(); }
        const recognition = new (window as any).webkitSpeechRecognition();
        recognition.continuous = true; recognition.interimResults = true; recognition.lang = 'pt-BR';
        recognition.onstart = () => setIsRecording(p => ({ ...p, [field]: true }));
        recognition.onend = () => { setIsRecording(p => ({ ...p, [field]: false })); recognitionRef.current = null; };
        recognition.onerror = (event: any) => setIsRecording(p => ({ ...p, [field]: false }));
        recognition.onresult = (event: any) => { let finalTranscript = ''; for (let i = event.resultIndex; i < event.results.length; ++i) { if (event.results[i].isFinal) finalTranscript += event.results[i][0].transcript; } if (finalTranscript) { if (field === 'problem') setCurrentProblem(prev => (prev ? prev + ' ' : '') + finalTranscript.trim()); else setCurrentSolution(prev => (prev ? prev + ' ' : '') + finalTranscript.trim()); } };
        recognition.start();
        recognitionRef.current = recognition;
    };

    const handleRecordStop = () => { if (recognitionRef.current) { (recognitionRef.current as any).stop(); } };

    return (
        <>
            <div className="bg-gray-800 rounded-xl shadow-lg animate-fadeIn">
                <header className="flex items-start justify-between p-4 sm:p-6 border-b border-gray-700">
                    <div className="flex items-center gap-4"><button type="button" onClick={onClose} className="p-2 text-gray-400 rounded-full hover:bg-gray-700 hover:text-white transition-colors" aria-label="Voltar"><ArrowLeftIcon className="w-6 h-6"/></button><div><h2 className="text-xl sm:text-2xl font-bold text-white leading-tight">{modalTitle}</h2><p className="text-sm text-gray-400 mt-0.5">{modalSubtitle}</p></div></div>
                </header>
                <form onSubmit={handleSubmit} onKeyDown={preventSubmitOnEnter} className="p-4 sm:p-6 space-y-4">
                    <input type="file" ref={fileInputRef} onChange={handleAudioUpload} style={{ display: 'none' }} accept="audio/*" multiple />
                    
                    <fieldset>
                        <legend className="text-lg font-semibold text-white mb-3 pb-2 border-b border-gray-700">Dados da Solicitação</legend>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="md:col-span-1" ref={clientSearchRef}>
                                {isSearchingClient ? (
                                    <FloatingLabelSearch id="client-search" label="Cliente" required value={clientSearchTerm} onChange={handleClientSearchChange} onKeyDown={handleClientKeyDown} onFocus={() => setIsClientListOpen(true)} suggestions={filteredClients} onSelect={handleClientSelect} highlightedIndex={highlightedClientIndex} autoComplete="off"/>
                                ) : (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-1.5">Cliente</label>
                                        <div className="flex items-center justify-between bg-gray-700 rounded-lg px-3 py-1.5 h-11 border border-gray-600">
                                            <span className="text-white font-medium truncate pr-2">{formData.client_name}</span>
                                            {!isClientLocked && (<button type="button" onClick={() => { setIsSearchingClient(true); setClientSearchTerm(''); }} className="text-sm font-semibold text-blue-400 hover:text-blue-300 flex-shrink-0" tabIndex={-1}>Trocar</button>)}
                                        </div>
                                    </div>
                                )}
                                <input type="hidden" name="entity_id" value={formData.entity_id || ''}/>
                            </div>
                            <div className="md:col-span-1">
                                <FloatingLabelSelect id="billing_type" name="billing_type" label="Tipo Faturamento" value={formData.billing_type} onChange={handleChange} required><option>Particular</option><option>Empresa</option></FloatingLabelSelect>
                            </div>
                             <div className="md:col-span-1">
                                <FloatingLabelSelect id="request_type" name="request_type" label="Tipo Solicitação" value={formData.request_type} onChange={handleChange} required>{requestTypes.map(rt => <option key={rt.id} value={rt.name}>{rt.name}</option>)}</FloatingLabelSelect>
                            </div>
                             {chamado && (
                                <div className="md:col-span-1">
                                    <FloatingLabelSelect id="status" name="status" label="Status" value={formData.status} onChange={handleChange} required>{['Aberto', 'Em Andamento', 'Concluído', 'Cancelado'].map(s => <option key={s} value={s}>{s}</option>)}</FloatingLabelSelect>
                                </div>
                            )}
                        </div>
                    </fieldset>

                    <fieldset><legend className="text-lg font-semibold text-white mb-3 pb-2 border-b border-gray-700">Detalhes do Chamado</legend><div className="space-y-4">
                        <div className="flex items-start gap-4"><div className="flex-grow" ref={equipmentSearchRef}><FloatingLabelSearch id="equipment" label="Equipamento/Sistema" value={equipmentSearchTerm} onChange={handleEquipmentSearchChange} onKeyDown={handleEquipmentKeyDown} onFocus={() => setIsEquipmentListOpen(true)} suggestions={filteredEquipamentos} onSelect={handleEquipmentSelect} highlightedIndex={highlightedEquipmentIndex} autoComplete="off" /></div>{showSerialField && <div className="w-1/3"><FloatingLabelInput id="serial_number" label="S/N" value={formData.serial_number} onChange={handleChange} /></div>}</div>
                        
                        <div><div className="mb-2"><label className="text-sm font-medium text-gray-300">Peças e Serviços</label></div><div className="space-y-2">{!isConcludedOrCanceled && <ItemInput onAddItem={handleAddItem} />}{formData.items.length > 0 ? (<><ItemsTable items={formData.items} onRemoveItem={handleRemoveItem} onItemChange={handleItemChange} tableHeaders={['Produto', 'Qtde', 'Vlr. Unit.', 'Vlr. Total']} isEditable={!isConcludedOrCanceled}/><div className="flex justify-end pt-2 text-lg"><span className="text-gray-400 font-medium mr-4">Total:</span><span className="text-white font-bold">{formatCurrency(totalValue)}</span></div></>) : (<p className="text-sm text-gray-500 text-center py-4 bg-gray-900/30 rounded-lg">Nenhum item adicionado.</p>)}</div></div>
                    </div></fieldset>
                    
                    <fieldset><legend className="text-lg font-semibold text-white mb-3 pb-2 border-b border-gray-700">Relato e Solução</legend><div className="space-y-4">
                        <div className="flex justify-between items-center"><label className="text-base font-medium text-gray-300">Relato do Cliente (Problemas)</label><div className="flex items-center gap-2"><button type="button" onClick={() => fileInputRef.current?.click()} className="h-11 flex items-center text-xs px-2 bg-gray-600 hover:bg-gray-500 text-white rounded-md transition-colors"><UploadIcon className="w-4 h-4 mr-1.5"/> Upar Áudio</button><button type="button" onClick={handleAddProblem} disabled={!currentProblem.trim()} className="h-11 flex items-center px-3 text-xs font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-500 disabled:opacity-50">Adicionar Problema</button></div></div>
                        <FloatingLabelTextarea id="problem" name="problem" label="Novo Problema a ser Adicionado" value={currentProblem} onChange={(e) => setCurrentProblem(e.target.value)} rows={3} onCorrect={() => handleAIAssistance('problem')} isCorrecting={isCorrecting.problem} onRecordStart={() => handleRecordStart('problem')} onRecordStop={handleRecordStop} isRecording={isRecording.problem} />
                        <div><h4 className="text-base font-semibold text-gray-300 mb-2">Problemas Relatados e Ações</h4>{technicalReports.length > 0 ? (<ul className="space-y-2">{technicalReports.map((report, index) => (<li key={index} className="flex flex-col sm:flex-row items-start justify-between gap-3 bg-gray-900/40 p-3 rounded-lg"><div className="flex-grow"><p className="font-medium text-gray-300">{index + 1}. {report.problem}</p>{report.solution && (<div className="pl-4 mt-1 border-l-2 border-cyan-700"><p className="text-sm text-cyan-300 whitespace-pre-wrap">{report.solution}</p></div>)}</div><div className="flex-shrink-0 flex items-center gap-2 pt-2 sm:pt-0"><button type="button" onClick={() => handleEditSolution(index)} className="h-11 flex items-center text-xs px-3 bg-blue-600 hover:bg-blue-500 text-white rounded-md">{report.solution ? 'Editar' : 'Adicionar'} Solução</button><button type="button" onClick={() => handleDeleteProblem(index)} className="p-1.5 bg-red-600/50 hover:bg-red-600 text-white rounded-full"><TrashIcon className="w-4 h-4"/></button></div></li>))}</ul>) : (<p className="text-sm text-gray-500 italic bg-gray-900/30 p-4 rounded-lg text-center">Nenhum problema adicionado.</p>)}</div>
                        {editingSolutionIndex !== null && <div className="pt-2"><div className="flex justify-between items-center"><label className="text-base font-medium text-gray-300">Relato Técnico para Problema #{editingSolutionIndex + 1}</label><button type="button" onClick={handleSaveCurrentSolution} disabled={!currentSolution.trim()} className="h-11 flex items-center px-3 text-xs font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-500 disabled:opacity-50">Salvar Relato</button></div><FloatingLabelTextarea id="solution" name="solution" label="Descreva a solução aplicada" value={currentSolution} onChange={(e) => setCurrentSolution(e.target.value)} rows={3} onCorrect={() => handleAIAssistance('solution')} isCorrecting={isCorrecting.solution} onRecordStart={() => handleRecordStart('solution')} onRecordStop={handleRecordStop} isRecording={isRecording.solution} /></div>}
                    </div></fieldset>

                    <div className="flex justify-end space-x-3 pt-6 border-t border-gray-700">
                        <button type="button" onClick={onClose} className="h-11 px-5 text-sm font-semibold text-gray-300 bg-gray-700 rounded-lg hover:bg-gray-600">Cancelar</button>
                        <button type="submit" disabled={isSaving} className="h-11 px-5 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-500 flex items-center justify-center w-24 disabled:bg-blue-800 disabled:cursor-not-allowed">{isSaving ? <SpinnerIcon className="w-5 h-5"/> : 'Salvar'}</button>
                    </div>
                </form>
            </div>
            <Modal isOpen={isStatusConfirmModalOpen} onClose={() => setStatusConfirmModalOpen(false)} title="Alterar Status do Chamado?" maxWidth="max-w-lg" closeOnBackdropClick={false} showCloseButton={false}><p className="text-gray-300">Deseja alterar o status para 'Em Andamento'?</p><div className="flex justify-end space-x-3 pt-6 mt-2"><button type="button" onClick={handleSaveWithoutStatusChange} className="px-5 py-2 text-sm font-semibold text-gray-300 bg-gray-700 rounded-lg hover:bg-gray-600">Não, manter Aberto</button><button type="button" onClick={handleSaveWithStatusChange} className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-500">Sim, alterar</button></div></Modal>
        </>
    );
};