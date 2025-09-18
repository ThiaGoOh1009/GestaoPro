// src/services/schema.ts

/**
 * Define a estrutura esperada do banco de dados.
 * Este objeto serve como um "contrato" para a função de verificação.
 * Se uma nova tabela ou coluna for adicionada à aplicação, ela deve ser definida aqui.
 * 
 * Tipos de dados comuns do PostgreSQL/Supabase:
 * - 'uuid': Identificador único
 * - 'timestamp with time zone': Data e hora com fuso horário (padrão para created_at)
 * - 'text': Texto de comprimento variável
 * - 'character varying': Texto com limite de caracteres
 * - 'boolean': Verdadeiro/Falso
 * - 'double precision': Número de ponto flutuante (para preços, etc.)
 * - 'bigint': Número inteiro grande (para IDs, quantidades)
 * - 'jsonb': Dados em formato JSON
 * - 'ARRAY': Array de um tipo específico (ex: 'text[]')
 */
export const DATABASE_SCHEMA = {
    entities: {
        columns: {
            id: { dataType: 'bigint' },
            created_at: { dataType: 'timestamp with time zone' },
            is_client: { dataType: 'boolean' },
            is_supplier: { dataType: 'boolean' },
            customer_type: { dataType: 'text' },
            document: { dataType: 'text' },
            legal_name: { dataType: 'text' },
            trade_name: { dataType: 'text' },
            contact_name: { dataType: 'text' },
            email: { dataType: 'text' },
            phone: { dataType: 'text' },
            whatsapp: { dataType: 'text' },
            status: { dataType: 'text' },
            address: { dataType: 'jsonb' },
            location: { dataType: 'jsonb' },
        }
    },
    products: {
        columns: {
            id: { dataType: 'bigint' },
            created_at: { dataType: 'timestamp with time zone' },
            type: { dataType: 'text' },
            name: { dataType: 'text' },
            category: { dataType: 'text' },
            description: { dataType: 'text' },
            price: { dataType: 'double precision' },
            stock: { dataType: 'bigint' },
        }
    },
    temporary_products: {
        columns: {
            id: { dataType: 'bigint' },
            created_at: { dataType: 'timestamp with time zone' },
            name: { dataType: 'text UNIQUE' },
            price: { dataType: 'double precision' },
        }
    },
    product_categories: {
        columns: {
            id: { dataType: 'bigint' },
            created_at: { dataType: 'timestamp with time zone' },
            type: { dataType: 'text' },
            name: { dataType: 'text' },
        }
    },
    chamados: {
        columns: {
            id: { dataType: 'bigint' },
            created_at: { dataType: 'timestamp with time zone' },
            entity_id: { dataType: 'bigint' },
            client_name: { dataType: 'text' },
            request_type: { dataType: 'text' },
            billing_type: { dataType: 'text' },
            status: { dataType: 'text' },
            priority: { dataType: 'text' },
            equipment: { dataType: 'text' },
            serial_number: { dataType: 'text' },
            problem_description: { dataType: 'text' },
            solution_description: { dataType: 'text' },
            observations: { dataType: 'text' },
            invoiced: { dataType: 'boolean' },
            in_route: { dataType: 'boolean' },
            training_description: { dataType: 'text' },
            training_type: { dataType: 'text' },
            other_training: { dataType: 'text' },
            participants: { dataType: 'bigint' },
            preferred_date: { dataType: 'timestamp with time zone' },
            scheduling_type: { dataType: 'text' },
            estimated_duration: { dataType: 'text' },
            audio_files: { dataType: 'jsonb' },
        }
    },
    item: {
        columns: {
            id: { dataType: 'bigint' },
            created_at: { dataType: 'timestamp with time zone' },
            chamado_id: { dataType: 'bigint' },
            product_id: { dataType: 'bigint' },
            name: { dataType: 'text' },
            quantity: { dataType: 'bigint' },
            unit_price: { dataType: 'double precision' },
            total_price: { dataType: 'double precision' },
        }
    },
    chamado_payments: {
        columns: {
            id: { dataType: 'bigint' },
            created_at: { dataType: 'timestamp with time zone' },
            chamado_id: { dataType: 'bigint' },
            amount: { dataType: 'double precision' },
            payment_date: { dataType: 'timestamp with time zone' },
        }
    },
    equipamentos: {
        columns: {
            id: { dataType: 'bigint' },
            created_at: { dataType: 'timestamp with time zone' },
            type: { dataType: 'text' },
            name: { dataType: 'text' },
        }
    },
    temporary_equipamentos: {
        columns: {
            id: { dataType: 'bigint' },
            created_at: { dataType: 'timestamp with time zone' },
            name: { dataType: 'text UNIQUE' },
        }
    },
    regioes: {
        columns: {
            id: { dataType: 'bigint' },
            created_at: { dataType: 'timestamp with time zone' },
            name: { dataType: 'text' },
            neighborhoods: { dataType: 'text[]' },
            center_coords: { dataType: 'jsonb' },
        }
    },
    market_points: {
        columns: {
            id: { dataType: 'bigint' },
            created_at: { dataType: 'timestamp with time zone' },
            name: { dataType: 'text' },
            description: { dataType: 'text' },
            address: { dataType: 'jsonb' },
            location: { dataType: 'jsonb' },
            regiao_id: { dataType: 'bigint' },
            neighborhood_name: { dataType: 'text' },
        }
    },
    pending_neighborhoods: {
        columns: {
            id: { dataType: 'bigint' },
            created_at: { dataType: 'timestamp with time zone' },
            name: { dataType: 'text UNIQUE' },
            reference_address: { dataType: 'jsonb' },
            count: { dataType: 'bigint' },
        }
    },
    rotas: {
        columns: {
            id: { dataType: 'bigint' },
            created_at: { dataType: 'timestamp with time zone' },
            region: { dataType: 'text' },
            chamado_ids: { dataType: 'bigint[]' },
            status: { dataType: 'text' },
        }
    },
    financeiro: {
        columns: {
            id: { dataType: 'bigint' },
            created_at: { dataType: 'timestamp with time zone' },
            description: { dataType: 'text' },
            amount: { dataType: 'double precision' },
            due_date: { dataType: 'timestamp with time zone' },
            type: { dataType: 'text' }, // 'R' para Receber, 'P' para Pagar
            status: { dataType: 'text' }, // 'Pendente', 'Pago', 'Vencido'
            paid_amount: { dataType: 'double precision' },
            payment_date: { dataType: 'timestamp with time zone' },
            entity_id: { dataType: 'bigint' }, // ID do cliente ou fornecedor
            chamado_id: { dataType: 'bigint' } // ID do chamado faturado (opcional)
        }
    },
    recurring_entries: {
        columns: {
            id: { dataType: 'bigint' },
            created_at: { dataType: 'timestamp with time zone' },
            type: { dataType: 'text' }, // 'R' or 'P'
            entity_id: { dataType: 'bigint' },
            description: { dataType: 'text' },
            amount: { dataType: 'double precision' },
            account_plan: { dataType: 'text' },
            cost_center: { dataType: 'text' },
            payment_method: { dataType: 'text' },
            frequency: { dataType: 'text' },
            due_day: { dataType: 'bigint' },
            start_date: { dataType: 'timestamp with time zone' },
            end_date: { dataType: 'timestamp with time zone' },
            occurrences: { dataType: 'bigint' },
            status: { dataType: 'text' }, // 'Ativo', 'Pausado', 'Concluído'
        }
    },
    payment_history: {
        columns: {
            id: { dataType: 'bigint' },
            created_at: { dataType: 'timestamp with time zone' },
            financeiro_id: { dataType: 'bigint' },
            amount_paid: { dataType: 'double precision' },
            payment_date: { dataType: 'timestamp with time zone' },
        }
    },
    company_profiles: {
        columns: {
            id: { dataType: 'bigint' },
            created_at: { dataType: 'timestamp with time zone' },
            name: { dataType: 'text' },
            cnpj: { dataType: 'text' },
            address: { dataType: 'text' },
            phone: { dataType: 'text' },
            email: { dataType: 'text' },
            logo_url: { dataType: 'text' },
        }
    },
    request_types: {
        columns: {
            id: { dataType: 'bigint' },
            created_at: { dataType: 'timestamp with time zone' },
            name: { dataType: 'text' },
        }
    },
    sugestoes: {
        columns: {
            id: { dataType: 'bigint' },
            created_at: { dataType: 'timestamp with time zone' },
            suggestion_text: { dataType: 'text' },
            original_text: { dataType: 'text' },
            status: { dataType: 'text' },
            target_page: { dataType: 'text' },
            suggestion_structure: { dataType: 'jsonb' },
            chat_history: { dataType: 'jsonb' },
        }
    }
};