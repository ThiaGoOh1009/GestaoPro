import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Chat } from '@google/genai';
import { Modal } from '../../components/Modal';
import { BotIcon, SpinnerIcon, CheckCheckIcon } from '../../components/Icons';

interface Message {
    role: 'user' | 'model';
    text: string;
    isError?: boolean;
}

interface PromptBuilderModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAcceptSuggestion: (text: string) => void;
}

// FIX: Replaced backticks ` with single quotes ' around identifiers inside the template literal to prevent them from being parsed as code.
const systemInstruction = `Você é um assistente especializado em engenharia de software e UX. Sua tarefa é ajudar o usuário a refinar e detalhar uma ideia para uma nova funcionalidade em um sistema de gestão (ERP/CRM). Transforme ideias vagas em uma lista de requisitos claros, numerados e bem definidos.

**IMPORTANTE:** Para iniciar a conversa, SEMPRE comece se apresentando e perguntando ao usuário em qual página ou funcionalidade do sistema ele gostaria de aplicar a melhoria.

Use a lista detalhada abaixo como contexto sobre a estrutura do sistema para guiar a conversa.

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
Lembre-se: seu objetivo é guiar o usuário a fornecer detalhes. Faça perguntas como "Como essa funcionalidade afetaria a tela de Chamados?", "Quais campos seriam necessários no formulário de Clientes para a sua ideia?".`;

export const PromptBuilderModal: React.FC<PromptBuilderModalProps> = ({ isOpen, onClose, onAcceptSuggestion }) => {
    const chatRef = useRef<Chat | null>(null);
    const [history, setHistory] = useState<Message[]>([]);
    const [userInput, setUserInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const chatContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen) {
            try {
                const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
                chatRef.current = ai.chats.create({
                    model: 'gemini-2.5-flash',
                    config: { 
                        systemInstruction,
                    },
                });
                
                setHistory([]);
                const startConversation = async () => {
                    if (!chatRef.current) return;
                    setIsLoading(true);
                    setHistory(prev => [...prev, { role: 'model', text: '' }]);
                    try {
                        const responseStream = await chatRef.current.sendMessageStream({ message: "Olá, inicie a conversa de acordo com suas instruções de sistema." });
                        let fullResponse = '';
                        for await (const chunk of responseStream) {
                            fullResponse += chunk.text;
                            setHistory(prev => {
                                const newHistory = [...prev];
                                newHistory[newHistory.length - 1] = { role: 'model', text: fullResponse };
                                return newHistory;
                            });
                        }
                    } catch (error) {
                         const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro desconhecido.";
                         console.error("Gemini API Error on init:", error);
                         setHistory([{ role: 'model', text: `Erro: ${errorMessage}`, isError: true }]);
                    } finally {
                        setIsLoading(false);
                    }
                };
                startConversation();

            } catch (error) {
                console.error("Failed to initialize Gemini Chat:", error);
                setHistory([{ role: 'model', text: 'Erro ao inicializar o assistente de IA. Verifique a configuração da chave de API.', isError: true }]);
            }
        }
    }, [isOpen]);

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
        setHistory(prev => [...prev, newUserMessage, { role: 'model', text: '' }]);
        setUserInput('');
        setIsLoading(true);

        try {
            const responseStream = await chatRef.current.sendMessageStream({ message });
            let fullResponse = '';
            for await (const chunk of responseStream) {
                fullResponse += chunk.text;
                setHistory(prev => {
                    const newHistory = [...prev];
                    newHistory[newHistory.length - 1].text = fullResponse;
                    return newHistory;
                });
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro desconhecido.";
            console.error("Gemini API Error:", error);
            setHistory(prev => {
                const newHistory = [...prev];
                newHistory[newHistory.length - 1] = { role: 'model', text: `Erro: ${errorMessage}`, isError: true };
                return newHistory;
            });
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleAccept = () => {
        const lastModelMessage = history.slice().reverse().find(m => m.role === 'model' && !m.isError && m.text);
        if (lastModelMessage) {
            onAcceptSuggestion(lastModelMessage.text);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Assistente de Sugestões" maxWidth="max-w-3xl">
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
                            placeholder="Digite sua mensagem..."
                            rows={2}
                            className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition resize-none"
                            disabled={isLoading}
                        />
                        <button type="submit" disabled={isLoading || !userInput.trim()} className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-500 transition-colors disabled:opacity-50">
                            Enviar
                        </button>
                    </div>
                </form>
            </div>
             <div className="flex justify-end space-x-3 pt-6 mt-4 border-t border-gray-700">
                <button type="button" onClick={onClose} className="px-5 py-2 text-sm font-semibold text-gray-300 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors">Cancelar</button>
                <button 
                    type="button" 
                    onClick={handleAccept}
                    disabled={isLoading || history.filter(m => m.role === 'model' && !m.isError && m.text).length === 0}
                    className="flex items-center justify-center px-5 py-2 text-sm font-semibold text-white bg-green-600 rounded-lg hover:bg-green-500 transition-colors disabled:opacity-50"
                >
                    <CheckCheckIcon className="w-5 h-5 mr-2"/>
                    Usar esta Sugestão
                </button>
            </div>
        </Modal>
    );
};
