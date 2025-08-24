import React, { useState, useEffect, useMemo } from 'react';
import { backend } from '../../services/storage';
import { LandmarkIcon, DollarSignIcon } from '../../components/Icons';

export const CaixaPage = ({ addLog }) => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState('Particular'); // Particular ou Empresa

    useEffect(() => {
        const loadTransactions = async () => {
            setLoading(true);
            try {
                const data = await backend.getCaixaTransactions();
                setTransactions(data);
                addLog(`Carregados ${data.length} lançamentos do caixa.`);
            } catch (error) {
                addLog(`Erro ao carregar caixa: ${error.message}`);
            } finally {
                setLoading(false);
            }
        };
        loadTransactions();
    }, [addLog]);

    const filteredTransactions = useMemo(() => {
        return transactions.filter(t => t.type === view);
    }, [transactions, view]);

    const total = useMemo(() => {
        return filteredTransactions.reduce((acc, t) => acc + t.amount, 0);
    }, [filteredTransactions]);

    const formatCurrency = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

    return (
        <div>
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
                <div>
                    <h2 className="text-3xl font-bold text-white">Caixa</h2>
                    <p className="text-gray-400 mt-1">Lançamentos recebidos à vista.</p>
                </div>
                <div className="flex rounded-lg bg-gray-800 p-1 mt-4 sm:mt-0">
                    <button
                        onClick={() => setView('Particular')}
                        className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors ${view === 'Particular' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}
                    >
                        Particular
                    </button>
                    <button
                        onClick={() => setView('Empresa')}
                        className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors ${view === 'Empresa' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}
                    >
                        Empresa
                    </button>
                </div>
            </header>

            <div className="bg-gray-800 rounded-xl shadow-lg">
                <div className="p-6 border-b border-gray-700/50 flex justify-between items-center">
                     <h3 className="text-lg font-semibold text-white">Lançamentos - {view}</h3>
                     <div className="text-right">
                        <p className="text-sm text-gray-400">Total em Caixa</p>
                        <p className="text-2xl font-bold text-green-400">{formatCurrency(total)}</p>
                     </div>
                </div>
                {loading ? (
                    <p className="p-6 text-center text-gray-400">Carregando...</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-gray-300">
                            <thead className="text-xs text-gray-400 uppercase bg-gray-800">
                                <tr>
                                    <th scope="col" className="px-6 py-4">Cliente</th>
                                    <th scope="col" className="px-6 py-4">Data</th>
                                    <th scope="col" className="px-6 py-4">Descrição</th>
                                    <th scope="col" className="px-6 py-4 text-right">Valor</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredTransactions.map(transaction => (
                                    <tr key={transaction.id} className="bg-gray-800 border-b border-gray-700/50 hover:bg-gray-700/50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-white">{transaction.clientName || 'N/A'}</td>
                                        <td className="px-6 py-4">{new Date(transaction.date).toLocaleDateString()}</td>
                                        <td className="px-6 py-4">{transaction.description}</td>
                                        <td className="px-6 py-4 text-right font-semibold text-green-400">{formatCurrency(transaction.amount)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {filteredTransactions.length === 0 && (
                            <p className="p-8 text-center text-gray-500">Nenhum lançamento encontrado para a visualização "{view}".</p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};