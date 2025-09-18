import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabaseService } from '../../services/storage';
import { BoxIcon, WrenchIcon, TagIcon, Edit2Icon, Trash2Icon, SearchIcon, PlusIcon, GridIcon, ListIcon } from '../../components/Icons';
import { ProductFormModal } from './ProductFormModal';
import { DeleteConfirmationModal } from '../../components/Modal';

const ProductCardSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-pulse">
        {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-gray-800 rounded-xl p-5 space-y-4">
                <div className="flex justify-between items-start">
                    <div className="space-y-2">
                        <div className="h-5 bg-gray-700 rounded w-32"></div>
                        <div className="h-3 bg-gray-700 rounded w-24"></div>
                    </div>
                    <div className="w-10 h-10 bg-gray-700 rounded-lg"></div>
                </div>
                <div className="h-3 bg-gray-700 rounded w-full"></div>
                <div className="h-3 bg-gray-700 rounded w-4/5"></div>
                <div className="flex justify-between items-center pt-2">
                    <div className="h-6 bg-gray-700 rounded w-28"></div>
                    <div className="flex space-x-3">
                        <div className="w-5 h-5 bg-gray-700 rounded"></div>
                        <div className="w-5 h-5 bg-gray-700 rounded"></div>
                    </div>
                </div>
            </div>
        ))}
    </div>
);

const ProductCard = ({ product, onEdit, onDelete }) => {
    const isService = product.type === 'Serviço';
    const formatCurrency = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

    return (
        <div className="bg-gray-800 rounded-xl p-5 flex flex-col justify-between shadow-lg hover:shadow-blue-500/10 hover:-translate-y-1 transition-all duration-300" data-dev-id={`ProdutosPage-ProductCard-${product.id}`}>
            <div>
                <div className="flex justify-between items-start mb-3">
                    <div>
                        <span className={`inline-block px-2 py-0.5 text-xs font-semibold rounded-full mb-2 ${isService ? 'bg-purple-500/20 text-purple-300' : 'bg-green-500/20 text-green-300'}`}>{product.type}</span>
                        <h3 className="font-bold text-white text-lg">{product.name}</h3>
                        <p className="text-sm text-gray-400">{product.category}</p>
                    </div>
                    <div className={`p-2 rounded-lg ${isService ? 'bg-purple-500/10 text-purple-400' : 'bg-green-500/10 text-green-400'}`}>
                        {isService ? <WrenchIcon className="w-6 h-6" /> : <BoxIcon className="w-6 h-6" />}
                    </div>
                </div>
                <p className="text-gray-300 text-sm mb-4 min-h-[40px]">{product.description}</p>
            </div>
            <div className="flex justify-between items-center pt-3 border-t border-gray-700/50">
                <div className="flex items-center">
                    <TagIcon className="w-4 h-4 text-gray-400 mr-2" />
                    <span className="text-lg font-semibold text-white">{formatCurrency(product.price)}</span>
                </div>
                <div className="flex items-center space-x-3">
                    {!isService && <span className="text-xs text-gray-400">Estoque: {product.stock}</span>}
                    <button name={`editProduct-${product.id}`} onClick={() => onEdit(product)} className="p-3 rounded-full hover:bg-gray-700 text-blue-400 hover:text-blue-300 transition-colors" aria-label={`Editar ${product.name}`} data-dev-id={`ProdutosPage-ProductCard-edit-${product.id}`}><Edit2Icon className="w-5 h-5" /></button>
                    <button name={`deleteProduct-${product.id}`} onClick={() => onDelete(product)} className="p-3 rounded-full hover:bg-gray-700 text-red-500 hover:text-red-400 transition-colors" aria-label={`Excluir ${product.name}`} data-dev-id={`ProdutosPage-ProductCard-delete-${product.id}`}><Trash2Icon className="w-5 h-5" /></button>
                </div>
            </div>
        </div>
    );
};

const ProductListItem = ({ product, onEdit, onDelete }) => {
    const isService = product.type === 'Serviço';
    const formatCurrency = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

    return (
        <tr className="bg-gray-800 border-b border-gray-700/50 hover:bg-gray-700/50 transition-colors" data-dev-id={`ProdutosPage-list-item-${product.id}`}>
            <td className="px-6 py-4">
                <div className="flex items-center">
                    <div className={`p-2 rounded-lg mr-4 ${isService ? 'bg-purple-500/10 text-purple-400' : 'bg-green-500/10 text-green-400'}`}>
                        {isService ? <WrenchIcon className="w-6 h-6" /> : <BoxIcon className="w-6 h-6" />}
                    </div>
                    <div>
                        <div className="font-semibold text-white">{product.name}</div>
                        <div className="text-sm text-gray-400">{product.category}</div>
                    </div>
                </div>
            </td>
            <td className="px-6 py-4 hidden md:table-cell">
                 <span className={`inline-block px-2 py-0.5 text-xs font-semibold rounded-full ${isService ? 'bg-purple-500/20 text-purple-300' : 'bg-green-500/20 text-green-300'}`}>{product.type}</span>
            </td>
            <td className="px-6 py-4 hidden sm:table-cell">{formatCurrency(product.price)}</td>
            <td className="px-6 py-4 hidden lg:table-cell">{isService ? 'N/A' : product.stock}</td>
            <td className="px-6 py-4 text-right">
                <div className="flex items-center justify-end space-x-3">
                    <button name={`editProduct-${product.id}`} onClick={() => onEdit(product)} className="p-3 rounded-full hover:bg-gray-700 text-blue-400 hover:text-blue-300 transition-colors" aria-label={`Editar ${product.name}`} data-dev-id={`ProdutosPage-list-edit-${product.id}`}><Edit2Icon className="w-5 h-5" /></button>
                    <button name={`deleteProduct-${product.id}`} onClick={() => onDelete(product)} className="p-3 rounded-full hover:bg-gray-700 text-red-500 hover:text-red-400 transition-colors" aria-label={`Excluir ${product.name}`} data-dev-id={`ProdutosPage-list-delete-${product.id}`}><Trash2Icon className="w-5 h-5" /></button>
                </div>
            </td>
        </tr>
    );
};

export const ProdutosPage = ({ addLog }) => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({ type: 'todos', category: 'todas' });
    const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'

    const [isFormModalOpen, setFormModalOpen] = useState(false);
    const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    const loadProducts = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await supabaseService.getProdutos();
            setProducts(data);
            addLog(`${data.length} produtos/serviços carregados.`);
        } catch (err) {
            setError(err.message);
            addLog(`ERRO ao carregar produtos: ${err.message}`);
        } finally {
            setLoading(false);
        }
    }, [addLog]);

    useEffect(() => {
        loadProducts();
    }, [loadProducts]);

    const handleOpenAddModal = () => { setSelectedProduct(null); setFormModalOpen(true); addLog('Abrindo modal para adicionar produto.'); };
    const handleOpenEditModal = (p) => { setSelectedProduct(p); setFormModalOpen(true); addLog(`Abrindo modal para editar produto: ${p.name}`); };
    const handleOpenDeleteModal = (p) => { setSelectedProduct(p); setDeleteModalOpen(true); addLog(`Abrindo modal para excluir produto: ${p.name}`); };
    const handleCloseModals = () => { setFormModalOpen(false); setDeleteModalOpen(false); setSelectedProduct(null); };

    const handleSaveProduct = async (productData) => {
        if (isSaving) return;
        setIsSaving(true);
        try {
            await supabaseService.saveProduto(productData);
            addLog(`Produto "${productData.name}" foi salvo com sucesso.`);
            handleCloseModals();
            loadProducts(); // Replaces local state update with a refetch
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            addLog(`ERRO ao salvar produto: ${message}`);
            alert(`Erro ao salvar produto: ${message}`);
        } finally {
            setIsSaving(false);
        }
    };

    const handleConfirmDelete = async () => {
        if (selectedProduct) {
            await supabaseService.deleteProduto(selectedProduct.id);
            addLog(`Produto "${selectedProduct.name}" foi excluído.`);
            handleCloseModals();
            loadProducts();
        }
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
        addLog(`Filtro '${name}' alterado para '${value}'.`);
    };

    const filteredProducts = useMemo(() => {
        return products.filter(p => {
            const searchMatch = searchTerm === '' ||
                p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (p.description && p.description.toLowerCase().includes(searchTerm.toLowerCase()));
            
            const typeMatch = filters.type === 'todos' || p.type === filters.type;
            const categoryMatch = filters.category === 'todas' || p.category === filters.category;

            return searchMatch && typeMatch && categoryMatch;
        });
    }, [products, searchTerm, filters]);
    
    const uniqueCategories = useMemo(() => ['todas', ...new Set(products.map(p => p.category))], [products]);

    return (
        <>
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-white">Produtos e Serviços</h2>
                    <p className="text-gray-400 mt-1">Visualize e gerencie seu catálogo.</p>
                </div>
                <div className="flex items-center justify-end space-x-2 w-full sm:w-auto">
                    <div className="relative flex-grow sm:flex-grow-0">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400"><SearchIcon className="w-5 h-5"/></span>
                        <input type="search" name="productSearch" placeholder="Buscar por nome ou descrição..." className="w-full sm:w-64 bg-gray-800 text-white rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" onChange={(e) => setSearchTerm(e.target.value)} data-dev-id="ProdutosPage-search-input" />
                    </div>
                     <button name="addProduct" onClick={handleOpenAddModal} className="flex items-center justify-center px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-500 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-blue-500" data-dev-id="ProdutosPage-add-button"><PlusIcon className="w-4 h-4 mr-2" />Adicionar</button>
                </div>
            </header>
            
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4 p-4 bg-gray-800/50 rounded-lg border border-gray-700/50">
                <div className="flex items-center gap-4 flex-wrap">
                    <div>
                        <label htmlFor="type" className="text-sm font-medium text-gray-400 mr-2">Tipo:</label>
                        <select id="type" name="type" value={filters.type} onChange={handleFilterChange} className="bg-gray-700 text-white rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 custom-select text-sm" data-dev-id="ProdutosPage-type-filter">
                            <option value="todos">Todos</option>
                            <option value="Produto">Produtos</option>
                            <option value="Serviço">Serviços</option>
                        </select>
                    </div>
                     <div>
                        <label htmlFor="category" className="text-sm font-medium text-gray-400 mr-2">Categoria:</label>
                        <select id="category" name="category" value={filters.category} onChange={handleFilterChange} className="bg-gray-700 text-white rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 custom-select text-sm" data-dev-id="ProdutosPage-category-filter">
                           {uniqueCategories.map(cat => <option key={cat} value={cat}>{cat === 'todas' ? 'Todas' : cat}</option>)}
                        </select>
                    </div>
                </div>
                 <div className="flex items-center bg-gray-700 rounded-lg p-1">
                    <button name="viewModeGrid" onClick={() => setViewMode('grid')} className={`p-1.5 rounded-md ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`} aria-label="Visualização em Grade" data-dev-id="ProdutosPage-viewmode-grid">
                        <GridIcon className="w-5 h-5"/>
                    </button>
                    <button name="viewModeList" onClick={() => setViewMode('list')} className={`p-1.5 rounded-md ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`} aria-label="Visualização em Lista" data-dev-id="ProdutosPage-viewmode-list">
                        <ListIcon className="w-5 h-5"/>
                    </button>
                </div>
            </div>

            {loading ? ( <ProductCardSkeleton /> ) : 
             error ? ( <div className="p-8 text-center text-red-400">{error}</div> ) : 
             filteredProducts.length > 0 ? (
                viewMode === 'grid' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredProducts.map(product => (
                            <ProductCard key={product.id} product={product} onEdit={handleOpenEditModal} onDelete={handleOpenDeleteModal} />
                        ))}
                    </div>
                ) : (
                    <div className="bg-gray-800 rounded-xl shadow-lg overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left text-gray-300">
                                <thead className="text-xs text-gray-400 uppercase bg-gray-800 border-b border-gray-700">
                                    <tr>
                                        <th scope="col" className="px-6 py-4">Produto</th>
                                        <th scope="col" className="px-6 py-4 hidden md:table-cell">Tipo</th>
                                        <th scope="col" className="px-6 py-4 hidden sm:table-cell">Preço</th>
                                        <th scope="col" className="px-6 py-4 hidden lg:table-cell">Estoque</th>
                                        <th scope="col" className="px-6 py-4 text-right">Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredProducts.map(product => (
                                        <ProductListItem key={product.id} product={product} onEdit={handleOpenEditModal} onDelete={handleOpenDeleteModal} />
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )
             ) : (
                 <div className="p-8 text-center text-gray-400 bg-gray-800 rounded-lg">
                    {products.length > 0 ? `Nenhum item encontrado com os filtros aplicados.` : 'Nenhum produto ou serviço cadastrado. Adicione um para começar.'}
                </div>
             )}
            
            {isFormModalOpen && <ProductFormModal isOpen={isFormModalOpen} onClose={handleCloseModals} onSave={handleSaveProduct} product={selectedProduct} addLog={addLog} isSaving={isSaving} />}
            <DeleteConfirmationModal isOpen={isDeleteModalOpen} onClose={handleCloseModals} onConfirm={handleConfirmDelete} bodyText={`Tem certeza que deseja excluir o item "${selectedProduct?.name}"? Esta ação não pode ser desfeita.`} />
        </>
    );
};