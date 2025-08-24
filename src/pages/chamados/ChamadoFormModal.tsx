import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Modal } from '../../components/Modal';
import { InputField } from '../../components/Generic';
import { backend } from '../../services/storage';
import { PlusIcon, XIcon, MicIcon, SparklesIcon, SpinnerIcon, UploadIcon, TrashIcon } from '../../components/Icons';
import { GoogleGenAI } from '@google/genai';
import { capitalizeWords } from '../../utils/helpers';


const ItemInput = ({ onAddItem }) => {
    const [products, setProducts] = useState([]);
    const [item, setItem] = useState({ productId: null, name: '', quantity: 1, unitPrice: '' });
    const [searchTerm, setSearchTerm] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [highlightedProductIndex, setHighlightedProductIndex] = useState(-1);
    const componentRef = useRef(null);

    useEffect(() => {
        backend.getProdutos().then(setProducts);
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

    const handleAddItem = () => {
        if (!item.productId || item.quantity <= 0) return;
        const unitPrice = parseFloat(item.unitPrice.replace(',', '.')) || 0;
        onAddItem({
            ...item,
            unitPrice: unitPrice,
            totalPrice: item.quantity * unitPrice,
        });
        setItem({ productId: null, name: '', quantity: 1, unitPrice: '' });
        setSearchTerm('');
    };
    
    const handleProductSearchKeyDown = (e) => {
        if (showSuggestions && filteredProducts.length > 0) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setHighlightedProductIndex(prev => (prev + 1) % filteredProducts.length);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setHighlightedProductIndex(prev => (prev - 1 + filteredProducts.length) % filteredProducts.length);
            } else if (e.key === 'Enter' || e.key === 'Tab') {
                if (highlightedProductIndex > -1) {
                    e.preventDefault();
                    handleProductSelect(filteredProducts[highlightedProductIndex]);
                }
            } else if (e.key === 'Escape') {
                setShowSuggestions(false);
                setHighlightedProductIndex(-1);
            }
        }
    };

    return (
        <div className="bg-gray-700/50 p-4 rounded-lg space-y-3" ref={componentRef}>
            <div className="relative">
                 <InputField 
                    label="Buscar Produto" 
                    id="item-name" 
                    placeholder="Digite para buscar..." 
                    value={searchTerm} 
                    onChange={(e) => {
                        const newSearchTerm = e.target.value;
                        setSearchTerm(newSearchTerm);
                        setShowSuggestions(true);
                        setHighlightedProductIndex(-1);
                        if (item.productId && item.name !== newSearchTerm) {
                            setItem(prev => ({...prev, productId: null, name: '', unitPrice: ''}));
                        }
                    }} 
                    onFocus={() => setShowSuggestions(true)}
                    onKeyDown={handleProductSearchKeyDown}
                    autoComplete="off"
                 />
                 {showSuggestions && filteredProducts.length > 0 && (
                     <ul className="absolute z-10 w-full bg-gray-600 border border-gray-500 rounded-md mt-1 max-h-40 overflow-y-auto">
                        {filteredProducts.map((p, index) => (
                            <li 
                                key={p.id} 
                                onClick={() => handleProductSelect(p)} 
                                className={`px-3 py-2 cursor-pointer hover:bg-gray-500 text-white ${index === highlightedProductIndex ? 'bg-blue-500' : ''}`}
                            >
                                {p.name}
                            </li>
                        ))}
                     </ul>
                 )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                 <InputField label="Qtde." id="item-quantity" type="number" min="1" value={item.quantity} onChange={e => setItem(p => ({ ...p, quantity: parseInt(e.target.value, 10) || 1 }))} />
                 <InputField label="Valor Unit. (R$)" id="item-price" value={item.unitPrice} onChange={e => setItem(p => ({...p, unitPrice: e.target.value.replace(/[^0-9,]/g, '') }))} disabled={!!item.productId} />
                 <div className="self-end">
                    <button type="button" onClick={handleAddItem} disabled={!item.productId} className="w-full flex items-center justify-center px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-500 transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed"><PlusIcon className="w-4 h-4 mr-2"/>Adicionar</button>
                 </div>
            </div>
        </div>
    );
};

const ItemsTable = ({ items, onRemoveItem, tableHeaders }) => (
    <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-300">
            <thead className="text-xs text-gray-400 uppercase bg-gray-800"><tr className="border-b border-gray-700/50">
                {tableHeaders.map(header => <th key={header} scope="col" className="px-4 py-2">{header}</th>)}
                <th scope="col" className="px-4 py-2 text-right">Ação</th>
            </tr></thead>
            <tbody>{items.map((item, index) => (
                <tr key={index} className="bg-gray-800/50 border-b border-gray-700/50">
                    <td className="px-4 py-2 font-medium text-white">{item.name}</td>
                    <td className="px-4 py-2">{item.quantity}</td>
                    {item.unitPrice != null && <td className="px-4 py-2">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.unitPrice)}</td>}
                    {item.totalPrice != null && <td className="px-4 py-2">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.totalPrice)}</td>}
                    <td className="px-4 py-2 text-right"><button onClick={() => onRemoveItem(index)} className="text-red-500 hover:text-red-400"><XIcon className="w-4 h-4" /></button></td>
                </tr>
            ))}</tbody>
        </table>
    </div>
);

const TextAreaWithTools = ({ label, name, value, onChange, onCorrect, onRecordStart, onRecordStop, isCorrecting, isRecording, recordMode = 'append', placeholder = '' }) => {
    return (
        <div>
            <label htmlFor={name} className="block text-sm font-medium text-gray-300 mb-1">{label}</label>
            <div className="relative">
                <textarea id={name} name={name} value={value} onChange={onChange} rows={4} className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 pr-12 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400 transition" placeholder={placeholder}></textarea>
                <div className="absolute top-2 right-2 flex flex-col space-y-2">
                    <button
                        type="button"
                        onMouseDown={() => onRecordStart(name, recordMode)}
                        onMouseUp={() => onRecordStop(name)}
                        onTouchStart={() => onRecordStart(name, recordMode)}
                        onTouchEnd={() => onRecordStop(name)}
                        className={`p-2 rounded-full transition-colors ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-600/50 text-gray-300 hover:bg-gray-500'}`}
                        aria-label={isRecording ? 'Parar Gravação' : 'Segure para Gravar Voz'}>
                        <MicIcon className="w-5 h-5" />
                    </button>
                    <button type="button" onClick={() => onCorrect(name)} disabled={isCorrecting} className="p-1.5 text-gray-300 bg-gray-600/50 rounded-full hover:bg-gray-500 hover:text-white transition-colors disabled:opacity-50" aria-label="Corrigir com IA">{isCorrecting ? <SpinnerIcon className="w-4 h-4" /> : <SparklesIcon className="w-4 h-4" />}</button>
                </div>
            </div>
        </div>
    );
};

export const ChamadoFormModal = ({ isOpen, onClose, onSave, chamado, addLog, isClientLocked = false }) => {
    const initialFormState = { clientId: '', clientName: '', requestType: 'Chamado de Serviço', billingType: 'Particular', status: 'Aberto', priority: 'Média', equipment: '', problemDescription: '', trainingDescription: '', solutionDescription: '', observations: '', items: [], trainingType: '', otherTraining: '', participants: 1, preferredDate: '', schedulingType: '', estimatedDuration: '', audioFiles: [] };
    const [formData, setFormData] = useState(initialFormState);
    const [clients, setClients] = useState([]);
    const [isCorrecting, setIsCorrecting] = useState({ problem: false, solution: false });
    const [isRecording, setIsRecording] = useState({ problem: false, training: false, solution: false });
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


    useEffect(() => {
        if (isOpen) {
            backend.getClientes().then(c => { setClients(c); addLog('Lista de clientes carregada.'); });
            backend.getEquipamentos().then(e => { setAllEquipamentos(e); addLog('Lista de equipamentos carregada.'); });
            if (chamado) {
                 const formDataToLoad = { ...initialFormState, ...chamado };
                // Ensure audioFiles exists and is an array, remove legacy field
                formDataToLoad.audioFiles = formDataToLoad.audioFiles || [];
                delete formDataToLoad.audioDescription;

                setFormData(formDataToLoad);
                setClientSearchTerm(chamado.clientName || '');
                setEquipmentSearchTerm(chamado.equipment || '');
                setIsSearchingClient(false);
                addLog(`Carregando dados para editar chamado: ${chamado.id}`);
            } else {
                setFormData(initialFormState);
                setClientSearchTerm('');
                setEquipmentSearchTerm('');
                setIsSearchingClient(!isClientLocked);
                addLog(`Abrindo formulário para novo chamado.`);
                if (!isClientLocked) {
                    setTimeout(() => {
                        clientSearchRef.current?.querySelector('input')?.focus();
                    }, 100);
                }
            }
        }
    }, [chamado, isOpen, addLog, isClientLocked]);
    
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (clientSearchRef.current && !clientSearchRef.current.contains(event.target)) {
                setIsClientListOpen(false);
            }
            if (equipmentSearchRef.current && !equipmentSearchRef.current.contains(event.target)) {
                setIsEquipmentListOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        const fieldsToCapitalize = ['otherTraining', 'estimatedDuration'];
        const finalValue = fieldsToCapitalize.includes(name) ? capitalizeWords(value) : value;
        setFormData(p => ({ ...p, [name]: finalValue }));
    };

    const handleClientSearchChange = (e) => {
        const term = capitalizeWords(e.target.value);
        setClientSearchTerm(term);
        setIsClientListOpen(true);
        setHighlightedClientIndex(-1);
        if (formData.clientId) {
            setFormData(p => ({ ...p, clientId: '', clientName: '' }));
        }
    };
    
    const handleClientSelect = (client) => {
        if (!client) return;
        const clientName = client.tradeName || client.legalName;
        setFormData(p => ({...p, clientId: client.id, clientName: clientName }));
        setClientSearchTerm(clientName);
        setIsClientListOpen(false);
        setIsSearchingClient(false);
        setHighlightedClientIndex(-1);
    };

    const handleEquipmentSearchChange = (e) => {
        const term = capitalizeWords(e.target.value);
        setEquipmentSearchTerm(term);
        setIsEquipmentListOpen(true);
        setHighlightedEquipmentIndex(-1);
        setFormData(p => ({...p, equipment: term }));
    };

    const handleEquipmentSelect = (equipamento) => {
        if (!equipamento) return;
        setFormData(p => ({...p, equipment: equipamento.name }));
        setEquipmentSearchTerm(equipamento.name);
        setIsEquipmentListOpen(false);
        setHighlightedEquipmentIndex(-1);
    };

    const filteredClients = useMemo(() => {
        if (!clientSearchTerm) return [];
        return clients.filter(c =>
            (c.legalName.toLowerCase().includes(clientSearchTerm.toLowerCase())) ||
            (c.tradeName && c.tradeName.toLowerCase().includes(clientSearchTerm.toLowerCase()))
        ).slice(0, 5);
    }, [clientSearchTerm, clients]);

    const filteredEquipamentos = useMemo(() => {
        if (!equipmentSearchTerm) return [];
        return allEquipamentos.filter(e =>
            e.name.toLowerCase().includes(equipmentSearchTerm.toLowerCase())
        ).slice(0, 5);
    }, [equipmentSearchTerm, allEquipamentos]);

    const handleClientKeyDown = (e) => {
        if (isClientListOpen && filteredClients.length > 0) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setHighlightedClientIndex(prev => (prev + 1) % filteredClients.length);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setHighlightedClientIndex(prev => (prev - 1 + filteredClients.length) % filteredClients.length);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (highlightedClientIndex > -1) {
                    handleClientSelect(filteredClients[highlightedClientIndex]);
                }
            } else if (e.key === 'Tab' && highlightedClientIndex > -1) {
                handleClientSelect(filteredClients[highlightedClientIndex]);
            } else if (e.key === 'Escape') {
                setIsClientListOpen(false);
            }
        }
    };

    const handleEquipmentKeyDown = (e) => {
        if (isEquipmentListOpen && (filteredEquipamentos.length > 0 || equipmentSearchTerm)) {
            if (e.key === 'ArrowDown' && filteredEquipamentos.length > 0) {
                e.preventDefault();
                setHighlightedEquipmentIndex(prev => (prev + 1) % filteredEquipamentos.length);
            } else if (e.key === 'ArrowUp' && filteredEquipamentos.length > 0) {
                e.preventDefault();
                setHighlightedEquipmentIndex(prev => (prev - 1 + filteredEquipamentos.length) % filteredEquipamentos.length);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (highlightedEquipmentIndex > -1) {
                    handleEquipmentSelect(filteredEquipamentos[highlightedEquipmentIndex]);
                } else {
                    setIsEquipmentListOpen(false);
                }
            } else if (e.key === 'Tab' && highlightedEquipmentIndex > -1) {
                handleEquipmentSelect(filteredEquipamentos[highlightedEquipmentIndex]);
            } else if (e.key === 'Escape') {
                setIsEquipmentListOpen(false);
            }
        }
    };

    const handleAddItem = (item) => { setFormData(p => ({ ...p, items: [...p.items, item] })); };
    const handleRemoveItem = (index) => { setFormData(p => ({...p, items: p.items.filter((_, i) => i !== index)})); };
    
    const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        // This will track how many transcriptions are in progress.
        let transcriptionsPending = 0;

        const processFile = (file: File) => {
            if (!file.type.startsWith('audio/')) {
                alert(`Arquivo "${file.name}" não é um áudio e será ignorado.`);
                addLog(`Falha no upload: arquivo "${file.name}" não é um áudio.`);
                return;
            }

            transcriptionsPending++;
            if (transcriptionsPending > 0) setIsTranscribing(true);

            const reader = new FileReader();
            reader.onload = async (loadEvent) => {
                const audioDataUrl = loadEvent.target.result as string;
                const newAudio = { name: file.name, dataUrl: audioDataUrl };
                
                // Add the new audio file to the list immediately for better UX
                setFormData(p => ({ ...p, audioFiles: [...p.audioFiles, newAudio] }));
                addLog(`Áudio "${file.name}" carregado. Iniciando transcrição com IA...`);

                try {
                    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
                    const base64Data = audioDataUrl.split(',')[1];

                    const audioPart = { inlineData: { mimeType: file.type, data: base64Data } };
                    const textPart = { text: "Transcreva o áudio a seguir em português:" };

                    const response = await ai.models.generateContent({
                        model: 'gemini-2.5-flash',
                        contents: { parts: [textPart, audioPart] },
                    });
                    
                    const transcription = response.text;
                    setFormData(p => ({
                        ...p,
                        problemDescription: ((p.problemDescription ? p.problemDescription + '\n\n' : '') + transcription).trim()
                    }));
                    addLog(`Transcrição de "${file.name}" concluída e adicionada à descrição.`);
                } catch (err) {
                    console.error("Gemini Transcription Error:", err);
                    const errorMessage = (err as Error).message || 'Ocorreu um erro desconhecido.';
                    addLog(`ERRO (Transcrição IA de ${file.name}): ${errorMessage}`);
                    // Optionally add an error message to the description
                    setFormData(p => ({
                        ...p,
                        problemDescription: ((p.problemDescription ? p.problemDescription + '\n\n' : '') + `[Erro na transcrição de ${file.name}]`).trim()
                    }));
                } finally {
                    transcriptionsPending--;
                    if (transcriptionsPending === 0) {
                        setIsTranscribing(false);
                    }
                }
            };
            reader.onerror = () => {
                addLog(`Erro ao ler o arquivo de áudio: ${file.name}.`);
                alert(`Não foi possível ler o arquivo de áudio: ${file.name}.`);
                transcriptionsPending--;
                if (transcriptionsPending === 0) {
                    setIsTranscribing(false);
                }
            };
            reader.readAsDataURL(file);
        };

        // Process all selected files
        for (const file of Array.from(files)) {
            processFile(file);
        }

        // Clear the file input so the same files can be selected again
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const removeAudio = (indexToRemove) => {
        const removedAudio = formData.audioFiles[indexToRemove];
        setFormData(p => ({
            ...p,
            audioFiles: p.audioFiles.filter((_, index) => index !== indexToRemove)
        }));
        if(fileInputRef.current) {
            fileInputRef.current.value = '';
        }
        addLog(`Áudio "${removedAudio.name}" removido do chamado.`);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const equipmentName = formData.equipment.trim();
        if (equipmentName) {
            const isOfficial = allEquipamentos.some(e => e.name.toLowerCase() === equipmentName.toLowerCase());
            if (!isOfficial) {
                await backend.addTemporaryEquipamento(equipmentName);
                addLog(`Equipamento temporário "${equipmentName}" adicionado para registro posterior.`);
            }
        }
        
        onSave({ ...formData, id: chamado?.id });
    };

    const handleCorrectText = async (fieldName) => {
        const textToCorrect = formData[fieldName];
        if (!textToCorrect) return;

        const setCorrecting = (isCorrecting) => setIsCorrecting(prev => ({ ...prev, [fieldName]: isCorrecting }));
        setCorrecting(true);
        addLog(`Iniciando correção de '${fieldName}' com IA...`);
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const prompt = `Corrija a ortografia e a gramática do seguinte texto, mantendo o sentido original. Retorne apenas o texto corrigido, sem nenhuma introdução ou formatação adicional: "${textToCorrect}"`;
            const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
            const correctedText = response.text.trim();
            setFormData(p => ({...p, [fieldName]: correctedText}));
            addLog(`'${fieldName}' corrigido pela IA.`);
        } catch(err) {
            console.error("Gemini Error:", err);
            addLog(`ERRO (IA): ${err.message}`);
            alert(`Ocorreu um erro ao usar a IA: ${err.message}`);
        } finally {
            setCorrecting(false);
        }
    };

    const handleStartRecording = (fieldName, mode) => {
        if (recognitionRef.current) return;

        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert('Gravação de voz não é suportada neste navegador.');
            return;
        }

        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.lang = 'pt-BR';
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = false;

        recognitionRef.current.onstart = () => {
            setIsRecording(prev => ({ ...prev, [fieldName]: true }));
            addLog(`Gravação de voz iniciada para '${fieldName}'.`);
        };

        recognitionRef.current.onend = () => {
            setIsRecording(prev => ({ ...prev, [fieldName]: false }));
            recognitionRef.current = null;
        };

        recognitionRef.current.onresult = (event) => {
            const transcript = event.results[0][0].transcript.trim();

            if (transcript) {
                setFormData(p => {
                    const currentText = p[fieldName] || '';
                    if (mode === 'numberedList') {
                        const lines = currentText.split('\n').filter(line => line.trim() !== '');
                        const nextNumber = lines.length + 1;
                        const newText = `${currentText}\n${nextNumber}. ${transcript.charAt(0).toUpperCase() + transcript.slice(1)}`;
                        return { ...p, [fieldName]: newText.trim() };
                    }
                    
                    const newText = currentText.trim()
                        ? `${currentText.trim()} ${transcript}`
                        : transcript.charAt(0).toUpperCase() + transcript.slice(1);

                    return { ...p, [fieldName]: newText };
                });
            }
        };
        
        recognitionRef.current.onerror = (event) => {
             addLog(`Erro na gravação: ${event.error}`);
             console.error('Speech recognition error', event);
             setIsRecording(prev => ({ ...prev, [fieldName]: false }));
        };

        recognitionRef.current.start();
    };
    
    const handleStopRecording = (fieldName) => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
            addLog(`Gravação de voz finalizada para '${fieldName}'.`);
        }
    };

    const preventSubmitOnEnter = (e: React.KeyboardEvent<HTMLFormElement>) => {
        const target = e.target as HTMLElement;
        if (e.key === 'Enter' && target.tagName.toLowerCase() === 'input') {
            e.preventDefault();
        }
    };

    const renderFormContent = () => {
        switch (formData.requestType) {
            case 'Chamado de Serviço': return <>
                 <div ref={equipmentSearchRef} className="relative">
                     <InputField 
                        id="equipment" 
                        label="Equipamento ou sistema afetado" 
                        name="equipment" 
                        value={equipmentSearchTerm} 
                        onChange={handleEquipmentSearchChange} 
                        onKeyDown={handleEquipmentKeyDown}
                        onFocus={() => setIsEquipmentListOpen(true)}
                        placeholder="Selecione ou digite um novo"
                        autoComplete="off"
                     />
                     {isEquipmentListOpen && filteredEquipamentos.length > 0 && (
                        <ul className="absolute z-20 w-full bg-gray-600 border border-gray-500 rounded-md mt-1 max-h-40 overflow-y-auto shadow-lg">
                           {filteredEquipamentos.map((e, index) => (
                               <li key={e.id} 
                                   onClick={() => handleEquipmentSelect(e)} 
                                   className={`px-3 py-2 cursor-pointer text-white ${index === highlightedEquipmentIndex ? 'bg-blue-500' : 'hover:bg-gray-500'}`}>
                                   {e.name} <span className="text-xs text-gray-400">({e.type})</span>
                               </li>
                           ))}
                        </ul>
                     )}
                </div>
                 <div>
                    <div className="flex justify-between items-center mb-1">
                        <label htmlFor="problemDescription" className="block text-sm font-medium text-gray-300">Descrição do Problema</label>
                        <button type="button" onClick={() => fileInputRef.current?.click()} className="flex items-center text-xs px-2 py-1 bg-gray-600 hover:bg-gray-500 text-white rounded-md transition-colors">
                            <UploadIcon className="w-4 h-4 mr-1.5"/> Upar Áudio
                        </button>
                    </div>
                    <div className="relative">
                        <textarea id="problemDescription" name="problemDescription" value={formData.problemDescription} onChange={handleChange} rows={4} className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 pr-12 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400 transition" placeholder=""></textarea>
                        <div className="absolute top-2 right-2 flex flex-col space-y-2">
                             <button
                                type="button"
                                onMouseDown={() => handleStartRecording('problemDescription', 'append')}
                                onMouseUp={() => handleStopRecording('problemDescription')}
                                onTouchStart={() => handleStartRecording('problemDescription', 'append')}
                                onTouchEnd={() => handleStopRecording('problemDescription')}
                                className={`p-2 rounded-full transition-colors ${isRecording.problem ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-600/50 text-gray-300 hover:bg-gray-500'}`}
                                aria-label={isRecording.problem ? 'Parar Gravação' : 'Segure para Gravar Voz'}>
                                <MicIcon className="w-5 h-5" />
                            </button>
                            <button type="button" onClick={() => handleCorrectText('problemDescription')} disabled={isCorrecting.problem} className="p-1.5 text-gray-300 bg-gray-600/50 rounded-full hover:bg-gray-500 hover:text-white transition-colors disabled:opacity-50" aria-label="Corrigir com IA">{isCorrecting.problem ? <SpinnerIcon className="w-4 h-4" /> : <SparklesIcon className="w-4 h-4" />}</button>
                        </div>
                    </div>
                     <div className="mt-2 space-y-2">
                        {formData.audioFiles.map((audio, index) => (
                            <div key={index} className="bg-gray-900/50 p-3 rounded-lg flex items-center justify-between gap-4">
                                <div className="flex-grow min-w-0">
                                     <p className="text-sm text-gray-300 truncate font-medium" title={audio.name}>{audio.name}</p>
                                     <audio controls src={audio.dataUrl} className="w-full h-10 mt-1"></audio>
                                </div>
                                <button type="button" onClick={() => removeAudio(index)} className="flex-shrink-0 p-1.5 text-red-400 hover:text-red-300 transition-colors" aria-label={`Remover áudio ${audio.name}`}>
                                    <TrashIcon className="w-5 h-5"/>
                                </button>
                            </div>
                        ))}
                    </div>
                    {isTranscribing && (
                         <div className="mt-3 bg-gray-900/50 p-3 rounded-lg flex items-center justify-center gap-2 text-sm text-yellow-300">
                             <SpinnerIcon className="w-4 h-4"/>
                             <span>Transcrevendo áudio(s)...</span>
                         </div>
                    )}
                </div>
                <div><label className="block text-sm font-medium text-gray-300 mb-1">Prioridade</label><select name="priority" value={formData.priority} onChange={handleChange} className="w-full bg-gray-700 custom-select text-white rounded-lg px-4 py-2 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400"><option>Baixa</option><option>Média</option><option>Alta</option></select></div>
                <InputField id="observations" label="Observações adicionais" name="observations" value={formData.observations} onChange={handleChange} />
                <div><label className="block text-sm font-medium text-gray-300 mb-2">Peças necessárias</label><ItemInput onAddItem={handleAddItem} /><ItemsTable items={formData.items} onRemoveItem={handleRemoveItem} tableHeaders={['Produto', 'Qtde', 'Vlr. Unit.', 'Vlr. Total']} /></div>
            </>;
            case 'Treinamento': return <>
                <div><label className="block text-sm font-medium text-gray-300 mb-1">Tipo de treinamento</label><select name="trainingType" value={formData.trainingType} onChange={handleChange} className="w-full bg-gray-700 custom-select text-white rounded-lg px-4 py-2 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400"><option>Treinamento de software</option><option>Treinamento de hardware</option><option>Outro</option></select></div>
                {formData.trainingType === 'Outro' && <InputField id="otherTraining" label="Especifique" name="otherTraining" value={formData.otherTraining} onChange={handleChange} />}
                <TextAreaWithTools
                    label="Descrição e Tópicos"
                    name="trainingDescription"
                    value={formData.trainingDescription}
                    onChange={handleChange}
                    onCorrect={handleCorrectText}
                    onRecordStart={handleStartRecording}
                    onRecordStop={handleStopRecording}
                    recordMode="numberedList"
                    isCorrecting={false} // Disabled for this field for simplicity
                    isRecording={isRecording.training}
                    placeholder="Grave ou digite os tópicos para o treinamento..."
                />
                <InputField id="participants" label="Número de participantes" name="participants" type="number" min="1" value={formData.participants} onChange={handleChange} />
                <InputField id="preferredDate-training" label="Data e hora preferida" name="preferredDate" type="datetime-local" value={formData.preferredDate} onChange={handleChange} />
                <InputField id="observations-training" label="Observações adicionais" name="observations" value={formData.observations} onChange={handleChange} />
                <div><label className="block text-sm font-medium text-gray-300 mb-2">Materiais necessários</label><ItemInput onAddItem={handleAddItem} /><ItemsTable items={formData.items} onRemoveItem={handleRemoveItem} tableHeaders={['Produto', 'Qtde', 'Vlr. Unit.', 'Vlr. Total']} /></div>
            </>;
            case 'Agendamento': return <>
                <div><label className="block text-sm font-medium text-gray-300 mb-1">Tipo de agendamento</label><select name="schedulingType" value={formData.schedulingType} onChange={handleChange} className="w-full bg-gray-700 custom-select text-white rounded-lg px-4 py-2 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400"><option>Agendamento de serviço</option><option>Agendamento de reunião</option></select></div>
                <InputField id="preferredDate-scheduling" label="Data e hora preferida" name="preferredDate" type="datetime-local" value={formData.preferredDate} onChange={handleChange} />
                <InputField id="estimatedDuration" label="Duração estimada" name="estimatedDuration" value={formData.estimatedDuration} onChange={handleChange} />
                <InputField id="observations-scheduling" label="Observações adicionais" name="observations" value={formData.observations} onChange={handleChange} />
                <div><label className="block text-sm font-medium text-gray-300 mb-2">Equipamentos necessários</label><ItemInput onAddItem={handleAddItem} /><ItemsTable items={formData.items} onRemoveItem={handleRemoveItem} tableHeaders={['Produto', 'Qtde']} /></div>
            </>;
            default: return null;
        }
    };
    
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={chamado ? 'Editar Chamado' : 'Novo Chamado'} maxWidth="max-w-3xl" closeOnBackdropClick={false} closeOnEscape={false} showCloseButton={false}>
            <form onSubmit={handleSubmit} onKeyDown={preventSubmitOnEnter} className="space-y-6">
                <input type="file" ref={fileInputRef} onChange={handleAudioUpload} style={{ display: 'none' }} accept="audio/*" multiple />
                <fieldset><legend className="text-lg font-semibold text-white mb-4 pb-3 border-b border-gray-700">Dados da Solicitação</legend>
                <div className="space-y-4">
                    <div className={`grid grid-cols-1 ${!chamado && formData.status ? 'sm:grid-cols-2' : 'sm:grid-cols-3'} gap-4`}>
                        <div ref={clientSearchRef}>
                            {isSearchingClient ? (
                                <div className="relative">
                                    <InputField
                                        label="Cliente"
                                        id="client-search"
                                        value={clientSearchTerm}
                                        onChange={handleClientSearchChange}
                                        onKeyDown={handleClientKeyDown}
                                        onFocus={() => setIsClientListOpen(true)}
                                        placeholder="Digite para buscar..."
                                        required={!formData.clientId}
                                        autoComplete="off"
                                    />
                                    {isClientListOpen && filteredClients.length > 0 && (
                                        <ul className="absolute z-20 w-full bg-gray-600 border border-gray-500 rounded-md mt-1 max-h-40 overflow-y-auto shadow-lg">
                                            {filteredClients.map((c, index) => (
                                                <li key={c.id} 
                                                    onClick={() => handleClientSelect(c)} 
                                                    className={`px-3 py-2 cursor-pointer text-white ${index === highlightedClientIndex ? 'bg-blue-500' : 'hover:bg-gray-500'}`}>
                                                    {c.tradeName || c.legalName}
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            ) : (
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">Cliente</label>
                                    <div className="flex items-center justify-between bg-gray-700 rounded-lg px-4 py-2 border border-gray-600 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-400">
                                        <span className="text-white font-medium">{formData.clientName}</span>
                                        {!isClientLocked && (
                                            <button type="button" onClick={() => { setIsSearchingClient(true); setClientSearchTerm(''); }} className="text-sm font-semibold text-blue-400 hover:text-blue-300" tabIndex={-1}>
                                                Trocar
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}
                            <input type="hidden" name="clientId" value={formData.clientId} />
                        </div>
                        <div>
                            <label htmlFor="billingType" className="block text-sm font-medium text-gray-300 mb-1">Tipo Faturamento</label>
                            <select id="billingType" name="billingType" value={formData.billingType} onChange={handleChange} required className="w-full bg-gray-700 custom-select text-white rounded-lg px-4 py-2 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400"><option>Particular</option><option>Empresa</option></select>
                        </div>
                        {chamado && (
                            <div>
                                <label htmlFor="status" className="block text-sm font-medium text-gray-300 mb-1">Status</label>
                                <select id="status" name="status" value={formData.status} onChange={handleChange} required className="w-full bg-gray-700 custom-select text-white rounded-lg px-4 py-2 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400">
                                    {['Aberto', 'Em Andamento', 'Concluído', 'Cancelado'].map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                        )}
                    </div>
                     <div><label htmlFor="requestType" className="block text-sm font-medium text-gray-300 mb-1">Tipo de Solicitação</label><select id="requestType" name="requestType" value={formData.requestType} onChange={handleChange} required className="w-full bg-gray-700 custom-select text-white rounded-lg px-4 py-2 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400"><option>Chamado de Serviço</option><option>Treinamento</option><option>Agendamento</option></select></div>
                </div></fieldset>

                <fieldset><legend className="text-lg font-semibold text-white mb-4 pb-3 border-b border-gray-700">Detalhes</legend>
                <div className="space-y-4">{renderFormContent()}</div>
                </fieldset>
                
                <fieldset><legend className="text-lg font-semibold text-white mb-4 pb-3 border-b border-gray-700">Relato e Solução do Técnico</legend>
                <div className="space-y-4">
                    <TextAreaWithTools
                        label="Descrição da Solução"
                        name="solutionDescription"
                        value={formData.solutionDescription}
                        onChange={handleChange}
                        onCorrect={handleCorrectText}
                        onRecordStart={handleStartRecording}
                        onRecordStop={handleStopRecording}
                        isCorrecting={isCorrecting.solution}
                        isRecording={isRecording.solution}
                        placeholder="Descreva as ações tomadas e o resultado do atendimento..."
                    />
                </div>
                </fieldset>

                <div className="flex justify-end space-x-3 pt-6 border-t border-gray-700"><button type="button" onClick={onClose} className="px-5 py-2 text-sm font-semibold text-gray-300 bg-gray-700 rounded-lg hover:bg-gray-600">Cancelar</button><button type="submit" className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-500">Salvar Chamado</button></div>
            </form>
        </Modal>
    );
};