import React, { useState, useCallback } from 'react';
import { Sidebar, Header } from './layout/Layout';
import { Dashboard } from './pages/dashboard/Dashboard';
import { ClientsPage } from './pages/clients/ClientsPage';
import { ProdutosPage } from './pages/products/ProdutosPage';
import { ProductSettingsPage } from './pages/products/ProductSettingsPage';
import { EquipamentosPage } from './pages/equipamentos/EquipamentosPage';
import { RegioesPage } from './pages/regioes/RegioesPage';
import { ChamadosPage } from './pages/chamados/ChamadosPage';
import { CaixaPage } from './pages/caixa/CaixaPage';
import { FinanceiroPage } from './pages/financeiro/FinanceiroPage';
import { RotasPage } from './pages/rotas/RotasPage';
import { LogPanel } from './components/LogPanel';

// Componentes substitutos para páginas ainda não implementadas completamente
const PlaceholderPage = ({ title }) => (
    <div>
        <h2 className="text-3xl font-bold text-white">{title}</h2>
        <p className="text-gray-400 mt-1">Página em construção.</p>
    </div>
);

export const App = () => {
    const [activePage, setActivePage] = useState('dashboard');
    const [breadcrumbs, setBreadcrumbs] = useState(['Home', 'Dashboard']);
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const [isLogPanelOpen, setLogPanelOpen] = useState(false);
    const [logs, setLogs] = useState([]);

    const addLog = useCallback((message) => {
        const newLog = { message, timestamp: new Date() };
        setLogs(prevLogs => [newLog, ...prevLogs.slice(0, 99)]); // Mantém os últimos 100 logs
    }, []);

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
            case 'produtos':
                return <ProdutosPage addLog={addLog} />;
            case 'product-settings':
                return <ProductSettingsPage addLog={addLog} />;
            case 'equipamentos':
                return <EquipamentosPage addLog={addLog} />;
            case 'regioes':
                return <RegioesPage addLog={addLog} />;
            case 'chamados':
                return <ChamadosPage addLog={addLog} onNavigate={handleNavigate} />;
            case 'caixa':
                return <CaixaPage addLog={addLog} />;
            case 'financeiro':
                return <FinanceiroPage addLog={addLog} />;
            case 'rotas':
                return <RotasPage addLog={addLog} />;
            default:
                return <Dashboard addLog={addLog} />;
        }
    };

    return (
        <div className="flex h-screen bg-gray-900 text-gray-200">
            <Sidebar 
                activePage={activePage} 
                onNavigate={handleNavigate} 
                onToggleLogPanel={() => setLogPanelOpen(!isLogPanelOpen)} 
                isOpen={isSidebarOpen} 
            />

            <div className="flex-1 flex flex-col overflow-hidden">
                <Header 
                    breadcrumbs={breadcrumbs} 
                    onMenuClick={() => setSidebarOpen(!isSidebarOpen)} 
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
        </div>
    );
};