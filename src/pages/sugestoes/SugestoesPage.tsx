import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabaseService } from '../../services/storage';
import { GoogleGenAI } from '@google/genai';
import { PlusIcon, Trash2Icon, SpinnerIcon, SparklesIcon, CheckCircle2Icon, ClipboardIcon, Edit2Icon, BotIcon, UndoIcon } from '../../components/Icons';
import { DeleteConfirmationModal } from '../../components/Modal';
import { SuggestionChatModal } from './SuggestionChatModal';
import { SelectPageModal } from './SelectPageModal';
import { CreationChatModal } from './CreationChatModal';


// Helper function to parse suggestion text into editable modules
const parseSuggestionToModules = (text) => {
    if (!text) return [];
    // Split by newline followed by a number, dot, and optional space.
    // The regex uses a positive lookahead to keep the delimiter.
    const modules = text.split(/(?=\n\d+\.?[ \t])/).map(m => m.trim()).filter(Boolean);
    if (modules.length <= 1 && text.includes('\n')) {
        // Fallback for lists that might not have the newline at the very start
        return text.split('\n').map(m => m.trim()).filter(Boolean);
    }
    return modules.length > 0 ? modules : [text]; // Handle single-line suggestions
};

export const SugestoesPage = ({ addLog }) => {
    const [sugestoes, setSugestoes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    const [processingItemId, setProcessingItemId] = useState<{ id: number; type: string; } | null>(null);
    const [copiedId, setCopiedId] = useState<number | null>(null);

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [suggestionToDelete, setSuggestionToDelete] = useState(null);
    
    const [chattingOnSuggestion, setChattingOnSuggestion] = useState(null);

    // State for modular editing
    const [editingModule, setEditingModule] = useState<{ suggestionId: number; moduleIndex: number; text: string; } | null>(null);
    const [editingTextareaRef, setEditingTextareaRef] = useState<HTMLTextAreaElement | null>(null);

    // New state for the creation workflow
    const [isSelectPageModalOpen, setIsSelectPageModalOpen] = useState(false);
    const [creationChatTargetPage, setCreationChatTargetPage] = useState<string | null>(null);


    const loadSugestoes = useCallback(async (showLoadingSpinner = true) => {
        if(showLoadingSpinner) setLoading(true);
        setError('');
        try {
            const data = await supabaseService.getSugestoes();
            setSugestoes(data);
            if(showLoadingSpinner) addLog(`${data.length} sugestões carregadas.`);
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            setError(message);
            addLog(`Erro ao carregar sugestões: ${message}`);
        } finally {
            if(showLoadingSpinner) setLoading(false);
        }
    }, [addLog]);

    useEffect(() => {
        loadSugestoes();
    }, [loadSugestoes]);
    
    useEffect(() => {
        // Auto-grow textarea for editing modules
        if (editingModule && editingTextareaRef) {
            const textarea = editingTextareaRef;
            textarea.style.height = 'auto'; // Reset height to recalculate
            textarea.style.height = `${textarea.scrollHeight}px`;
        }
    }, [editingModule, editingTextareaRef]);
    
    const handleOpenSelectPageModal = () => {
        setIsSelectPageModalOpen(true);
        addLog('Abrindo modal para selecionar página alvo para nova sugestão.');
    };

    const handlePageSelected = (pageName: string) => {
        setIsSelectPageModalOpen(false);
        setCreationChatTargetPage(pageName);
        addLog(`Página "${pageName}" selecionada. Iniciando chat de criação.`);
    };

    const handleSaveNewSuggestionFromChat = async (suggestionText: string, targetPage: string) => {
        try {
            const [savedData] = await supabaseService.saveSugestao({
                suggestion_text: suggestionText,
                original_text: suggestionText,
                status: 'Melhorada', // Assume AI-assisted suggestions are 'Melhorada'
                target_page: targetPage,
                chat_history: [],
            });
            if (savedData) {
                setSugestoes(prev => [savedData, ...prev]);
                addLog(`Nova sugestão para "${targetPage}" salva via chat.`);
            } else {
                loadSugestoes(false);
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            setError(message);
            addLog(`Erro ao salvar sugestão via chat: ${message}`);
        } finally {
            setCreationChatTargetPage(null); // Close the chat modal
        }
    };

    const handleCloseCreationChat = () => {
        setCreationChatTargetPage(null);
    };

    const handleOpenDeleteModal = (sugestao) => {
        setSuggestionToDelete(sugestao);
        setIsDeleteModalOpen(true);
    };

    const handleCloseModals = () => {
        setIsDeleteModalOpen(false);
        setSuggestionToDelete(null);
        setChattingOnSuggestion(null);
    };

    const handleConfirmDelete = async () => {
        if (!suggestionToDelete) return;
        try {
            await supabaseService.deleteSugestao(suggestionToDelete.id);
            setSugestoes(prev => prev.filter(s => s.id !== suggestionToDelete.id));
            addLog(`Sugestão "${suggestionToDelete.suggestion_text}" excluída.`);
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            setError(message);
            addLog(`Erro ao excluir sugestão: ${message}`);
        } finally {
            handleCloseModals();
        }
    };

    const handleCopy = (text) => {
        navigator.clipboard.writeText(text).then(() => {
            addLog(`Texto copiado: "${text.substring(0, 30)}..."`);
            setCopiedId(text); // Use text as a temporary ID
            setTimeout(() => setCopiedId(null), 2000);
        }, (err) => {
            addLog(`Erro ao copiar texto: ${err}`);
            alert('Falha ao copiar texto.');
        });
    };

    const handleAIAssistance = async (sugestao, type: 'correct' | 'improve' | 'undo') => {
        setProcessingItemId({ id: sugestao.id, type });
        addLog(`Iniciando IA para ${type} sugestão ID ${sugestao.id}...`);

        try {
            let newText = sugestao.suggestion_text;
            let newStatus = sugestao.status;
            let newOriginalText = sugestao.original_text;

            if (type === 'undo') {
                newText = sugestao.original_text;
                newStatus = 'Nova'; 
            } else {
                const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
                const prompt = type === 'correct'
                    ? `Corrija a ortografia e a gramática do seguinte texto, mantendo o sentido original. Retorne apenas o texto corrigido: "${sugestao.suggestion_text}"`
                    : `Você é um analista de sistemas e especialista em UX/UI sênior. Sua tarefa é analisar a seguinte sugestão de melhoria para um sistema de gestão chamado "GestaoPro" e expandi-la em uma especificação de requisitos clara, detalhada e profissional.

**Contexto da Sugestão Original do Usuário:**
"${sugestao.suggestion_text}"

**Sua Tarefa:**
1.  **Analise a Ideia:** Entenda o objetivo principal da sugestão do usuário.
2.  **Expanda e Detalhe:** Adicione detalhes técnicos e de usabilidade que o usuário pode não ter considerado. Pense em casos de uso, impacto em outras áreas do sistema, e a melhor forma de apresentar a funcionalidade.
3.  **Estruture como Requisitos:** Organize a sugestão expandida em uma lista numerada de requisitos funcionais (RF). Use um formato claro e hierárquico (ex: 1. Título do Requisito, 1.1. Detalhe).
4.  **Mantenha a Essência:** Não mude a ideia central do usuário, mas enriqueça-a.
5.  **Seja Conciso e Direto:** Evite introduções como "Aqui está a sua sugestão melhorada". Comece diretamente com a lista de requisitos.

**REGRAS FINAIS:**
- Sua resposta DEVE conter APENAS a lista de requisitos.
- NÃO adicione nenhum texto introdutório, cabeçalhos genéricos, resumos ou conclusões.
- Apenas a especificação detalhada e numerada.`;
                
                const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
                newText = (response.text || '').trim();
                newOriginalText = sugestao.suggestion_text; // Save current text as original before overwriting
                newStatus = type === 'improve' ? 'Melhorada' : 'Corrigida';
            }
            
            const updatedSugestao = { ...sugestao, suggestion_text: newText, original_text: newOriginalText, status: newStatus };
            const [savedData] = await supabaseService.saveSugestao(updatedSugestao);

            if (savedData) {
                setSugestoes(prev => prev.map(s => s.id === sugestao.id ? savedData : s));
                addLog(`Sugestão ID ${sugestao.id} foi ${type}.`);
            } else {
                loadSugestoes(false);
            }
            
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            setError(message);
            addLog(`Erro de IA: ${message}`);
        } finally {
            setProcessingItemId(null);
        }
    };

    const handleAccept = async (sugestao) => {
        setProcessingItemId({ id: sugestao.id, type: 'accept' });
        try {
            const [savedData] = await supabaseService.saveSugestao({ ...sugestao, status: 'Aceita' });
            if (savedData) {
                setSugestoes(prev => prev.map(s => s.id === sugestao.id ? savedData : s));
                addLog(`Sugestão ID ${sugestao.id} marcada como 'Aceita'.`);
            } else {
                loadSugestoes(false);
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            setError(message);
            addLog(`Erro ao aceitar sugestão: ${message}`);
        } finally {
            setProcessingItemId(null);
        }
    };

    const handleTargetPageChange = async (suggestionId, newTargetPage) => {
        const suggestion = sugestoes.find(s => s.id === suggestionId);
        if (suggestion) {
            try {
                const [savedData] = await supabaseService.saveSugestao({ ...suggestion, target_page: newTargetPage, suggestion_structure: null });
                if (savedData) {
                    setSugestoes(prev => prev.map(s => s.id === suggestionId ? savedData : s));
                    addLog(`Página alvo da sugestão #${suggestionId} atualizada para "${newTargetPage}".`);
                } else {
                    loadSugestoes(false);
                }
            } catch (err) {
                addLog(`Erro ao salvar página alvo: ${err.message}`);
            }
        }
    };
    
    const handleGenerateStructure = async (suggestion) => {
        if (!suggestion.target_page) {
            alert('Por favor, selecione uma página alvo para gerar a estrutura.');
            return;
        }

        setProcessingItemId({ id: suggestion.id, type: 'structure' });
        addLog(`Gerando estrutura para sugestão #${suggestion.id}...`);
        
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            
            const schema = {
                type: 'OBJECT',
                properties: {
                    changes: {
                        type: 'ARRAY',
                        description: 'Uma lista de alterações na UI a serem aplicadas.',
                        items: {
                            type: 'OBJECT',
                            properties: {
                                action: { type: 'STRING', enum: ['add', 'modify', 'remove'] },
                                element: { type: 'STRING', enum: ['button', 'field', 'table_column', 'text_element', 'card_section'] },
                                target_area: { type: 'STRING', enum: ['header', 'form', 'table', 'sidebar', 'card_body'] },
                                identifier: { type: 'STRING', description: 'Nome do elemento existente para ancorar a mudança (ex: "search_input", "save_button").' },
                                details: {
                                    type: 'OBJECT',
                                    properties: {
                                        label: { type: 'STRING' },
                                        placeholder: { type: 'STRING' },
                                        position: { type: 'STRING', enum: ['after', 'before', 'inside'] },
                                        new_text: { type: 'STRING' },
                                    },
                                },
                            },
                            required: ['action', 'element', 'target_area']
                        },
                    },
                },
                required: ['changes']
            };

            const prompt = `Analise a seguinte sugestão de melhoria para um aplicativo e converta-a em um objeto JSON estruturado que descreve as alterações na UI. A sugestão é para a página "${suggestion.target_page}".

Sugestão: "${suggestion.suggestion_text}"

Sua tarefa é preencher o esquema JSON abaixo com base na sugestão. Seja o mais específico possível. Se a sugestão for vaga, faça uma interpretação razoável.

Responda APENAS com o objeto JSON, sem nenhum texto ou formatação adicional.`;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: schema,
                },
            });

            let structure;
            try {
                 structure = JSON.parse(response.text);
            } catch(e) {
                console.error("Failed to parse AI JSON response:", response.text, e);
                throw new Error("A IA retornou uma estrutura JSON inválida.");
            }
            
            const [savedData] = await supabaseService.saveSugestao({ ...suggestion, suggestion_structure: structure });
            
            if(savedData) {
                setSugestoes(prev => prev.map(s => s.id === suggestion.id ? savedData : s));
                addLog(`Estrutura para sugestão #${suggestion.id} gerada e salva.`);
            } else {
                loadSugestoes(false);
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            addLog(`Erro ao gerar estrutura: ${message}`);
            alert(`Erro ao gerar estrutura: ${message}`);
        } finally {
            setProcessingItemId(null);
        }
    };


    // --- Modular Editing Handlers ---

    const handleEditModuleClick = (suggestionId, moduleIndex, text) => {
        setEditingModule({ suggestionId, moduleIndex, text });
    };

    const handleCancelModuleEdit = () => {
        setEditingModule(null);
    };

    const handleSaveModuleEdit = async () => {
        if (!editingModule) return;
        setProcessingItemId({ id: editingModule.suggestionId, type: `edit-${editingModule.moduleIndex}` });
        
        const suggestionToUpdate = sugestoes.find(s => s.id === editingModule.suggestionId);
        if (!suggestionToUpdate) return;

        const modules = parseSuggestionToModules(suggestionToUpdate.suggestion_text);
        modules[editingModule.moduleIndex] = editingModule.text;
        const newFullText = modules.join('\n\n'); // Join with double newline for better spacing

        try {
            const [savedData] = await supabaseService.saveSugestao({
                ...suggestionToUpdate,
                suggestion_text: newFullText,
                status: 'Corrigida' // Mark as edited
            });
            if (savedData) {
                setSugestoes(prev => prev.map(s => s.id === editingModule.suggestionId ? savedData : s));
                addLog(`Módulo ${editingModule.moduleIndex + 1} da sugestão ID ${editingModule.suggestionId} salvo.`);
                setEditingModule(null);
            } else {
                loadSugestoes(false);
            }
        } catch (err) {
            addLog(`Erro ao salvar módulo: ${err.message}`);
        } finally {
            setProcessingItemId(null);
        }
    };

    const handleDeleteModule = async (suggestion, moduleIndex) => {
        if (!window.confirm("Tem certeza que deseja excluir este item da sugestão?")) return;
        
        let modules = parseSuggestionToModules(suggestion.suggestion_text);
        modules.splice(moduleIndex, 1);
        const newFullText = modules.join('\n\n');

        setProcessingItemId({ id: suggestion.id, type: `delete-${moduleIndex}` });
        try {
            const [savedData] = await supabaseService.saveSugestao({ ...suggestion, suggestion_text: newFullText, status: 'Corrigida' });
            if (savedData) {
                setSugestoes(prev => prev.map(s => s.id === suggestion.id ? savedData : s));
                addLog(`Módulo ${moduleIndex + 1} da sugestão ID ${suggestion.id} excluído.`);
            } else {
                loadSugestoes(false);
            }
        } catch(err) {
             addLog(`Erro ao excluir módulo: ${err.message}`);
        } finally {
            setProcessingItemId(null);
        }
    };

    const handleImproveModuleAI = async () => {
        if (!editingModule) return;
        setProcessingItemId({ id: editingModule.suggestionId, type: `improve-module-${editingModule.moduleIndex}` });

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const prompt = `Refine e melhore o seguinte ponto de uma lista de sugestões. Mantenha o formato original (ex: se começar com '1.1.', mantenha). Retorne apenas o texto melhorado. Texto: "${editingModule.text}"`;
            const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
            const improvedText = (response.text || '').trim();
            setEditingModule(prev => prev ? { ...prev, text: improvedText } : null);
            addLog('Módulo melhorado pela IA.');
        } catch (err) {
             addLog(`Erro de IA ao melhorar módulo: ${err.message}`);
        } finally {
            setProcessingItemId(null);
        }
    };

    const handleUpdateSuggestionFromChat = async (suggestionId, newText) => {
        const suggestionToUpdate = sugestoes.find(s => s.id === suggestionId);
        if (!suggestionToUpdate) return;

        setProcessingItemId({ id: suggestionId, type: 'save-chat' });
        try {
            const updatedData = {
                ...suggestionToUpdate,
                suggestion_text: newText,
                status: 'Melhorada',
                suggestion_structure: null, // Structure is now outdated, needs regeneration.
            };
            const [savedData] = await supabaseService.saveSugestao(updatedData);
            
            if (savedData) {
                setSugestoes(prev => prev.map(s => s.id === suggestionId ? savedData : s));
                addLog(`Sugestão ID ${suggestionId} atualizada via chat.`);
            } else {
                loadSugestoes(false); // Fallback
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            setError(message);
            addLog(`Erro ao salvar sugestão via chat: ${message}`);
        } finally {
            setProcessingItemId(null);
            setChattingOnSuggestion(null);
        }
    };

    const statusConfig = {
        'Nova': { bg: 'bg-gray-700', text: 'text-gray-300', border: 'border-gray-600', textColor: 'text-gray-300' },
        'Corrigida': { bg: 'bg-blue-900/50', text: 'text-blue-300', border: 'border-blue-700', textColor: 'text-blue-300' },
        'Melhorada': { bg: 'bg-purple-900/50', text: 'text-purple-300', border: 'border-purple-700', textColor: 'text-purple-300' },
        'Aceita': { bg: 'bg-green-900/50', text: 'text-green-300', border: 'border-green-700', textColor: 'text-green-300' },
    };
    
    const appPages = ['Dashboard', 'Clientes', 'Fornecedores', 'Produtos e Serviços', 'Chamados', 'Rotas', 'Financeiro', 'Cadastros'];


    return (
        <>
            <div>
                <header className="mb-8">
                    <h2 className="text-3xl font-bold text-white">Sugestões de Melhoria</h2>
                    <p className="text-gray-400 mt-1">Converse com a IA para criar e refinar ideias para o sistema.</p>
                </header>

                <div className="bg-gray-800 rounded-xl shadow-lg p-6 max-w-4xl mx-auto">
                    <div className="flex items-center justify-center">
                        <button onClick={handleOpenSelectPageModal} className="flex items-center justify-center px-6 py-3 text-base font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-500 transition-colors shadow-lg hover:shadow-blue-500/50">
                            <PlusIcon className="w-6 h-6 mr-3" />
                            Adicionar Melhoria
                        </button>
                    </div>

                    <div className="mt-8 border-t border-gray-700/50 pt-6">
                        <h3 className="text-xl font-semibold text-white mb-4">Lista de Sugestões</h3>
                        {loading ? (<div className="flex justify-center py-8"><SpinnerIcon className="w-8 h-8 text-white"/></div>) : 
                         error ? (<div className="p-4 text-center text-red-400">{error}</div>) : 
                        (<ul className="space-y-4">
                            {sugestoes.length > 0 ? sugestoes.map(item => {
                                const statusInfo = statusConfig[item.status] || statusConfig['Nova'];
                                const modules = parseSuggestionToModules(item.suggestion_text);
                                const canUndo = item.original_text && item.original_text !== item.suggestion_text;
                                return (
                                <li key={item.id} className={`bg-gray-900/50 p-4 rounded-lg border-l-4 ${statusInfo.border}`}>
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex-grow space-y-3">
                                            {modules.map((moduleText, index) => (
                                                <div key={index} className="flex items-start gap-3 group">
                                                    {editingModule?.suggestionId === item.id && editingModule?.moduleIndex === index ? (
                                                        <div className="flex-grow space-y-2">
                                                            <textarea
                                                                ref={setEditingTextareaRef}
                                                                value={editingModule.text}
                                                                onChange={(e) => setEditingModule(prev => prev ? { ...prev, text: e.target.value } : null)}
                                                                style={{ minHeight: '150px', resize: 'none' }}
                                                                className="w-full bg-gray-600 text-white rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-height duration-200"
                                                                autoFocus
                                                            />
                                                            <div className="flex items-center justify-end gap-3">
                                                                <button onClick={handleImproveModuleAI} disabled={processingItemId?.id === item.id} className="flex items-center gap-2 text-sm px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors">
                                                                    <SparklesIcon className="w-4 h-4"/>Melhorar este Ponto
                                                                </button>
                                                                <button onClick={handleCancelModuleEdit} className="text-sm px-4 py-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors">Cancelar</button>
                                                                <button onClick={handleSaveModuleEdit} disabled={processingItemId?.id === item.id} className="flex items-center gap-2 text-sm px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors">
                                                                    {processingItemId?.id === item.id ? <SpinnerIcon className="w-5 h-5" /> : 'Salvar'}
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <p className={`flex-grow whitespace-pre-wrap ${item.status !== 'Nova' ? statusInfo.textColor : 'text-gray-300'}`}>{moduleText}</p>
                                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <button onClick={() => handleEditModuleClick(item.id, index, moduleText)} className="p-2 text-blue-400 hover:bg-blue-500/20 rounded-full"><Edit2Icon className="w-5 h-5"/></button>
                                                                <button onClick={() => handleDeleteModule(item, index)} className="p-2 text-red-400 hover:bg-red-500/20 rounded-full"><Trash2Icon className="w-5 h-5"/></button>
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                        <div className="flex-shrink-0 flex flex-col items-end gap-2 ml-4">
                                            <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${statusInfo.bg} ${statusInfo.text}`}>{item.status}</span>
                                        </div>
                                    </div>

                                    {/* Estrutura/Preview Section */}
                                    <div className="mt-4 pt-4 border-t border-gray-700/50 space-y-3">
                                        <div className="flex flex-col sm:flex-row items-center gap-3">
                                            <div>
                                                <label htmlFor={`target-page-${item.id}`} className="text-sm font-medium text-gray-400 mr-2">Página Alvo:</label>
                                                <select id={`target-page-${item.id}`} name="target_page" value={item.target_page || ''} onChange={(e) => handleTargetPageChange(item.id, e.target.value)} className="bg-gray-700 text-white rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 custom-select text-sm">
                                                    <option value="" disabled>Selecione</option>
                                                    {appPages.map(page => <option key={page} value={page}>{page}</option>)}
                                                </select>
                                            </div>
                                            <button onClick={() => handleGenerateStructure(item)} disabled={!item.target_page || processingItemId?.id === item.id} className="flex items-center gap-2 text-sm px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                                                {processingItemId?.id === item.id && processingItemId.type === 'structure' ? <SpinnerIcon className="w-4 h-4" /> : <BotIcon className="w-5 h-5" />}
                                                Gerar Estrutura com IA
                                            </button>
                                            {item.suggestion_structure && (
                                                <button onClick={() => setChattingOnSuggestion(item)} className="flex items-center gap-2 text-sm px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded-lg transition-colors">
                                                    <BotIcon className="w-5 h-5" />
                                                    Discutir / Melhorar
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-700/50 mt-4">
                                        <button onClick={() => handleCopy(item.suggestion_text)} className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded-md transition-colors w-24 justify-center">{copiedId === item.suggestion_text ? <><CheckCircle2Icon className="w-5 h-5 text-green-400" /><span>Copiado!</span></> : <><ClipboardIcon className="w-5 h-5" /><span>Copiar</span></>}</button>
                                        <button onClick={() => handleAIAssistance(item, 'correct')} disabled={processingItemId?.id === item.id} className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded-md transition-colors disabled:opacity-50">{processingItemId?.id === item.id && processingItemId.type === 'correct' ? <SpinnerIcon className="w-4 h-4" /> : <SparklesIcon className="w-5 h-5 text-yellow-400" />}Corrigir</button>
                                        <button onClick={() => handleAIAssistance(item, 'improve')} disabled={processingItemId?.id === item.id} className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded-md transition-colors disabled:opacity-50">{processingItemId?.id === item.id && processingItemId.type === 'improve' ? <SpinnerIcon className="w-4 h-4" /> : <SparklesIcon className="w-5 h-5 text-purple-400" />}Melhorar</button>
                                        {canUndo && <button onClick={() => handleAIAssistance(item, 'undo')} disabled={processingItemId?.id === item.id} className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded-md transition-colors disabled:opacity-50">{processingItemId?.id === item.id && processingItemId.type === 'undo' ? <SpinnerIcon className="w-4 h-4" /> : <UndoIcon className="w-5 h-5 text-gray-400" />}Desfazer</button>}
                                        <button onClick={() => handleAccept(item)} disabled={processingItemId?.id === item.id} className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 bg-green-600/50 hover:bg-green-600 text-white rounded-md transition-colors disabled:opacity-50">{processingItemId?.id === item.id && processingItemId.type === 'accept' ? <SpinnerIcon className="w-4 h-4" /> : <CheckCircle2Icon className="w-5 h-5" />}Aceitar</button>
                                        <button onClick={() => handleOpenDeleteModal(item)} disabled={processingItemId?.id === item.id} className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 bg-red-600/50 hover:bg-red-600 text-white rounded-md transition-colors disabled:opacity-50"><Trash2Icon className="w-5 h-5"/> Excluir</button>
                                    </div>
                                </li>
                                );
                            }) : (<p className="text-center text-gray-500 py-8">Nenhuma sugestão cadastrada ainda.</p>)}
                        </ul>
                        )}
                    </div>
                </div>
            </div>
            {isSelectPageModalOpen && (
                <SelectPageModal
                    isOpen={isSelectPageModalOpen}
                    onClose={() => setIsSelectPageModalOpen(false)}
                    onSelectPage={handlePageSelected}
                />
            )}
            {creationChatTargetPage && (
                <CreationChatModal
                    isOpen={!!creationChatTargetPage}
                    onClose={handleCloseCreationChat}
                    onSave={handleSaveNewSuggestionFromChat}
                    targetPage={creationChatTargetPage}
                    addLog={addLog}
                />
            )}
            {chattingOnSuggestion && (
                <SuggestionChatModal
                    isOpen={!!chattingOnSuggestion}
                    onClose={handleCloseModals}
                    onSave={handleUpdateSuggestionFromChat}
                    suggestion={chattingOnSuggestion}
                    addLog={addLog}
                />
            )}
            <DeleteConfirmationModal isOpen={isDeleteModalOpen} onClose={handleCloseModals} onConfirm={handleConfirmDelete} bodyText={`Tem certeza que deseja excluir a sugestão: "${suggestionToDelete?.suggestion_text}"?`} />
        </>
    );
};
