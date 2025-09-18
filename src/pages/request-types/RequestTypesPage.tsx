import React, { useState, useEffect, useCallback } from 'react';
import { supabaseService } from '../../services/storage';
import { capitalizeWords } from '../../utils/helpers';
import { Trash2Icon, PlusIcon, SpinnerIcon, FileTextIcon } from '../../components/Icons';

export const RequestTypesPage = ({ addLog }) => {
    const [requestTypes, setRequestTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [newItemName, setNewItemName] = useState('');

    const loadRequestTypes = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const data = await supabaseService.getRequestTypes();
            setRequestTypes(data);
            addLog('Tipos de solicitação carregados.');
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            setError(message);
            addLog(`Erro ao carregar tipos de solicitação: ${message}`);
        } finally {
            setLoading(false);
        }
    }, [addLog]);

    useEffect(() => {
        loadRequestTypes();
    }, [loadRequestTypes]);

    const handleAddItem = async () => {
        const name = newItemName.trim();
        if (!name) return;

        const exists = requestTypes.some(rt => rt.name.toLowerCase() === name.toLowerCase());
        if (exists) {
            addLog(`Aviso: O tipo de solicitação "${name}" já existe.`);
            alert(`O tipo de solicitação "${name}" já existe.`);
            return;
        }
        
        try {
            await supabaseService.saveRequestType({ name });
            setNewItemName('');
            addLog(`Tipo de solicitação "${name}" adicionado.`);
            loadRequestTypes();
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            setError(message);
            addLog(`Erro ao adicionar tipo de solicitação: ${message}`);
        }
    };
    
    const handleDeleteItem = async (id, name) => {
        const coreTypes = ['Chamado de Serviço', 'Treinamento', 'Agendamento'];
        if (coreTypes.includes(name)) {
            alert(`O tipo "${name}" é um tipo principal e não pode ser excluído.`);
            addLog(`Tentativa de exclusão do tipo principal "${name}" bloqueada.`);
            return;
        }
        
        if (window.confirm(`Tem certeza que deseja excluir o tipo "${name}"?`)) {
            try {
                await supabaseService.deleteRequestType(id);
                addLog(`Tipo de solicitação "${name}" removido.`);
                loadRequestTypes();
            } catch (err) {
                const message = err instanceof Error ? err.message : String(err);
                setError(message);
                addLog(`Erro ao remover tipo de solicitação: ${message}`);
            }
        }
    };

    const handleInputChange = (e) => {
        setNewItemName(capitalizeWords(e.target.value));
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAddItem();
        }
    };

    return (
        <div>
            <header className="mb-8">
                <h2 className="text-3xl font-bold text-white">Tipos de Solicitação</h2>
                <p className="text-gray-400 mt-1">Gerencie os tipos de chamados que podem ser criados.</p>
            </header>
            
            <div className="bg-gray-800 rounded-xl shadow-lg p-6 max-w-2xl mx-auto">
                <h3 className="text-xl font-semibold text-white mb-4">Adicionar e Gerenciar Tipos</h3>
                <div className="flex space-x-2 mb-6">
                    <input 
                        type="text" 
                        name="newRequestType"
                        placeholder="Nome do novo tipo" 
                        value={newItemName} 
                        onChange={handleInputChange} 
                        onKeyDown={handleKeyDown} 
                        className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                    />
                    <button 
                        name="addRequestType"
                        onClick={handleAddItem} 
                        className="flex-shrink-0 px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-500 transition-colors"
                    >
                        <PlusIcon className="w-6 h-6" />
                    </button>
                </div>
                {loading ? (
                    <div className="flex justify-center py-8"><SpinnerIcon className="w-8 h-8 text-white"/></div>
                ) : error ? (
                    <div className="p-4 text-center text-red-400">{error}</div>
                ) : (
                    <ul className="space-y-2 max-h-96 overflow-y-auto pr-2 sidebar-scroll">
                        {requestTypes.length > 0 ? requestTypes.map(item => (
                            <li key={item.id} className="flex justify-between items-center bg-gray-700/50 p-3 rounded-lg">
                                <span className="text-gray-300">{item.name}</span>
                                <button 
                                    name={`deleteRequestType-${item.id}`}
                                    onClick={() => handleDeleteItem(item.id, item.name)} 
                                    className="p-2 text-red-500 hover:text-red-400 transition-colors" 
                                    aria-label={`Excluir ${item.name}`}
                                >
                                    <Trash2Icon className="w-6 h-6" />
                                </button>
                            </li>
                        )) : (
                            <div className="text-center py-12">
                                <FileTextIcon className="mx-auto w-12 h-12 text-gray-500" />
                                <h3 className="mt-4 text-lg font-medium text-white">Nenhum tipo encontrado</h3>
                                <p className="mt-1 text-sm text-gray-400">Os tipos padrão serão criados automaticamente.</p>
                            </div>
                        )}
                    </ul>
                )}
            </div>
        </div>
    );
};