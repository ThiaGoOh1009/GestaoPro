import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Modal } from '../../components/Modal';
import { InputField } from '../../components/Generic';
import { MapPicker } from '../../components/MapPicker';
import { SpinnerIcon } from '../../components/Icons';
import { capitalizeWords, maskZip, debounce } from '../../utils/helpers';
import { fetchAddressFromCep, geocodeAddress, reverseGeocode } from '../../services/api';

export const MarketPointFormModal = ({ isOpen, onClose, onSave, marketPoint, regiao, isSaving, addLog, initialData }) => {
    const [formData, setFormData] = useState({ 
        id: null as number | null,
        name: '', 
        description: '',
        neighborhood_name: '',
        address: { street: '', number: '', neighborhood: '', city: '', state: '', zip: '' }, 
        location: { lat: -25.5165, lng: -54.5555 },
        regiao_id: null as number | null,
    });
    const [isLoading, setIsLoading] = useState({ cep: false, geo: false });
    const [error, setError] = useState({ cep: '', geo: '' });
    const [mapRefetchKey, setMapRefetchKey] = useState(0);

    const handleGetAddressFromCoords = useCallback(async (lat, lng, source) => {
        addLog(`Buscando endereço para Ponto [${lat.toFixed(4)}, ${lng.toFixed(4)}] via ${source}.`);
        setIsLoading(p => ({ ...p, geo: true }));
        setError(p => ({ ...p, geo: '' }));
        
        setFormData(prev => ({ ...prev, location: { lat, lng } }));
    
        try {
            const addressData = await reverseGeocode(lat, lng);
            const updatedAddress = { ...formData.address, ...addressData };
            const updatedNeighborhood = addressData.neighborhood || formData.neighborhood_name;

            setFormData(prev => ({ ...prev, address: updatedAddress, neighborhood_name: updatedNeighborhood }));
            
            const matchedNeighborhood = regiao?.neighborhoods.find(n => n.toLowerCase() === updatedNeighborhood.toLowerCase());
            if (matchedNeighborhood) {
                setFormData(prev => ({...prev, neighborhood_name: matchedNeighborhood}));
            }

            addLog(`Endereço preenchido: ${addressData.street}, ${addressData.city}`);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            addLog(`ERRO (Busca de endereço via ${source}): ${errorMessage}`);
            setError(p => ({ ...p, geo: "Não foi possível buscar o endereço para o local selecionado." }));
        } finally {
            setIsLoading(p => ({ ...p, geo: false }));
        }
    }, [addLog, regiao, formData.address, formData.neighborhood_name]);

    useEffect(() => {
        if (isOpen) {
            setError({ cep: '', geo: '' });

            const defaultAddress = { street: '', number: '', neighborhood: '', city: '', state: '', zip: '' };
            const defaultLocation = { lat: -25.5165, lng: -54.5555 };

            if (marketPoint) { // Editing existing point
                setFormData({
                    id: marketPoint.id,
                    name: marketPoint.name,
                    description: marketPoint.description || '',
                    neighborhood_name: marketPoint.neighborhood_name,
                    address: marketPoint.address || defaultAddress,
                    location: marketPoint.location || defaultLocation,
                    regiao_id: marketPoint.regiao_id,
                });
                addLog(`Carregando dados para editar Ponto: ${marketPoint.name}`);
                setMapRefetchKey(k => k + 1);
            } else if (initialData) { // Creating from map click
                setFormData({
                    id: null,
                    name: '',
                    description: '',
                    neighborhood_name: '',
                    address: defaultAddress,
                    location: initialData.location,
                    regiao_id: initialData.regiao_id,
                });
                // Automatically fetch address for the clicked point
                handleGetAddressFromCoords(initialData.location.lat, initialData.location.lng, 'map click');
            }
            else { // Creating from sidebar button
                setFormData({
                    id: null,
                    name: '',
                    description: '',
                    neighborhood_name: '',
                    address: defaultAddress,
                    location: regiao?.center || defaultLocation,
                    regiao_id: regiao?.id || null,
                });
            }
        }
    }, [marketPoint, initialData, isOpen, regiao, addLog, handleGetAddressFromCoords]);
    
    const handleChange = (e) => {
        const { name, value } = e.target;
        const finalValue = ['name', 'description'].includes(name) ? capitalizeWords(value) : value;
        setFormData(p => ({ ...p, [name]: finalValue }));
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
    
    const handleSubmit = (e) => {
        e.preventDefault();
        if (isSaving || !formData.regiao_id) {
            if (!formData.regiao_id) alert("A região é obrigatória. Se nenhuma foi sugerida, selecione uma manualmente.");
            return;
        }
        onSave(formData);
    };

    const preventSubmitOnEnter = (e: React.KeyboardEvent<HTMLFormElement>) => {
        if (e.key === 'Enter' && (e.target as HTMLElement).tagName.toLowerCase() !== 'textarea') {
            e.preventDefault();
        }
    };

    const modalTitle = marketPoint ? 'Editar Ponto de Referência' : 'Adicionar Bairro/Ponto de Referência';

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={modalTitle} maxWidth="max-w-3xl" closeOnBackdropClick={false}>
            <form onSubmit={handleSubmit} onKeyDown={preventSubmitOnEnter} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                    <InputField label="Nome do Bairro" id="neighborhood_name" name="neighborhood_name" value={formData.neighborhood_name} onChange={handleChange} required />
                    <InputField label="Nome / Referência Específica (Opcional)" id="name" name="name" value={formData.name} onChange={handleChange} placeholder="Ex: Posto de Saúde, Mercado" />
                    
                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-1">Descrição (Opcional)</label>
                        <textarea id="description" name="description" value={formData.description} onChange={handleChange} rows={3} className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition" />
                    </div>
                     <div className="md:col-span-2"><label htmlFor="zip" className="block text-sm font-medium text-gray-300 mb-1">CEP (para busca de endereço)</label><div className="relative"><input type="text" name="zip" id="zip" value={formData.address.zip} onChange={handleAddressChange} inputMode="numeric" className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10" placeholder="XXXXX-XXX" />{isLoading.cep && (<div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none"><SpinnerIcon className="w-5 h-5 text-gray-400" /></div>)}</div>{error.cep && <p className="text-red-400 text-xs mt-1">{error.cep}</p>}</div>
                </div>
                <div className="space-y-4">
                    <MapPicker lat={formData.location.lat} lng={formData.location.lng} onLocationChange={handleGetAddressFromCoords} onRecenter={() => {}} address={formData.address} isLoading={isLoading.geo} isOpen={isOpen} onPoiSelect={() => {}} refetchKey={mapRefetchKey} />
                     <div className="flex items-center space-x-4"><p className="text-xs text-gray-400">Lat: {formData.location.lat.toFixed(6)}</p><p className="text-xs text-gray-400">Lng: {formData.location.lng.toFixed(6)}</p>{error.geo && <p className="text-red-400 text-xs">{error.geo}</p>}</div>
                </div>

                <div className="col-span-full flex justify-end space-x-3 pt-6 border-t border-gray-700">
                    <button type="button" onClick={onClose} className="px-5 py-2 text-sm font-semibold text-gray-300 bg-gray-700 rounded-lg hover:bg-gray-600">Cancelar</button>
                    <button type="submit" disabled={isSaving} className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-500 flex items-center justify-center w-24 disabled:bg-blue-800">
                        {isSaving ? <SpinnerIcon className="w-5 h-5" /> : 'Salvar'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};