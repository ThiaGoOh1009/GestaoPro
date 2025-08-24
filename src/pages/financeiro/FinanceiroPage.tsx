import React, { useState, useEffect, useMemo } from 'react';
import { backend } from '../../services/storage';
import { CreditCardIcon } from '../../components/Icons';

export const FinanceiroPage = ({ addLog }) => {
    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState('Particular'); // Particular ou Empresa

    useEffect(() => {
        const loadEntries = async () => {
            setLoading(true);
            try {
                const data = await backend.getFinanceiroEntries();
                setEntries(data);
                addLog(`Carregados ${data.length} lançamentos do financeiro.`);
            } catch (error) {
                addLog(`Erro ao carregar financeiro: ${error.message}`);
            } finally {
                setLoading(false);
            }
        };
        loadEntries();
    }, [addLog]);

    const filteredEntries = useMemo(() => {
        return entries.filter(e => e.type === view);
    }, [entries, view]);

    const total = useMemo(() => {
        return filteredEntries.reduce((acc, e) => acc + e.amount, 0);
    }, [filteredEntries]);

    const formatCurrency = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

    return (
        <div>
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
                <div>
                    <h2 className="text-3xl font-bold text-white">Financeiro</h2>
                    <p className="text-gray-400 mt-1">Contas a receber de pagamentos a prazo.</p>
                </div>
                <div className="flex rounded-lg bg-gray-800 p-1 mt-4 sm:mt-0">
                    <button
                        onClick={() => setView('Particular')}
                        className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors ${view === 'Particular' ? 'bg-purple-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}
                    >
                        Particular
                    </button>
                    <button
                        onClick={() => setView('Empresa')}
                        className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors ${view === 'Empresa' ? 'bg-purple-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}
                    >
                        Empresa
                    </button>
                </div>
            </header>

            <div className="bg-gray-800 rounded-xl shadow-lg">
                <div className="p-6 border-b border-gray-700/50 flex justify-between items-center">
                     <h3 className="text-lg font-semibold text-white">Contas a Receber - {view}</h3>
                     <div className="text-right">
                        <p className="text-sm text-gray-400">Total a Receber</p>
                        <p className="text-2xl font-bold text-yellow-400">{formatCurrency(total)}</p>
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
                                    <th scope="col" className="px-6 py-4">Lançamento</th>
                                    <th scope="col" className="px-6 py-4">Descrição</th>
                                    <th scope="col" className="px-6 py-4">Vencimento</th>
                                    <th scope="col" className="px-6 py-4">Status</th>
                                    <th scope="col" className="px-6 py-4 text-right">Valor</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredEntries.map(entry => (
                                    <tr key={entry.id} className="bg-gray-800 border-b border-gray-700/50 hover:bg-gray-700/50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-white">{entry.clientName || 'N/A'}</td>
                                        <td className="px-6 py-4">{new Date(entry.date).toLocaleDateString()}</td>
                                        <td className="px-6 py-4">{entry.description}</td>
                                        <td className="px-6 py-4">{new Date(entry.dueDate).toLocaleDateString()}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${entry.status === 'Pendente' ? 'bg-yellow-500/20 text-yellow-300' : 'bg-green-500/20 text-green-300'}`}>{entry.status}</span>
                                        </td>
                                        <td className="px-6 py-4 text-right font-semibold text-yellow-400">{formatCurrency(entry.amount)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {filteredEntries.length === 0 && (
                            <p className="p-8 text-center text-gray-500">Nenhuma conta a receber encontrada para "{view}".</p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};