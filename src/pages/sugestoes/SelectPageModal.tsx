import React, { useState } from 'react';
import { Modal } from '../../components/Modal';
import { LayoutDashboardIcon, UsersIcon, BoxIcon, FileTextIcon, RouteIcon, LandmarkIcon, ArchiveIcon, ArrowLeftIcon } from '../../components/Icons';

interface SelectPageModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectPage: (pageName: string) => void;
}

const pageConfig = [
    { name: 'Dashboard', icon: LayoutDashboardIcon },
    { name: 'Produtos e Serviços', icon: BoxIcon },
    { name: 'Chamados', icon: FileTextIcon },
    { name: 'Rotas', icon: RouteIcon },
    { 
        name: 'Clientes / Fornecedores', 
        icon: UsersIcon,
        subPages: [
            { name: 'Visão Geral (Ambos)', targetPage: 'Clientes / Fornecedores' },
            { name: 'Apenas Clientes', targetPage: 'Clientes' },
            { name: 'Apenas Fornecedores', targetPage: 'Fornecedores' },
        ]
    },
    { 
        name: 'Financeiro', 
        icon: LandmarkIcon,
        subPages: [
            { name: 'Visão Geral (Ambos)', targetPage: 'Financeiro' },
            { name: 'Contas a Receber', targetPage: 'Contas a Receber' },
            { name: 'Contas a Pagar', targetPage: 'Contas a Pagar' },
            { name: 'Lançamentos Recorrentes', targetPage: 'Lançamentos Recorrentes' },
        ]
    },
    { 
        name: 'Cadastros', 
        icon: ArchiveIcon,
        subPages: [
            { name: 'Config. de Produtos', targetPage: 'Config. de Produtos' },
            { name: 'Equipamentos', targetPage: 'Equipamentos' },
            { name: 'Regiões', targetPage: 'Regiões' },
            { name: 'Tipos de Solicitação', targetPage: 'Tipos de Solicitação' },
            { name: 'Dados da Empresa', targetPage: 'Dados da Empresa' },
            { name: 'Config. do Banco', targetPage: 'Config. do Banco' },
        ]
    },
];

export const SelectPageModal: React.FC<SelectPageModalProps> = ({ isOpen, onClose, onSelectPage }) => {
    const [view, setView] = useState('main'); // 'main' or 'sub'
    const [selectedParent, setSelectedParent] = useState<any | null>(null);

    const handleMainPageClick = (page) => {
        if (page.subPages) {
            setSelectedParent(page);
            setView('sub');
        } else {
            onSelectPage(page.name);
        }
    };
    
    const handleSubPageClick = (subPage) => {
        onSelectPage(subPage.targetPage);
    };

    const handleBack = () => {
        setView('main');
        setSelectedParent(null);
    };

    const renderMainView = () => (
        <>
            <p className="text-gray-400 text-center">Para qual parte do sistema é a sua sugestão de melhoria?</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4">
                {pageConfig.map(page => {
                    const Icon = page.icon;
                    return (
                        <button
                            key={page.name}
                            onClick={() => handleMainPageClick(page)}
                            className="flex flex-col items-center justify-center p-4 bg-gray-700/50 rounded-lg text-white hover:bg-gray-700 hover:ring-2 hover:ring-blue-500 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 aspect-square"
                        >
                            <Icon className="w-10 h-10 mb-2 text-blue-400" />
                            <span className="text-sm font-semibold text-center">{page.name}</span>
                        </button>
                    );
                })}
            </div>
        </>
    );

    const renderSubView = () => {
        if (!selectedParent) return null;
        const Icon = selectedParent.icon;
        
        return (
            <div>
                <button onClick={handleBack} className="flex items-center gap-2 mb-4 text-sm text-blue-400 hover:text-blue-300">
                    <ArrowLeftIcon className="w-5 h-5"/>
                    Voltar
                </button>
                <div className="flex items-center justify-center gap-3 mb-4 p-4 bg-gray-900/50 rounded-lg">
                    <Icon className="w-8 h-8 text-blue-400" />
                    <h3 className="text-xl font-semibold text-white">Refinar {selectedParent.name}</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {selectedParent.subPages.map(subPage => (
                        <button
                            key={subPage.name}
                            onClick={() => handleSubPageClick(subPage)}
                            className="w-full text-left p-4 bg-gray-700/50 rounded-lg text-white hover:bg-gray-700 hover:ring-2 hover:ring-blue-500 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <span className="font-medium">{subPage.name}</span>
                        </button>
                    ))}
                </div>
            </div>
        );
    };

    // Close and reset state when modal is closed
    const handleClose = () => {
        setView('main');
        setSelectedParent(null);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Selecionar Página para Melhoria" maxWidth="max-w-2xl" closeOnBackdropClick={false}>
            <div className="space-y-4">
                {view === 'main' ? renderMainView() : renderSubView()}
            </div>
        </Modal>
    );
};
