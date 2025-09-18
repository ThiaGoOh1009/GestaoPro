import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { supabaseService } from '../../services/storage';
import { PlusIcon, Edit2Icon, Trash2Icon, MapPinIcon, SpinnerIcon, ClipboardIcon } from '../../components/Icons';
import { RegiaoFormModal } from './RegiaoFormModal';
import { DeleteConfirmationModal } from '../../components/Modal';
import { REGIOES_FOZ } from './regioes-foz';
import { MarketPointFormModal } from './MarketPointFormModal';

// Dark theme for Google Maps
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

const EditableCoords = ({ regiao, pendingChange, onSaveCoords, isSaving, onCoordsChange }) => {
    const [coords, setCoords] = useState({ lat: '', lng: '' });
    const [isDirty, setIsDirty] = useState(false);

    useEffect(() => {
        const initialCoords = pendingChange || regiao.center_coords || REGIOES_FOZ.find(r => r.name === regiao.name)?.center || { lat: 0, lng: 0 };
        setCoords({
            lat: String(initialCoords.lat || 0),
            lng: String(initialCoords.lng || 0)
        });
        setIsDirty(!!pendingChange);
    }, [regiao, pendingChange]);

    const handleCoordChange = (e) => {
        const { name, value } = e.target;
        const newCoords = { ...coords, [name]: value };
        setCoords(newCoords);
        setIsDirty(true);
        onCoordsChange({
            lat: parseFloat(newCoords.lat) || 0,
            lng: parseFloat(newCoords.lng) || 0
        });
    };

    const handleSave = () => {
        onSaveCoords(regiao.id, {
            lat: parseFloat(coords.lat) || 0,
            lng: parseFloat(coords.lng) || 0
        });
    };

    return (
        <div className="space-y-2 text-xs">
             <div className="flex items-center gap-2">
                <label htmlFor={`lat-${regiao.id}`} className="w-12 text-gray-400 flex-shrink-0">Latitude:</label>
                <input id={`lat-${regiao.id}`} type="number" step="any" name="lat" value={coords.lat} onChange={handleCoordChange} className="flex-grow bg-gray-900 text-gray-300 rounded px-2 py-1 border border-gray-700 focus:outline-none font-mono focus:ring-1 focus:ring-blue-500" />
            </div>
            <div className="flex items-center gap-2">
                <label htmlFor={`lng-${regiao.id}`} className="w-12 text-gray-400 flex-shrink-0">Longitude:</label>
                <input id={`lng-${regiao.id}`} type="number" step="any" name="lng" value={coords.lng} onChange={handleCoordChange} className="flex-grow bg-gray-900 text-gray-300 rounded px-2 py-1 border border-gray-700 focus:outline-none font-mono focus:ring-1 focus:ring-blue-500" />
            </div>
            {isDirty && (
                <div className="flex justify-end pt-2">
                    <button onClick={handleSave} disabled={isSaving} className="px-3 py-1 text-xs font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-500 disabled:opacity-50">
                        {isSaving ? <SpinnerIcon className="w-4 h-4" /> : 'Salvar'}
                    </button>
                </div>
            )}
        </div>
    );
};


const RegionDetails = ({ regiao, marketPoints, onEdit, onDelete, onAddMarketPoint, onEditMarketPoint, onDeleteMarketPoint, onSaveCoords, isSavingCoords, pendingChange, onCoordsChange }) => {
    const filteredMarketPoints = useMemo(() => {
        if (!regiao) return [];
        return marketPoints.filter(mp => mp.regiao_id === regiao.id);
    }, [regiao, marketPoints]);

    return (
        <div className="p-2 animate-fadeIn">
            {!regiao.isStatic && (
                <div className="flex items-center justify-end space-x-2 mb-2">
                    <button name={`editRegiao-${regiao.id}`} onClick={() => onEdit(regiao)} className="p-2 rounded-full hover:bg-gray-700 text-blue-400 hover:text-blue-300"><Edit2Icon className="w-5 h-5" /></button>
                    <button name={`deleteRegiao-${regiao.id}`} onClick={() => onDelete(regiao)} className="p-2 rounded-full hover:bg-gray-700 text-red-500 hover:text-red-400"><Trash2Icon className="w-5 h-5" /></button>
                </div>
            )}
            
            <h4 className="text-sm font-semibold text-gray-300 mb-2 mt-2 pt-2 border-t border-gray-700">Coordenada Central:</h4>
            <EditableCoords regiao={regiao} pendingChange={pendingChange} onSaveCoords={onSaveCoords} isSaving={isSavingCoords} onCoordsChange={onCoordsChange} />

            <h4 className="text-sm font-semibold text-gray-300 mb-2 mt-4 pt-2 border-t border-gray-700">Bairros:</h4>
            <div className="flex flex-wrap gap-2">{regiao.neighborhoods?.length > 0 ? regiao.neighborhoods.sort((a, b) => a.localeCompare(b)).map(b => (<span key={b} className="px-2.5 py-1 text-xs font-medium rounded-full bg-gray-700 text-gray-300">{b}</span>)) : (<p className="text-sm text-gray-500 italic">Nenhum bairro.</p>)}</div>

            <div className="mt-4 pt-4 border-t border-gray-700">
                <div className="flex justify-between items-center mb-2">
                    <h4 className="text-sm font-semibold text-gray-300">Pontos de Referência:</h4>
                    <button onClick={onAddMarketPoint} className="flex items-center text-xs px-2 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-md transition-colors"><PlusIcon className="w-4 h-4 mr-1" /> Adicionar</button>
                </div>
                <ul className="space-y-2">{filteredMarketPoints.length > 0 ? filteredMarketPoints.map(mp => (<li key={mp.id} className="flex justify-between items-center bg-gray-700/50 p-2 rounded-lg"><div className="text-gray-300 text-sm"><p className="font-medium">{mp.name}</p><p className="text-xs text-gray-400">{mp.neighborhood_name}</p></div><div className="flex items-center"><button onClick={() => onEditMarketPoint(mp)} className="p-2 rounded-full text-blue-400 hover:text-blue-300"><Edit2Icon className="w-4 h-4" /></button><button onClick={() => onDeleteMarketPoint(mp)} className="p-2 rounded-full text-red-400 hover:text-red-300"><Trash2Icon className="w-4 h-4" /></button></div></li>)) : <p className="text-sm text-gray-500 italic">Nenhum ponto.</p>}</ul>
            </div>
        </div>
    );
};


export const RegioesPage = ({ addLog }) => {
    const [regioes, setRegioes] = useState<any[]>([]);
    const [marketPoints, setMarketPoints] = useState([]);
    const [clients, setClients] = useState([]);
    const [pendingNeighborhoodNames, setPendingNeighborhoodNames] = useState(new Set<string>());
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isAddMode, setIsAddMode] = useState(false);
    
    const [selectedRegiao, setSelectedRegiao] = useState(null);
    const [pendingCoordChanges, setPendingCoordChanges] = useState<{ [key: number]: { lat: number; lng: number } }>({});
    
    const mapRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const marketPointMarkersRef = useRef({});
    const regionCenterMarkersRef = useRef({});
    const [openAccordion, setOpenAccordion] = useState<number | null>(null);

    const [isFormModalOpen, setFormModalOpen] = useState(false);
    const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
    const [isMarketPointModalOpen, setIsMarketPointModalOpen] = useState(false);
    const [selectedMarketPoint, setSelectedMarketPoint] = useState(null);
    const [isSavingCoords, setIsSavingCoords] = useState(false);
    const [initialDataForModal, setInitialDataForModal] = useState(null);
    
    const loadData = useCallback(async (showLoading = true) => {
        if (showLoading) setLoading(true);
        setError(null);
        try {
            await supabaseService.syncFozRegions();
            addLog('Sincronização das regiões de Foz do Iguaçu concluída.');
            
            const [regioesData, marketPointsData, clientsData] = await Promise.all([
                supabaseService.getRegioes(),
                supabaseService.getMarketPoints(),
                supabaseService.getClientes(),
            ]);
            setRegioes(regioesData.sort((a, b) => a.name.localeCompare(b.name)));
            setMarketPoints(marketPointsData);
            setClients(clientsData);
            addLog(`${regioesData.length} regiões, ${marketPointsData.length} pontos e ${clientsData.length} clientes carregados.`);
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            setError(message);
            addLog(`ERRO ao carregar dados de regiões: ${message}`);
        } finally {
            if (showLoading) setLoading(false);
        }
    }, [addLog]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    useEffect(() => {
        if (clients.length > 0) {
            const pendingNames = new Set<string>();
            clients.forEach(client => {
                if (!client.address?.region && client.address?.neighborhood) {
                    pendingNames.add(client.address.neighborhood);
                }
            });
            setPendingNeighborhoodNames(pendingNames);
            if (pendingNames.size > 0) {
                 addLog(`${pendingNames.size} bairros com clientes pendentes de região foram identificados.`);
            }
        }
    }, [clients, addLog]);
    
    const initMap = useCallback(() => {
        if (mapRef.current && !mapInstanceRef.current) {
            const map = new window.google.maps.Map(mapRef.current, {
                center: { lat: -25.5165, lng: -54.5555 }, // Foz do Iguaçu
                zoom: 12,
                styles: mapStyles,
                disableDefaultUI: true,
                zoomControl: true,
                mapId: 'GESTPRO_REGIOES_MAP',
            });
            mapInstanceRef.current = map;
        }
    }, []);

    useEffect(() => {
        initMap();
    }, [initMap]);
    
    const regionColorMap = useMemo(() => new Map(REGIOES_FOZ.map(r => [r.name, r.color])), []);

    const handleRegionSelect = (regiao) => {
        const newSelectedId = openAccordion === regiao.id ? null : regiao.id;
        setOpenAccordion(newSelectedId);
        setSelectedRegiao(newSelectedId ? regiao : null);

        const map = mapInstanceRef.current;
        const coords = pendingCoordChanges[regiao.id] || regiao.center_coords || REGIOES_FOZ.find(r => r.name === regiao.name)?.center;
        
        if (map && coords) {
            map.panTo(coords);
            map.setZoom(13);
        }
    };

    useEffect(() => {
        const map = mapInstanceRef.current;
        if (!map) return;

        Object.values(marketPointMarkersRef.current).forEach((marker: any) => marker.setMap(null));
        marketPointMarkersRef.current = {};
        Object.values(regionCenterMarkersRef.current).forEach((marker: any) => marker.setMap(null));
        regionCenterMarkersRef.current = {};

        regioes.forEach(regiao => {
            const pending = pendingCoordChanges[regiao.id];
            const coords = pending || regiao.center_coords || REGIOES_FOZ.find(r => r.name === regiao.name)?.center;
            if (!coords || !coords.lat || !coords.lng) return;
    
            const color = regionColorMap.get(regiao.name) || '#718096';
            const isSelected = selectedRegiao?.id === regiao.id;
    
            const markerContent = document.createElement('div');
            markerContent.style.position = 'relative';
            markerContent.style.display = 'flex';
            markerContent.style.justifyContent = 'center';
            markerContent.style.alignItems = 'center';
            markerContent.style.transition = 'transform 0.2s ease-in-out';
            if (isSelected) {
                markerContent.style.transform = 'scale(1.2)';
                markerContent.style.zIndex = '1000';
            }
    
            const shortName = regiao.name.split('–')[0]?.trim() || 'R';
    
            markerContent.innerHTML = `
                <svg width="40" height="48" viewBox="0 0 40 48" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 4px 6px rgba(0,0,0,0.4));">
                    <path d="M20 0C8.95431 0 0 8.95431 0 20C0 24.4183 1.66667 28.4183 4.33333 31.6667L20 48L35.6667 31.6667C38.3333 28.4183 40 24.4183 40 20C40 8.95431 31.0457 0 20 0Z" fill="${color}"/>
                </svg>
                <span style="position: absolute; top: 10px; color: white; font-size: 14px; font-weight: bold; text-shadow: 0 1px 2px rgba(0,0,0,0.5);">${shortName}</span>
            `;
    
            const marker = new window.google.maps.marker.AdvancedMarkerElement({
                position: coords,
                map: map,
                content: markerContent,
                title: regiao.name,
                zIndex: isSelected ? 200 : 20,
                gmpDraggable: true,
            });
    
            marker.addListener('click', () => {
                handleRegionSelect(regiao);
            });
            
            marker.addListener('dragend', (event) => {
                const newPos = event.latLng;
                if(newPos) {
                    const newCoords = { lat: newPos.lat(), lng: newPos.lng() };
                    setPendingCoordChanges(prev => ({ ...prev, [regiao.id]: newCoords }));
                    if (openAccordion !== regiao.id) {
                        handleRegionSelect(regiao);
                    }
                }
            });
    
            regionCenterMarkersRef.current[regiao.id] = marker;
        });

        marketPoints.forEach(point => {
            const markerContent = document.createElement('div');
            markerContent.className = 'relative flex justify-center items-center';
            
            const isSelected = selectedRegiao && point.regiao_id === selectedRegiao.id;
            const regionOfPoint = regioes.find(r => r.id === point.regiao_id);
            const color = regionOfPoint ? (regionColorMap.get(regionOfPoint.name) || '#A0AEC0') : '#A0AEC0';
            
            let dotHTML = '';
            if (isSelected) {
                dotHTML = `<div style="width: 1rem; height: 1rem; background-color: ${color}; border: 2px solid white; border-radius: 50%; box-shadow: 0 0 8px ${color}; z-index: 20; position: relative;"></div>`;
            } else {
                dotHTML = `<div class="marker-dot" style="width: 0.75rem; height: 0.75rem; border-width: 1px; opacity: 0.8; z-index: 10; position: relative;"></div>`;
            }
            markerContent.innerHTML = dotHTML;
    
            if (pendingNeighborhoodNames.has(point.neighborhood_name)) {
                const halo = document.createElement('div');
                halo.className = 'marker-halo';
                halo.style.backgroundColor = color;
                markerContent.appendChild(halo);
            }
            
            const marker = new window.google.maps.marker.AdvancedMarkerElement({
                position: point.location,
                map: map,
                title: `${point.name} (${point.neighborhood_name})`,
                content: markerContent,
                zIndex: isSelected ? 100 : 1
            });
            marker.addListener('click', () => handleOpenEditMarketPointModal(point));
            marketPointMarkersRef.current[point.id] = marker;
        });
    
    }, [regioes, marketPoints, pendingNeighborhoodNames, selectedRegiao, regionColorMap, openAccordion, pendingCoordChanges]);

    useEffect(() => {
        const map = mapInstanceRef.current;
        if (!map || !isAddMode) return;

        map.setOptions({ draggableCursor: 'crosshair' });
        const listener = map.addListener('click', (e) => {
            const clickLocation = { lat: e.latLng.lat(), lng: e.latLng.lng() };
            let suggestedRegionId = null;

            for (const region of REGIOES_FOZ) {
                if (region.path && region.path.length > 0) {
                    const polygon = new window.google.maps.Polygon({ paths: region.path });
                    if (window.google.maps.geometry.poly.containsLocation(clickLocation, polygon)) {
                        const dbRegiao = regioes.find(r => r.name === region.name);
                        if (dbRegiao) {
                            suggestedRegionId = dbRegiao.id;
                            break;
                        }
                    }
                }
            }
            addLog(`Clique no mapa para adicionar bairro. Região sugerida ID: ${suggestedRegionId || 'Nenhuma'}.`);
            setInitialDataForModal({ location: clickLocation, regiao_id: suggestedRegionId });
            setIsMarketPointModalOpen(true);
            setIsAddMode(false);
        });
        
        return () => {
            map.setOptions({ draggableCursor: null });
            window.google.maps.event.removeListener(listener);
        };

    }, [isAddMode, regioes, addLog]);


    const handleOpenAddModal = () => { setSelectedRegiao(null); setFormModalOpen(true); };
    const handleOpenEditModal = (r) => { setSelectedRegiao(r); setFormModalOpen(true); };
    const handleOpenDeleteModal = (r) => { setSelectedRegiao(r); setDeleteModalOpen(true); };
    const handleOpenAddMarketPointModal = (region) => { setSelectedRegiao(region); setSelectedMarketPoint(null); setInitialDataForModal(null); setIsMarketPointModalOpen(true); };
    const handleOpenEditMarketPointModal = (mp) => { setSelectedRegiao(regioes.find(r => r.id === mp.regiao_id)); setSelectedMarketPoint(mp); setInitialDataForModal(null); setIsMarketPointModalOpen(true); };
    const handleOpenDeleteMarketPointModal = (mp) => { setSelectedMarketPoint(mp); setDeleteModalOpen(true); };
    
    const handleCloseModals = () => {
        setFormModalOpen(false);
        setDeleteModalOpen(false);
        setIsMarketPointModalOpen(false);
        setInitialDataForModal(null);
    };

    const handleSaveRegiao = async (regiaoData) => {
        setIsSavingCoords(true);
        try {
            await supabaseService.saveRegiao(regiaoData);
            addLog(`Região "${regiaoData.name}" foi salva.`);
            handleCloseModals();
            loadData(false);
        } catch (err) { addLog(`ERRO ao salvar região: ${err.message}`); alert(`Erro: ${err.message}`);
        } finally { setIsSavingCoords(false); }
    };

    const handleSaveCoords = async (regiaoId, newCoords) => {
        setIsSavingCoords(true);
        try {
            await supabaseService.saveRegiao({ id: regiaoId, center_coords: newCoords });
            addLog(`Coordenadas para a região ID ${regiaoId} salvas.`);
            setPendingCoordChanges(prev => {
                const next = { ...prev };
                delete next[regiaoId];
                return next;
            });
            await loadData(false);
        } catch (err) {
            let detailedMessage = 'Ocorreu um erro desconhecido.';
            if (err instanceof Error) { detailedMessage = err.message; }
            else if (typeof err === 'object' && err !== null) { detailedMessage = (err as any).message || JSON.stringify(err, null, 2); }
            else { detailedMessage = String(err); }
            addLog(`ERRO ao salvar coordenadas: ${detailedMessage}`);

            let alertMessage = `Erro ao salvar coordenadas.`;
            if (detailedMessage.includes("RLS") || detailedMessage.includes("security")) {
                alertMessage += " Verifique as políticas de segurança (RLS) da tabela 'regioes' no Supabase para a operação de UPDATE.";
            } else {
                alertMessage += " Verifique o console do navegador para mais detalhes.";
            }
            alert(alertMessage);
            console.error("Erro detalhado ao salvar coordenadas:", err);
        } finally {
            setIsSavingCoords(false);
        }
    };

    const handleConfirmDelete = async () => {
        if (selectedRegiao && !selectedMarketPoint) {
            await supabaseService.deleteRegiao(selectedRegiao.id);
            addLog(`Região "${selectedRegiao.name}" excluída.`);
            setSelectedRegiao(null);
        } else if (selectedMarketPoint) {
            await supabaseService.deleteMarketPoint(selectedMarketPoint.id);
            addLog(`Ponto de referência "${selectedMarketPoint.name}" excluído.`);
        }
        setSelectedMarketPoint(null);
        handleCloseModals();
        loadData(false);
    };

    const handleSaveMarketPoint = async (pointData) => {
        setIsSavingCoords(true);
        try {
            await supabaseService.saveMarketPoint(pointData);
            addLog(`Ponto de referência "${pointData.name}" foi salvo.`);
            handleCloseModals();
            loadData(false);
        } catch(err) { addLog(`ERRO ao salvar ponto: ${err.message}`); alert(`Erro: ${err.message}`);
        } finally { setIsSavingCoords(false); }
    };
    
    return (
        <>
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
                <div>
                    <h2 className="text-3xl font-bold text-white">Regiões e Bairros</h2>
                    <p className="text-gray-400 mt-1">Gerencie as áreas de atendimento e seus pontos de referência.</p>
                </div>
                <div className="flex items-center gap-4 mt-4 sm:mt-0">
                    <button onClick={() => setIsAddMode(true)} disabled={isAddMode} className="flex items-center px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                        <MapPinIcon className="w-5 h-5 mr-2"/>
                        {isAddMode ? 'Clique no Mapa...' : 'Adicionar Bairro ao Mapa'}
                    </button>
                </div>
            </header>

            <div className="flex flex-col lg:flex-row gap-6 h-[75vh]">
                <aside className="w-full lg:w-1/3 xl:w-1/4 bg-gray-800 rounded-xl shadow-lg flex flex-col p-4">
                    <div className="flex-grow overflow-y-auto pr-2 sidebar-scroll">
                        <h3 className="text-xl font-bold text-white mb-4 px-2">Regiões de Atendimento</h3>
                        {regioes.map(regiao => {
                            const color = regionColorMap.get(regiao.name) || '#718096';
                            return (
                            <div key={regiao.id} className="bg-gray-900/50 rounded-lg mb-2">
                                <button onClick={() => handleRegionSelect(regiao)} className="w-full flex justify-between items-center text-left font-semibold text-white p-4">
                                     <div className="flex items-center gap-3"><span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: color }}></span><span>{regiao.name}</span></div>
                                    <ChevronRightIcon className={`w-5 h-5 transition-transform ${openAccordion === regiao.id ? 'rotate-90' : ''}`} />
                                </button>
                                {openAccordion === regiao.id && (
                                    <div className="p-2 border-t border-gray-700">
                                        <RegionDetails 
                                            regiao={regiao} 
                                            marketPoints={marketPoints} 
                                            onEdit={handleOpenEditModal} 
                                            onDelete={handleOpenDeleteModal} 
                                            onAddMarketPoint={() => handleOpenAddMarketPointModal(regiao)} 
                                            onEditMarketPoint={handleOpenEditMarketPointModal} 
                                            onDeleteMarketPoint={handleOpenDeleteMarketPointModal} 
                                            onSaveCoords={handleSaveCoords} 
                                            isSavingCoords={isSavingCoords}
                                            pendingChange={pendingCoordChanges[regiao.id]}
                                            onCoordsChange={(newCoords) => setPendingCoordChanges(prev => ({...prev, [regiao.id]: newCoords}))}
                                        />
                                    </div>
                                )}
                            </div>
                        )})}
                    </div>
                </aside>
                <main className="w-full lg:w-2/3 xl:w-3/4 bg-gray-800 rounded-xl shadow-lg overflow-hidden relative">
                    {error ? <div className="p-8 text-center text-red-400">{error}</div> : <div ref={mapRef} className="h-full w-full"></div>}
                    {loading && <div className="absolute inset-0 bg-gray-900/50 flex justify-center items-center"><SpinnerIcon className="w-8 h-8"/></div>}
                </main>
            </div>

            {isFormModalOpen && <RegiaoFormModal isOpen={isFormModalOpen} onClose={handleCloseModals} onSave={handleSaveRegiao} regiao={selectedRegiao} isSaving={isSavingCoords} />}
            {isMarketPointModalOpen && <MarketPointFormModal isOpen={isMarketPointModalOpen} onClose={handleCloseModals} onSave={handleSaveMarketPoint} marketPoint={selectedMarketPoint} regiao={selectedRegiao} isSaving={isSavingCoords} addLog={addLog} initialData={initialDataForModal} />}
            <DeleteConfirmationModal isOpen={isDeleteModalOpen} onClose={handleCloseModals} onConfirm={handleConfirmDelete} bodyText={`Tem certeza que deseja excluir "${selectedMarketPoint?.name || selectedRegiao?.name}"? Esta ação não pode ser desfeita.`} />
        </>
    );
};

const ChevronRightIcon = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m9 18 6-6-6-6" /></svg>;