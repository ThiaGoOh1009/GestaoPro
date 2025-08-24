import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Modal } from '../../components/Modal';
import { InputField } from '../../components/Generic';
import { MapPicker } from '../../components/MapPicker';
import { SpinnerIcon, SearchIcon } from '../../components/Icons';
import { capitalizeWords, maskDocument, maskPhone, maskZip, debounce } from '../../utils/helpers';
import { fetchAddressFromCep, fetchCompanyDataFromCnpj, geocodeAddress, reverseGeocode } from '../../services/api';
import { backend } from '../../services/storage';

export const ClientFormModal = ({ isOpen, onClose, onSave, client, fieldSettings = { email: false, phone: false }, addLog }) => {
    const initialFormState = { customerType: 'PJ', document: '', legalName: '', tradeName: '', contactName: '', email: '', phone: '', status: 'Ativo', address: { street: '', number: '', neighborhood: '', region: '', city: '', state: '', zip: '' }, location: { lat: -23.55052, lng: -46.633308 } };
    const [formData, setFormData] = useState(initialFormState);
    const [isLoading, setIsLoading] = useState({ cep: false, document: false, geo: false });
    const [error, setError] = useState({ cep: '', document: '', geo: '' });
    const [regioes, setRegioes] = useState([]);

    const handleGetAddressFromCoords = useCallback(async (lat, lng, source) => {
        addLog(`Buscando endereço para [${lat.toFixed(4)}, ${lng.toFixed(4)}] via ${source}.`);
        setIsLoading(p => ({ ...p, geo: true }));
        setError(p => ({ ...p, geo: '' }));
        
        // Update location immediately for map responsiveness
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
        
        backend.getRegioes().then(setRegioes);

        setError({ cep: '', document: '', geo: '' });

        if (client) {
            const clientLocation = client.location && typeof client.location.lat === 'number' ? client.location : initialFormState.location;
            setFormData({ ...initialFormState, ...client, address: { ...initialFormState.address, ...client.address }, location: clientLocation });
            addLog(`Carregando dados para editar cliente: ${client.legalName}`);
        } else {
            setFormData(initialFormState);
            handleRecenterMap(); // On new client, try to get location
        }
    }, [client, isOpen, addLog, handleRecenterMap]);
    
    useEffect(() => {
        if (!isOpen) return;
        setFormData(prev => ({ ...prev, tradeName: prev.customerType === 'PJ' ? prev.tradeName : '', contactName: prev.contactName || (prev.customerType === 'PJ' ? '' : prev.legalName) }));
    }, [formData.customerType, isOpen]);

    useEffect(() => {
        if (formData.address.neighborhood && regioes.length > 0) {
            const neighborhood = formData.address.neighborhood.trim().toLowerCase();
            const foundRegion = regioes.find(r => 
                r.neighborhoods.some(n => n.trim().toLowerCase() === neighborhood)
            );
            if (foundRegion) {
                if(formData.address.region !== foundRegion.name) {
                    setFormData(prev => ({
                        ...prev,
                        address: { ...prev.address, region: foundRegion.name }
                    }));
                     addLog(`Região "${foundRegion.name}" preenchida automaticamente pelo bairro.`);
                }
            } else {
                if(formData.address.region !== '') {
                    setFormData(prev => ({
                        ...prev,
                        address: { ...prev.address, region: '' }
                    }));
                }
            }
        }
    }, [formData.address.neighborhood, regioes, addLog]);
    
    const handleChange = (e) => {
        const { name, value } = e.target;
        let finalValue = ['legalName', 'tradeName', 'contactName'].includes(name) ? capitalizeWords(value) : value;
        if (name === 'document') { finalValue = maskDocument(value); setError(p => ({ ...p, document: '' })); }
        if (name === 'phone') finalValue = maskPhone(value);
        setFormData(p => ({ ...p, [name]: finalValue }));
        addLog(`Campo '${name}' alterado para: "${finalValue}"`);
    };

    const handleCepLookup = useCallback(async (cep) => {
        addLog(`Iniciando busca por CEP: ${cep}`);
        setIsLoading(p => ({...p, cep: true})); setError(p => ({...p, cep: ''}));
        try {
            const newAddressData = await fetchAddressFromCep(cep);
            setFormData(p => ({ ...p, address: { ...p.address, ...newAddressData } }));
            addLog(`CEP encontrado. Endereço preenchido: ${newAddressData.street}`);

            const addressQuery = `${newAddressData.street}, ${newAddressData.city}, ${newAddressData.state}`;
            const newLocation = await geocodeAddress(addressQuery);
            if (newLocation) {
                setFormData(p => ({ ...p, location: newLocation }));
                addLog(`Geolocalização do CEP encontrada.`);
            }
        } catch (err) { 
            setError(p => ({...p, cep: err.message})); 
            addLog(`ERRO (CEP): ${err.message}`);
        } finally { setIsLoading(p => ({...p, cep: false})); }
    }, [addLog]);

    const debouncedCepLookup = useMemo(() => debounce(handleCepLookup, 500), [handleCepLookup]);

    const handleAddressChange = (e) => {
        const { name, value } = e.target;
        
        if (name === 'zip') {
            setError(p => ({ ...p, cep: '' }));
            const finalValue = maskZip(value);
            setFormData(p => ({ ...p, address: { ...p.address, zip: finalValue } }));
            addLog(`Endereço: campo 'zip' alterado para: "${finalValue}"`);

            const cleanedCep = finalValue.replace(/\D/g, '');
            if (cleanedCep.length === 8) {
                addLog(`CEP completo, iniciando busca em 500ms...`);
                debouncedCepLookup(cleanedCep);
            }
        } else {
             const finalValue = ['street', 'neighborhood', 'city'].includes(name) ? capitalizeWords(value) : (name === 'state' ? value.toUpperCase().slice(0, 2) : value);
             setFormData(p => ({ ...p, address: { ...p.address, [name]: finalValue } }));
             addLog(`Endereço: campo '${name}' alterado para: "${finalValue}"`);
        }
    };

    const handleDocumentLookup = async () => {
        const cleanedCnpj = formData.document.replace(/\D/g, '');
        if (cleanedCnpj.length !== 14) { setError(p => ({ ...p, document: 'Busca disponível apenas para CNPJ válido.' })); return; }
        addLog(`Iniciando busca por CNPJ: ${cleanedCnpj}`);
        setIsLoading(p => ({ ...p, document: true })); setError(p => ({ ...p, document: '' }));
        try {
            const data = await fetchCompanyDataFromCnpj(cleanedCnpj);
            const addressQuery = `${data.address.street}, ${data.address.number}, ${data.address.city}, ${data.address.state}`;
            const newLocation = await geocodeAddress(addressQuery);
            
            setFormData(p => {
                const updates: { [key: string]: any } = {
                    legalName: data.legalName,
                    tradeName: data.tradeName,
                    address: { ...p.address, ...data.address },
                    ...(newLocation && { location: newLocation })
                };
                if (data.contactName) updates.contactName = data.contactName;
                if (data.phone) updates.phone = data.phone;
                if (data.email) updates.email = data.email;

                return { ...p, ...updates };
            });

            addLog(`CNPJ encontrado. Dados preenchidos para: ${data.legalName}`);
        } catch (err) { 
            setError(p => ({ ...p, document: err.message }));
            addLog(`ERRO (CNPJ): ${err.message}`);
        } finally { setIsLoading(p => ({ ...p, document: false })); }
    };

    const handleLocationChangeFromMarkerDrag = useCallback((newLocation) => {
        handleGetAddressFromCoords(newLocation.lat, newLocation.lng, 'arraste do marcador');
    }, [handleGetAddressFromCoords]);

    const handleAddressSearchFromMap = useCallback(async (addressQuery) => {
        addLog(`Buscando localização para: "${addressQuery}"`);
        setIsLoading(p => ({...p, geo: true}));
        setError(p => ({...p, geo: ''}));
        try {
            const newLocation = await geocodeAddress(addressQuery);
            if (newLocation) {
                handleGetAddressFromCoords(newLocation.lat, newLocation.lng, 'busca de endereço');
            } else {
                 throw new Error("Endereço não encontrado.");
            }
        } catch (err) { 
            const errorMessage = err instanceof Error ? err.message : String(err);
            setError(p => ({...p, geo: errorMessage})); 
            addLog(`ERRO (Busca de Endereço): ${errorMessage}`);
            setIsLoading(p => ({...p, geo: false}));
        }
    }, [addLog, handleGetAddressFromCoords]);


    const handleSubmit = (e) => { 
        e.preventDefault(); 
        const dataToSave = { id: client?.id, ...formData, contactName: formData.customerType === 'PF' ? formData.legalName : formData.contactName };
        addLog(`Tentativa de salvar cliente: ${dataToSave.legalName}`);
        onSave(dataToSave);
    };
    
    const isPJ = formData.customerType === 'PJ';

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={client ? 'Editar Cliente' : 'Adicionar Cliente'} maxWidth="max-w-5xl">
            <form onSubmit={handleSubmit} className="space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-x-8 gap-y-10">
                    <div className="lg:col-span-2 space-y-8">
                        <fieldset><legend className="text-lg font-semibold text-white mb-4 pb-3 border-b border-gray-700">Identificação</legend><div className="space-y-6">
                            <div className="flex items-center space-x-6">
                                <label className="flex items-center space-x-2 text-white cursor-pointer"><input type="radio" name="customerType" value="PJ" checked={isPJ} onChange={handleChange} className="form-radio bg-gray-700 text-blue-500 border-gray-600 focus:ring-blue-500" /><span>Pessoa Jurídica</span></label>
                                <label className="flex items-center space-x-2 text-white cursor-pointer"><input type="radio" name="customerType" value="PF" checked={!isPJ} onChange={handleChange} className="form-radio bg-gray-700 text-blue-500 border-gray-600 focus:ring-blue-500" /><span>Pessoa Física</span></label>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-6">
                                <div>
                                    <label htmlFor="document" className="block text-sm font-medium text-gray-300 mb-1">{isPJ ? 'CNPJ' : 'CPF'}</label>
                                    <div className="flex space-x-2"><input type="text" name="document" id="document" value={formData.document} onChange={handleChange} className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder={isPJ ? 'XX.XXX.XXX/XXXX-XX' : 'XXX.XXX.XXX-XX'} />{isPJ && <button type="button" onClick={handleDocumentLookup} disabled={isLoading.document} className="px-3 py-2 text-sm font-semibold text-white bg-gray-600 rounded-lg hover:bg-gray-500 transition-colors disabled:opacity-50 flex items-center">{isLoading.document ? <SpinnerIcon className="w-5 h-5"/> : <SearchIcon className="w-5 h-5"/>}</button>}</div>
                                    {error.document && <p className="text-red-400 text-xs mt-1">{error.document}</p>}
                                </div>
                                <InputField label={isPJ ? "Razão Social" : "Nome Completo"} id="legalName" name="legalName" value={formData.legalName} onChange={handleChange} />
                                {isPJ && <InputField label="Nome Fantasia" id="tradeName" name="tradeName" value={formData.tradeName} onChange={handleChange} />}
                                <InputField label="Nome do Contato" id="contactName" name="contactName" value={formData.contactName} onChange={handleChange} required />
                                <InputField label="Email" id="email" name="email" type="email" value={formData.email} onChange={handleChange} required={fieldSettings.email} />
                                <InputField label="Telefone" id="phone" name="phone" type="tel" value={formData.phone} onChange={handleChange} required={fieldSettings.phone} placeholder="(XX) XXXXX-XXXX" />
                            </div>
                        </div></fieldset>
                         <fieldset><legend className="text-lg font-semibold text-white mb-4 pb-3 border-b border-gray-700">Endereço</legend><div className="grid grid-cols-1 md:grid-cols-6 gap-x-4 gap-y-6">
                            <div className="md:col-span-2"><label htmlFor="zip" className="block text-sm font-medium text-gray-300 mb-1">CEP</label><div className="relative"><input type="text" name="zip" id="zip" value={formData.address.zip} onChange={handleAddressChange} className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10" placeholder="XXXXX-XXX" />{isLoading.cep && (<div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none"><SpinnerIcon className="w-5 h-5 text-gray-400" /></div>)}</div>{error.cep && <p className="text-red-400 text-xs mt-1">{error.cep}</p>}</div>
                            <div className="md:col-span-4"><InputField label="Rua / Logradouro" id="street" name="street" value={formData.address.street} onChange={handleAddressChange} /></div>
                            <div className="md:col-span-1"><InputField label="Nº" id="number" name="number" value={formData.address.number} onChange={handleAddressChange} /></div>
                            <div className="md:col-span-3"><InputField label="Bairro" id="neighborhood" name="neighborhood" value={formData.address.neighborhood} onChange={handleAddressChange} /></div>
                            <div className="md:col-span-2"><InputField label="Região" id="region" name="region" value={formData.address.region || ''} onChange={() => {}} placeholder="Automático" disabled /></div>
                            <div className="md:col-span-4"><InputField label="Cidade" id="city" name="city" value={formData.address.city} onChange={handleAddressChange} /></div>
                            <div className="md:col-span-2"><InputField label="UF" id="state" name="state" value={formData.address.state} onChange={handleAddressChange} placeholder="SP" /></div>
                        </div></fieldset>
                    </div>
                    <div className="lg:col-span-1 space-y-8">
                        <fieldset><legend className="text-lg font-semibold text-white mb-4 pb-3 border-b border-gray-700">Status</legend><div className="flex rounded-lg bg-gray-700 p-1"><button type="button" onClick={() => setFormData(p => ({...p, status: 'Ativo'}))} className={`flex-1 py-1.5 text-sm font-semibold rounded-md transition-colors ${formData.status === 'Ativo' ? 'bg-green-500 text-white' : 'text-gray-300 hover:bg-gray-600'}`}>Ativo</button><button type="button" onClick={() => setFormData(p => ({...p, status: 'Inativo'}))} className={`flex-1 py-1.5 text-sm font-semibold rounded-md transition-colors ${formData.status === 'Inativo' ? 'bg-red-500 text-white' : 'text-gray-300 hover:bg-gray-600'}`}>Inativo</button></div></fieldset>
                        <fieldset>
                            <legend className="text-lg font-semibold text-white mb-4 pb-3 border-b border-gray-700">
                                Localização
                            </legend>
                            <p className="text-xs text-gray-400 mb-2 -mt-2">Use o mapa para buscar ou ajustar a localização.</p>
                            <MapPicker 
                                lat={formData.location.lat} 
                                lng={formData.location.lng} 
                                onLocationChange={handleLocationChangeFromMarkerDrag}
                                onRecenter={handleRecenterMap}
                                onAddressSearch={handleAddressSearchFromMap}
                                address={formData.address}
                                isLoading={isLoading.geo} 
                            />
                            <div className="flex items-center space-x-4 mt-2"><p className="text-xs text-gray-400">Lat: {formData.location.lat.toFixed(6)}</p><p className="text-xs text-gray-400">Lng: {formData.location.lng.toFixed(6)}</p>{error.geo && <p className="text-red-400 text-xs">{error.geo}</p>}</div>
                        </fieldset>
                    </div>
                </div>
                <div className="flex justify-end space-x-3 pt-6 border-t border-gray-700"><button type="button" onClick={onClose} className="px-5 py-2 text-sm font-semibold text-gray-300 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors">Cancelar</button><button type="submit" className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-500 transition-colors">Salvar Cliente</button></div>
            </form>
        </Modal>
    );
};