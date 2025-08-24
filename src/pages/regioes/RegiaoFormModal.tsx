import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/Modal';
import { InputField } from '../../components/Generic';
import { capitalizeWords } from '../../utils/helpers';

export const RegiaoFormModal = ({ isOpen, onClose, onSave, regiao }) => {
    const initialFormState = { name: '', neighborhoods: '' };
    const [formData, setFormData] = useState(initialFormState);

    useEffect(() => {
        if (isOpen) {
            if (regiao) {
                setFormData({
                    name: regiao.name,
                    neighborhoods: regiao.neighborhoods.join(', ')
                });
            } else {
                setFormData(initialFormState);
            }
        }
    }, [regiao, isOpen]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        const finalValue = name === 'name' ? capitalizeWords(value) : value;
        setFormData(p => ({ ...p, [name]: finalValue }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const neighborhoodsArray = formData.neighborhoods
            .split(',')
            .map(b => capitalizeWords(b.trim()))
            .filter(b => b); // Remove empty strings

        const dataToSave = {
            id: regiao?.id,
            name: formData.name,
            neighborhoods: neighborhoodsArray,
        };
        onSave(dataToSave);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={regiao ? 'Editar Região' : 'Adicionar Região'} maxWidth="max-w-xl">
            <form onSubmit={handleSubmit} className="space-y-6">
                <InputField
                    label="Nome da Região"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="Ex: Região Central"
                />
                <div>
                    <label htmlFor="neighborhoods" className="block text-sm font-medium text-gray-300 mb-1">
                        Bairros
                        <span className="text-red-400 ml-1">*</span>
                    </label>
                    <textarea
                        id="neighborhoods"
                        name="neighborhoods"
                        value={formData.neighborhoods}
                        onChange={handleChange}
                        required
                        rows={5}
                        className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                        placeholder="Centro, Vila Yolanda, Jardim América..."
                    />
                    <p className="text-xs text-gray-400 mt-1">Separe os nomes dos bairros por vírgula.</p>
                </div>
                <div className="flex justify-end space-x-3 pt-6 border-t border-gray-700">
                    <button type="button" onClick={onClose} className="px-5 py-2 text-sm font-semibold text-gray-300 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors">Cancelar</button>
                    <button type="submit" className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-500 transition-colors">Salvar</button>
                </div>
            </form>
        </Modal>
    );
};
