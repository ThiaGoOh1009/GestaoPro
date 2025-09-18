import React, { useState, useEffect } from 'react';
import { supabaseService } from '../../services/storage';
import { capitalizeWords } from '../../utils/helpers';
import { Trash2Icon, PlusIcon, CheckCheckIcon } from '../../components/Icons';
import { ProductFormModal } from './ProductFormModal';

export const ProductSettingsPage = ({ addLog }) => {
    const [categories, setCategories] = useState({ produtos: [], servicos: [] });
    const [newCategory, setNewCategory] = useState({ produtos: '', servicos: '' });
    const [temporaryProducts, setTemporaryProducts] = useState([]);

    // State for managing the product form modal for registration
    const [isFormModalOpen, setFormModalOpen] = useState(false);
    const [productToRegister, setProductToRegister] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    const loadData = async () => {
        try {
            const [loadedCategories, loadedTempProducts] = await Promise.all([
                supabaseService.getCategories(),
                supabaseService.getTemporaryProducts(),
            ]);
            setCategories(loadedCategories);
            setTemporaryProducts(loadedTempProducts);
        } catch (error) {
            addLog(`Erro ao carregar configurações: ${error.message}`);
        }
    };

    useEffect(() => {
        loadData();
        addLog('Página de configurações de produto aberta.');
    }, [addLog]);

    const handleAddCategory = async (type) => {
        const categoryToAdd = newCategory[type].trim();
        if (!categoryToAdd) return;

        const currentCategories = type === 'produtos' ? categories.produtos : categories.servicos;
        
        if (!currentCategories.some(c => c && c.toLowerCase() === categoryToAdd.toLowerCase())) {
            const updatedCategories = { ...categories };
            updatedCategories[type].push(categoryToAdd);
            
            await supabaseService.saveCategories(updatedCategories);
            setNewCategory(prev => ({ ...prev, [type]: '' }));
            addLog(`Categoria "${categoryToAdd}" adicionada a ${type}.`);
            loadData();
        } else {
            addLog(`Aviso: Categoria "${categoryToAdd}" já existe.`);
        }
    };
    
    const handleDeleteCategory = async (type, categoryToDelete) => {
        const updatedCategories = { ...categories };
        updatedCategories[type] = updatedCategories[type].filter(cat => cat !== categoryToDelete);
        
        await supabaseService.saveCategories(updatedCategories);
        addLog(`Categoria "${categoryToDelete}" removida de ${type}.`);
        loadData();
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

    // Handlers for temporary products
    const handleRegisterClick = (tempProduct) => {
        setProductToRegister({
            name: tempProduct.name,
            price: tempProduct.price,
            type: 'Produto', // Default to product, user can change in modal
        });
        setFormModalOpen(true);
        addLog(`Abrindo formulário para cadastrar o produto sugerido: ${tempProduct.name}`);
    };

    const handleSaveProduct = async (productData) => {
        if (isSaving) return;
        setIsSaving(true);
        try {
            await supabaseService.saveProduto(productData);
            const tempProduct = temporaryProducts.find(p => p.name === productData.name);
            if (tempProduct) {
                await supabaseService.deleteTemporaryProduct(tempProduct.id);
            }
            addLog(`Produto "${productData.name}" salvo com sucesso e removido das sugestões.`);
            setFormModalOpen(false);
            loadData();
        } catch (err) {
            addLog(`ERRO ao salvar produto: ${err.message}`);
            alert(`Erro ao salvar produto: ${err.message}`);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteTemporary = async (tempProduct) => {
        if (window.confirm(`Tem certeza que deseja excluir a sugestão "${tempProduct.name}"?`)) {
            await supabaseService.deleteTemporaryProduct(tempProduct.id);
            addLog(`Sugestão "${tempProduct.name}" removida.`);
            loadData();
        }
    };

    const renderCategoryList = (type) => (
        <div className="bg-gray-800 rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-semibold text-white mb-4">Categorias de {type === 'produtos' ? 'Produtos' : 'Serviços'}</h3>
            <div className="flex space-x-2 mb-4">
                <input
                    type="text"
                    name={`newCategory-${type}`}
                    placeholder="Nova categoria"
                    value={newCategory[type]}
                    onChange={(e) => handleInputChange(e, type)}
                    onKeyDown={(e) => handleKeyDown(e, type)}
                    className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                    name={`addCategory-${type}`}
                    onClick={() => handleAddCategory(type)}
                    className="flex-shrink-0 px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-500 transition-colors"
                >
                    Adicionar
                </button>
            </div>
            <ul className="space-y-2 max-h-60 overflow-y-auto pr-2">
                {categories[type]?.length > 0 ? categories[type].map(cat => (
                    <li key={cat} className="flex justify-between items-center bg-gray-700/50 p-3 rounded-lg">
                        <span className="text-gray-300">{cat}</span>
                        <button
                            name={`deleteCategory-${type}-${cat}`}
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
        <>
            <div>
                <header className="mb-8">
                    <h2 className="text-3xl font-bold text-white">Configurações de Produtos</h2>
                    <p className="text-gray-400 mt-1">Gerencie as categorias para produtos e serviços.</p>
                </header>
                
                {temporaryProducts.length > 0 && (
                    <div className="bg-yellow-900/50 border border-yellow-700 rounded-xl shadow-lg p-6 mb-8">
                        <h3 className="text-xl font-semibold text-yellow-200 mb-4">Sugestões de Produtos Pendentes</h3>
                        <p className="text-sm text-yellow-300 mb-4">Estes itens foram adicionados em chamados mas não estão no catálogo. Cadastre-os oficialmente ou remova-os.</p>
                        <ul className="space-y-3">
                            {temporaryProducts.map((item: any) => (
                                <li key={item.id} className="flex flex-col sm:flex-row justify-between items-center bg-gray-700/50 p-3 rounded-lg gap-3">
                                    <div className="flex-grow text-left w-full sm:w-auto">
                                        <p className="font-medium text-white">{item.name}</p>
                                        <p className="text-xs text-gray-400">Preço Sugerido: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.price)}</p>
                                    </div>
                                    <div className="flex items-center space-x-3 flex-shrink-0">
                                        <button name={`register-temp-item-${item.id}`} onClick={() => handleRegisterClick(item)} className="flex items-center text-xs px-2 py-1 bg-green-600 hover:bg-green-500 text-white rounded-md transition-colors" title="Cadastrar Oficialmente"><CheckCheckIcon className="w-4 h-4 mr-1"/> Cadastrar</button>
                                        <button name={`delete-temp-item-${item.id}`} onClick={() => handleDeleteTemporary(item)} className="text-red-500 hover:text-red-400 transition-colors" aria-label={`Excluir sugestão ${item.name}`}><Trash2Icon className="w-5 h-5" /></button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {renderCategoryList('produtos')}
                    {renderCategoryList('servicos')}
                </div>
            </div>

            {isFormModalOpen && (
                <ProductFormModal 
                    isOpen={isFormModalOpen}
                    onClose={() => setFormModalOpen(false)}
                    onSave={handleSaveProduct}
                    product={productToRegister}
                    addLog={addLog}
                    isSaving={isSaving}
                />
            )}
        </>
    );
};