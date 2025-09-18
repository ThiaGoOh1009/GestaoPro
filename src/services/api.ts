declare global {
    interface Window {
        google: any;
    }
}

import { GOOGLE_MAPS_API_KEY } from './key';
import { capitalizeWords, maskPhone, maskZip } from '../utils/helpers';

// --- Google Maps Script Loader (Refactored) ---
let mapsApiPromise: Promise<void> | null = null;

/**
 * Initializes the Google Maps script. This function should be called once when the application starts.
 * It reads the API key from the central key.ts file.
 * @returns A promise that resolves when the script is loaded.
 */
export const initializeMapsApi = (): Promise<void> => {
    // Prevent re-initialization
    if (mapsApiPromise) {
        return mapsApiPromise;
    }

    const apiKey = GOOGLE_MAPS_API_KEY;

    // FIX: Removed check against a specific placeholder string which caused a TypeScript error
    // because the actual key is now present, making the comparison of two different literals always false.
    // The check for a falsy key is sufficient.
    if (!apiKey) {
        const errorMessage = 'A chave da API do Google Maps não foi configurada. Por favor, edite o arquivo src/services/key.ts e adicione sua chave.';
        console.error(errorMessage);
        return Promise.reject(new Error(errorMessage));
    }

    mapsApiPromise = new Promise((resolve, reject) => {
        if (window.google && window.google.maps) {
            resolve();
            return;
        }

        const scriptId = 'google-maps-script';
        // Remove existing script if it exists, in case of a bad key attempt
        const existingScript = document.getElementById(scriptId) as HTMLScriptElement;
        if(existingScript) {
            existingScript.remove();
        }

        const script = document.createElement('script');
        script.id = scriptId;
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geocoding,marker,geometry&v=beta`;
        script.async = true;
        script.defer = true;
        script.onload = () => resolve();
        script.onerror = () => {
            // Reset promise on error to allow retrying with a new key
            mapsApiPromise = null; 
            reject(new Error('Falha ao carregar o script do Google Maps. Verifique se a chave da API é válida, se a API "Maps JavaScript API" está ativada no Google Cloud Console e se não há restrições de referenciador HTTP.'));
        };
        document.head.appendChild(script);
    });

    return mapsApiPromise;
};

/**
 * Ensures that the Google Maps API has been initialized before proceeding.
 * @returns A promise that resolves when the API is ready, or rejects if it hasn't been initialized.
 */
const ensureMapsApiLoaded = (): Promise<void> => {
    if (!mapsApiPromise) {
        return Promise.reject(new Error("A API do Google Maps não foi inicializada. Chame initializeMapsApi primeiro."));
    }
    return mapsApiPromise;
};


export const fetchCompanyDataFromCnpj = async (cnpj) => {
    try {
        const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`);
        if (!response.ok) throw new Error('Serviço de busca de CNPJ indisponível.');
        const data = await response.json();
        if (data.type || data.name === 'CnpjError') throw new Error(data.message || 'CNPJ não encontrado ou inválido.');
        
        return {
            legalName: capitalizeWords(data.razao_social || ''),
            tradeName: capitalizeWords(data.nome_fantasia || ''),
            contactName: data.qsa && data.qsa.length > 0 ? capitalizeWords(data.qsa[0].nome_socio) : '',
            phone: data.ddd_telefone_1 ? maskPhone(data.ddd_telefone_1) : '',
            email: data.email ? data.email.toLowerCase() : '',
            address: {
                street: capitalizeWords(data.logouro || ''),
                number: data.numero || '',
                neighborhood: capitalizeWords(data.bairro || ''),
                city: capitalizeWords(data.municipio || ''),
                state: (data.uf || '').toUpperCase(),
                zip: maskZip(data.cep || ''),
            }
        };
    } catch (error) { console.error("BrasilAPI CNPJ Error:", error); throw error; }
};

export const fetchAddressFromCep = async (cep) => {
    try {
        const response = await fetch(`https://brasilapi.com.br/api/cep/v1/${cep}`);
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: `Serviço de CEP indisponível (status: ${response.status})` }));
            // BrasilAPI can return a detailed error message.
            throw new Error(errorData.message || 'CEP não encontrado ou inválido.');
        }
        const data = await response.json();
        
        return {
            street: capitalizeWords(data.street || ''),
            neighborhood: capitalizeWords(data.neighborhood || ''),
            city: capitalizeWords(data.city || ''),
            state: (data.state || '').toUpperCase(),
        };
    } catch (error) { 
        console.error("BrasilAPI CEP Error:", error); 
        throw error; 
    }
};

const parseGoogleAddressComponents = (components) => {
    const get = (type) => components.find(c => c.types.includes(type))?.long_name || '';
    return {
        street: capitalizeWords(get('route')),
        number: get('street_number'),
        neighborhood: capitalizeWords(get('sublocality_level_1') || get('political')),
        city: capitalizeWords(get('administrative_area_level_2')),
        state: (get('administrative_area_level_1') || '').toUpperCase(),
        zip: maskZip(get('postal_code')),
    };
};

export const geocodeAddress = async (addressQuery) => {
    await ensureMapsApiLoaded();
    try {
        const geocoder = new window.google.maps.Geocoder();
        const response = await geocoder.geocode({ address: addressQuery });
        if (response.results.length > 0) {
            const location = response.results[0].geometry.location;
            return { lat: location.lat(), lng: location.lng() };
        }
        return null;
    } catch (err) { console.error("Geocoding failed:", err); throw new Error("Não foi possível encontrar a localização."); }
};

export const reverseGeocode = async (lat, lng) => {
    await ensureMapsApiLoaded();
    try {
        const geocoder = new window.google.maps.Geocoder();
        const response = await geocoder.geocode({ location: { lat, lng } });
        if (response.results.length > 0) {
            return parseGoogleAddressComponents(response.results[0].address_components);
        }
        throw new Error("Endereço não encontrado para as coordenadas.");
    } catch (err) { console.error("Reverse Geocoding failed:", err); throw err; }
};

export const fetchNearbyPlaces = async (lat, lng, map) => {
    await ensureMapsApiLoaded();
    try {
        const service = new window.google.maps.places.PlacesService(map);
        const request = {
            location: { lat, lng },
            radius: 100,
            types: ['store', 'restaurant', 'establishment']
        };
        return new Promise((resolve, reject) => {
            service.nearbySearch(request, (results, status) => {
                if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
                    const places = results.map(p => ({
                        place_id: p.place_id,
                        lat: p.geometry.location.lat(),
                        lon: p.geometry.location.lng(),
                        display_name: `${p.name}, ${p.vicinity}`,
                        name: p.name,
                    })).filter(p => p.place_id);
                    resolve(places);
                } else if (status === window.google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
                    resolve([]);
                } else {
                    reject(new Error(`Places API error: ${status}`));
                }
            });
        });
    } catch (err) {
        console.error("Nearby Places failed:", err);
        throw new Error("Não foi possível buscar comércios próximos.");
    }
};


export const fetchPlaceDetails = async (place_id, map) => {
    await ensureMapsApiLoaded();
    try {
        const service = new window.google.maps.places.PlacesService(map);
        const request = { placeId: place_id, fields: ['name', 'address_components', 'geometry'] };
        return new Promise((resolve, reject) => {
            service.getDetails(request, (place, status) => {
                if (status === window.google.maps.places.PlacesServiceStatus.OK && place) {
                    const address = parseGoogleAddressComponents(place.address_components);
                    const name = capitalizeWords(place.name);
                    resolve({
                        legalName: name,
                        tradeName: name,
                        address: address,
                        location: { lat: place.geometry.location.lat(), lng: place.geometry.location.lng() }
                    });
                } else {
                    reject(new Error(`Place Details API error: ${status}`));
                }
            });
        });
    } catch (err) {
        console.error("Place Details failed:", err);
        throw err;
    }
};