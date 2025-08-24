import React, { useEffect, useRef, useState } from 'react';
import { SpinnerIcon, SearchIcon } from './Icons';

declare var L: any;

export const MapPicker = ({ lat, lng, onLocationChange, onRecenter, onAddressSearch, address, isLoading }) => {
    const mapContainerRef = useRef(null);
    const mapRef = useRef(null);
    const markerRef = useRef(null);
    const [searchQuery, setSearchQuery] = useState('');

    const createPopupContent = (addr) => [addr.street, addr.number, addr.neighborhood, addr.city, addr.state].filter(Boolean).join(', ');

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            onAddressSearch(searchQuery);
        }
    };

    useEffect(() => {
        if (mapContainerRef.current && !mapRef.current) {
            const map = L.map(mapContainerRef.current, {
                zoomControl: false // Disable default zoom control
            }).setView([lat, lng], 13);

            L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
                subdomains: 'abcd',
                maxZoom: 20
            }).addTo(map);

            // Add custom zoom control to the bottom right
            L.control.zoom({ position: 'bottomright' }).addTo(map);

            // Custom Recenter Control
            const RecenterControl = L.Control.extend({
                onAdd: function(map) {
                    const btn = L.DomUtil.create('button', 'leaflet-bar leaflet-control leaflet-control-custom');
                    btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="22" y1="12" x2="18" y2="12"/><line x1="6" y1="12" x2="2" y2="12"/><line x1="12" y1="6" x2="12" y2="2"/><line x1="12" y1="22" x2="12" y2="18"/></svg>`;
                    btn.style.backgroundColor = '#1f2937';
                    btn.style.borderColor = '#374151';
                    btn.style.color = '#d1d5db';
                    btn.style.width = '30px';
                    btn.style.height = '30px';
                    btn.style.cursor = 'pointer';
                    btn.title = "Minha Localização";

                    L.DomEvent.on(btn, 'click', (e) => {
                        L.DomEvent.stop(e);
                        onRecenter();
                    });

                    return btn;
                }
            });
            new RecenterControl({ position: 'bottomright' }).addTo(map);


            const marker = L.marker([lat, lng], { draggable: true }).addTo(map);
            if (address && createPopupContent(address)) {
                marker.bindPopup(createPopupContent(address)).openPopup();
            }

            marker.on('dragend', (event) => {
                if (onLocationChange) {
                    onLocationChange(event.target.getLatLng());
                }
            });

            mapRef.current = map;
            markerRef.current = marker;
        }
    }, []);

    useEffect(() => {
        if (mapRef.current && markerRef.current) {
            const newLatLng = L.latLng(lat, lng);
            const currentZoom = mapRef.current.getZoom();
            mapRef.current.setView(newLatLng, currentZoom < 15 ? 16 : currentZoom);
            markerRef.current.setLatLng(newLatLng);

            const popupContent = createPopupContent(address);
            if (popupContent) {
                if (markerRef.current.getPopup()) {
                    markerRef.current.setPopupContent(popupContent).openPopup();
                } else {
                    markerRef.current.bindPopup(popupContent).openPopup();
                }
            } else {
                 if (markerRef.current.getPopup()) {
                    markerRef.current.closePopup();
                    markerRef.current.unbindPopup();
                }
            }
        }
    }, [lat, lng, address]);

    return (
        <div className="relative h-96 w-full rounded-lg z-0 bg-gray-700 overflow-hidden">
            <div ref={mapContainerRef} className="h-full w-full"></div>

            <form onSubmit={handleSearch} className="absolute top-2 left-2 right-2 z-[1000] flex items-center space-x-2 bg-gray-800/50 backdrop-blur-sm p-2 rounded-lg shadow-lg">
                <input 
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar endereço..."
                    className="w-full bg-gray-900/70 text-white text-sm rounded-md px-3 py-1.5 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button type="submit" className="flex-shrink-0 p-2 text-white bg-blue-600 rounded-md hover:bg-blue-500 transition-colors" aria-label="Buscar Endereço">
                    <SearchIcon className="w-4 h-4" />
                </button>
            </form>

            {isLoading && (
                <div className="absolute inset-0 bg-gray-900/60 flex justify-center items-center z-[1001]">
                    <SpinnerIcon className="w-8 h-8 text-white" />
                </div>
            )}
        </div>
    );
};