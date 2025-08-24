import React, { useState } from 'react';
import {
    LayoutDashboardIcon, BoxIcon, UsersIcon, RouteIcon, DollarSignIcon, ArchiveIcon, ChevronDownIcon,
    TerminalIcon, LogOutIcon, MenuIcon, ChevronRightIcon, FileTextIcon, LandmarkIcon
} from '../components/Icons';

export const Sidebar = ({ activePage, onNavigate, onToggleLogPanel, isOpen }) => {
    const [isCadastrosOpen, setIsCadastrosOpen] = useState(false);
    const navItems = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboardIcon },
        { id: 'produtos', label: 'Produtos', icon: BoxIcon },
        { id: 'clientes', label: 'Clientes', icon: UsersIcon },
        { id: 'chamados', label: 'Chamados', icon: FileTextIcon },
        { id: 'caixa', label: 'Caixa', icon: DollarSignIcon },
        { id: 'financeiro', label: 'Financeiro', icon: LandmarkIcon },
        { id: 'rotas', label: 'Rotas', icon: RouteIcon },
    ];
    return (
        <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-gray-800 flex flex-col flex-shrink-0 border-r border-gray-700/50 transition-transform duration-300 ease-in-out md:static md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
            <div className="h-16 flex items-center justify-center px-4 border-b border-gray-700/50">
                <h1 className="text-2xl font-bold text-white tracking-wider">GestaoPro</h1>
            </div>
            <nav className="flex-1 overflow-y-auto sidebar-scroll p-4 space-y-1">
                {navItems.map(item => (
                    <a
                        key={item.id}
                        href="#"
                        onClick={(e) => { e.preventDefault(); onNavigate(item.id, item.label); }}
                        className={`flex items-center px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${activePage === item.id ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`}
                    >
                        <item.icon className="w-5 h-5 mr-3" />
                        <span>{item.label}</span>
                    </a>
                ))}
                 {/* Cadastros Accordion */}
                <div className="pt-2">
                    <button onClick={() => setIsCadastrosOpen(!isCadastrosOpen)} className="flex items-center justify-between w-full px-4 py-2.5 text-sm font-medium rounded-lg transition-colors text-gray-300 hover:bg-gray-700 hover:text-white">
                        <div className="flex items-center">
                            <ArchiveIcon className="w-5 h-5 mr-3" />
                            <span>Cadastros</span>
                        </div>
                        <ChevronDownIcon className={`w-5 h-5 transition-transform ${isCadastrosOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {isCadastrosOpen && (
                        <div className="pl-6 mt-2 space-y-2">
                            <a href="#" onClick={(e) => { e.preventDefault(); onNavigate('product-settings', 'Config. de Produtos'); }} className={`flex items-center px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${activePage === 'product-settings' ? 'text-blue-400 font-semibold' : 'text-gray-400 hover:text-white'}`}>
                                <span>Config. de Produtos</span>
                            </a>
                            <a href="#" onClick={(e) => { e.preventDefault(); onNavigate('equipamentos', 'Equipamentos'); }} className={`flex items-center px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${activePage === 'equipamentos' ? 'text-blue-400 font-semibold' : 'text-gray-400 hover:text-white'}`}>
                                <span>Equipamentos</span>
                            </a>
                            <a href="#" onClick={(e) => { e.preventDefault(); onNavigate('regioes', 'Regiões'); }} className={`flex items-center px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${activePage === 'regioes' ? 'text-blue-400 font-semibold' : 'text-gray-400 hover:text-white'}`}>
                                <span>Regiões</span>
                            </a>
                        </div>
                    )}
                </div>
            </nav>
            <div className="p-4 space-y-2 border-t border-gray-700/50">
                <a href="#" onClick={(e) => { e.preventDefault(); onToggleLogPanel(); }} className="flex items-center w-full px-4 py-2.5 text-sm font-medium rounded-lg transition-colors text-gray-300 hover:bg-gray-700 hover:text-white">
                    <TerminalIcon className="w-5 h-5 mr-3" />
                    <span>Painel de Logs</span>
                </a>
                <div className="group relative">
                    <div className="flex items-center w-full p-2 text-sm font-medium text-left text-white bg-gray-700/50 rounded-lg hover:bg-gray-700 cursor-pointer">
                        <img className="w-8 h-8 rounded-full mr-3" src="https://i.pravatar.cc/100?u=admin" alt="Admin"/>
                        <div className="flex-1">
                           <p className="font-semibold">Admin</p>
                           <p className="text-xs text-gray-400">Ver Perfil</p>
                        </div>
                        <LogOutIcon className="w-5 h-5 text-gray-400 group-hover:text-red-400 transition-colors"/>
                    </div>
                </div>
            </div>
        </aside>
    );
};

export const Header = ({ breadcrumbs, onMenuClick }) => (
    <header className="flex-shrink-0 h-16 bg-gray-800/50 backdrop-blur-sm border-b border-gray-700/50 flex items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center">
            <nav aria-label="breadcrumb">
                <ol className="flex items-center space-x-2 text-gray-400 text-sm">
                    {breadcrumbs.map((crumb, index) => (
                        <li key={index} className="flex items-center">
                            {index > 0 && <ChevronRightIcon className="w-4 h-4 text-gray-500 mx-1" />}
                            <span className={index === breadcrumbs.length - 1 ? "font-medium text-white" : "hover:text-white"}>{crumb}</span>
                        </li>
                    ))}
                </ol>
            </nav>
        </div>
        <button onClick={onMenuClick} className="p-2 text-gray-400 rounded-lg hover:bg-gray-700 hover:text-white transition-colors md:hidden" aria-label="Abrir menu">
            <MenuIcon className="w-6 h-6" />
        </button>
    </header>
);