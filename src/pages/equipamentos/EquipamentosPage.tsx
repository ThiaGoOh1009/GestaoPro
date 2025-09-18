import React, { useState, useEffect, useCallback } from 'react';
import { supabaseService } from '../../services/storage';
import { capitalizeWords } from '../../utils/helpers';
import { Trash2Icon, PlusIcon, CheckCheckIcon } from '../../components/Icons';

export const EquipamentosPage = ({ addLog }) => {
    const [equipamentos, setEquipamentos] = useState([]);
    const [temporary, setTemporary] = useState([]);
    const [editedTemporaryItems, setEditedTemporaryItems] = useState<{ [key: string]: string }>({});
    const [newItem, setNewItem] = useState({ Equipamento: '', Sistema: '' });

    const loadData = useCallback(async () => {
        try {
            const eqData = await supabaseService.getEquipamentos();
            setEquipamentos(eqData);
            const tempData = await supabaseService.getTemporaryEquipamentos();
            setTemporary(tempData);
            setEditedTemporaryItems(tempData.reduce((acc, name) => ({ ...acc, [name]: name }), {}));
            addLog('Página de equipamentos e sistemas aberta.');
        } catch (error) {
            addLog(`Erro ao carregar dados de equipamentos: ${error.message}`);
        }
    }, [addLog]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleAddItem = async (type) => {
        const name = newItem[type].trim();
        if (!name) return;

        const exists = equipamentos.some(e => e.name && e.name.toLowerCase() === name.toLowerCase() && e.type === type);
        if (exists) {
            addLog(`Aviso: ${type} "${name}" já existe.`);
            return;
        }
        
        await supabaseService.saveEquipamento({ type, name });
        setNewItem(prev => ({ ...prev, [type]: '' }));
        addLog(`${type} "${name}" adicionado.`);
        loadData();
    };
    
    const handleDeleteItem = async (id, name, type) => {
        await supabaseService.deleteEquipamento(id);
        addLog(`${type} "${name}" removido.`);
        loadData();
    };
    
    const handleRegisterTemporary = async (originalName) => {
        const nameToRegister = (editedTemporaryItems[originalName] || originalName).trim();
        if (!nameToRegister) {
            addLog('Nome do equipamento não pode ser vazio.');
            return;
        }

        const type = "Equipamento"; // Assume temporary items are equipment
        const exists = equipamentos.some(e => e.name && e.name.toLowerCase() === nameToRegister.toLowerCase());
        
        if (exists) {
            addLog(`Aviso: Equipamento "${nameToRegister}" já existe. Removendo item temporário.`);
        } else {
             await supabaseService.saveEquipamento({ type, name: nameToRegister });
             addLog(`Equipamento temporário "${originalName}" foi cadastrado como "${nameToRegister}".`);
        }
        await supabaseService.deleteTemporaryEquipamento(originalName);
        loadData(); // Reload all data
    };

    const handleDeleteTemporary = async (name) => {
        await supabaseService.deleteTemporaryEquipamento(name);
        addLog(`Equipamento temporário "${name}" foi removido.`);
        loadData(); // Reload all data to ensure state consistency
    };

    const handleInputChange = (e, type) => {
        const { value } = e.target;
        setNewItem(prev => ({ ...prev, [type]: capitalizeWords(value) }));
    };

    const handleTemporaryItemChange = (e, originalName) => {
        const { value } = e.target;
        setEditedTemporaryItems(prev => ({ ...prev, [originalName]: capitalizeWords(value) }));
    };

    const handleKeyDown = (e, type) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAddItem(type);
        }
    };

    const renderList = (type) => {
        const items = equipamentos.filter(e => e.type === type);
        return (
            <div className="bg-gray-800 rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-semibold text-white mb-4">{type}s</h3>
                <div className="flex space-x-2 mb-4">
                    <input type="text" name={`new-${type.toLowerCase()}`} placeholder={`Novo ${type.toLowerCase()}`} value={newItem[type]} onChange={(e) => handleInputChange(e, type)} onKeyDown={(e) => handleKeyDown(e, type)} className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    <button name={`add-${type.toLowerCase()}`} onClick={() => handleAddItem(type)} className="flex-shrink-0 px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-500 transition-colors"><PlusIcon className="w-4 h-4" /></button>
                </div>
                <ul className="space-y-2 max-h-80 overflow-y-auto pr-2 sidebar-scroll">
                    {items.length > 0 ? items.map(item => (
                        <li key={item.id} className="flex justify-between items-center bg-gray-700/50 p-3 rounded-lg">
                            <span className="text-gray-300">{item.name}</span>
                            <button name={`delete-${type.toLowerCase()}-${item.id}`} onClick={() => handleDeleteItem(item.id, item.name, item.type)} className="p-2 text-red-500 hover:text-red-400 transition-colors" aria-label={`Excluir ${item.name}`}><Trash2Icon className="w-5 h-5" /></button>
                        </li>
                    )) : (<p className="text-gray-500 italic text-center py-4">Nenhum {type.toLowerCase()} cadastrado.</p>)}
                </ul>
            </div>
        );
    };
    
    return (
        <div>
            <header className="mb-8">
                <h2 className="text-3xl font-bold text-white">Equipamentos e Sistemas</h2>
                <p className="text-gray-400 mt-1">Gerencie os itens disponíveis para os chamados.</p>
            </header>

            {temporary.length > 0 && (
                 <div className="bg-yellow-900/50 border border-yellow-700 rounded-xl shadow-lg p-6 mb-8">
                     <h3 className="text-xl font-semibold text-yellow-200 mb-4">Itens Temporários Pendentes</h3>
                     <p className="text-sm text-yellow-300 mb-4">Estes itens foram criados em chamados. Edite o nome se necessário e cadastre-os oficialmente ou remova-os.</p>
                     <ul className="space-y-3">
                        {temporary.map(originalName => (
                            <li key={originalName} className="flex flex-col sm:flex-row justify-between items-center bg-gray-700/50 p-3 rounded-lg gap-3">
                                <input
                                    type="text"
                                    name={`temp-item-${originalName}`}
                                    value={editedTemporaryItems[originalName] || ''}
                                    onChange={(e) => handleTemporaryItemChange(e, originalName)}
                                    className="w-full bg-gray-900 text-white rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    aria-label={`Editar nome do item temporário ${originalName}`}
                                />
                                <div className="flex items-center space-x-3 flex-shrink-0">
                                    <button name={`register-temp-item-${originalName}`} onClick={() => handleRegisterTemporary(originalName)} className="flex items-center text-xs px-2 py-1 bg-green-600 hover:bg-green-500 text-white rounded-md transition-colors" title="Cadastrar Oficialmente"><CheckCheckIcon className="w-4 h-4 mr-1"/> Cadastrar</button>
                                    <button name={`delete-temp-item-${originalName}`} onClick={() => handleDeleteTemporary(originalName)} className="text-red-500 hover:text-red-400 transition-colors" aria-label={`Excluir item temporário ${originalName}`}><Trash2Icon className="w-5 h-5" /></button>
                                </div>
                            </li>
                        ))}
                     </ul>
                 </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {renderList('Equipamento')}
                {renderList('Sistema')}
            </div>
        </div>
    );
};