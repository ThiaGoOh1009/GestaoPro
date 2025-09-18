import React from 'react';

const formatCurrency = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);

export const ChamadoPrintLayout = ({ chamado, companyData }) => {
    const defaultCompanyData = {
        name: 'Sua Empresa (Configure em Cadastros)',
        cnpj: '00.000.000/0001-00',
        address: 'Seu Endereço Completo',
        phone: '(00) 00000-0000',
        email: 'seu@email.com.br',
        logo_url: ''
    };

    const displayData = companyData || defaultCompanyData;
    const client = chamado.client || {};
    const clientAddress = client.address ? [client.address.street, client.address.number, client.address.neighborhood, client.address.city, client.address.state, client.address.zip].filter(Boolean).join(', ') : 'Endereço não informado';

    const subtotal = chamado.items?.reduce((acc, item) => acc + item.totalPrice, 0) || 0;
    const total = subtotal;

    // --- STYLES ---
    const layoutStyle: React.CSSProperties = {
        fontFamily: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
        fontSize: '11px',
        color: '#374151',
        backgroundColor: '#fff',
        padding: '20px',
        boxSizing: 'border-box',
        width: '100%',
        minHeight: '277mm', // A bit less than A4 height to be safe
        display: 'flex',
        flexDirection: 'column',
    };
    const pStyle: React.CSSProperties = { margin: '1px 0', lineHeight: '1.4' };
    const sectionTitleStyle: React.CSSProperties = {
        fontSize: '13px',
        fontWeight: 600,
        color: '#111827',
        margin: '0',
        padding: '5px 8px',
        borderBottom: '1px solid #e5e7eb',
        backgroundColor: '#f9fafb',
    };
    const tableStyle: React.CSSProperties = { width: '100%', borderCollapse: 'collapse', marginTop: '6px' };
    const thStyle: React.CSSProperties = { padding: '6px 8px', fontSize: '10px', border: '1px solid #e5e7eb', textAlign: 'left', backgroundColor: '#f3f4f6', fontWeight: 600, color: '#1f2937' };
    const tdStyle: React.CSSProperties = { padding: '6px 8px', border: '1px solid #e5e7eb' };

    return (
        <div style={layoutStyle}>
            {/* Header */}
            <header style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #374151', paddingBottom: '10px', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    {displayData.logo_url && (
                        <img src={displayData.logo_url} alt="Logo da Empresa" style={{ width: 'auto', height: '60px', maxHeight: '60px', marginRight: '20px' }} />
                    )}
                    <div>
                        <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 4px 0', color: '#000' }}>{displayData.name}</h1>
                        <p style={{ ...pStyle, fontSize: '10px', color: '#6b7280' }}>{displayData.address}</p>
                        <p style={{ ...pStyle, fontSize: '10px', color: '#6b7280' }}>CNPJ: {displayData.cnpj} | {displayData.phone} | {displayData.email}</p>
                    </div>
                </div>
                <div style={{ textAlign: 'center', flexShrink: 0, border: '1px solid #d1d5db', borderRadius: '6px', padding: '8px 12px', backgroundColor: '#f9fafb' }}>
                    <h2 style={{ fontSize: '14px', fontWeight: 'bold', margin: '0 0 4px 0', color: '#1f2937' }}>ORDEM DE SERVIÇO</h2>
                    <p style={{ ...pStyle, fontSize: '18px', fontWeight: 'bold', color: '#000' }}>Nº {String(chamado.id).padStart(6, '0')}</p>
                    <p style={{ ...pStyle, fontSize: '10px' }}>{new Date(chamado.created_at).toLocaleDateString('pt-BR')}</p>
                </div>
            </header>

            {/* Client Info */}
            <section style={{ marginTop: '15px', border: '1px solid #e5e7eb', borderRadius: '6px', overflow: 'hidden' }}>
                <h3 style={sectionTitleStyle}>DADOS DO CLIENTE</h3>
                <div style={{ padding: '10px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px' }}>
                    <div><p style={pStyle}><strong>Nome/Razão Social:</strong> {client.legal_name || 'Não informado'}</p></div>
                    <div><p style={pStyle}><strong>Nome Fantasia:</strong> {client.trade_name || 'N/A'}</p></div>
                    <div><p style={pStyle}><strong>CPF/CNPJ:</strong> {client.document || 'Não informado'}</p></div>
                    <div><p style={pStyle}><strong>Contato:</strong> {client.contact_name || 'Não informado'} - {client.phone || 'N/A'}</p></div>
                    <div style={{ gridColumn: '1 / -1' }}><p style={pStyle}><strong>Endereço:</strong> {clientAddress}</p></div>
                </div>
            </section>
            
            {/* Service Details */}
            <section style={{ marginTop: '15px', border: '1px solid #e5e7eb', borderRadius: '6px', overflow: 'hidden' }}>
                <h3 style={sectionTitleStyle}>DETALHES DO SERVIÇO</h3>
                <div style={{ padding: '10px' }}>
                     <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px 16px', marginBottom: '10px' }}>
                        <div><p style={pStyle}><strong>Tipo de Solicitação:</strong> {chamado.request_type}</p></div>
                        {chamado.equipment && <div><p style={pStyle}><strong>Equipamento:</strong> {chamado.equipment}</p></div>}
                        {chamado.priority && <div><p style={pStyle}><strong>Prioridade:</strong> {chamado.priority}</p></div>}
                        {chamado.billing_type && <div><p style={pStyle}><strong>Faturamento:</strong> {chamado.billing_type}</p></div>}
                    </div>
                     <p style={{ ...pStyle }}><strong>Descrição do Problema/Solicitação:</strong></p>
                     <div style={{ padding: '8px 12px', color: '#4b5563', backgroundColor: '#f9fafb', borderRadius: '4px', border: '1px solid #f3f4f6', whiteSpace: 'pre-wrap', minHeight: '40px' }}>{chamado.problem_description || 'Nenhuma descrição fornecida.'}</div>
                </div>
            </section>
            
            {/* Technician's Report Section */}
            {chamado.solution_description && (
                <section style={{ marginTop: '15px', border: '1px solid #e5e7eb', borderRadius: '6px', overflow: 'hidden' }}>
                    <h3 style={sectionTitleStyle}>RELATO TÉCNICO / SOLUÇÃO APLICADA</h3>
                    <div style={{ padding: '10px', color: '#4b5563', backgroundColor: '#fff', whiteSpace: 'pre-wrap' }}>{chamado.solution_description}</div>
                </section>
            )}

            {/* Items Table */}
            <section style={{ marginTop: '15px' }}>
                <h3 style={sectionTitleStyle}>PRODUTOS E SERVIÇOS UTILIZADOS</h3>
                <table style={tableStyle}>
                    <thead>
                        <tr>
                            <th style={{ ...thStyle, width: '10%' }}>Cód.</th>
                            <th style={thStyle}>Descrição</th>
                            <th style={{ ...thStyle, width: '10%', textAlign: 'center' }}>Qtd.</th>
                            <th style={{ ...thStyle, width: '20%', textAlign: 'right' }}>Vlr. Unit.</th>
                            <th style={{ ...thStyle, width: '20%', textAlign: 'right' }}>Vlr. Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {chamado.items?.length > 0 ? (
                            chamado.items.map((item, index) => (
                                <tr key={index}>
                                    <td style={tdStyle}>{item.productId || '-'}</td>
                                    <td style={tdStyle}>{item.name}</td>
                                    <td style={{ ...tdStyle, textAlign: 'center' }}>{item.quantity}</td>
                                    <td style={{ ...tdStyle, textAlign: 'right' }}>{formatCurrency(item.unitPrice)}</td>
                                    <td style={{ ...tdStyle, textAlign: 'right' }}>{formatCurrency(item.totalPrice)}</td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={5} style={{ ...tdStyle, textAlign: 'center', color: '#9ca3af' }}>Nenhum item ou serviço adicional foi utilizado.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </section>

            <div style={{ flexGrow: 1 }}></div>

            <footer style={{ marginTop: '20px' }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '20px' }}>
                    <div style={{ width: total > 0 ? '55%' : '100%' }}>
                         <h3 style={sectionTitleStyle}>CONDIÇÕES E OBSERVAÇÕES</h3>
                         <div style={{ padding: '8px 0' }}>
                             <p style={pStyle}><strong>Condição de Pagamento:</strong> A combinar</p>
                             <p style={pStyle}><strong>Prazo de Entrega/Serviço:</strong> {chamado.preferred_date ? new Date(chamado.preferred_date).toLocaleString('pt-BR') : 'Conforme agendamento'}</p>
                             {chamado.observations && <p style={{...pStyle, marginTop: '4px'}}><strong>Observações:</strong> {chamado.observations}</p>}
                         </div>
                    </div>
                    {total > 0 && (
                        <div style={{ width: '40%' }}>
                            <div style={{ backgroundColor: '#f3f4f6', padding: '10px', borderRadius: '6px', textAlign: 'right' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}><span style={{ color: '#6b7280'}}>Subtotal:</span><span>{formatCurrency(subtotal)}</span></div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '18px', color: '#000', borderTop: '1px solid #d1d5db', paddingTop: '8px', marginTop: '8px' }}><span>TOTAL:</span><span>{formatCurrency(total)}</span></div>
                            </div>
                        </div>
                    )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: '60px', paddingTop: '10px' }}>
                    <div style={{ textAlign: 'center', width: '45%' }}>
                        <div style={{ borderTop: '1px solid #6b7280', paddingTop: '6px' }}>
                            <p style={pStyle}>{displayData.name}</p>
                            <p style={{ ...pStyle, fontSize: '9px', color: '#6b7280' }}>Técnico Responsável</p>
                        </div>
                    </div>
                    <div style={{ textAlign: 'center', width: '45%' }}>
                        <div style={{ borderTop: '1px solid #6b7280', paddingTop: '6px' }}>
                             <p style={{...pStyle, minHeight: '16px'}}>{client.legal_name}</p>
                             <p style={{ ...pStyle, fontSize: '9px', color: '#6b7280' }}>Cliente</p>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};