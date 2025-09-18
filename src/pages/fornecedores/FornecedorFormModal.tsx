import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Modal } from '../../components/Modal';
import { InputField } from '../../components/Generic';
import { MapPicker } from '../../components/MapPicker';
import { SpinnerIcon, SearchIcon } from '../../components/Icons';
import { capitalizeWords, maskDocument, maskPhone, maskZip, debounce } from '../../utils/helpers';
import { fetchAddressFromCep, fetchCompanyDataFromCnpj, geocodeAddress, reverseGeocode } from '../../services/api';
import { supabaseService } from '../../services/storage';

export const FornecedorFormModal = ({ isOpen, onClose, onSave, fornecedor, addLog, isSaving }) => {
    const initialFormState = { 
        customerType: 'PJ', document: '', legalName: '', tradeName: '', contactName: '', 
        email: '', phone: '', whatsapp: '', status: 'Ativo', 
        address: { street: '', number: '', neighborhood: '', region: '', city: '', state: '', zip: '' }, 
        location: { lat: -23.55052, lng: -46.633308 },
        is_client: false,
        is_supplier: true, // Default for supplier form
    };
    const [formData, setFormData] = useState(initialFormState);
    const [isLoading, setIsLoading] = useState({ cep: false, document: false, geo: false });
    const [error, setError] = useState({ cep: '', document: '', geo: '' });
    const [regioes, setRegioes] = useState([]);
    const [mapRefetchKey, setMapRefetchKey] = useState(0);

    const handleGetAddressFromCoords = useCallback(async (lat, lng, source) => {
        addLog(`Buscando endereço para [${lat.toFixed(4)}, ${lng.toFixed(4)}] via ${source}.`);
        setIsLoading(p => ({ ...p, geo: true }));
        setError(p => ({ ...p, geo: '' }));
        
        setFormData(prev => ({ ...prev, location: { lat, lng } }));
    
        try {
            const addressData = await reverseGeocode(lat, lng);
            setFormData(prev => ({ ...prev, address: { ...prev.address, ...addressData } }));
            addLog(`Endereço preenchido via ${source}: ${addressData.street}, ${addressData.city}`);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            addLog(`ERRO (Busca de endereço via ${source}): ${errorMessage}`);
            setError(p => ({ ...p, geo: "Não foi possível buscar o endereço para o local selecionado." }));
        } finally {
            setIsLoading(p => ({ ...p, geo: false }));
        }
    }, [addLog]);

    const handleRecenterMap = useCallback(() => {
        addLog('Tentando obter geolocalização do navegador...');
        if (navigator.geolocation) {
            setIsLoading(p => ({ ...p, geo: true }));
            setError(p => ({ ...p, geo: '' }));
            
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    handleGetAddressFromCoords(latitude, longitude, 'GPS');
                    setMapRefetchKey(k => k + 1);
                },
                (err) => {
                    const errorMessage = err.message;
                    addLog(`ERRO (Geolocalização): ${errorMessage}`);
                    setError(p => ({ ...p, geo: 'Falha ao obter localização. Verifique as permissões do navegador.' }));
                    setIsLoading(p => ({ ...p, geo: false }));
                },
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
            );
        } else {
            addLog("Geolocalização não é suportada por este navegador.");
            setError(p => ({ ...p, geo: 'Geolocalização não é suportada neste navegador.' }));
        }
    }, [addLog, handleGetAddressFromCoords]);

    useEffect(() => {
        if (!isOpen) return;
        
        supabaseService.getRegioes().then(setRegioes);
        setError({ cep: '', document: '', geo: '' });

        if (fornecedor) {
            const location = fornecedor.location && typeof fornecedor.location.lat === 'number' ? fornecedor.location : initialFormState.location;
            const dataForForm = {
                ...fornecedor,
                customerType: fornecedor.customer_type,
                legalName: fornecedor.legal_name,
                tradeName: fornecedor.trade_name,
                contactName: fornecedor.contact_name,
                is_client: fornecedor.is_client ?? false,
                is_supplier: fornecedor.is_supplier ?? true,
            };
            setFormData({ ...initialFormState, ...dataForForm, address: { ...initialFormState.address, ...fornecedor.address }, location });
            addLog(`Carregando dados para editar fornecedor: ${fornecedor.legal_name}`);
            setMapRefetchKey(k => k + 1);
        } else {
            setFormData(initialFormState);
            if (sessionStorage.getItem('initialLocationFetched') !== 'true') {
                handleRecenterMap();
                sessionStorage.setItem('initialLocationFetched', 'true');
            }
        }
    }, [fornecedor, isOpen, addLog, handleRecenterMap]);
    
    useEffect(() => {
        if (!isOpen) return;
        setFormData(prev => ({ ...prev, tradeName: prev.customerType === 'PJ' ? prev.tradeName : '', contactName: prev.contactName || (prev.customerType === 'PJ' ? '' : prev.legalName) }));
    }, [formData.customerType, isOpen]);

    useEffect(() => {
        if (formData.address.neighborhood && regioes.length > 0) {
            const neighborhood = formData.address.neighborhood.trim().toLowerCase();
            const foundRegion = regioes.find(r => r.neighborhoods?.some(n => n && n.trim().toLowerCase() === neighborhood));
            if (foundRegion) {
                if(formData.address.region !== foundRegion.name) {
                    setFormData(prev => ({ ...prev, address: { ...prev.address, region: foundRegion.name } }));
                     addLog(`Região "${foundRegion.name}" preenchida automaticamente pelo bairro.`);
                }
            } else {
                if(formData.address.region !== '') { setFormData(prev => ({ ...prev, address: { ...prev.address, region: '' } })); }
            }
        }
    }, [formData.address.neighborhood, regioes, addLog]);
    
    const handleChange = (e) => {
        const { name, value } = e.target;
        let finalValue = ['legalName', 'tradeName', 'contactName'].includes(name) ? capitalizeWords(value) : value;
        if (name === 'document') { finalValue = maskDocument(value); setError(p => ({ ...p, document: '' })); }
        if (name === 'phone' || name === 'whatsapp') finalValue = maskPhone(value);
        setFormData(p => ({ ...p, [name]: finalValue }));
    };

    const handleSwitchChange = (name, value) => {
        setFormData(p => ({ ...p, [name]: value }));
        addLog(`Campo '${name}' alterado para: ${value}`);
    };

    const handleCepLookup = useCallback(async (cep) => {
        setIsLoading(p => ({...p, cep: true})); setError(p => ({...p, cep: ''}));
        try {
            const newAddressData = await fetchAddressFromCep(cep);
            setFormData(p => ({ ...p, address: { ...p.address, ...newAddressData } }));
            const addressQuery = `${newAddressData.street}, ${newAddressData.city}, ${newAddressData.state}`;
            const newLocation = await geocodeAddress(addressQuery);
            if (newLocation) {
                setFormData(p => ({ ...p, location: newLocation }));
                setMapRefetchKey(k => k + 1);
            }
        } catch (err) { setError(p => ({...p, cep: err.message})); } 
        finally { setIsLoading(p => ({...p, cep: false})); }
    }, []);

    const debouncedCepLookup = useMemo(() => debounce(handleCepLookup, 500), [handleCepLookup]);

    const handleAddressChange = (e) => {
        const { name, value } = e.target;
        if (name === 'zip') {
            setError(p => ({ ...p, cep: '' }));
            const finalValue = maskZip(value);
            setFormData(p => ({ ...p, address: { ...p.address, zip: finalValue } }));
            const cleanedCep = finalValue.replace(/\D/g, '');
            if (cleanedCep.length === 8) debouncedCepLookup(cleanedCep);
        } else {
             const finalValue = ['street', 'neighborhood', 'city'].includes(name) ? capitalizeWords(value) : (name === 'state' ? value.toUpperCase().slice(0, 2) : value);
             setFormData(p => ({ ...p, address: { ...p.address, [name]: finalValue } }));
        }
    };

    const handleDocumentLookup = async () => {
        const cleanedCnpj = formData.document.replace(/\D/g, '');
        if (cleanedCnpj.length !== 14) { setError(p => ({ ...p, document: 'Busca disponível apenas para CNPJ válido.' })); return; }
        setIsLoading(p => ({ ...p, document: true })); setError(p => ({ ...p, document: '' }));
        try {
            const data = await fetchCompanyDataFromCnpj(cleanedCnpj);
            const addressQuery = `${data.address.street}, ${data.address.number}, ${data.address.city}, ${data.address.state}`;
            const newLocation = await geocodeAddress(addressQuery);
            setFormData(p => {
                const updates: { [key: string]: any } = { legalName: data.legalName, tradeName: data.tradeName, address: { ...p.address, ...data.address }, ...(newLocation && { location: newLocation }) };
                if (data.contactName) updates.contactName = data.contactName;
                if (data.phone) updates.phone = data.phone;
                if (data.email) updates.email = data.email;
                return { ...p, ...updates };
            });
            if (newLocation) setMapRefetchKey(k => k + 1);
        } catch (err) { setError(p => ({ ...p, document: err.message })); } 
        finally { setIsLoading(p => ({ ...p, document: false })); }
    };

    const handleLocationChangeFromMarkerDrag = useCallback((newLocation) => {
        handleGetAddressFromCoords(newLocation.lat, newLocation.lng, 'arraste do marcador');
    }, [handleGetAddressFromCoords]);

    const handlePoiSelected = useCallback(async (poiDetails) => {
        addLog(`Preenchendo formulário com dados de: ${poiDetails.legalName}`);
        setFormData(prev => ({ ...prev, legalName: poiDetails.legalName, tradeName: poiDetails.tradeName, address: { ...prev.address, ...poiDetails.address }, location: poiDetails.location, customerType: 'PJ' }));
        setMapRefetchKey(k => k + 1);
    }, [addLog]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (isSaving) return;

        if (!formData.is_client && !formData.is_supplier) {
            alert('A entidade deve ser marcada como Cliente e/ou Fornecedor.');
            return;
        }

        const { legalName, customerType, contactName, tradeName, ...rest } = formData;
        const dataToSave = {
            id: fornecedor?.id,
            legal_name: legalName,
            customer_type: customerType,
            contact_name: customerType === 'PF' ? legalName : contactName,
            trade_name: tradeName,
            ...rest,
        };
        addLog(`Tentativa de salvar fornecedor: ${dataToSave.legal_name}`);
        onSave(dataToSave);
    };
    
    const preventSubmitOnEnter = (e: React.KeyboardEvent<HTMLFormElement>) => {
        if (e.key === 'Enter' && (e.target as HTMLElement).tagName.toLowerCase() === 'input') {
            e.preventDefault();
        }
    };

    const isPJ = formData.customerType === 'PJ';

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={fornecedor ? 'Editar Fornecedor' : 'Adicionar Fornecedor'} maxWidth="max-w-5xl" closeOnBackdropClick={false} closeOnEscape={false} showCloseButton={false}>
            <form onSubmit={handleSubmit} onKeyDown={preventSubmitOnEnter} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-10">
                    <div className="lg:col-span-2 space-y-8">
                         <fieldset>
                            <legend className="flex justify-between items-center w-full text-lg font-semibold text-white mb-4 pb-3 border-b border-gray-700">
                                <span>Identificação</span>
                                <div className="flex items-center space-x-4">
                                    <label className="flex items-center space-x-2 text-sm font-normal text-gray-300 cursor-pointer">
                                        <input 
                                            type="checkbox" 
                                            name="is_client" 
                                            checked={formData.is_client} 
                                            onChange={() => handleSwitchChange('is_client', !formData.is_client)} 
                                            className="form-checkbox h-4 w-4 bg-gray-600 border-gray-500 rounded text-blue-500 focus:ring-blue-500"
                                        />
                                        <span>Cliente</span>
                                    </label>
                                    <label className="flex items-center space-x-2 text-sm font-normal text-gray-300 cursor-pointer">
                                        <input 
                                            type="checkbox" 
                                            name="is_supplier" 
                                            checked={formData.is_supplier} 
                                            onChange={() => handleSwitchChange('is_supplier', !formData.is_supplier)} 
                                            className="form-checkbox h-4 w-4 bg-gray-600 border-gray-500 rounded text-blue-500 focus:ring-blue-500"
                                        />
                                        <span>Fornecedor</span>
                                    </label>
                                </div>
                            </legend>
                            <div className="space-y-6">
                            <div className="flex items-center space-x-6">
                                <label className="flex items-center space-x-2 text-white cursor-pointer"><input type="radio" name="customerType" value="PJ" checked={isPJ} onChange={handleChange} className="form-radio bg-gray-700 text-blue-500 border-gray-600 focus:ring-blue-500" /><span>Pessoa Jurídica</span></label>
                                <label className="flex items-center space-x-2 text-white cursor-pointer"><input type="radio" name="customerType" value="PF" checked={!isPJ} onChange={handleChange} className="form-radio bg-gray-700 text-blue-500 border-gray-600 focus:ring-blue-500" /><span>Pessoa Física</span></label>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-6">
                                <div>
                                    <label htmlFor="document" className="block text-sm font-medium text-gray-300 mb-1">{isPJ ? 'CNPJ' : 'CPF'}</label>
                                    <div className="flex space-x-2"><input type="text" name="document" id="document" value={formData.document} onChange={handleChange} onFocus={e => e.target.select()} className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder={isPJ ? 'XX.XXX.XXX/XXXX-XX' : 'XXX.XXX.XXX-XX'} inputMode="numeric" />{isPJ && <button type="button" name="documentLookup" onClick={handleDocumentLookup} disabled={isLoading.document} className="px-3 py-2 text-sm font-semibold text-white bg-gray-600 rounded-lg hover:bg-gray-500 transition-colors disabled:opacity-50 flex items-center">{isLoading.document ? <SpinnerIcon className="w-5 h-5"/> : <SearchIcon className="w-6 h-6"/>}</button>}</div>
                                    {error.document && <p className="text-red-400 text-xs mt-1">{error.document}</p>}
                                </div>
                                <InputField label={isPJ ? "Razão Social" : "Nome Completo"} id="legalName" name="legalName" value={formData.legalName} onChange={handleChange} />
                                {isPJ && <InputField label="Nome Fantasia" id="tradeName" name="tradeName" value={formData.tradeName} onChange={handleChange} />}
                                <InputField label="Nome do Contato" id="contactName" name="contactName" value={formData.contactName} onChange={handleChange} required />
                                <InputField label="Email" id="email" name="email" type="email" value={formData.email} onChange={handleChange} />
                                <InputField label="Telefone" id="phone" name="phone" type="tel" value={formData.phone} onChange={handleChange} placeholder="(XX) XXXXX-XXXX" />
                                <InputField label="WhatsApp" id="whatsapp" name="whatsapp" type="tel" value={formData.whatsapp} onChange={handleChange} placeholder="(XX) XXXXX-XXXX" />
                            </div>
                        </div></fieldset>
                         <fieldset><legend className="text-lg font-semibold text-white mb-4 pb-3 border-b border-gray-700">Endereço</legend><div className="grid grid-cols-1 md:grid-cols-6 gap-x-4 gap-y-6">
                            <div className="md:col-span-2"><label htmlFor="zip" className="block text-sm font-medium text-gray-300 mb-1">CEP</label><div className="relative"><input type="text" name="zip" id="zip" value={formData.address.zip} onChange={handleAddressChange} onFocus={e => e.target.select()} inputMode="numeric" className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10" placeholder="XXXXX-XXX" />{isLoading.cep && (<div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none"><SpinnerIcon className="w-5 h-5 text-gray-400" /></div>)}</div>{error.cep && <p className="text-red-400 text-xs mt-1">{error.cep}</p>}</div>
                            <div className="md:col-span-4"><InputField label="Rua / Logradouro" id="street" name="street" value={formData.address.street} onChange={handleAddressChange} /></div>
                            <div className="md:col-span-1"><InputField label="Nº" id="number" name="number" value={formData.address.number} onChange={handleAddressChange} inputMode="numeric" /></div>
                            <div className="md:col-span-3"><InputField label="Bairro" id="neighborhood" name="neighborhood" value={formData.address.neighborhood} onChange={handleAddressChange} /></div>
                            <div className="md:col-span-2"><InputField label="Região" id="region" name="region" value={formData.address.region || ''} onChange={() => {}} placeholder="Automático" disabled /></div>
                            <div className="md:col-span-4"><InputField label="Cidade" id="city" name="city" value={formData.address.city} onChange={handleAddressChange} /></div>
                            <div className="md:col-span-2"><InputField label="UF" id="state" name="state" value={formData.address.state} onChange={handleAddressChange} placeholder="SP" /></div>
                        </div></fieldset>
                    </div>
                    <div className="lg:col-span-1 space-y-8">
                        <fieldset><legend className="text-lg font-semibold text-white mb-4 pb-3 border-b border-gray-700">Status</legend><div className="flex rounded-lg bg-gray-700 p-1"><button type="button" name="statusAtivo" onClick={() => setFormData(p => ({...p, status: 'Ativo'}))} className={`flex-1 py-1.5 text-sm font-semibold rounded-md transition-colors ${formData.status === 'Ativo' ? 'bg-green-500 text-white' : 'text-gray-300 hover:bg-gray-600'}`}>Ativo</button><button type="button" name="statusInativo" onClick={() => setFormData(p => ({...p, status: 'Inativo'}))} className={`flex-1 py-1.5 text-sm font-semibold rounded-md transition-colors ${formData.status === 'Inativo' ? 'bg-red-500 text-white' : 'text-gray-300 hover:bg-gray-600'}`}>Inativo</button></div></fieldset>
                        <fieldset>
                            <legend className="text-lg font-semibold text-white mb-4 pb-3 border-b border-gray-700">Localização</legend>
                            <p className="text-xs text-gray-400 mb-2 -mt-2">Use o mapa para buscar ou ajustar a localização.</p>
                            <MapPicker lat={formData.location.lat} lng={formData.location.lng} onLocationChange={handleLocationChangeFromMarkerDrag} onRecenter={handleRecenterMap} address={formData.address} isLoading={isLoading.geo} isOpen={isOpen} onPoiSelect={handlePoiSelected} refetchKey={mapRefetchKey} />
                            <div className="flex items-center space-x-4 mt-2"><p className="text-xs text-gray-400">Lat: {formData.location.lat.toFixed(6)}</p><p className="text-xs text-gray-400">Lng: {formData.location.lng.toFixed(6)}</p>{error.geo && <p className="text-red-400 text-xs">{error.geo}</p>}</div>
                        </fieldset>
                    </div>
                </div>
                <div className="flex justify-end space-x-3 pt-6 border-t border-gray-700">
                    <button type="button" name="formCancel" onClick={onClose} className="px-5 py-2 text-sm font-semibold text-gray-300 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors">Cancelar</button>
                    <button type="submit" name="formSave" disabled={isSaving} className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-500 transition-colors flex items-center justify-center w-40 disabled:bg-blue-800 disabled:cursor-not-allowed">
                        {isSaving ? <SpinnerIcon className="w-5 h-5" /> : 'Salvar Fornecedor'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};