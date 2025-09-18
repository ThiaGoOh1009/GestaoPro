import React, { useState, useEffect } from 'react';
import { supabaseService } from '../../services/storage';
import { InputField } from '../../components/Generic';
import { SpinnerIcon, AlertCircleIcon, CheckCircle2Icon } from '../../components/Icons';
import { maskDocument, maskPhone } from '../../utils/helpers';

export const EmpresaPage = ({ addLog }) => {
    const [formData, setFormData] = useState({
        name: '',
        cnpj: '',
        address: '',
        phone: '',
        email: '',
        logo_url: ''
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        const loadProfile = async () => {
            setLoading(true);
            setError('');
            try {
                const profile = await supabaseService.getCompanyProfile();
                if (profile) {
                    setFormData({
                        name: profile.name || '',
                        cnpj: profile.cnpj || '',
                        address: profile.address || '',
                        phone: profile.phone || '',
                        email: profile.email || '',
                        logo_url: profile.logo_url || ''
                    });
                }
                addLog('Dados da empresa carregados.');
            } catch (err) {
                const message = err instanceof Error ? err.message : String(err);
                setError(message);
                addLog(`Erro ao carregar dados da empresa: ${message}`);
            } finally {
                setLoading(false);
            }
        };
        loadProfile();
    }, [addLog]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        let finalValue = value;
        if (name === 'cnpj') {
            finalValue = maskDocument(value);
        } else if (name === 'phone') {
            finalValue = maskPhone(value);
        }
        setFormData(prev => ({ ...prev, [name]: finalValue }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        setSuccess('');
        try {
            await supabaseService.saveCompanyProfile(formData);
            setSuccess('Dados da empresa salvos com sucesso!');
            addLog('Dados da empresa foram salvos.');
            setTimeout(() => setSuccess(''), 3000); // Clear success message after 3 seconds
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            setError(message);
            addLog(`Erro ao salvar dados da empresa: ${message}`);
        } finally {
            setSaving(false);
        }
    };
    
    if (loading) {
        return (
            <div className="flex justify-center items-center h-full">
                <SpinnerIcon className="w-8 h-8 text-white" />
            </div>
        );
    }

    return (
        <div>
            <header className="mb-8">
                <h2 className="text-3xl font-bold text-white">Dados da Empresa</h2>
                <p className="text-gray-400 mt-1">
                    Informações que aparecerão nos documentos, como ordens de serviço.
                </p>
            </header>
            <div className="bg-gray-800 rounded-xl shadow-lg p-6 max-w-3xl mx-auto">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <InputField label="Nome da Empresa" id="name" name="name" value={formData.name} onChange={handleChange} required />
                    <InputField label="CNPJ" id="cnpj" name="cnpj" value={formData.cnpj} onChange={handleChange} required />
                    <InputField label="Endereço Completo" id="address" name="address" value={formData.address} onChange={handleChange} required placeholder="Rua, Número, Bairro, Cidade - UF, CEP" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <InputField label="Telefone" id="phone" name="phone" type="tel" value={formData.phone} onChange={handleChange} required />
                        <InputField label="Email" id="email" name="email" type="email" value={formData.email} onChange={handleChange} required />
                    </div>
                    <InputField label="URL do Logo" id="logo_url" name="logo_url" type="url" value={formData.logo_url} onChange={handleChange} placeholder="https://exemplo.com/logo.png" />

                    <div className="pt-6 border-t border-gray-700/50 flex items-center justify-end gap-4">
                        {error && (
                            <div className="flex items-center text-red-400 text-sm">
                                <AlertCircleIcon className="w-6 h-6 mr-2" />
                                <span>{error}</span>
                            </div>
                        )}
                        {success && (
                            <div className="flex items-center text-green-400 text-sm">
                                <CheckCircle2Icon className="w-6 h-6 mr-2" />
                                <span>{success}</span>
                            </div>
                        )}
                        <button type="submit" disabled={saving} className="flex items-center justify-center px-6 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-wait">
                            {saving ? <SpinnerIcon className="w-5 h-5" /> : 'Salvar Informações'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};