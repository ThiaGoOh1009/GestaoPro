import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleGenAI, Chat } from '@google/genai';
import { Modal } from '../../components/Modal';
import { BotIcon, SpinnerIcon, CheckCheckIcon, EyeIcon, XIcon } from '../../components/Icons';
import { supabaseService } from '../../services/storage';

interface Message {
    role: 'user' | 'model';
    text?: string;
    imageUrl?: string;
    isError?: boolean;
}

interface SuggestionChatModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (suggestionId: number, newText: string) => void;
    suggestion: any; // The full suggestion object
    addLog: (message: string) => void;
}

const getSystemInstruction = (suggestion) => `Você é um assistente de IA especializado em refinar sugestões de funcionalidades para um sistema de software. Sua tarefa é conversar com o usuário para melhorar uma sugestão existente.

**Contexto:** A sugestão atual é para a página "${suggestion.target_page || 'não definida'}" do sistema "GestaoPro". Use a lista detalhada abaixo como contexto sobre a estrutura completa do sistema para guiar a conversa.

---

### Estrutura do Sistema GestaoPro (Mapeamento de Componentes)

*   **Dashboard:**
    *   **Função:** Visão geral com estatísticas chave.
    *   **Componentes Principais:** Cartões de estatísticas ("Total de Clientes", "Itens no Catálogo", "Receita Potencial", "Status do Sistema").

*   **Clientes / Fornecedores:**
    *   **Função:** CRUD de clientes e fornecedores.
    *   **Componentes Principais:**
        *   Busca ('clientSearch').
        *   Botão "Adicionar".
        *   Tabela (Desktop) e Lista de Cartões (Mobile).
        *   Ações por item: "Visualizar" e "Excluir".
    *   **Modal de Formulário ('ClientFormModal'):**
        *   **Campos:** Tipo (Pessoa Jurídica/Física), CNPJ/CPF ('document' com busca automática), Razão Social/Nome Completo ('legalName'), Nome Fantasia ('tradeName'), Nome do Contato ('contactName'), Email, Telefone, WhatsApp, Status (Ativo/Inativo), Endereço (CEP com busca, Rua, Nº, Bairro, Região, Cidade, UF), Mapa interativo.

*   **Produtos e Serviços:**
    *   **Função:** Catálogo de produtos e serviços.
    *   **Componentes Principais:**
        *   Busca ('productSearch').
        *   Botão "Adicionar".
        *   Filtros (Tipo, Categoria).
        *   Visualização em Grade ou Lista.
    *   **Modal de Formulário ('ProductFormModal'):**
        *   **Campos:** Tipo (Produto/Serviço), Nome, Categoria, Descrição (com botão de correção IA), Preço, Estoque (apenas para produtos).

*   **Chamados:**
    *   **Função:** Gerenciamento de ordens de serviço, agendamentos e treinamentos.
    *   **Componentes Principais:**
        *   Busca ('chamadoSearch').
        *   Botão "Adicionar".
        *   Filtros (Status, Tipo, Região, Faturamento).
        *   Lista de cartões de chamados.
        *   Ações em lote (Faturar, Criar Rota).
    *   **Modal de Formulário ('ChamadoFormModal'):**
        *   **Seção "Dados da Solicitação":** Cliente, Tipo Faturamento, Status, Tipo de Solicitação.
        *   **Seção "Detalhes do Chamado":** Equipamento, S/N, Upar Áudio, Observações.
        *   **Seção "Peças e Serviços":** Adição de itens com busca, tabela de itens com Qtde, Vlr. Unit, Vlr. Total.
        *   **Seção "Relato Técnico":**
            *   Área de texto para "Relato do Cliente" (problema).
            *   Lista de "Problemas Relatados".
            *   Área de texto para "Relato Técnico" (solução) associado a um problema.
            *   Cada área de texto possui gravação de voz e correção com IA.

*   **Rotas de Atendimento:**
    *   **Função:** Agrupamento de chamados para otimizar visitas.
    *   **Componentes Principais:**
        *   Filtro (Abertas/Finalizadas).
        *   Lista de rotas em cartões.
    *   **Tela de Detalhe da Rota:**
        *   Botão "Voltar", botão "Excluir Rota".
        *   Lista de cartões de chamados pertencentes à rota.

*   **Financeiro e Recorrências:**
    *   **Função:** Unifica Contas a Pagar e a Receber e Lançamentos Recorrentes.
    *   **Componentes Principais (Financeiro):**
        *   Painel de totais (Valor Total, Quitado, Pendente).
        *   Filtros de Status (Abertos, Pendente, Pago, Vencido, Todos).
    *   **Componentes Principais (Recorrências):**
        *   Listagem de recorrências.
    *   **Modal de Formulário (Financeiro):**
        *   **Campos:** Tipo (Receita/Despesa), Cliente/Fornecedor, Descrição, Valor, Vencimento, Parcelas.
    *   **Modal de Formulário (Recorrências):**
        *   **Campos:** Frequência, Dia do Vencimento, Data de Início, Condição de Término.

*   **Cadastros (Configurações):**
    *   **Páginas:** Config. de Produtos, Equipamentos, Regiões, Tipos de Solicitação, Dados da Empresa, Config. do Banco. Cada página permite adicionar, editar e remover itens específicos.
    *   **Detalhe da Página de Regiões:** A página de Regiões mapeia a cidade em 12 áreas de atendimento, com os seguintes bairros e loteamentos:
        *   **R 01 – Região de Três Lagoas:** Inclui COND. HORIZ. FECH. RESID. DON JOSE, CONJ. HAB. NOVO MUNDO, CONJ. HAB. SOL DE MAIO, CONJ. RESID. DOURADOS, CONJ. RESID. FERNANDA, CONJ. RESID. GRAÚNA, CONJ. RESID. TUCURUÍ, JARDIM BANDEIRANTES, JARDIM CEDRO, JARDIM CONGONHAS, JARDIM DOURADO II, JARDIM IPANEMA, JARDIM MÕNACO, JARDIM SANTA RITA, JARDIM VALE DO SOL, JARDIM VASCO DA GAMA, LOT. JARDIM COLOMBELLI, LOT. DOM RICARDO, LOT. GLEBA GUARANI, LOT. JARDIM DAS OLIVEIRAS, LOT. JARDIM DAS OLMEIRAS II, LOT. MENGER, LOT. NOVO MUNDO, LOT. PILARZINHO, LOT. RESID. JACQUELINE, LOT. RESID. LAGOA DOURADA, LOT. RESID. LAGOA VERMELHA, LOT. SÃO JOÃO, LOT. TRES LAGOAS, LOT. WITT, PARQUE RESID. LAGOA AZUL, VILA GUARANI, VILA MIRANDA, VILA TIBAGI.
        *   **R 02 – Região da Vila “C”:** Inclui Cidade Nova, Itaipu Binacional, Itaipu “C”, Pólo Universitário, Porto Belo.
        *   **R 03 – Região do São Francisco:** Inclui Morumbi, Portal Da Foz.
        *   **R 04 – Região do Porto Meira:** Inclui Bourbon, Porto Meira, Três Fronteiras.
        *   **R 05 – Região do Jardim São Paulo:** Inclui Panorama, São Roque.
        *   **R 06 – Região da Vila Portes e Jardim América:** Inclui América, Monjolo, Portes.
        *   **R 07 – Região do Parque Imperatriz:** Inclui Lancaster, Três Bandeiras.
        *   **R 08 – Região da KLP:** Inclui Itaipu A, Itaipu B, KLP, Ipê.
        *   **R 09 – Região do Centro:** Inclui Centro, Maracanã, Yolanda.
        *   **R 10 – Região do Campos do Iguaçu:** Inclui Polo Centro, Centro Cívico, Campos do Iguaçu.
        *   **R 11 – Região do Carimã:** Inclui Carimã, Mata Verde.
        *   **R 12 – Região Mista-Leste:** Inclui Cataratas, Cognópolis, Lote Grande, Remanso, Parque Nacional.

*   **Sugestões de Melhoria (Esta página):**
    *   **Função:** Registrar e gerenciar ideias para o sistema.
    *   **Componentes:** Área de texto para novas sugestões (com gravação de voz e IA), lista de sugestões.
    *   **Ações por Sugestão:** Corrigir com IA, Melhorar com IA, Desfazer, Aceitar, Excluir, Copiar, Gerar Estrutura JSON com IA, Discutir/Melhorar (abre este chat).
---

**Sua Tarefa:**
1.  Ao iniciar a conversa, você receberá a sugestão de texto atual. Cumprimente o usuário, confirme que você entendeu a sugestão e pergunte o que ele gostaria de alterar ou adicionar.
2.  Ouça as modificações solicitadas pelo usuário (ex: "Adicione um item sobre exportação de dados", "Detalhe melhor o ponto 3").
3.  Após cada solicitação, responda de forma conversacional e, em seguida, apresente a **sugestão de texto COMPLETA e ATUALIZADA**, incorporando a alteração. Mantenha o formato de lista numerada, se aplicável.

**Exemplo de Resposta:**
"Ótima ideia! Incorporei a funcionalidade de exportação em PDF. Veja como a sugestão completa ficou agora:

1.  Na página 'Clientes', adicione um novo botão no cabeçalho.
1.1. O rótulo do botão será 'Exportar PDF'.
2.  ... (restante dos itens) ..."

**Regras Finais:**
- Seja sempre prestativo e conversacional.
- Sempre retorne o texto completo da sugestão após cada alteração.
- O objetivo é que o texto final na sua última resposta seja a versão que o usuário quer salvar.`;

const ImageViewerModal = ({ imageUrl, onClose }) => {
    if (!imageUrl) return null;

    return (
        <div 
            className="fixed inset-0 bg-black/90 z-[60] flex justify-center items-center p-4 modal-enter" 
            onClick={onClose}
        >
            <button 
                onClick={(e) => { e.stopPropagation(); onClose(); }} 
                className="absolute top-4 right-4 text-white bg-black/50 rounded-full p-2 hover:bg-black/80 transition-colors z-10"
                aria-label="Fechar imagem"
            >
                <XIcon className="w-8 h-8" />
            </button>
            <div className="w-full h-full flex justify-center items-center modal-content-enter">
                <img 
                    src={imageUrl} 
                    alt="Visualização em tamanho real do rascunho da UI" 
                    className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                    onClick={(e) => e.stopPropagation()}
                />
            </div>
        </div>
    );
};

export const SuggestionChatModal: React.FC<SuggestionChatModalProps> = ({ isOpen, onClose, onSave, suggestion, addLog }) => {
    const chatRef = useRef<Chat | null>(null);
    const [history, setHistory] = useState<Message[]>([]);
    const [userInput, setUserInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isVisualizing, setIsVisualizing] = useState(false);
    const [viewingImage, setViewingImage] = useState<string | null>(null);
    const chatContainerRef = useRef<HTMLDivElement>(null);

    const saveHistory = useCallback(async (currentHistory: Message[]) => {
        if (!suggestion) return;
        try {
            await supabaseService.saveSugestao({
                id: suggestion.id,
                chat_history: currentHistory
            });
        } catch (error) {
            console.error('Failed to save chat history', error);
            addLog(`Falha ao salvar o histórico do chat: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
        }
    }, [suggestion, addLog]);

    useEffect(() => {
        if (isOpen && suggestion) {
            try {
                const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
                chatRef.current = ai.chats.create({
                    model: 'gemini-2.5-flash',
                    config: { 
                        systemInstruction: getSystemInstruction(suggestion),
                    },
                });
                
                if (suggestion.chat_history && Array.isArray(suggestion.chat_history) && suggestion.chat_history.length > 0) {
                    setHistory(suggestion.chat_history);
                    addLog(`Histórico de chat carregado para a sugestão #${suggestion.id}.`);
                } else {
                    const startConversation = async () => {
                        if (!chatRef.current) return;
                        setIsLoading(true);
                        setHistory([{ role: 'model', text: '' }]);
                        try {
                            const initialPrompt = `Esta é a sugestão que vamos melhorar:\n\n---\n${suggestion.suggestion_text}\n---\n\nInicie a conversa conforme suas instruções.`;
                            const responseStream = await chatRef.current.sendMessageStream({ message: initialPrompt });
                            let fullResponse = '';
                            for await (const chunk of responseStream) {
                                fullResponse += chunk.text;
                                setHistory(prev => {
                                    const newHistory = [...prev];
                                    // FIX: Explicitly cast object to Message to satisfy TypeScript.
                                    newHistory[newHistory.length - 1] = { role: 'model', text: fullResponse } as Message;
                                    return newHistory;
                                });
                            }
                            const finalHistory: Message[] = [{ role: 'model', text: fullResponse }];
                            await saveHistory(finalHistory);
                        } catch (error) {
                             const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro desconhecido.";
                             console.error("Gemini API Error on init:", error);
                             // FIX: Add explicit type to `errorMsg` to resolve type inference issue.
                             const errorMsg: Message = { role: 'model', text: `Erro: ${errorMessage}`, isError: true };
                             setHistory([errorMsg]);
                             await saveHistory([errorMsg]);
                        } finally {
                            setIsLoading(false);
                        }
                    };
                    startConversation();
                }

            } catch (error) {
                console.error("Failed to initialize Gemini Chat:", error);
                setHistory([{ role: 'model', text: 'Erro ao inicializar o assistente de IA. Verifique a configuração da chave de API.', isError: true }]);
            }
        }
    }, [isOpen, suggestion, addLog, saveHistory]);

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [history]);

    const handleSendMessage = async (e?: React.FormEvent) => {
        e?.preventDefault();
        const message = userInput.trim();
        if (!message || isLoading || !chatRef.current) return;

        const newUserMessage: Message = { role: 'user', text: message };
        const historyWithUserMsg = [...history, newUserMessage];
        setHistory(historyWithUserMsg);
        setUserInput('');
        setIsLoading(true);

        // FIX: Cast object to Message for state update.
        setHistory(prev => [...prev, { role: 'model', text: '' } as Message]);

        try {
            const responseStream = await chatRef.current.sendMessageStream({ message });
            let fullResponse = '';
            for await (const chunk of responseStream) {
                fullResponse += chunk.text;
                setHistory(prev => {
                    const newHistory = [...prev];
                    // FIX: Explicitly cast object to Message to satisfy TypeScript.
                    newHistory[newHistory.length - 1] = { role: 'model', text: fullResponse } as Message;
                    return newHistory;
                });
            }
            // FIX: Create typed message object before adding to array to ensure type compatibility.
            const modelResponse: Message = { role: 'model', text: fullResponse };
            const finalHistory = [...historyWithUserMsg, modelResponse];
            await saveHistory(finalHistory);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro desconhecido.";
            console.error("Gemini API Error:", error);
            const errorMsg: Message = { role: 'model', text: `Erro: ${errorMessage}`, isError: true };
            setHistory(prev => [...prev.slice(0, -1), errorMsg]);
            await saveHistory([...historyWithUserMsg, errorMsg]);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleSave = () => {
        const lastModelMessage = history.slice().reverse().find(m => m.role === 'model' && !m.isError && m.text);
        if (lastModelMessage) {
            const suggestionTextMatch = lastModelMessage.text.match(/(\d+\..*)/s);
            const finalText = suggestionTextMatch ? suggestionTextMatch[0] : lastModelMessage.text;
            onSave(suggestion.id, finalText);
        }
    };
    
    const handleVisualize = async () => {
        if (!suggestion.suggestion_structure?.changes) return;
        setIsVisualizing(true);
        setHistory(prev => [...prev, { role: 'model', text: 'Gerando rascunho visual...' }]);

        const changesDescription = suggestion.suggestion_structure.changes.map(c => {
            const details = c.details;
            // Safety check for details being undefined or null
            let detailString = '';
            if (details) {
                if (details.label) detailString += ` com o rótulo '${details.label}'`;
                if (details.new_text) detailString += ` contendo o texto '${details.new_text}'`;
                if (details.placeholder) detailString += ` com o placeholder '${details.placeholder}'`;
                if (details.position && c.identifier) detailString += ` ${details.position} do elemento '${c.identifier}'`;
            }
            
            return `- Ação '${c.action}': Adicionar um '${c.element}' na área '${c.target_area}'${detailString}.`;
        }).join('\n');

        const prompt = `Gere uma imagem de um wireframe de UI (rascunho de interface) altamente detalhado e fiel para uma página de um aplicativo web chamado "GestaoPro".

**REGRAS ESTRITAS:**
- **PROIBIDO FIGURAS HUMANAS:** Não inclua pessoas, mãos, animais, ou qualquer figura biológica. O foco é 100% na interface.
- **APENAS UI:** A imagem deve mostrar SOMENTE componentes de interface (botões, texto, tabelas, menus, cartões, etc.).

**DIRETRIZES DE ESTILO (MUITO IMPORTANTE):**
- **Tema:** Dark mode profissional e limpo.
- **Fundo Principal:** Use um cinza muito escuro, quase preto (#111827).
- **Cartões e Modais:** Componentes como cartões e modais devem ter um fundo de cinza escuro (#1f2937) com cantos bem arredondados (border-radius grande).
- **Cores de Destaque:** A cor primária para botões, links e destaques é um azul vibrante (#3b82f6). Ações de sucesso são verdes (#22c55e) e ações de perigo são vermelhas (#ef4444).
- **Tipografia:** Use uma fonte sans-serif limpa e moderna, similar à 'Inter'. O texto principal deve ser branco ou cinza claro (#d1d5db).
- **Estilo Geral:** Minimalista, com bom espaçamento, profissional. Pense em um sistema de gestão (ERP/CRM) moderno.

**PÁGINA A SER RENDERIZADA:**
- **Página:** ${suggestion.target_page}.

**ALTERAÇÕES A SEREM EXIBIDAS NESTA PÁGINA:**
${changesDescription}

**SAÍDA:**
- Renderize apenas a imagem do wireframe. Não adicione texto explicativo sobreposto na imagem. A imagem deve preencher todo o quadro.`;

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

            const imageGenerationPromise = ai.models.generateImages({
                model: 'imagen-4.0-generate-001',
                prompt: prompt,
                config: {
                    numberOfImages: 1,
                    outputMimeType: 'image/jpeg',
                    aspectRatio: '16:9',
                },
            });

            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('A geração da imagem está demorando mais que o esperado. Por favor, tente novamente.')), 60000) // 60 second timeout
            );

            const response: any = await Promise.race([imageGenerationPromise, timeoutPromise]);

            if (!response || !response.generatedImages || response.generatedImages.length === 0) {
                throw new Error("A IA não retornou uma imagem. Tente refinar sua sugestão.");
            }

            const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
            const imageUrl = `data:image/jpeg;base64,${base64ImageBytes}`;
            setHistory(prev => {
                const newHistory = [...prev];
                newHistory[newHistory.length - 1] = { role: 'model', imageUrl: imageUrl, text: 'Aqui está um rascunho visual da sugestão:' };
                return newHistory;
            });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro desconhecido.";
            console.error("Gemini Image Generation Error:", error);
            setHistory(prev => {
                const newHistory = [...prev];
                newHistory[newHistory.length - 1] = { role: 'model', text: `Erro ao gerar a imagem: ${errorMessage}`, isError: true };
                return newHistory;
            });
        } finally {
            setIsVisualizing(false);
        }
    };


    return (
        <>
            <Modal isOpen={isOpen} onClose={onClose} title="Melhorar Sugestão com IA" maxWidth="max-w-3xl" closeOnBackdropClick={false}>
                <div className="flex flex-col h-[65vh]">
                    <div ref={chatContainerRef} className="flex-grow overflow-y-auto p-4 bg-gray-900/50 rounded-lg space-y-6">
                        {history.map((msg, index) => (
                            <div key={index} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                                {msg.role === 'model' && <div className="flex-shrink-0 w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center"><BotIcon className="w-5 h-5 text-white"/></div>}
                                <div className={`max-w-lg p-3 rounded-xl whitespace-pre-wrap ${
                                    msg.isError 
                                    ? 'bg-red-900/50 text-red-300' 
                                    : msg.role === 'user' 
                                    ? 'bg-blue-600 text-white' 
                                    : 'bg-gray-700 text-gray-200'
                                }`}>
                                   { isLoading && index === history.length - 1 && !msg.text ? <SpinnerIcon className="w-5 h-5 text-gray-400" /> : msg.text }
                                   {msg.imageUrl && (
                                       <div className="mt-2 p-1 bg-gray-800 rounded-lg">
                                           <img 
                                                src={msg.imageUrl} 
                                                alt="Rascunho da UI" 
                                                className="rounded-md w-full cursor-pointer hover:opacity-80 transition-opacity"
                                                onClick={() => setViewingImage(msg.imageUrl)}
                                            />
                                       </div>
                                   )}
                                </div>
                            </div>
                        ))}
                    </div>
                    <form onSubmit={handleSendMessage} className="flex-shrink-0 pt-4">
                        <div className="flex items-center gap-3">
                            <textarea
                                value={userInput}
                                onChange={(e) => setUserInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSendMessage();
                                    }
                                }}
                                placeholder="Descreva a alteração que você deseja..."
                                rows={2}
                                className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition resize-none"
                                disabled={isLoading || isVisualizing}
                            />
                            <button type="submit" disabled={isLoading || isVisualizing || !userInput.trim()} className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-500 transition-colors disabled:opacity-50">
                                Enviar
                            </button>
                        </div>
                    </form>
                </div>
                 <div className="flex justify-between items-center pt-6 mt-4 border-t border-gray-700">
                    <button 
                        type="button" 
                        onClick={handleVisualize}
                        disabled={isLoading || isVisualizing || !suggestion?.suggestion_structure}
                        className="flex items-center justify-center px-4 py-2 text-sm font-semibold text-white bg-teal-600 rounded-lg hover:bg-teal-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title={!suggestion?.suggestion_structure ? "Gere uma estrutura com IA primeiro" : "Visualizar um rascunho da interface"}
                    >
                        {isVisualizing ? <SpinnerIcon className="w-5 h-5 mr-2"/> : <EyeIcon className="w-5 h-5 mr-2"/>}
                        {isVisualizing ? 'Gerando...' : 'Visualizar Rascunho'}
                    </button>
                    <div className="flex space-x-3">
                        <button type="button" onClick={onClose} className="px-5 py-2 text-sm font-semibold text-gray-300 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors">Cancelar</button>
                        <button 
                            type="button" 
                            onClick={handleSave}
                            disabled={isLoading || isVisualizing || history.filter(m => m.role === 'model' && !m.isError && m.text).length === 0}
                            className="flex items-center justify-center px-5 py-2 text-sm font-semibold text-white bg-green-600 rounded-lg hover:bg-green-500 transition-colors disabled:opacity-50"
                        >
                            <CheckCheckIcon className="w-5 h-5 mr-2"/>
                            Salvar Alterações
                        </button>
                    </div>
                </div>
            </Modal>
            <ImageViewerModal imageUrl={viewingImage} onClose={() => setViewingImage(null)} />
        </>
    );
};
