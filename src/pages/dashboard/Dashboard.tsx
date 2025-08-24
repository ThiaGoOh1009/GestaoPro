import React, { useState, useEffect } from 'react';
import { backend } from '../../services/storage';
import { UsersIcon, BoxIcon, DollarSignIcon, TrendingUpIcon, CheckCircle2Icon } from '../../components/Icons';

const StatCard = ({ icon, title, value, change, borderColor, iconBg, iconColor }) => {
    const Icon = icon;
    return (
        <div className={`bg-gray-800 p-6 rounded-xl shadow-lg border-l-4 ${borderColor}`}>
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-gray-400 uppercase tracking-wider">{title}</p>
                    <p className="text-3xl font-bold text-white mt-1">{value}</p>
                </div>
                <div className={`p-3 rounded-full ${iconBg}`}>
                    <Icon className={`w-7 h-7 ${iconColor}`} />
                </div>
            </div>
            {change && (
                <p className={`text-sm mt-4 flex items-center text-gray-400`}>
                    <TrendingUpIcon className="w-4 h-4 mr-1.5" />
                    {change}
                </p>
            )}
        </div>
    );
};


const DashboardSkeleton = () => (
     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
        {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-gray-800 p-6 rounded-xl shadow-lg">
                <div className="flex items-center justify-between">
                    <div>
                        <div className="h-4 bg-gray-700 rounded w-24 mb-2"></div>
                        <div className="h-8 bg-gray-700 rounded w-16"></div>
                    </div>
                    <div className="w-12 h-12 bg-gray-700 rounded-full"></div>
                </div>
            </div>
        ))}
    </div>
);


export const Dashboard = ({ addLog }) => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            setLoading(true);
            try {
                const [clients, products] = await Promise.all([
                    backend.getClientes(),
                    backend.getProdutos()
                ]);

                const activeClients = clients.filter(c => c.status === 'Ativo').length;
                const totalProducts = products.filter(p => p.type === 'Produto').length;
                const totalServices = products.filter(p => p.type === 'Serviço').length;
                const totalRevenue = products.reduce((acc, p) => acc + p.price, 0);

                setStats({
                    totalClients: clients.length,
                    activeClients,
                    totalProducts,
                    totalServices,
                    totalRevenue,
                });
                addLog('Estatísticas do dashboard carregadas.');
            } catch (error) {
                addLog(`Erro ao carregar estatísticas do dashboard: ${error.message}`);
                console.error("Dashboard error:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, [addLog]);

    if (loading) {
        return (
            <div>
                <header className="mb-8">
                    <h2 className="text-3xl font-bold text-white">Dashboard</h2>
                    <p className="text-gray-400 mt-1">Visão geral do seu negócio.</p>
                </header>
                <DashboardSkeleton />
            </div>
        );
    }

    return (
        <div>
            <header className="mb-8">
                <h2 className="text-3xl font-bold text-white">Dashboard</h2>
                <p className="text-gray-400 mt-1">Visão geral do seu negócio.</p>
            </header>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard 
                    icon={UsersIcon}
                    title="Total de Clientes"
                    value={stats.totalClients}
                    change={`${stats.activeClients} ativos`}
                    borderColor="border-blue-500"
                    iconBg="bg-blue-500/10"
                    iconColor="text-blue-400"
                />
                <StatCard 
                    icon={BoxIcon}
                    title="Itens no Catálogo"
                    value={stats.totalProducts + stats.totalServices}
                    change={`${stats.totalProducts} produtos, ${stats.totalServices} serviços`}
                    borderColor="border-green-500"
                    iconBg="bg-green-500/10"
                    iconColor="text-green-400"
                />
                <StatCard 
                    icon={DollarSignIcon}
                    title="Receita Potencial"
                    value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.totalRevenue)}
                    change="Baseado nos preços"
                    borderColor="border-yellow-500"
                    iconBg="bg-yellow-500/10"
                    iconColor="text-yellow-400"
                />
                 <StatCard 
                    icon={CheckCircle2Icon}
                    title="Status do Sistema"
                    value="Operacional"
                    change="Todos os serviços online"
                    borderColor="border-teal-500"
                    iconBg="bg-teal-500/10"
                    iconColor="text-teal-400"
                />
            </div>
        </div>
    );
};