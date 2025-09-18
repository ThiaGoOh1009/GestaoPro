import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Modal } from '../../components/Modal';
import { SpinnerIcon } from '../../components/Icons';
import { geocodeAddress } from '../../services/api';
import { REGIOES_FOZ } from './regioes-foz';

const mapStyles = [
    { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
    { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
    { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
    { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
    { featureType: "poi", stylers: [{ visibility: "off" }] },
    { featureType: "road", elementType: "geometry", stylers: [{ color: "#38414e" }] },
    { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#212a37" }] },
    { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#9ca5b3" }] },
    { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#746855" }] },
    { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#1f2835" }] },
    { featureType: "road.highway", elementType: "labels.text.fill", stylers: [{ color: "#f3d19c" }] },
    { featureType: "transit", stylers: [{ visibility: "off" }] },
    { featureType: "water", elementType: "geometry", stylers: [{ color: "#17263c" }] },
    { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#515c6d" }] },
    { featureType: "water", elementType: "labels.text.stroke", stylers: [{ color: "#17263c" }] },
];

export const MapAssignmentModal = ({ isOpen, onClose, onConfirm, neighborhoodData, regioes, addLog }) => {
    const mapContainerRef = useRef(null);
    const mapRef = useRef(null);
    const markerRef = useRef(null);
    const polygonRefs = useRef({});

    const [selectedRegionId, setSelectedRegionId] = useState('');
    const [loading, setLoading] = useState(true);

    const initMap = useCallback(() => {
        if (mapContainerRef.current && !mapRef.current) {
            const map = new window.google.maps.Map(mapContainerRef.current, {
                center: { lat: -25.5165, lng: -54.5555 },
                zoom: 12,
                styles: mapStyles,
                disableDefaultUI: true,
                zoomControl: true,
            });
            mapRef.current = map;
        }
    }, []);

    useEffect(() => {
        if (isOpen) {
            setLoading(true);
            setSelectedRegionId('');
            initMap();
            
            // Geocode and center map
            const locateAddress = async () => {
                const map = mapRef.current;
                if (!map || !neighborhoodData) {
                    setLoading(false);
                    return;
                }

                try {
                    let addressString = '';
                    // FIX: Handle cases where reference_address might be null or incomplete
                    if (neighborhoodData.reference_address && neighborhoodData.reference_address.street) {
                        addressString = [
                            neighborhoodData.reference_address.street,
                            neighborhoodData.reference_address.number,
                            neighborhoodData.reference_address.neighborhood,
                            neighborhoodData.reference_address.city,
                            neighborhoodData.reference_address.state,
                        ].filter(Boolean).join(', ');
                    }

                    // Fallback to neighborhood name if address string is empty
                    if (!addressString.trim()) {
                        addressString = `${neighborhoodData.name}, Foz do Iguaçu, Brasil`;
                        addLog(`Endereço de referência para "${neighborhoodData.name}" ausente ou vazio. Usando nome do bairro para geolocalização.`);
                    }

                    const location = await geocodeAddress(addressString);
                    if (location) {
                        map.setCenter(location);
                        map.setZoom(16);

                        if (markerRef.current) markerRef.current.setMap(null);
                        
                        const markerContent = document.createElement('div');
                        markerContent.innerHTML = `<div class="relative flex justify-center items-center"><div class="w-6 h-6 bg-yellow-400 rounded-full shadow-lg border-2 border-white"></div><div class="absolute w-6 h-6 bg-yellow-400 rounded-full pulse-animate"></div></div>`;
                        
                        markerRef.current = new window.google.maps.marker.AdvancedMarkerElement({
                            position: location,
                            map: map,
                            content: markerContent
                        });
                        addLog(`Endereço de referência para "${neighborhoodData.name}" localizado.`);
                    } else {
                        throw new Error('Endereço não encontrado.');
                    }
                } catch (err) {
                    addLog(`Erro ao localizar endereço: ${err.message}`);
                } finally {
                    setLoading(false);
                }
            };
            
            // Delay to allow map to initialize after modal opens
            setTimeout(locateAddress, 300);
        }
    }, [isOpen, neighborhoodData, initMap, addLog]);

    // Draw polygons effect
    useEffect(() => {
        const map = mapRef.current;
        if (!isOpen || !map) return;

        // Clear existing polygons
        Object.values(polygonRefs.current).forEach(p => (p as any).setMap(null));
        polygonRefs.current = {};

        REGIOES_FOZ.forEach((regiaoData) => {
            const dbRegiao = regioes.find(r => r.name === regiaoData.name);
            if (!dbRegiao) return;

            const isSelected = String(dbRegiao.id) === selectedRegionId;
            const polygon = new window.google.maps.Polygon({
                paths: regiaoData.path,
                strokeColor: '#FFFFFF',
                strokeOpacity: isSelected ? 0.9 : 0.6,
                strokeWeight: isSelected ? 2 : 1,
                fillColor: regiaoData.color,
                fillOpacity: isSelected ? 0.7 : 0.35,
            });
            polygon.setMap(map);
            polygonRefs.current[dbRegiao.id] = polygon;
        });
    }, [isOpen, regioes, selectedRegionId]);

    const handleConfirm = () => {
        if (!selectedRegionId) {
            alert("Por favor, selecione uma região.");
            return;
        }
        onConfirm(neighborhoodData.name, selectedRegionId);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Mapear Bairro: ${neighborhoodData?.name || ''}`} maxWidth="max-w-4xl" closeOnBackdropClick={false}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 space-y-4">
                    <div>
                        <h3 className="text-lg font-semibold text-white">1. Selecione a Região</h3>
                        <p className="text-sm text-gray-400 mb-2">Escolha a região correta para este bairro. O polígono será destacado no mapa.</p>
                        <select value={selectedRegionId} onChange={(e) => setSelectedRegionId(e.target.value)} className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 custom-select">
                            <option value="" disabled>Selecione uma região...</option>
                            {regioes.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                        </select>
                    </div>
                     <div>
                        <h3 className="text-lg font-semibold text-white mt-6">2. Confirme</h3>
                        <p className="text-sm text-gray-400 mb-2">Após selecionar a região, confirme para salvar a associação.</p>
                    </div>
                </div>
                <div className="lg:col-span-2 relative h-96 lg:h-auto lg:min-h-[400px] w-full rounded-lg bg-gray-800 overflow-hidden">
                    <div ref={mapContainerRef} className="h-full w-full"></div>
                    {loading && (
                        <div className="absolute inset-0 bg-gray-900/60 flex flex-col justify-center items-center">
                            <SpinnerIcon className="w-8 h-8 text-white" />
                            <span className="text-white mt-3 text-sm">Localizando endereço...</span>
                        </div>
                    )}
                </div>
            </div>
             <div className="flex justify-end space-x-3 pt-6 mt-6 border-t border-gray-700">
                <button type="button" onClick={onClose} className="px-5 py-2 text-sm font-semibold text-gray-300 bg-gray-700 rounded-lg hover:bg-gray-600">Cancelar</button>
                <button type="button" onClick={handleConfirm} disabled={!selectedRegionId} className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-500 disabled:opacity-50">Confirmar Mapeamento</button>
            </div>
        </Modal>
    );
};
