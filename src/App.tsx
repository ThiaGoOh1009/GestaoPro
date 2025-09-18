import React, { useState, useCallback, useEffect } from 'react';
import { Sidebar, Header } from './layout/Layout';
import { Dashboard } from './pages/dashboard/Dashboard';
import { ClientsPage } from './pages/clients/ClientsPage';
import { ProdutosPage } from './pages/products/ProdutosPage';
import { ProductSettingsPage } from './pages/products/ProductSettingsPage';
import { EquipamentosPage } from './pages/equipamentos/EquipamentosPage';
import { RegioesPage } from './pages/regioes/RegioesPage';
import { ChamadosPage } from './pages/chamados/ChamadosPage';
import { FinanceiroPage } from './pages/financeiro/FinanceiroPage';
import { RecorrenciasPage } from './pages/financeiro/RecorrenciasPage'; // Import new page
import { RotasPage } from './pages/rotas/RotasPage';
import { LogPanel } from './components/LogPanel';
import { DatabaseSettingsPage } from './pages/database/DatabaseSettingsPage';
import { FornecedoresPage } from './pages/fornecedores/FornecedoresPage';
import { EmpresaPage } from './pages/empresa/EmpresaPage';
import { RequestTypesPage } from './pages/request-types/RequestTypesPage';
import { SugestoesPage } from './pages/sugestoes/SugestoesPage';
import { InstallPrompt } from './components/InstallPrompt';
import { initializeMapsApi } from './services/api';
import { SpinnerIcon, AlertCircleIcon } from './components/Icons';

const ResolutionDisplay = () => {
    const [resolution, setResolution] = useState({
        width: window.innerWidth,
        height: window.innerHeight,
    });

    useEffect(() => {
        const handleResize = () => {
            setResolution({
                width: window.innerWidth,
                height: window.innerHeight,
            });
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <div className="fixed top-2 left-1/2 -translate-x-1/2 bg-gray-900/70 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-full shadow-lg z-40 pointer-events-none hidden md:block" data-dev-id="ResolutionDisplay">
            {resolution.width} x {resolution.height}
        </div>
    );
};

export const App = () => {
    const [activePage, setActivePage] = useState('dashboard');
    const [breadcrumbs, setBreadcrumbs] = useState(['Home', 'Dashboard']);
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const [isLogPanelOpen, setLogPanelOpen] = useState(false);
    const [logs, setLogs] = useState([]);
    const [installPromptEvent, setInstallPromptEvent] = useState<Event | null>(null);
    const [isInstallPromptVisible, setInstallPromptVisible] = useState(false);

    // State for Google Maps API initialization
    const [mapsInitializing, setMapsInitializing] = useState(true);
    const [mapsInitialized, setMapsInitialized] = useState(false);
    const [mapsError, setMapsError] = useState<string | null>(null);

    const addLog = useCallback((message) => {
        const newLog = { message, timestamp: new Date() };
        setLogs(prevLogs => [newLog, ...prevLogs.slice(0, 99)]); // Mantém os últimos 100 logs
    }, []);
    
    // Global Click Logger to automatically log interactions with identified components
    useEffect(() => {
        const handleGlobalClick = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            // Find the closest element (or the element itself) with the data-dev-id attribute
            const devIdElement = target.closest('[data-dev-id]');

            if (devIdElement) {
                const devId = devIdElement.getAttribute('data-dev-id');
                if (devId) {
                    addLog(`Click: ${devId}`);
                }
            }
        };

        // Add the event listener in the capture phase. This allows it to log clicks
        // even if event propagation is stopped by the component's own click handler.
        document.addEventListener('click', handleGlobalClick, true);

        // Cleanup the event listener when the App component unmounts
        return () => {
            document.removeEventListener('click', handleGlobalClick, true);
        };
    }, [addLog]);


    useEffect(() => {
        if (!mapsInitialized) {
            setMapsInitializing(true);
            setMapsError(null);
            initializeMapsApi()
                .then(() => {
                    setMapsInitialized(true);
                    addLog('Google Maps API inicializada com sucesso.');
                })
                .catch(err => {
                    const message = err instanceof Error ? err.message : String(err);
                    setMapsError(message);
                    addLog(`Erro ao inicializar Google Maps: ${message}`);
                })
                .finally(() => {
                    setMapsInitializing(false);
                });
        }
    }, [mapsInitialized, addLog]);

    useEffect(() => {
        const handleBeforeInstallPrompt = (event: Event) => {
            event.preventDefault();
            setInstallPromptEvent(event);

            const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
            if(isMobile) {
                setInstallPromptVisible(true);
                addLog('Solicitação de instalação de PWA disponível.');
            }
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        window.addEventListener('appinstalled', () => {
            setInstallPromptVisible(false);
            setInstallPromptEvent(null);
            addLog('PWA instalado com sucesso.');
        });

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, [addLog]);

    const handleInstall = () => {
        if (!installPromptEvent) return;
        
        (installPromptEvent as any).prompt();
        addLog('Prompt de instalação de PWA exibido.');
        (installPromptEvent as any).userChoice.then((choiceResult: { outcome: 'accepted' | 'dismissed' }) => {
            if (choiceResult.outcome === 'accepted') {
                addLog('Usuário aceitou a instalação do PWA.');
            } else {
                addLog('Usuário recusou a instalação do PWA.');
            }
            setInstallPromptEvent(null);
            setInstallPromptVisible(false);
        });
    };
    
    const handleDismissInstall = () => {
        setInstallPromptVisible(false);
        addLog('Usuário dispensou o lembrete de instalação do PWA.');
    };

    const handleNavigate = (pageId, pageLabel) => {
        setActivePage(pageId);
        setBreadcrumbs(['Home', pageLabel]);
        setSidebarOpen(false); // Fecha a sidebar no celular após a navegação
        addLog(`Navegando para: ${pageLabel}`);
    };

    const renderPage = () => {
        switch (activePage) {
            case 'dashboard':
                return <Dashboard addLog={addLog} />;
            case 'clientes':
                return <ClientsPage addLog={addLog} />;
            case 'fornecedores':
                return <FornecedoresPage addLog={addLog} />;
            case 'produtos':
                return <ProdutosPage addLog={addLog} />;
            case 'product-settings':
                return <ProductSettingsPage addLog={addLog} />;
            case 'equipamentos':
                return <EquipamentosPage addLog={addLog} />;
            case 'regioes':
                return <RegioesPage addLog={addLog} />;
            case 'request-types':
                return <RequestTypesPage addLog={addLog} />;
            case 'sugestoes':
                return <SugestoesPage addLog={addLog} />;
            case 'dados-empresa':
                return <EmpresaPage addLog={addLog} />;
            case 'chamados':
                return <ChamadosPage addLog={addLog} onNavigate={handleNavigate} />;
            case 'rotas':
                return <RotasPage addLog={addLog} />;
            case 'database-settings':
                return <DatabaseSettingsPage addLog={addLog} />;
            case 'contas-a-receber':
                 return <FinanceiroPage addLog={addLog} defaultTab="R" />;
            case 'contas-a-pagar':
                return <FinanceiroPage addLog={addLog} defaultTab="P" />;
            case 'lancamentos-recorrentes': // Add new route
                return <RecorrenciasPage addLog={addLog} />;
            default:
                return <Dashboard addLog={addLog} />;
        }
    };
    
    if (mapsError) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-gray-200 p-4">
                <div className="w-full max-w-lg text-center bg-gray-800 p-8 rounded-xl shadow-lg">
                    <AlertCircleIcon className="w-12 h-12 text-red-500 mx-auto" />
                    <h1 className="mt-4 text-2xl font-bold text-white">Erro na Inicialização dos Mapas</h1>
                    <p className="mt-2 text-gray-300">Não foi possível carregar os serviços de mapa. Verifique o seguinte:</p>
                    <p className="mt-4 text-left text-sm text-red-300 bg-gray-900/50 p-4 rounded-lg">{mapsError}</p>
                    <p className="mt-4 text-xs text-gray-500">Se o erro persistir, verifique a chave de API no arquivo de configuração e a conexão com a internet.</p>
                </div>
            </div>
        );
    }

    if (mapsInitializing || !mapsInitialized) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-gray-200">
                <SpinnerIcon className="w-10 h-10 text-blue-500" />
                <p className="mt-4 text-lg">Inicializando serviços de mapa...</p>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-gray-900 text-gray-200">
            <ResolutionDisplay />
            <Sidebar 
                activePage={activePage} 
                onNavigate={handleNavigate} 
                onToggleLogPanel={() => {
                    setLogPanelOpen(!isLogPanelOpen);
                    addLog('Painel de logs alternado.');
                }} 
                isOpen={isSidebarOpen} 
            />

            <div className="flex-1 flex flex-col overflow-hidden">
                <Header 
                    breadcrumbs={breadcrumbs}
                    onNavigate={handleNavigate}
                    onMenuClick={() => {
                        setSidebarOpen(!isSidebarOpen);
                        addLog('Sidebar (mobile) alternada.');
                    }} 
                />
                <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 sm:p-6 lg:p-8">
                    {renderPage()}
                </main>
            </div>
            
            <LogPanel 
                isOpen={isLogPanelOpen}
                onClose={() => setLogPanelOpen(false)}
                logs={logs}
                onClear={() => { setLogs([]); addLog("Logs limpos."); }}
            />
             {isInstallPromptVisible && installPromptEvent && (
                <InstallPrompt 
                    onInstall={handleInstall}
                    onDismiss={handleDismissInstall}
                />
            )}
        </div>
    );
};