import { capitalizeWords, maskPhone, maskZip } from '../utils/helpers';

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
                street: capitalizeWords(data.logradouro || ''),
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
        const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        if (!response.ok) throw new Error("Erro ao buscar CEP.");
        const data = await response.json();
        if (data.erro) throw new Error("CEP não encontrado.");
        return {
            street: capitalizeWords(data.logradouro || ''),
            neighborhood: capitalizeWords(data.bairro || ''),
            city: capitalizeWords(data.localidade || ''),
            state: (data.uf || '').toUpperCase(),
        };
    } catch (error) { console.error("ViaCEP Error:", error); throw error; }
};

export const geocodeAddress = async (addressQuery) => {
    try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addressQuery)}&limit=1`);
        if (!response.ok) throw new Error("Erro ao geolocalizar endereço.");
        const data = await response.json();
        if (data.length > 0) return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
        return null;
    } catch (err) { console.error("Geocoding failed:", err); throw new Error("Não foi possível encontrar a localização."); }
};

export const reverseGeocode = async (lat, lng) => {
    try {
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`);
        if (!response.ok) throw new Error("Falha ao buscar endereço.");
        const data = await response.json();
        if (data && data.address) {
            const addr = data.address;
            return {
                street: capitalizeWords(addr.road || ''),
                number: addr.house_number || '',
                neighborhood: capitalizeWords(addr.suburb || addr.neighbourhood || ''),
                city: capitalizeWords(addr.city || addr.town || ''),
                state: (addr.state_code || addr.state || '').toUpperCase(),
                zip: maskZip(addr.postcode || ''),
            };
        }
        throw new Error("Endereço não encontrado para as coordenadas.");
    } catch (err) { console.error("Reverse Geocoding failed:", err); throw err; }
};
