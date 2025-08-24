import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import { Modal } from '../../components/Modal';
import { InputField } from '../../components/Generic';
import { SpinnerIcon, SparklesIcon } from '../../components/Icons';
import { backend } from '../../services/storage';
import { capitalizeWords } from '../../utils/helpers';

export const ProductFormModal = ({ isOpen, onClose, onSave, product, addLog }) => {
    const initialFormState = { type: 'Produto', name: '', category: '', description: '', price: '', stock: '' };
    const [formData, setFormData] = useState(initialFormState);
    const [categories, setCategories] = useState({ produtos: [], servicos: [] });
    const [isCorrecting, setIsCorrecting] = useState(false);
    
    useEffect(() => {
        if (isOpen) {
            const loadedCategories = backend.getCategories();
            setCategories(loadedCategories);
            addLog("Categorias de produto carregadas.");

            if (product) {
                const productDataForForm = {
                    id: product.id,
                    type: product.type,
                    name: product.name,
                    category: product.category,
                    description: product.description,
                    price: String(product.price).replace('.',','),
                    stock: String(product.stock ?? ''),
                };
                setFormData({ ...initialFormState, ...productDataForForm });
                addLog(`Carregando dados para editar produto: ${product.name}`);
            } else {
                setFormData(initialFormState);
                addLog('Abrindo formulário para novo produto/serviço.');
            }
        }
    }, [product, isOpen, addLog]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        
        let finalValue = value;
        if (name === 'type') {
            addLog(`Tipo alterado para: "${finalValue}".`);
            setFormData(p => ({
                ...p,
                type: finalValue,
                category: '', // Reset category on type change
                stock: finalValue === 'Serviço' ? '' : p.stock,
            }));
            addLog('Categoria reiniciada. Estoque ajustado se necessário.');
            return; // Exit early to avoid double state set
        } else if (name === 'price') {
             finalValue = value.replace(/[^0-9,]/g, '');
        } else if (name === 'stock') {
             finalValue = value.replace(/\D/g, '');
        } else if (name === 'name') {
            finalValue = capitalizeWords(value);
        }

        setFormData(p => ({ ...p, [name]: finalValue }));
        addLog(`Campo '${name}' alterado para: "${finalValue}"`);
    };

    const handleCorrectDescription = async () => {
        if (!formData.description) return;
        setIsCorrecting(true);
        addLog('Iniciando correção ortográfica com IA...');
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const prompt = `Corrija a ortografia e a gramática do seguinte texto, mantendo o sentido original. Retorne apenas o texto corrigido, sem nenhuma introdução ou formatação adicional: "${formData.description}"`;
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
            });

            const correctedText = response.text.trim();
            setFormData(p => ({...p, description: correctedText}));
            addLog('Texto corrigido pela IA.');
        } catch(err) {
            console.error("Gemini Error:", err);
            const errorMessage = err.message || 'Ocorreu um erro desconhecido.';
            addLog(`ERRO (IA): ${errorMessage}`);
            alert(`Ocorreu um erro ao usar a IA: ${errorMessage}`);
        } finally {
            setIsCorrecting(false);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const priceNumber = parseFloat(formData.price.replace(',', '.')) || 0;
        const stockNumber = formData.type === 'Produto' ? (parseInt(formData.stock, 10) || 0) : null;
        
        const dataToSave = {
            id: product?.id,
            type: formData.type,
            name: formData.name,
            category: formData.category,
            description: formData.description,
            price: priceNumber,
            stock: stockNumber,
        };
        addLog(`Tentativa de salvar produto: ${dataToSave.name}`);
        onSave(dataToSave);
    };

    const isService = formData.type === 'Serviço';
    const currentCategories = isService ? categories.servicos : categories.produtos;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={product ? 'Editar Produto/Serviço' : 'Adicionar Produto/Serviço'} maxWidth="max-w-2xl">
            <form onSubmit={handleSubmit} className="space-y-6">
                 <div>
                    <span className="block text-sm font-medium text-gray-300 mb-2">Tipo</span>
                    <div className="flex rounded-lg bg-gray-700 p-1">
                        <button type="button" onClick={() => handleChange({ target: { name: 'type', value: 'Produto'} })} className={`flex-1 py-1.5 text-sm font-semibold rounded-md transition-colors ${!isService ? 'bg-blue-500 text-white' : 'text-gray-300 hover:bg-gray-600'}`}>Produto</button>
                        <button type="button" onClick={() => handleChange({ target: { name: 'type', value: 'Serviço'} })} className={`flex-1 py-1.5 text-sm font-semibold rounded-md transition-colors ${isService ? 'bg-purple-500 text-white' : 'text-gray-300 hover:bg-gray-600'}`}>Serviço</button>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InputField label="Nome" id="name" name="name" value={formData.name} onChange={handleChange} required />
                    <div>
                        <label htmlFor="category" className="block text-sm font-medium text-gray-300 mb-1">Categoria<span className="text-red-400 ml-1">*</span></label>
                        <select id="category" name="category" value={formData.category} onChange={handleChange} required className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 custom-select">
                            <option value="" disabled>Selecione</option>
                            {currentCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                    </div>
                </div>
                <div>
                     <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-1">Descrição</label>
                     <div className="relative">
                        <textarea id="description" name="description" value={formData.description} onChange={handleChange} rows={4} className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"></textarea>
                        <button type="button" onClick={handleCorrectDescription} disabled={isCorrecting} className="absolute bottom-2 right-2 p-1.5 text-gray-300 bg-gray-600/50 rounded-full hover:bg-gray-500 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed" aria-label="Corrigir texto com IA">
                           {isCorrecting ? <SpinnerIcon className="w-4 h-4" /> : <SparklesIcon className="w-4 h-4" />}
                        </button>
                     </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InputField label="Preço (R$)" id="price" name="price" value={formData.price} onChange={handleChange} required placeholder="Ex: 99,90"/>
                    <InputField label="Estoque" id="stock" name="stock" type="number" value={formData.stock} onChange={handleChange} disabled={isService} />
                </div>
                 <div className="flex justify-end space-x-3 pt-6 border-t border-gray-700">
                    <button type="button" onClick={onClose} className="px-5 py-2 text-sm font-semibold text-gray-300 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors">Cancelar</button>
                    <button type="submit" className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-500 transition-colors">Salvar</button>
                </div>
            </form>
        </Modal>
    );
};