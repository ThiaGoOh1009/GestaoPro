

declare global {
    interface Window {
        google: any;
    }
}

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { SpinnerIcon } from './Icons';
import { fetchNearbyPlaces, fetchPlaceDetails } from '../services/api';

// Dark theme for Google Maps
const mapStyles = [
    { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
    { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
    { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
    { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
    { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
    { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#263c3f" }] },
    { featureType: "poi.park", elementType: "labels.text.fill", stylers: [{ color: "#6b9a76" }] },
    { featureType: "road", elementType: "geometry", stylers: [{ color: "#38414e" }] },
    { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#212a37" }] },
    { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#9ca5b3" }] },
    { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#746855" }] },
    { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#1f2835" }] },
    { featureType: "road.highway", elementType: "labels.text.fill", stylers: [{ color: "#f3d19c" }] },
    { featureType: "transit", elementType: "geometry", stylers: [{ color: "#2f3948" }] },
    { featureType: "transit.station", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
    { featureType: "water", elementType: "geometry", stylers: [{ color: "#17263c" }] },
    { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#515c6d" }] },
    { featureType: "water", elementType: "labels.text.stroke", stylers: [{ color: "#17263c" }] },
];

export const MapPicker = ({ lat, lng, onLocationChange, onRecenter, address, isLoading, isOpen, onPoiSelect, refetchKey }) => {
    const mapContainerRef = useRef(null);
    const mapRef = useRef(null);
    const mainMarkerRef = useRef(null);
    const placesMarkersRef = useRef<any[]>([]);
    const infoWindowRef = useRef(null);
    
    const [isFetchingPlaces, setIsFetchingPlaces] = useState(false);
    const [showZoomMessage, setShowZoomMessage] = useState(true);
    
    // Use a ref to lock fetching, preventing multiple calls for the same key.
    const lastFetchedKey = useRef<number | null>(null);
    // Use a ref for the onPoiSelect callback to avoid stale closures.
    const onPoiSelectRef = useRef(onPoiSelect);
    onPoiSelectRef.current = onPoiSelect;


    const findNearbyPlaces = useCallback(async (map) => {
        if (isFetchingPlaces) return;

        const zoom = map.getZoom();
        if (zoom < 16) {
            setShowZoomMessage(true);
            return;
        }
        
        setShowZoomMessage(false);
        setIsFetchingPlaces(true);
        const center = map.getCenter();
        if (!center) {
            console.error("Failed to get map center. Map may not be fully initialized due to errors (e.g., Invalid API Key).");
            setIsFetchingPlaces(false);
            return;
        }
        
        try {
            const nearbyPlaces = await fetchNearbyPlaces(center.lat(), center.lng(), map);
            
            placesMarkersRef.current.forEach(m => m.setMap(null));
            placesMarkersRef.current = [];

            (nearbyPlaces as any[]).forEach(place => {
                const placeMarker = new window.google.maps.Marker({
                    position: { lat: place.lat, lng: place.lon },
                    map: map,
                    title: place.name,
                    icon: {
                        url: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-8 h-8 text-yellow-500 drop-shadow-lg"><path stroke-linecap="round" stroke-linejoin="round" stroke="black" stroke-width="1" fill="%23f59e0b" d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3" fill="black" /></svg>`,
                        scaledSize: new window.google.maps.Size(32, 32),
                        anchor: new window.google.maps.Point(16, 32),
                    }
                });

                placeMarker.addListener('click', (event) => {
                    // This stops the click from propagating to the map, which could cause other listeners to fire.
                    if (event && typeof event.stop === 'function') {
                        event.stop();
                    }

                    const contentString = `
                        <div class="p-1 font-sans">
                            <div class="font-semibold text-gray-900 text-base">${place.name}</div>
                            <p class="text-sm text-gray-600 mt-1">${place.display_name.split(',').slice(1).join(',').trim()}</p>
                            <button type="button" id="use-place-${place.place_id}" data-dev-id="MapPicker-use-poi-button" class="w-full mt-3 px-3 py-1.5 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-500 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400">
                                Preencher com este local
                            </button>
                        </div>`;
                    
                    infoWindowRef.current.setContent(contentString);
                    infoWindowRef.current.open({ anchor: placeMarker, map });
                });
                
                placesMarkersRef.current.push(placeMarker);
            });
        } catch (error) {
            console.error("Failed to fetch nearby places:", error);
        } finally {
            setIsFetchingPlaces(false);
        }
    }, [isFetchingPlaces]);

    // Map initialization effect - runs only once
    useEffect(() => {
        if (mapContainerRef.current && !mapRef.current) {
            const map = new window.google.maps.Map(mapContainerRef.current, {
                center: { lat: -23.55052, lng: -46.633308 }, // Default center
                zoom: 16,
                styles: mapStyles,
                disableDefaultUI: true,
                zoomControl: true,
                mapId: 'GESTPRO_DARK_THEME_MAP',
            });
            mapRef.current = map;
            
            const markerContent = document.createElement('div');
            markerContent.innerHTML = `
                <div class="relative flex justify-center items-center">
                    <div class="w-6 h-6 bg-blue-500 rounded-full shadow-lg border-2 border-white"></div>
                    <div class="absolute w-6 h-6 bg-blue-500 rounded-full pulse-animate"></div>
                </div>`;

            const mainMarker = new window.google.maps.marker.AdvancedMarkerElement({
                position: { lat: -23.55052, lng: -46.633308 },
                map: map,
                content: markerContent,
                gmpDraggable: true,
            });
            mainMarkerRef.current = mainMarker;

            mainMarker.addListener('dragend', (event) => {
                const newPos = event.latLng;
                if (onLocationChange) onLocationChange({ lat: newPos.lat(), lng: newPos.lng() });
            });

            infoWindowRef.current = new window.google.maps.InfoWindow();
            infoWindowRef.current.addListener('domready', () => {
                const button = document.querySelector('[id^="use-place-"]');
                if (button) {
                     button.addEventListener('click', async () => {
                        const placeId = button.id.replace('use-place-', '');
                        button.innerHTML = '<span class="flex items-center justify-center"><svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Carregando...</span>';
                        (button as HTMLButtonElement).disabled = true;
                        try {
                            const details = await fetchPlaceDetails(placeId, mapRef.current);
                            if (onPoiSelectRef.current) onPoiSelectRef.current(details);
                            infoWindowRef.current.close();
                        } catch (error) {
                            console.error("Could not fetch POI details", error);
                            alert("Não foi possível obter os detalhes completos deste local.");
                            button.innerHTML = 'Tentar Novamente';
                            (button as HTMLButtonElement).disabled = false;
                        }
                    });
                }
            });

            map.addListener('zoom_changed', () => {
                const zoom = map.getZoom();
                const shouldShow = zoom >= 16;
                setShowZoomMessage(!shouldShow);
                placesMarkersRef.current.forEach(m => m.setVisible(shouldShow));
            });
            
            setShowZoomMessage(map.getZoom() < 16);

            const controlsContainer = document.createElement("div");
            controlsContainer.className = "flex flex-col m-2 gap-2";

            const recenterControl = document.createElement("button");
            recenterControl.type = "button";
            recenterControl.className = "bg-white rounded-md shadow-md w-[30px] h-[30px] flex items-center justify-center focus:outline-none hover:bg-gray-100";
            recenterControl.title = "Centralizar na sua localização";
            recenterControl.setAttribute("data-dev-id", "MapPicker-recenter-button");
            recenterControl.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-gray-700"><circle cx="12" cy="12" r="10"/><line x1="22" y1="12" x2="18" y2="12"/><line x1="6" y1="12" x2="2" y2="12"/><line x1="12" y1="6" x2="12" y2="2"/><line x1="12" x2="12" y1="22" y2="18"/></svg>`;
            recenterControl.addEventListener("click", onRecenter);
            controlsContainer.appendChild(recenterControl);
            
            map.controls[window.google.maps.ControlPosition.RIGHT_BOTTOM].push(controlsContainer);
        }
    }, [onLocationChange, onRecenter]);

    // Effect to keep map and marker visuals in sync with props
    useEffect(() => {
        if (!isOpen || !mapRef.current || !mainMarkerRef.current) {
            return;
        }

        const newPos = { lat, lng };
        const currentMarkerPos = mainMarkerRef.current.position;
        
        // Sync marker and map center only if they have changed
        if (currentMarkerPos && (currentMarkerPos.lat !== lat || currentMarkerPos.lng !== lng)) {
            mainMarkerRef.current.position = newPos;
            mapRef.current.setCenter(newPos);
        }

        // Resize map after modal animation to ensure it renders correctly
        setTimeout(() => {
            if (mapRef.current) { // Check if component is still mounted
                window.google.maps.event.trigger(mapRef.current, 'resize');
                mapRef.current.setCenter(newPos);
            }
        }, 300);
    }, [isOpen, lat, lng]);

    // Create a ref to hold the latest props to avoid stale closures in the fetch effect.
    const latestProps = useRef({ findNearbyPlaces });
    latestProps.current = { findNearbyPlaces };

    // Effect to trigger nearby search. This is more robust to prevent re-fetches.
    useEffect(() => {
        // Reset the fetch lock if the modal is closed, so it can fetch again next time it opens.
        if (!isOpen) {
            lastFetchedKey.current = null;
            return;
        }
        
        const { findNearbyPlaces } = latestProps.current;
        
        // We only fetch if the modal is open, map is ready, we have a valid key,
        // and this specific key hasn't been used for a fetch yet in this session.
        if (mapRef.current && refetchKey > 0 && refetchKey !== lastFetchedKey.current) {
            // Lock before fetching to prevent re-renders from re-triggering this effect.
            lastFetchedKey.current = refetchKey;
            findNearbyPlaces(mapRef.current);
        }
    }, [refetchKey, isOpen]); // Reruns ONLY when key or modal visibility changes.
    
    return (
        <div className="relative h-96 w-full rounded-lg z-0 bg-gray-800 overflow-hidden" data-dev-id="MapPicker-container">
            <div ref={mapContainerRef} className="h-full w-full"></div>
                {showZoomMessage && !isFetchingPlaces && (
                <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-gray-900/70 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-full shadow-lg z-[1001]">
                    Aproxime o mapa para ver locais próximos
                </div>
            )}
            {(isLoading || isFetchingPlaces) && (
                <div className="absolute inset-0 bg-gray-900/60 flex flex-col justify-center items-center z-[1001]">
                    <SpinnerIcon className="w-8 h-8 text-white" />
                    {isFetchingPlaces && <span className="text-white mt-3 text-sm">Buscando locais próximos...</span>}
                </div>
            )}
        </div>
    );
};