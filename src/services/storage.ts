import { capitalizeWords, maskPhone, maskZip } from '../utils/helpers';

export const storage = {
    loadClientFieldSettings: () => {
        try { const settings = localStorage.getItem('clientFieldSettings'); return settings ? JSON.parse(settings) : { email: false, phone: false }; }
        catch (e) { return { email: false, phone: false }; }
    },
    saveClientFieldSettings: (settings) => { 
        try {
            localStorage.setItem('clientFieldSettings', JSON.stringify(settings));
        } catch (e) {
            console.error("Failed to save settings:", e);
            alert("Erro: Não foi possível salvar as configurações.");
        }
    },
};

export const backend = {
    getClientes: async (): Promise<any[]> => {
        try {
            let clients = JSON.parse(localStorage.getItem('clients'));
            if (!clients) {
                clients = [
                    { id: 1, customerType: 'PJ', document: '11.222.333/0001-44', legalName: 'Tecnologia Inovadora Ltda', tradeName: 'Tech Inova', contactName: 'Carlos Silva', email: 'contato@techinova.com', phone: '(11) 98765-4321', status: 'Ativo', address: { street: 'Av. Paulista', number: '1000', neighborhood: 'Bela Vista', region: '', city: 'São Paulo', state: 'SP', zip: '01310-100' }, location: { lat: -23.5613, lng: -46.6565 } },
                    { id: 2, customerType: 'PF', document: '123.456.789-00', legalName: 'Maria Oliveira', tradeName: '', contactName: 'Maria Oliveira', email: 'maria.o@email.com', phone: '(21) 91234-5678', status: 'Ativo', address: { street: 'Av. Atlântica', number: '2000', neighborhood: 'Copacabana', region: '', city: 'Rio de Janeiro', state: 'RJ', zip: '22070-001' }, location: { lat: -22.9715, lng: -43.1825 } },
                    { id: 3, customerType: 'PJ', document: '44.555.666/0001-77', legalName: 'Comércio Varejista Brasil S.A.', tradeName: 'Varejo Brasil', contactName: 'Ana Souza', email: 'ana.s@varejobrasil.com', phone: '(31) 99999-8888', status: 'Inativo', address: { street: 'Av. Afonso Pena', number: '3000', neighborhood: 'Centro', region: '', city: 'Belo Horizonte', state: 'MG', zip: '30130-007' }, location: { lat: -19.9245, lng: -43.9352 } },
                    { id: 4, customerType: 'PJ', document: '55.123.456/0001-88', legalName: 'Hotelaria Vistas das Cataratas Ltda', tradeName: 'Hotel Vistas Cataratas', contactName: 'Ricardo Mendes', email: 'gerencia@hotelvistas.com.br', phone: '(45) 99876-5432', status: 'Ativo', address: { street: 'Av. das Cataratas', number: '1234', neighborhood: 'Vila Yolanda', region: 'Região do Centro/Vila Yolanda', city: 'Foz do Iguaçu', state: 'PR', zip: '85853-000' }, location: { lat: -25.5683, lng: -54.5517 } },
                    { id: 5, customerType: 'PJ', document: '66.789.012/0001-99', legalName: 'Sabor da Fronteira Gastronomia Ltda', tradeName: 'Restaurante Sabor da Fronteira', contactName: 'Juliana Costa', email: 'contato@sabordafronteira.com', phone: '(45) 99123-8765', status: 'Ativo', address: { street: 'Av. Brasil', number: '500', neighborhood: 'Centro', region: 'Região do Centro/Vila Yolanda', city: 'Foz do Iguaçu', state: 'PR', zip: '85851-000' }, location: { lat: -25.5460, lng: -54.5857 } },
                    { id: 6, customerType: 'PJ', document: '77.345.678/0001-00', legalName: 'Foz Explorer Viagens e Turismo EIRELI', tradeName: 'Agência Foz Explorer', contactName: 'Fernando Lima', email: 'fernando.lima@fozexplorer.com', phone: '(45) 98877-4455', status: 'Inativo', address: { street: 'Rua Almirante Barroso', number: '2020', neighborhood: 'Centro', region: 'Região do Centro/Vila Yolanda', city: 'Foz do Iguaçu', state: 'PR', zip: '85851-010' }, location: { lat: -25.5413, lng: -54.5802 } },
                    { id: 7, customerType: 'PJ', document: '17.890.123/0001-11', legalName: 'Supermercado Sol Nascente Ltda', tradeName: 'Supermercado Sol', contactName: 'Mariana Lima', email: 'contato@supersol.com', phone: '(45) 98765-1122', status: 'Ativo', address: { street: 'Av. Ranieri Mazzilli', number: '500', neighborhood: 'Jardim Três Fronteiras', region: 'Região Tres Lagoas', city: 'Foz do Iguaçu', state: 'PR', zip: '85862-210' }, location: { lat: -25.4957, lng: -54.5694 } },
                    { id: 8, customerType: 'PJ', document: '18.901.234/0001-22', legalName: 'Padaria Pão Quente & Cia', tradeName: 'Padaria Pão Quente', contactName: 'Roberto Almeida', email: 'roberto@paoquente.com', phone: '(45) 98765-2233', status: 'Ativo', address: { street: 'Rua Pompéu de Toledo', number: '123', neighborhood: 'Loteamento Três Lagoas', region: 'Região Tres Lagoas', city: 'Foz do Iguaçu', state: 'PR', zip: '85862-500' }, location: { lat: -25.4881, lng: -54.5752 } },
                    { id: 9, customerType: 'PJ', document: '19.012.345/0001-33', legalName: 'Farmácia Bem Estar Foz Ltda', tradeName: 'Farmácia Bem Estar', contactName: 'Lucia Ferraz', email: 'lucia@bemestarfoz.com', phone: '(45) 98765-3344', status: 'Ativo', address: { street: 'Av. Tancredo Neves', number: '6731', neighborhood: 'Vila C Nova', region: 'Região da Vila C', city: 'Foz do Iguaçu', state: 'PR', zip: '85867-900' }, location: { lat: -25.4593, lng: -54.5855 } },
                    { id: 10, customerType: 'PJ', document: '20.123.456/0001-44', legalName: 'Estilo Modas e Confecções', tradeName: 'Loja de Roupas Estilo', contactName: 'Beatriz Costa', email: 'bia@estilomodas.com', phone: '(45) 98765-4455', status: 'Inativo', address: { street: 'Rua B', number: '456', neighborhood: 'Vila C Velha', region: 'Região da Vila C', city: 'Foz do Iguaçu', state: 'PR', zip: '85867-901' }, location: { lat: -25.4620, lng: -54.5821 } },
                    { id: 11, customerType: 'PF', document: '111.222.333-44', legalName: 'João Pereira da Silva', tradeName: '', contactName: 'João Pereira', email: 'joao.pereira@email.com', phone: '(45) 98765-5566', status: 'Ativo', address: { street: 'Rua Cláudio Coutinho', number: '789', neighborhood: 'Parque Residencial Morumbi I', region: 'Região do São Francisco/Morumbi', city: 'Foz do Iguaçu', state: 'PR', zip: '85858-200' }, location: { lat: -25.5532, lng: -54.5478 } },
                    { id: 12, customerType: 'PJ', document: '21.234.567/0001-55', legalName: 'Consultório Dentário Sorriso Perfeito', tradeName: 'Consultório Sorriso', contactName: 'Dr. Fábio Martins', email: 'fabio.m@consultoriosorriso.com', phone: '(45) 98765-6677', status: 'Ativo', address: { street: 'Av. Juscelino Kubitscheck', number: '3321', neighborhood: 'Portal da Foz', region: 'Região do São Francisco/Morumbi', city: 'Foz do Iguaçu', state: 'PR', zip: '85851-210' }, location: { lat: -25.5419, lng: -54.5586 } },
                    { id: 13, customerType: 'PJ', document: '22.345.678/0001-66', legalName: 'Açougue Boi Bom de Foz', tradeName: 'Açougue Boi Bom', contactName: 'Sr. Valdir', email: 'valdir@boibom.com', phone: '(45) 98765-7788', status: 'Ativo', address: { street: 'Av. Morenitas', number: '999', neighborhood: 'Jardim das Flores', region: 'Região do Porto Meira', city: 'Foz do Iguaçu', state: 'PR', zip: '85854-410' }, location: { lat: -25.5925, lng: -54.5739 } }
                ];
                localStorage.setItem('clients', JSON.stringify(clients));
            }
            return clients;
        } catch (e) { return []; }
    },
    saveCliente: async (clientData) => {
        const clients = await backend.getClientes();
        
        if (clientData.address && clientData.address.neighborhood) {
            const neighborhood = clientData.address.neighborhood.trim();
            if (neighborhood) {
                const regioes = await backend.getRegioes();
                const foundRegion = regioes.find(r => 
                    r.neighborhoods.some(n => n.trim().toLowerCase() === neighborhood.toLowerCase())
                );

                if (foundRegion) {
                    clientData.address.region = foundRegion.name;
                } else {
                    clientData.address.region = ''; 
                    await backend.addPendingNeighborhood(neighborhood);
                }
            } else {
                 clientData.address.region = '';
            }
        }

        if (clientData.id) {
            const index = clients.findIndex(c => c.id === clientData.id);
            if (index !== -1) clients[index] = clientData;
        } else {
            clientData.id = Date.now();
            clients.push(clientData);
        }
        try {
            localStorage.setItem('clients', JSON.stringify(clients));
        } catch(e) {
            console.error("Failed to save client data:", e);
            alert("Erro: Não foi possível salvar os dados do cliente.");
            throw e;
        }
        return clients;
    },
    deleteCliente: async (id) => {
        let clients = await backend.getClientes();
        clients = clients.filter(c => c.id !== id);
        try {
            localStorage.setItem('clients', JSON.stringify(clients));
        } catch (e) {
            console.error("Failed to delete client data:", e);
            alert("Erro: Não foi possível excluir os dados do cliente.");
            throw e;
        }
        return clients;
    },
     getProdutos: async () => {
        try {
            let products = JSON.parse(localStorage.getItem('products'));
            if (!products) {
                products = [
                    { id: 101, type: 'Produto', name: 'Roteador Wi-Fi 6 Mesh', category: 'Hardware', description: 'Roteador de alta performance para redes domésticas e empresariais.', price: 799.90, stock: 50 },
                    { id: 102, type: 'Serviço', name: 'Instalação de Rede Estruturada', category: 'Infraestrutura', description: 'Serviço completo de passagem de cabos e configuração de rede.', price: 1500.00, stock: null },
                    { id: 103, type: 'Produto', name: 'Câmera de Segurança IP Full HD', category: 'Segurança', description: 'Câmera com visão noturna e acesso remoto via aplicativo.', price: 349.90, stock: 120 },
                    { id: 104, type: 'Serviço', name: 'Contrato de Suporte Técnico Mensal', category: 'Suporte', description: 'Plano de suporte técnico remoto e presencial para empresas.', price: 450.00, stock: null },
                    { id: 105, type: 'Produto', name: 'Switch 24 Portas Gigabit', category: 'Hardware', description: 'Switch gerenciável para otimização de tráfego de rede.', price: 1299.00, stock: 30 },
                    { id: 106, type: 'Serviço', name: 'Configuração de Firewall', category: 'Segurança', description: 'Implementação de regras de segurança e políticas de acesso.', price: 800.00, stock: null },
                    { id: 107, type: 'Produto', name: 'No-break Senoidal 1500VA', category: 'Energia', description: 'Proteção para equipamentos sensíveis contra quedas de energia.', price: 950.50, stock: 45 },
                    { id: 108, type: 'Serviço', name: 'Visita Técnica Avulsa', category: 'Suporte', description: 'Atendimento técnico para resolução de problemas pontuais.', price: 250.00, stock: null }
                ];
                localStorage.setItem('products', JSON.stringify(products));
            }
            return products;
        } catch (e) { return []; }
    },
    saveProduto: async (productData) => {
        const products = await backend.getProdutos();
        if (productData.id) {
            const index = products.findIndex(p => p.id === productData.id);
            if (index !== -1) {
                products[index] = productData; // Simplified logic for clarity and correctness
            }
        } else {
            productData.id = Date.now();
            products.push(productData);
        }
        try {
            localStorage.setItem('products', JSON.stringify(products));
        } catch(e) {
            console.error("Failed to save product data:", e);
            alert("Erro: Não foi possível salvar os dados do produto.");
            throw e;
        }
        return products;
    },
    deleteProduto: async (id) => {
        let products = await backend.getProdutos();
        products = products.filter(p => p.id !== id);
        try {
            localStorage.setItem('products', JSON.stringify(products));
        } catch(e) {
            console.error("Failed to delete product data:", e);
            alert("Erro: Não foi possível excluir os dados do produto.");
            throw e;
        }
        return products;
    },
    getCategories: () => {
        try {
            const cats = localStorage.getItem('productCategories');
            if (cats) return JSON.parse(cats);
            const defaultCats = {
                produtos: ['Hardware', 'Segurança', 'Energia', 'Software'],
                servicos: ['Infraestrutura', 'Suporte', 'Consultoria', 'Manutenção']
            };
            backend.saveCategories(defaultCats);
            return defaultCats;
        } catch (e) {
            console.error("Failed to load categories:", e);
            return { produtos: [], servicos: [] };
        }
    },
    saveCategories: (categories) => {
        try {
            localStorage.setItem('productCategories', JSON.stringify(categories));
        } catch (e) {
            console.error("Failed to save categories:", e);
            alert("Erro ao salvar categorias.");
        }
    },
    getChamados: async (): Promise<any[]> => {
        try {
            let chamados = JSON.parse(localStorage.getItem('chamados'));
            if (!chamados) {
                chamados = [
                    // --- Região do Centro/Vila Yolanda ---
                    {
                        id: 301,
                        clientId: 4,
                        clientName: 'Hotel Vistas Cataratas',
                        billingType: 'Empresa',
                        invoiced: false,
                        inRoute: false,
                        requestType: 'Chamado de Serviço',
                        status: 'Aberto',
                        priority: 'Alta',
                        equipment: 'Rede Wi-Fi Hóspedes',
                        problemDescription: 'Wi-Fi instável nos quartos do 5º andar. Hóspedes reclamando de quedas constantes de conexão.',
                        solutionDescription: '',
                        items: [{ productId: 108, name: 'Visita Técnica Avulsa', quantity: 1, unitPrice: 250.00, totalPrice: 250.00 }],
                        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
                    },
                    {
                        id: 302,
                        clientId: 5,
                        clientName: 'Restaurante Sabor da Fronteira',
                        billingType: 'Empresa',
                        invoiced: false,
                        inRoute: false,
                        requestType: 'Chamado de Serviço',
                        status: 'Aberto',
                        priority: 'Alta',
                        equipment: 'Impressora de Pedidos Cozinha',
                        problemDescription: 'A impressora térmica da cozinha não está imprimindo os pedidos enviados pelo caixa 1. Já foi reiniciada.',
                        solutionDescription: '',
                        items: [],
                        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
                    },
                    {
                        id: 303,
                        clientId: 6,
                        clientName: 'Agência Foz Explorer',
                        billingType: 'Empresa',
                        invoiced: false,
                        inRoute: false,
                        requestType: 'Chamado de Serviço',
                        status: 'Aberto',
                        priority: 'Média',
                        equipment: 'Infraestrutura de Rede',
                        problemDescription: 'Necessário instalar um novo ponto de rede na sala de vendas para um novo computador.',
                        solutionDescription: '',
                        items: [{ productId: 102, name: 'Instalação de Rede Estruturada', quantity: 1, unitPrice: 1500.00, totalPrice: 1500.00 }],
                        createdAt: new Date().toISOString(),
                    },
                    // --- Região Tres Lagoas ---
                    {
                        id: 304,
                        clientId: 7,
                        clientName: 'Supermercado Sol',
                        billingType: 'Empresa',
                        invoiced: false,
                        inRoute: false,
                        requestType: 'Chamado de Serviço',
                        status: 'Aberto',
                        priority: 'Alta',
                        equipment: 'Balança Toledo',
                        problemDescription: 'Balança do setor de açougue está com o peso desregulado. Precisa de aferição urgente.',
                        solutionDescription: '',
                        items: [],
                        createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), // 3 hours ago
                    },
                    {
                        id: 305,
                        clientId: 8,
                        clientName: 'Padaria Pão Quente',
                        billingType: 'Empresa',
                        invoiced: false,
                        inRoute: false,
                        requestType: 'Chamado de Serviço',
                        status: 'Aberto',
                        priority: 'Média',
                        equipment: 'Sistema PDV',
                        problemDescription: 'O sistema do Ponto de Venda fica muito lento nos horários de pico, entre 17h e 19h. Travando as vendas.',
                        solutionDescription: '',
                        items: [{ productId: 108, name: 'Visita Técnica Avulsa', quantity: 1, unitPrice: 250.00, totalPrice: 250.00 }],
                        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
                    },
                    // --- Região da Vila C ---
                    {
                        id: 306,
                        clientId: 9,
                        clientName: 'Farmácia Bem Estar',
                        billingType: 'Empresa',
                        invoiced: false,
                        inRoute: false,
                        requestType: 'Chamado de Serviço',
                        status: 'Aberto',
                        priority: 'Alta',
                        equipment: 'Impressora Fiscal',
                        problemDescription: 'Impressora fiscal Bematech apresentando erro na emissão do cupom. Código de erro 1008.',
                        solutionDescription: '',
                        items: [],
                        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
                    },
                    {
                        id: 307,
                        clientId: 10,
                        clientName: 'Loja de Roupas Estilo',
                        billingType: 'Empresa',
                        invoiced: false,
                        inRoute: false,
                        requestType: 'Chamado de Serviço',
                        status: 'Aberto',
                        priority: 'Média',
                        equipment: 'DVR Câmeras',
                        problemDescription: 'Uma das câmeras de segurança do estoque parou de gravar. A imagem aparece ao vivo, mas não salva.',
                        solutionDescription: '',
                        items: [{ productId: 103, name: 'Câmera de Segurança IP Full HD', quantity: 1, unitPrice: 349.90, totalPrice: 349.90 }],
                        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
                    },
                    // --- Região do São Francisco/Morumbi ---
                    {
                        id: 308,
                        clientId: 11,
                        clientName: 'João Pereira da Silva',
                        billingType: 'Particular',
                        invoiced: false,
                        inRoute: false,
                        requestType: 'Chamado de Serviço',
                        status: 'Aberto',
                        priority: 'Média',
                        equipment: 'Computador Pessoal',
                        problemDescription: 'Meu computador de casa não liga. Aperto o botão e nada acontece, nenhuma luz acende.',
                        solutionDescription: '',
                        items: [],
                        createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
                    },
                    {
                        id: 309,
                        clientId: 12,
                        clientName: 'Consultório Sorriso',
                        billingType: 'Empresa',
                        invoiced: false,
                        inRoute: false,
                        requestType: 'Agendamento',
                        status: 'Aberto',
                        schedulingType: 'Agendamento de serviço',
                        preferredDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // in 5 days
                        estimatedDuration: '3 horas',
                        problemDescription: 'Configurar rotina de backup em nuvem para o sistema de gerenciamento de pacientes.',
                        items: [{ productId: 106, name: 'Configuração de Firewall', quantity: 1, unitPrice: 800.00, totalPrice: 800.00 }],
                        createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), // 4 days ago
                    },
                    // --- Região do Porto Meira ---
                    {
                        id: 310,
                        clientId: 13,
                        clientName: 'Açougue Boi Bom',
                        billingType: 'Empresa',
                        invoiced: false,
                        inRoute: false,
                        requestType: 'Agendamento',
                        status: 'Aberto',
                        schedulingType: 'Agendamento de serviço',
                        preferredDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // in 3 days
                        estimatedDuration: '2 horas',
                        problemDescription: 'Realizar manutenção preventiva no servidor local, limpeza e verificação de logs.',
                        items: [],
                        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
                    },
                    // --- Fora de Foz do Iguaçu (não devem aparecer na rota) ---
                    {
                        id: 311,
                        clientId: 1,
                        clientName: 'Tech Inova',
                        billingType: 'Empresa',
                        invoiced: false,
                        inRoute: false,
                        requestType: 'Chamado de Serviço',
                        status: 'Aberto',
                        priority: 'Alta',
                        equipment: 'Servidor Dell PowerEdge T40',
                        problemDescription: 'Servidor apresentando alertas de erro de disco. Possível falha iminente no HD 2.',
                        solutionDescription: '',
                        items: [],
                        createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
                    },
                    {
                        id: 312,
                        clientId: 2,
                        clientName: 'Maria Oliveira',
                        billingType: 'Particular',
                        invoiced: false,
                        inRoute: false,
                        requestType: 'Chamado de Serviço',
                        status: 'Em Andamento',
                        priority: 'Baixa',
                        equipment: 'Impressora HP',
                        problemDescription: 'Comprei uma impressora nova e não consigo instalar no meu notebook. Preciso de ajuda.',
                        solutionDescription: 'Acesso remoto agendado para amanhã.',
                        items: [],
                        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
                    },
                ];
                localStorage.setItem('chamados', JSON.stringify(chamados));
            }
            return chamados;
        } catch (e) {
            console.error("Failed to load chamados:", e);
            return [];
        }
    },
    saveChamado: async (chamadoData) => {
        const chamados = await backend.getChamados();
        if (chamadoData.id) {
            const index = chamados.findIndex(c => c.id === chamadoData.id);
            if (index !== -1) chamados[index] = {...chamados[index], ...chamadoData};
        } else {
            chamadoData.id = Date.now();
            chamadoData.createdAt = new Date().toISOString();
            chamadoData.invoiced = false;
            chamadoData.inRoute = false;
            chamadoData.status = 'Aberto';
            chamados.unshift(chamadoData);
        }
        try {
            localStorage.setItem('chamados', JSON.stringify(chamados));
        } catch(e) {
            console.error("Failed to save chamado data:", e);
            alert("Erro: Não foi possível salvar os dados do chamado.");
            throw e;
        }
        return chamados;
    },
    updateChamados: async (chamadoIds, updates) => {
        const chamados = await backend.getChamados();
        const updatedChamados = chamados.map(c => {
            if (chamadoIds.includes(c.id)) {
                return { ...c, ...updates };
            }
            return c;
        });
        try {
            localStorage.setItem('chamados', JSON.stringify(updatedChamados));
        } catch(e) { throw e; }
        return updatedChamados;
    },
    deleteChamado: async (id) => {
        let chamados = await backend.getChamados();
        chamados = chamados.filter(c => c.id !== id);
        try {
            localStorage.setItem('chamados', JSON.stringify(chamados));
        } catch (e) {
            console.error("Failed to delete chamado data:", e);
            alert("Erro: Não foi possível excluir os dados do chamado.");
            throw e;
        }
        return chamados;
    },
    // --- EQUIPAMENTOS ---
    getEquipamentos: async () => {
        try {
            let equipamentos = JSON.parse(localStorage.getItem('equipamentos'));
            if (!equipamentos) {
                equipamentos = [
                    // Equipamentos
                    ...Array.from({ length: 20 }, (_, i) => ({ id: `eq_caixa_${i + 1}`, type: 'Equipamento', name: `Caixa ${i + 1}` })),
                    ...Array.from({ length: 5 }, (_, i) => ({ id: `eq_balcao_${i + 1}`, type: 'Equipamento', name: `Balcão ${i + 1}` })),
                    ...Array.from({ length: 5 }, (_, i) => ({ id: `eq_cpd_${i + 1}`, type: 'Equipamento', name: `CPD ${i + 1}` })),
                    ...Array.from({ length: 10 }, (_, i) => ({ id: `eq_escritorio_${i + 1}`, type: 'Equipamento', name: `Escritório ${i + 1}` })),
                    ...Array.from({ length: 3 }, (_, i) => ({ id: `eq_padaria_${i + 1}`, type: 'Equipamento', name: `Padaria ${i + 1}` })),
                    // Sistemas
                    { id: 'sys_uniplus', type: 'Sistema', name: 'Uniplus' },
                    { id: 'sys_toledo', type: 'Sistema', name: 'Toledo' },
                    { id: 'sys_urano', type: 'Sistema', name: 'Urano' },
                    { id: 'sys_filizola', type: 'Sistema', name: 'Filizola' },
                    { id: 'sys_ponto', type: 'Sistema', name: 'Ponto' },
                ];
                localStorage.setItem('equipamentos', JSON.stringify(equipamentos));
            }
            return equipamentos;
        } catch (e) { return []; }
    },
    saveEquipamento: async (equipamentoData) => {
        const equipamentos = await backend.getEquipamentos();
        if (equipamentoData.id) {
            const index = equipamentos.findIndex(e => e.id === equipamentoData.id);
            if (index !== -1) equipamentos[index] = equipamentoData;
        } else {
            equipamentoData.id = Date.now();
            equipamentos.push(equipamentoData);
        }
        try {
            localStorage.setItem('equipamentos', JSON.stringify(equipamentos));
        } catch(e) { throw e; }
        return equipamentos;
    },
    deleteEquipamento: async (id) => {
        let equipamentos = await backend.getEquipamentos();
        equipamentos = equipamentos.filter(e => e.id !== id);
        try {
            localStorage.setItem('equipamentos', JSON.stringify(equipamentos));
        } catch (e) { throw e; }
        return equipamentos;
    },
    getTemporaryEquipamentos: async () => {
        try {
            const temps = localStorage.getItem('temporaryEquipamentos');
            return temps ? JSON.parse(temps) : [];
        } catch (e) { return []; }
    },
    addTemporaryEquipamento: async (name) => {
        const temps = await backend.getTemporaryEquipamentos();
        const lowerCaseTemps = temps.map(t => t.toLowerCase());
        if (!lowerCaseTemps.includes(name.toLowerCase())) {
            temps.push(name);
            try { localStorage.setItem('temporaryEquipamentos', JSON.stringify(temps)); } catch(e) { throw e; }
        }
        return temps;
    },
    deleteTemporaryEquipamento: async (name) => {
        let temps = await backend.getTemporaryEquipamentos();
        temps = temps.filter(t => t.toLowerCase() !== name.toLowerCase());
         try { localStorage.setItem('temporaryEquipamentos', JSON.stringify(temps)); } catch(e) { throw e; }
        return temps;
    },
    // --- REGIOES ---
    getRegioes: async () => {
        try {
            let regioes = JSON.parse(localStorage.getItem('regioes'));
            if (!regioes) {
                regioes = [
                    { id: 1, name: 'Região Tres Lagoas', neighborhoods: ['Alto Guarani', 'Arroio Leão Chácara Três Fronteiras', 'Conjunto Habitacional Fernanda', 'Conjunto Habitacional Novo Mundo', 'Conjunto Habitacional Sol de Maio', 'Conjunto Residencial Dourados', 'Conjunto Residencial Graúna', 'Conjunto Residencial Tucuruí', 'Gleba Guarani', 'Imóvel Foz do Iguaçu', 'Jardim Alvorada', 'Jardim Bandeirantes', 'Jardim Cedro', 'Jardim Congonhas', 'Jardim Ipanema', 'Jardim Mônaco', 'Jardim Porto Dourado', 'Jardim Santa Rita', 'Jardim Três Fronteiras', 'Jardim Vale do Sol', 'Jardim Vasco da Gama', 'Loteamento Don Ricardo', 'Loteamento Gleba Guarani', 'Loteamento Jardim Colombelli', 'Loteamento Jardim Imperial', 'Loteamento Jardim Madre Tereza I', 'Loteamento Jardim Madre Tereza II', 'Loteamento Menger', 'Loteamento Novo Mundo', 'Loteamento Pilarzinho', 'Loteamento Residencial Jacqueline', 'Loteamento Residencial Lagoa Vermelha', 'Loteamento São João', 'Loteamento Três Lagoas', 'Loteamento Witt', 'Parque Residencial Lagoa Azul', 'Parque Três Fronteiras (Imóvel M\'Boicy)', 'Vila Guarani', 'Vila Miranda', 'Vila Tibagi'] },
                    { id: 2, name: 'Região da Vila C', neighborhoods: ['Vila C Nova', 'Vila C Velha', 'Jardim Almada', 'Ilha Acaray', 'Imóvel Gleba Bela Vista', 'Loteamento Bela Vista II', 'Loteamento Bela Vista de Itaipu - Parte I', 'Loteamento Budel', 'Jardim Califórnia', 'Cidade Nova I', 'Cidade Nova II', 'Loteamento Jardim Curitiba', 'Jardim Evangélico', 'Jardim Florença', 'Jardim Irma', 'Jardim Itá', 'Jardim Itaipu', 'Jardim Marisa', 'Jardim Nova Califórnia', 'Jardim Olívia', 'Jardim Princesa Diana', 'Parque Linear', 'Pólo Universitário', 'Porto Belo', 'Jardim Rose Magalhães', 'Parque Industrial e Comercial São Paulo', 'Loteamento São Roque', 'Vila São Sebastião', 'Jardim Universitário das Américas I', 'Jardim Universitário das Américas II', 'Jardim Veneza', 'Vila Rural'] },
                    { id: 3, name: 'Região do São Francisco/Morumbi', neighborhoods: ['Mutirão 1º de Maio', 'Imóvel M\'Boicy', 'Jardim Copacabana II', 'Jardim Europa', 'Jardim Liberdade I', 'Jardim Pacaembu', 'Jardim San Rafael I', 'Jardim San Rafael II', 'Jardim São Miguel', 'Jardim Soledade I', 'Jardim Soledade II', 'Jardim Tarobá II', 'Jardim Terra e Lar', 'Loteamento Residencial Itália (Jardim Itália)', 'Loteamento Jardim Residencial Caiobá', 'Loteamento Rincão São Francisco (Cohapar III)', 'Parque Residencial Morumbi I', 'Parque Residencial Morumbi II', 'Parque Residencial Morumbi III', 'Parque Residencial Morumbi IV', 'Parque Residencial Santa Rita (Jardim Santa Rita)', 'Portal da Foz', 'Vila Borges', 'Vila das Batalhas', 'Vila Independente'] },
                    { id: 4, name: 'Região do Porto Meira', neighborhoods: ['Condomínio Horizontal Fechado Quinta do Sol (Jardim Quinta do Sol)', 'Condomínio Lazer Helena', 'Condomínio Residencial Fechado Solar das Crisálidas (Conjunto Residencial Yang Ming)', 'Conjunto Remador', 'Conjunto Residencial Aristides Merhy (Profilurb I)', 'Conjunto Residencial Piracema (Profilurb II)', 'Jardim Ana Rouver', 'Jardim Boa Esperança', 'Jardim Cecília', 'Jardim das Flores', 'Jardim Elisa I', 'Jardim Elisa II', 'Jardim Guaíra', 'Jardim do Horto', 'Jardim Iara', 'Jardim Morenitas I', 'Jardim Morenitas II', 'Jardim Oriente', 'Jardim Polônia', 'Jardim Residencial Deville', 'Jardim Santa Cecília II', 'Jardim Tropical', 'Jardim Veraneio', 'Loteamento Bourbon', 'Loteamento Nossa Senhora da Luz (Jardim Nossa Senhora da Luz)', 'Loteamento Parque das Três Fronteiras', 'Parque Residencial Ouro Verde (Parque Ouro Verde)', 'Parque do Patriarca', 'Sohab', 'Vila Adriana I', 'Vila Adriana II', 'Vila Padre Monti', 'Vila Shalom'] },
                    { id: 5, name: 'Região do Jardim São Paulo', neighborhoods: ['Chácaras Dom Emílio', 'Cognópolis', 'Condomínio Residencial Fechado Village Iguaçu', 'Jardim Copacabana I', 'Jardim Dom Miguel Osman', 'Jardim Dom Pedro I', 'Jardim Dona Fátima Osman', 'Jardim Dona Leila', 'Jardim Estela', 'Jardim Niterói I', 'Jardim Niterói II', 'Jardim Panorama I', 'Jardim Panorama II', 'Jardim Primavera', 'Jardim Residencial Bela Vista', 'Jardim Residencial São Roque I', 'Jardim Residencial São Roque II', 'Jardim São Bento', 'Jardim São Luiz', 'Jardim São Paulo I', 'Jardim São Paulo II', 'Jardim Residencial São Roque III', 'Jardim Três Pinheiros', 'Jardim Vitória', 'Linha Guarapuava', 'Loteamento Lindóia', 'Loteamento Residencial Cohiguaçu', 'Loteamento Residencial Iguaçu'] },
                    { id: 6, name: 'Região do Jardim América', neighborhoods: ['Condomínio Horizontal Fechado Maria Tereza', 'Condomínio Horizontal Fechado Moradas do Parque', 'Imóvel Madeireira', 'Imóvel Nardina Duso', 'Imóvel Olaria Fulgêncio', 'Imóvel Portes', 'Imóvel Porto Alegre', 'Imóvel Rodrigues "A"', 'Imóvel Santo Inácio', 'Jardim América', 'Jardim Boa Vista', 'Jardim Central', 'Jardim Cristina', 'Jardim das Nações', 'Jardim Jupira', 'Loteamento Paraguaçu', 'Loteamento Renato Festugato (Jardim Festugato)', 'Parque Monjolo (Jardim Comercial das Bandeiras)', 'Vila Brasília', 'Vila Paraguaia', 'Vila Pérola', 'Vila Portes'] },
                    { id: 7, name: 'Região do Parque Imperatriz', neighborhoods: ['Condomínio Arco di Roma', 'Conjunto Habitacional Fechado Lago dos Cisnes', 'Conjunto Habitacional Parque Imperatriz', 'Conjunto Habitacional Plaza', 'Distrito Industrial', 'Jardim Ana Cristina', 'Jardim Aurora', 'Jardim Canadá I', 'Jardim Canadá II', 'Jardim Curitibano IV', 'Jardim das Palmeiras I', 'Jardim das Palmeiras II', 'Jardim Dona Rocca', 'Jardim Duarte', 'Jardim Lancaster I', 'Jardim Lancaster III', 'Jardim Lancaster IV', 'Jardim Lancaster V', 'Jardim Nacional', 'Parque Imperatriz', 'Parque Presidente II', 'Parque Residencial Três Bandeiras', 'Pilar Parque Campestre', 'Vila Braz', 'Vila Santo Antônio'] },
                    { id: 8, name: 'Região da Vila A', neighborhoods: ['Condomínio Horizontal Fechado Porto Seguro', 'Conjunto Belvedere I', 'Loteamento Belvedere I', 'Conjunto Residencial Aporã', 'Jardim das Laranjeiras', 'Jardim Bárbara', 'Jardim Curitibano I', 'Jardim Curitibano II', 'Jardim Curitibano III', 'Jardim Estrela', 'Jardim Ipê I', 'Jardim Ipê II', 'Jardim Ipê III', 'Jardim Jasmim', 'Jardim Lancaster II', 'Jardim Norma', 'Jardim Paraná', 'Jardim Petrópolis', 'Jardim Santa Rosa', 'Parque Residencial Karla', 'Vila A', 'Vila B'] },
                    { id: 9, name: 'Região do Centro/Vila Yolanda', neighborhoods: ['Centro', 'Vila Maracanã', 'Vila Itajubá (Jardim Itajubá)', 'Vila Remígio', 'Jardim Los Angeles', 'Condomínio Horizontal Fechado Residencial Central Park', 'Condomínio Horizontal Country Iguaçu', 'Jardim Eldorado', 'Jardim Esmeralda I', 'Jardim Esmeralda II', 'Jardim Guarapuava I', 'Jardim Guarapuava II', 'Jardim Iguaçu', 'Jardim Naipi', 'Jardim Social I', 'Jardim Social II', 'Jardim Tarobá (Cohapar I)', 'Loteamento Roth', 'Loteamento Parque M\'Boicy', 'Vila Bom Jesus', 'Vila Matilde', 'Vila Yolanda'] },
                    { id: 10, name: 'Região do Campos do Iguaçu', neighborhoods: ['Alto São Francisco', 'Beverly Falls Park', 'Campos do Iguaçu I', 'Campos do Iguaçu II (Cohapar II)', 'Condomínio Fechado Residencial Castel Franco', 'Condomínio Horizontal Fechado Izadora Parque', 'Conjunto Libra I', 'Conjunto Libra II', 'Conjunto Libra III', 'Conjunto Libra IV', 'Flamboyant', 'Imóvel Acaraizinho', 'Imóvel Edmundo Weirich', 'Imóvel Sotelo', 'Jardim Acaray', 'Jardim Alice I', 'Jardim Alice II', 'Jardim Amazonas', 'Jardim Cappuccino', 'Jardim Cláudia', 'Jardim João Paulo II', 'Jardim Langwinski', 'Jardim Liberdade II', 'Jardim Manaus', 'Jardim Pólo Centro', 'Jardim Residencial Itamaraty (Jardim Itamaraty)', 'Loteamento Amauri Rainho', 'Loteamento Rincão São Francisco (Cohapar III) (parte)', 'Loteamento Santos Guglielmi', 'Parque Presidente I', 'Vila CR-1', 'Vila Militar'] },
                    { id: 11, name: 'Região da Vila Carimã', neighborhoods: ['Condomínio Mata Verde', 'Jardim Comercial e Residencial Cataratas', 'Jardim Novo Horizonte', 'Loteamento Darcy Werner', 'Loteamento Dona Amanda', 'Loteamento João Gonçalves Batista', 'Parte Norte', 'Parte Sul', 'Vila Anita Garibaldi', 'Vila Carimã'] },
                    { id: 12, name: 'Região Rural', neighborhoods: ['Região Rural Norte', 'Alto da Boa Vista', 'Área Itaipu Binacional', 'Gleba Passo Cuê', 'Região Rural Leste/Sul', 'Aeroporto', 'Imóvel Alwin', 'Vila Aparecidinha', 'Arroio Dourado (Gleba II)', 'Condomínio Residencial Campo dos Sonhos', 'Condomínio Chácara Natureza', 'Condomínio Residencial Serenologia', 'Linha Keller', 'Parque Nacional', 'Imóvel Tamanduá', 'Imóvel Tamanduazinho', 'Remanso Grande (Gleba I)', 'Sanga Funda', 'São João', 'Região Rural Bananal', 'Vila Bananal'] }
                ];
                localStorage.setItem('regioes', JSON.stringify(regioes));
            }
            return regioes;
        } catch (e) { return []; }
    },
    saveRegiao: async (regiaoData) => {
        const regioes = await backend.getRegioes();
        if (regiaoData.id) {
            const index = regioes.findIndex(r => r.id === regiaoData.id);
            if (index !== -1) regioes[index] = regiaoData;
        } else {
            regiaoData.id = Date.now();
            regioes.push(regiaoData);
        }
        try {
            localStorage.setItem('regioes', JSON.stringify(regioes));
        } catch(e) { throw e; }
        return regioes;
    },
    deleteRegiao: async (id) => {
        let regioes = await backend.getRegioes();
        regioes = regioes.filter(r => r.id !== id);
        try {
            localStorage.setItem('regioes', JSON.stringify(regioes));
        } catch (e) { throw e; }
        return regioes;
    },
    // --- PENDING NEIGHBORHOODS ---
    getPendingNeighborhoods: async () => {
        try {
            const pending = localStorage.getItem('pendingNeighborhoods');
            return pending ? JSON.parse(pending) : [];
        } catch (e) { return []; }
    },
    addPendingNeighborhood: async (neighborhood) => {
        const pending = await backend.getPendingNeighborhoods();
        const lowerCasePending = pending.map(p => p.toLowerCase());
        const lowerCaseNeighborhood = neighborhood.toLowerCase();
        if (!lowerCasePending.includes(lowerCaseNeighborhood)) {
            pending.push(neighborhood);
            try { localStorage.setItem('pendingNeighborhoods', JSON.stringify(pending)); } catch(e) { throw e; }
        }
        return pending;
    },
    deletePendingNeighborhood: async (neighborhood) => {
        let pending = await backend.getPendingNeighborhoods();
        const lowerCaseNeighborhood = neighborhood.toLowerCase();
        pending = pending.filter(p => p.toLowerCase() !== lowerCaseNeighborhood);
        try { localStorage.setItem('pendingNeighborhoods', JSON.stringify(pending)); } catch(e) { throw e; }
        return pending;
    },
    updateClientsRegion: async (neighborhood, regionName) => {
        const clients = await backend.getClientes();
        let updated = false;
        const updatedClients = clients.map(client => {
            if (client.address && client.address.neighborhood && client.address.neighborhood.toLowerCase() === neighborhood.toLowerCase()) {
                client.address.region = regionName;
                updated = true;
            }
            return client;
        });
        if (updated) {
            try { localStorage.setItem('clients', JSON.stringify(updatedClients)); } catch (e) { throw e; }
        }
        return updatedClients;
    },
    // --- ROTAS ---
    getRotas: async (): Promise<any[]> => {
        try {
            const rotas = localStorage.getItem('rotas');
            if (rotas) {
                const parsed = JSON.parse(rotas);
                return Array.isArray(parsed) ? parsed : [];
            }
            return [];
        } catch (e) { 
            console.error("Falha ao buscar ou analisar rotas do localStorage", e);
            return []; 
        }
    },
    saveRotas: async (rotasToSave) => {
        try {
            localStorage.setItem('rotas', JSON.stringify(rotasToSave));
        } catch(e) { throw e; }
        return rotasToSave;
    },
    deleteRota: async (id) => {
        let rotas = await backend.getRotas();
        rotas = rotas.filter(r => r.id !== id);
        try {
            localStorage.setItem('rotas', JSON.stringify(rotas));
        } catch (e) { throw e; }
        return rotas;
    },
    // --- CAIXA & FINANCEIRO ---
    getCaixaTransactions: async () => {
        try {
            let transactions = JSON.parse(localStorage.getItem('caixa_transactions'));
            if(!transactions) {
                 transactions = [
                    { id: 1, type: 'Particular', clientName: 'Maria Oliveira', description: 'Faturamento Chamado #202', amount: 350.00, date: new Date(2024, 6, 22).toISOString() }
                 ];
                 localStorage.setItem('caixa_transactions', JSON.stringify(transactions));
            }
            return transactions;
        } catch(e) { return []; }
    },
    getFinanceiroEntries: async () => {
        try {
            let entries = JSON.parse(localStorage.getItem('financeiro_entries'));
            if(!entries) {
                 entries = [
                     { id: 1, type: 'Empresa', clientName: 'Varejo Brasil', description: 'Faturamento Chamado #199', amount: 1200.00, dueDate: new Date(2024, 7, 15).toISOString(), status: 'Pendente' }
                 ];
                 localStorage.setItem('financeiro_entries', JSON.stringify(entries));
            }
            return entries;
        } catch(e) { return []; }
    },
    bulkInvoiceChamados: async (chamadosToInvoice, paymentMethod) => {
        const allChamados = await backend.getChamados();
        const transactions = await backend.getCaixaTransactions();
        const entries = await backend.getFinanceiroEntries();

        const chamadosToInvoiceIds = chamadosToInvoice.map(c => c.id);
        let itemsAdded = false;

        for (const chamado of chamadosToInvoice) {
            const totalValue = chamado.items?.reduce((acc, item) => acc + item.totalPrice, 0) || 0;
            if (totalValue > 0) {
                itemsAdded = true;
                const description = `Faturamento Chamado #${chamado.id}`;
                const entry = {
                    id: Date.now() + Math.random(),
                    type: chamado.billingType,
                    clientName: chamado.clientName,
                    description,
                    amount: totalValue,
                    date: new Date().toISOString()
                };

                if (paymentMethod === 'À Vista') {
                    transactions.unshift(entry);
                } else { // A Prazo
                    entries.unshift({ ...entry, status: 'Pendente', dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() });
                }
            }
        }
        
        const updatedChamados = allChamados.map(c => {
            if (chamadosToInvoiceIds.includes(c.id)) {
                return { ...c, invoiced: true, status: 'Concluído' };
            }
            return c;
        });

        try {
            if (itemsAdded) {
                if (paymentMethod === 'À Vista') {
                    localStorage.setItem('caixa_transactions', JSON.stringify(transactions));
                } else {
                    localStorage.setItem('financeiro_entries', JSON.stringify(entries));
                }
            }
            localStorage.setItem('chamados', JSON.stringify(updatedChamados));
        } catch (e) {
            throw new Error('Falha ao salvar faturamento em lote.');
        }
        return updatedChamados;
    },
    invoiceChamado: async (chamado, paymentMethod) => {
        const totalValue = chamado.items?.reduce((acc, item) => acc + item.totalPrice, 0) || 0;

        // 1. Add financial entry only if value > 0
        if (totalValue > 0) {
            const description = `Faturamento Chamado #${chamado.id}`;
            const entry = {
                id: Date.now(),
                type: chamado.billingType,
                clientName: chamado.clientName,
                description,
                amount: totalValue,
                date: new Date().toISOString()
            };

            if (paymentMethod === 'À Vista') {
                const transactions = await backend.getCaixaTransactions();
                transactions.unshift(entry);
                 try { localStorage.setItem('caixa_transactions', JSON.stringify(transactions)); } catch(e) { throw new Error('Falha ao salvar no caixa'); }
            } else { // A Prazo
                const entries = await backend.getFinanceiroEntries();
                entries.unshift({ ...entry, status: 'Pendente', dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() });
                 try { localStorage.setItem('financeiro_entries', JSON.stringify(entries)); } catch(e) { throw new Error('Falha ao salvar no financeiro'); }
            }
        }

        // 2. Mark chamado as invoiced and completed
        const allChamados = await backend.getChamados();
        const index = allChamados.findIndex(c => c.id === chamado.id);
        if (index !== -1) {
            allChamados[index].invoiced = totalValue > 0;
            allChamados[index].status = 'Concluído';
            try { localStorage.setItem('chamados', JSON.stringify(allChamados)); } catch(e) { throw new Error('Falha ao atualizar status do chamado'); }
        }
        
        // 3. Check if route should be finalized
        const allRotas = await backend.getRotas();
        const rotaOfChamado = allRotas.find(r => Array.isArray(r.chamadoIds) && r.chamadoIds.includes(chamado.id));
        
        if (rotaOfChamado) {
            const chamadosIdsInRota = rotaOfChamado.chamadoIds;
            // Check status of all chamados in the route using the freshest `allChamados` data
            const allCompleted = chamadosIdsInRota.every(chamadoId => {
                const c = allChamados.find(ch => ch.id === chamadoId);
                return c && c.status === 'Concluído';
            });

            if (allCompleted) {
                const rotaIndex = allRotas.findIndex(r => r.id === rotaOfChamado.id);
                if (rotaIndex !== -1) {
                    allRotas[rotaIndex].status = 'Finalizada';
                    try {
                        localStorage.setItem('rotas', JSON.stringify(allRotas));
                    } catch(e) {
                        throw new Error('Falha ao finalizar a rota.');
                    }
                }
            }
        }
        
        return allChamados;
    }
};