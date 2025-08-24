import React, { useState, useEffect } from 'react';
import { backend } from '../../services/storage';
import { capitalizeWords } from '../../utils/helpers';
import { Trash2Icon } from '../../components/Icons';

export const ProductSettingsPage = ({ addLog }) => {
    const [categories, setCategories] = useState({ produtos: [], servicos: [] });
    const [newCategory, setNewCategory] = useState({ produtos: '', servicos: '' });

    useEffect(() => {
        setCategories(backend.getCategories());
        addLog('Página de configurações de produto aberta.');
    }, [addLog]);

    const handleAddCategory = (type) => {
        const categoryToAdd = newCategory[type].trim();
        if (!categoryToAdd) return;

        const updatedCategories = { ...categories };
        if (!updatedCategories[type].map(c => c.toLowerCase()).includes(categoryToAdd.toLowerCase())) {
            updatedCategories[type].push(categoryToAdd);
            setCategories(updatedCategories);
            backend.saveCategories(updatedCategories);
            setNewCategory(prev => ({ ...prev, [type]: '' }));
            addLog(`Categoria "${categoryToAdd}" adicionada a ${type}.`);
        } else {
            addLog(`Aviso: Categoria "${categoryToAdd}" já existe.`);
        }
    };
    
    const handleDeleteCategory = (type, categoryToDelete) => {
        const updatedCategories = { ...categories };
        updatedCategories[type] = updatedCategories[type].filter(cat => cat !== categoryToDelete);
        setCategories(updatedCategories);
        backend.saveCategories(updatedCategories);
        addLog(`Categoria "${categoryToDelete}" removida de ${type}.`);
    };

    const handleInputChange = (e, type) => {
        const { value } = e.target;
        setNewCategory(prev => ({ ...prev, [type]: capitalizeWords(value) }));
    };

    const handleKeyDown = (e, type) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAddCategory(type);
        }
    };

    const renderCategoryList = (type) => (
        <div className="bg-gray-800 rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-semibold text-white mb-4">Categorias de {type === 'produtos' ? 'Produtos' : 'Serviços'}</h3>
            <div className="flex space-x-2 mb-4">
                <input
                    type="text"
                    placeholder="Nova categoria"
                    value={newCategory[type]}
                    onChange={(e) => handleInputChange(e, type)}
                    onKeyDown={(e) => handleKeyDown(e, type)}
                    className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                    onClick={() => handleAddCategory(type)}
                    className="flex-shrink-0 px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-500 transition-colors"
                >
                    Adicionar
                </button>
            </div>
            <ul className="space-y-2 max-h-60 overflow-y-auto pr-2">
                {categories[type].length > 0 ? categories[type].map(cat => (
                    <li key={cat} className="flex justify-between items-center bg-gray-700/50 p-3 rounded-lg">
                        <span className="text-gray-300">{cat}</span>
                        <button
                            onClick={() => handleDeleteCategory(type, cat)}
                            className="text-red-500 hover:text-red-400 transition-colors"
                            aria-label={`Excluir categoria ${cat}`}
                        >
                            <Trash2Icon className="w-5 h-5" />
                        </button>
                    </li>
                )) : (
                    <p className="text-gray-500 italic text-center py-4">Nenhuma categoria cadastrada.</p>
                )}
            </ul>
        </div>
    );
    
    return (
        <div>
            <header className="mb-8">
                <h2 className="text-3xl font-bold text-white">Configurações de Produtos</h2>
                <p className="text-gray-400 mt-1">Gerencie as categorias para produtos e serviços.</p>
            </header>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {renderCategoryList('produtos')}
                {renderCategoryList('servicos')}
            </div>
        </div>
    );
};