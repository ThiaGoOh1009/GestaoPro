import { supabase } from './supabase';
import { capitalizeWords } from '../utils/helpers';
import { DATABASE_SCHEMA } from './schema';
import { REGIOES_FOZ } from '../pages/regioes/regioes-foz';

// Helper para tratar erros do Supabase de forma consistente
const handleSupabaseError = (error: any, context: string) => {
    console.error(`Supabase error in ${context}:`, error);

    // If the error is not a structured object, stringify it directly.
    if (typeof error !== 'object' || error === null) {
        throw new Error(`Erro no banco de dados (${context}): ${String(error)}`);
    }

    // Attempt to build a detailed message from PostgREST error properties.
    const messageParts = [];
    if (error.message && typeof error.message === 'string') {
         // Avoid adding the generic "[object Object]"
        if (!error.message.includes('[object Object]')) {
             messageParts.push(error.message);
        }
    }
    if (error.details && typeof error.details === 'string') {
        messageParts.push(`Detalhes: ${error.details}`);
    }
    if (error.hint && typeof error.hint === 'string') {
        messageParts.push(`Dica: ${error.hint}`);
    }

    // If we have structured parts, join them.
    if (messageParts.length > 0) {
        throw new Error(`Erro no banco de dados (${context}): ${messageParts.join(' ')}`);
    }
    
    // Fallback for unexpected error objects: serialize the whole thing.
    // This prevents '[object Object]' and provides full context for debugging.
    try {
        // Use a replacer to avoid issues and get more info from Error objects
        const replacer = (key, value) => {
            if (value instanceof Error) {
                return { message: value.message, stack: value.stack };
            }
            return value;
        };
        const fullError = JSON.stringify(error, replacer, 2);
        
        // Final check to avoid the dreaded string
        if (fullError === '{}' || fullError.includes('[object Object]')) {
             throw new Error(`Erro no banco de dados (${context}): Ocorreu um erro de comunicação. Verifique o console para detalhes e confirme se as políticas de RLS (Row Level Security) estão configuradas corretamente para esta tabela no Supabase.`);
        }

        throw new Error(`Erro no banco de dados (${context}): ${fullError}`);
    } catch (e) {
        // Catch potential circular structure in JSON.stringify
        throw new Error(`Erro no banco de dados (${context}): Ocorreu um erro não serializável. Verifique o console para detalhes.`);
    }
};

// Configurações de UI ainda podem usar localStorage
export const storage = {
    loadClientFieldSettings: () => {
        try { const settings = localStorage.getItem('clientFieldSettings'); return settings ? JSON.parse(settings) : { email: false, phone: false }; }
        catch (e) { return { email: false, phone: false }; }
    },
    saveClientFieldSettings: (settings) => { 
        try { localStorage.setItem('clientFieldSettings', JSON.stringify(settings)); } 
        catch (e) { console.error("Failed to save settings:", e); alert("Erro: Não foi possível salvar as configurações."); }
    },
};

// O objeto 'backend' agora é 'supabaseService' e interage com o Supabase
export const supabaseService = {
    // --- ENTIDADES (Clientes/Fornecedores) ---
    getClientes: async () => {
        const { data, error } = await supabase.from('entities').select('*').eq('is_client', true).order('trade_name', { ascending: true });
        if (error) handleSupabaseError(error, 'getClientes');
        return data || [];
    },
    getFornecedores: async () => {
        const { data, error } = await supabase.from('entities').select('*').eq('is_supplier', true).order('trade_name', { ascending: true });
        if (error) handleSupabaseError(error, 'getFornecedores');
        return data || [];
    },
    getAllEntities: async () => {
        const { data, error } = await supabase.from('entities').select('*');
        if (error) handleSupabaseError(error, 'getAllEntities');
        return data || [];
    },
    saveEntidade: async (entityData) => {
        if (entityData.address?.neighborhood) {
            const neighborhood = (entityData.address.neighborhood || '').trim();
            if (neighborhood) {
                const { data: regioes, error: regioesError } = await supabase.from('regioes').select('name, neighborhoods');
                if (regioesError) handleSupabaseError(regioesError, 'saveEntidade (fetch regioes)');
                const foundRegion = regioes?.find(r => r.neighborhoods?.some(n => n && n.trim().toLowerCase() === neighborhood.toLowerCase()));
                entityData.address.region = foundRegion ? foundRegion.name : '';
                if (!foundRegion) {
                    // Manual upsert to handle count increment.
                    const { data: existingPending, error: selectError } = await supabase
                        .from('pending_neighborhoods')
                        .select('id, count')
                        .eq('name', neighborhood)
                        .maybeSingle();

                    if (selectError) {
                        handleSupabaseError(selectError, 'saveEntidade (select pending neighborhood)');
                    } else if (existingPending) {
                         // It exists, so increment the count.
                        const { error: updateError } = await supabase
                            .from('pending_neighborhoods')
                            .update({ count: (existingPending.count || 0) + 1 })
                            .eq('id', existingPending.id);
                        if (updateError) handleSupabaseError(updateError, 'saveEntidade (update pending neighborhood count)');
                    } else {
                        // It doesn't exist, so insert it.
                        const { error: insertError } = await supabase
                            .from('pending_neighborhoods')
                            .insert({ name: neighborhood, reference_address: entityData.address, count: 1 });
                        if (insertError) handleSupabaseError(insertError, 'saveEntidade (insert pending neighborhood)');
                    }
                }
            }
        }
        
        // REMOVED RECURRING FIELDS TO ALIGN WITH SCHEMA REFACTORING
        delete (entityData as any).is_recurring;
        delete (entityData as any).recurring_amount;
        delete (entityData as any).recurring_due_day;

        // Garante que o campo 'entity_type' legado seja removido ao salvar no novo formato.
        if ('entity_type' in entityData) {
            delete entityData.entity_type;
        }

        const { data, error } = await supabase.from('entities').upsert(entityData).select();
        if (error) handleSupabaseError(error, 'saveEntidade');
        return data;
    },
    deleteEntidade: async (id) => {
        const { error } = await supabase.from('entities').delete().eq('id', id);
        if (error) handleSupabaseError(error, 'deleteEntidade');
    },

    // --- PRODUTOS ---
    getProdutos: async () => {
        const { data, error } = await supabase.from('products').select('*').order('name', { ascending: true });
        if (error) handleSupabaseError(error, 'getProdutos');
        return data || [];
    },
    saveProduto: async (productData) => {
        const { data, error } = await supabase.from('products').upsert(productData).select();
        if (error) handleSupabaseError(error, 'saveProduto');
        return data;
    },
    deleteProduto: async (id) => {
        const { error } = await supabase.from('products').delete().eq('id', id);
        if (error) handleSupabaseError(error, 'deleteProduto');
    },
    getCategories: async () => {
        const { data, error } = await supabase.from('product_categories').select('type, name');
        if (error) handleSupabaseError(error, 'getCategories');
        return (data || []).reduce((acc, cat) => {
            if (!acc[cat.type]) acc[cat.type] = [];
            acc[cat.type].push(cat.name);
            return acc;
        }, { produtos: [], servicos: [] });
    },
    saveCategories: async (categories) => {
        const allCategories = [
            ...categories.produtos.map(name => ({ type: 'produtos', name })),
            ...categories.servicos.map(name => ({ type: 'servicos', name }))
        ];
        const { data: existingCategories, error: fetchError } = await supabase.from('product_categories').select('type, name');
        if (fetchError) handleSupabaseError(fetchError, 'saveCategories (fetch)');

        if (existingCategories) {
            const toDelete = existingCategories.filter(e => !allCategories.some(c => c.type === e.type && c.name === e.name));
            for (const cat of toDelete) {
                const { error: deleteError } = await supabase.from('product_categories').delete().match({ type: cat.type, name: cat.name });
                if (deleteError) handleSupabaseError(deleteError, `saveCategories (delete ${cat.name})`);
            }
        }
        const { error: upsertError } = await supabase.from('product_categories').upsert(allCategories);
        if (upsertError) handleSupabaseError(upsertError, 'saveCategories (upsert)');
    },

    // --- TEMPORARY PRODUCTS ---
    getTemporaryProducts: async () => {
        const { data, error } = await supabase.from('temporary_products').select('*').order('name', { ascending: true });
        if (error) handleSupabaseError(error, 'getTemporaryProducts');
        return data || [];
    },
    addTemporaryProduct: async (productData) => {
        // Manual upsert to bypass potential 'onConflict' issues if the UNIQUE constraint is missing in the user's DB.
        const { data, error: selectError } = await supabase
            .from('temporary_products')
            .select('id')
            .eq('name', productData.name)
            .maybeSingle(); // Use maybeSingle to avoid error if not found

        if (selectError) {
            handleSupabaseError(selectError, 'addTemporaryProduct (select)');
            return;
        }

        if (data) {
            // Entry exists, update it. This preserves the ID.
            const { error: updateError } = await supabase
                .from('temporary_products')
                .update({ price: productData.price }) // Only update the price, name is the key
                .eq('id', data.id);
            if (updateError) handleSupabaseError(updateError, 'addTemporaryProduct (update)');
        } else {
            // Entry doesn't exist, insert it.
            const { error: insertError } = await supabase
                .from('temporary_products')
                .insert(productData);
            if (insertError) handleSupabaseError(insertError, 'addTemporaryProduct (insert)');
        }
    },
    deleteTemporaryProduct: async (id) => {
        const { error } = await supabase.from('temporary_products').delete().eq('id', id);
        if (error) handleSupabaseError(error, 'deleteTemporaryProduct');
    },
    
    // --- CHAMADOS ---
    getChamados: async () => {
        // Step 1: Fetch all chamados
        const { data: chamados, error: chamadosError } = await supabase
            .from('chamados')
            .select('*')
            .order('created_at', { ascending: false });
        if (chamadosError) handleSupabaseError(chamadosError, 'getChamados (chamados)');
        if (!chamados || chamados.length === 0) return [];

        // Step 2: Fetch all related items and payments
        const chamadoIds = chamados.map(c => c.id);

        // Fetch items (critical for app function)
        const { data: items, error: itemsError } = await supabase
            .from('item')
            .select('*')
            .in('chamado_id', chamadoIds);
        if (itemsError) handleSupabaseError(itemsError, 'getChamados (items)');
        
        // Fetch payments gracefully, allowing the app to function if this table is missing.
        let payments: any[] = [];
        const { data: paymentsData, error: paymentsError } = await supabase
            .from('chamado_payments')
            .select('*')
            .in('chamado_id', chamadoIds);
        
        if (paymentsError) {
            console.warn(`Supabase warning in getChamados (payments): Could not fetch payments. This might be due to a missing table or RLS policy. Error:`, paymentsError);
        } else {
            payments = paymentsData || [];
        }
        
        // Step 3: Create maps for easy lookup
        const itemsByChamadoId = (items || []).reduce((acc, item) => {
            if (!acc[item.chamado_id]) acc[item.chamado_id] = [];
            acc[item.chamado_id].push({ ...item, productId: item.product_id, unitPrice: item.unit_price, totalPrice: item.total_price });
            return acc;
        }, {} as { [key: number]: any[] });

        const paymentsByChamadoId = (payments || []).reduce((acc, payment) => {
            if (!acc[payment.chamado_id]) acc[payment.chamado_id] = [];
            acc[payment.chamado_id].push(payment);
            return acc;
        }, {} as { [key: number]: any[] });

        // Step 4: Attach items and payments to their respective chamados
        const chamadosWithDetails = chamados.map(chamado => ({
            ...chamado,
            items: itemsByChamadoId[chamado.id] || [],
            payments: paymentsByChamadoId[chamado.id] || []
        }));

        return chamadosWithDetails;
    },
    saveChamado: async (chamadoData) => {
        // Step 1: Separate items from the main chamado data
        const { items, ...mainChamadoData } = chamadoData;

        // FIX: When editing, the `chamadoData` object contains enriched `client` object
        // which is not a column in the `chamados` table. The Supabase client library throws
        // an error when it finds properties that don't map to columns.
        // We must remove it before the upsert operation to prevent the `[object Object]` error.
        if ('client' in mainChamadoData) {
            delete (mainChamadoData as any).client;
        }
        if ('payments' in mainChamadoData) {
            delete (mainChamadoData as any).payments;
        }

        // FIX: The form sends `_list` arrays which are not in the DB schema.
        // The `executeSave` function in the form modal correctly creates the string versions,
        // but the original arrays are still present and must be removed to avoid the `[object Object]` error.
        if ('problem_description_list' in mainChamadoData) {
            delete (mainChamadoData as any).problem_description_list;
        }
        if ('solution_description_list' in mainChamadoData) {
            delete (mainChamadoData as any).solution_description_list;
        }

        // Safeguard against schema drift
        const dataToSave = { ...mainChamadoData };

        // FIX: Explicitly ensure entity_id is null if it's a falsy value (e.g., '', 0).
        // The database expects a valid bigint foreign key or NULL. An empty string from a form
        // can cause a type mismatch error that results in a cryptic '[object Object]' message.
        if (!dataToSave.entity_id) {
            dataToSave.entity_id = null;
        }

        if (dataToSave.request_type !== 'Chamado de Serviço') {
            delete dataToSave.equipment;
            delete dataToSave.problem_description;
            delete dataToSave.priority;
        }
        if (dataToSave.request_type !== 'Treinamento') {
            delete dataToSave.training_description;
            delete dataToSave.training_type;
            delete dataToSave.other_training;
            delete dataToSave.participants;
        }
        if (dataToSave.request_type !== 'Agendamento') {
            delete dataToSave.scheduling_type;
            delete dataToSave.estimated_duration;
        }
        if (dataToSave.request_type !== 'Treinamento' && dataToSave.request_type !== 'Agendamento') {
             delete dataToSave.preferred_date;
        }
        if (dataToSave.preferred_date === '') {
            dataToSave.preferred_date = null;
        }
        
        // Step 2: Upsert the main chamado data and get the result
        const { data: savedChamados, error } = await supabase
            .from('chamados')
            .upsert(dataToSave)
            .select();
            
        if (error) handleSupabaseError(error, 'saveChamado (upsert)');
        if (!savedChamados || savedChamados.length === 0) throw new Error("Falha ao salvar o chamado principal.");
        
        const chamadoId = savedChamados[0].id;

        // Step 3: Delete existing items for this chamado
        const { error: deleteError } = await supabase
            .from('item')
            .delete()
            .eq('chamado_id', chamadoId);
        if (deleteError) handleSupabaseError(deleteError, 'saveChamado (delete items)');

        // Step 4: Insert new items if they exist
        if (items && items.length > 0) {
            const itemsToInsert = items.map((item: any) => ({
                chamado_id: chamadoId,
                product_id: item.productId, // Map to snake_case for DB
                name: item.name,
                quantity: item.quantity,
                unit_price: item.unitPrice,
                total_price: item.totalPrice,
            }));

            // Added for enhanced debugging
            console.log('Tentativa de inserir itens no chamado:', JSON.stringify(itemsToInsert, null, 2));

            const { error: insertError } = await supabase
                .from('item')
                .insert(itemsToInsert);
            if (insertError) handleSupabaseError(insertError, 'saveChamado (insert items)');
        }

        // Step 5: Return the saved chamado with its items for consistency
        const finalChamadoData = { ...savedChamados[0], items: items || [] };
        return [finalChamadoData];
    },
    updateChamados: async (chamadoIds, updates) => {
        const { data, error } = await supabase.from('chamados').update(updates).in('id', chamadoIds).select();
        if (error) handleSupabaseError(error, 'updateChamados');
        return data;
    },
    deleteChamado: async (id) => {
        // Step 1: Delete associated items and payments first
        const { error: deleteItemsError } = await supabase.from('item').delete().eq('chamado_id', id);
        if (deleteItemsError) handleSupabaseError(deleteItemsError, 'deleteChamado (delete items)');
        
        const { error: deletePaymentsError } = await supabase.from('chamado_payments').delete().eq('chamado_id', id);
        if (deletePaymentsError) handleSupabaseError(deletePaymentsError, 'deleteChamado (delete payments)');
        
        // Step 2: Delete the chamado itself
        const { error } = await supabase.from('chamados').delete().eq('id', id);
        if (error) handleSupabaseError(error, 'deleteChamado (delete chamado)');
    },
    // --- ADIANTAMENTOS DE CHAMADO ---
    addPaymentToChamado: async (paymentData) => {
        const { data, error } = await supabase.from('chamado_payments').insert(paymentData).select();
        if (error) handleSupabaseError(error, 'addPaymentToChamado');
        return data;
    },
    deletePayment: async (paymentId) => {
        const { error } = await supabase.from('chamado_payments').delete().eq('id', paymentId);
        if (error) handleSupabaseError(error, 'deletePayment');
    },


    // --- TIPOS DE SOLICITAÇÃO ---
    getRequestTypes: async () => {
        const coreTypes = ['Chamado de Serviço', 'Treinamento', 'Agendamento'];
        
        let { data, error } = await supabase.from('request_types').select('name');
        if (error) handleSupabaseError(error, 'getRequestTypes (fetch)');
        
        const existingTypes = data?.map(t => t.name) || [];
        const missingTypes = coreTypes.filter(ct => !existingTypes.includes(ct));
    
        if (missingTypes.length > 0) {
            const typesToInsert = missingTypes.map(name => ({ name }));
            const { error: insertError } = await supabase.from('request_types').insert(typesToInsert);
            if (insertError) handleSupabaseError(insertError, 'getRequestTypes (seed core types)');
        }
    
        // Always return the full, fresh list
        const { data: fullData, error: fullFetchError } = await supabase.from('request_types').select('*').order('name', { ascending: true });
        if (fullFetchError) handleSupabaseError(fullFetchError, 'getRequestTypes (full fetch)');
        return fullData || [];
    },
    saveRequestType: async (typeData) => {
        const { data, error } = await supabase.from('request_types').upsert(typeData).select();
        if (error) handleSupabaseError(error, 'saveRequestType');
        return data;
    },
    deleteRequestType: async (id) => {
        const { error } = await supabase.from('request_types').delete().eq('id', id);
        if (error) handleSupabaseError(error, 'deleteRequestType');
    },

    // --- SUGESTÕES ---
    getSugestoes: async () => {
        const { data, error } = await supabase.from('sugestoes').select('*').order('created_at', { ascending: false });
        if (error) handleSupabaseError(error, 'getSugestoes');
        return data || [];
    },
    saveSugestao: async (sugestaoData) => {
        const { data, error } = await supabase.from('sugestoes').upsert(sugestaoData).select();
        if (error) handleSupabaseError(error, 'saveSugestao');
        return data;
    },
    deleteSugestao: async (id) => {
        const { error } = await supabase.from('sugestoes').delete().eq('id', id);
        if (error) handleSupabaseError(error, 'deleteSugestao');
    },

    // --- EQUIPAMENTOS ---
    getEquipamentos: async () => {
        const { data, error } = await supabase.from('equipamentos').select('*').order('name', { ascending: true });
        if (error) handleSupabaseError(error, 'getEquipamentos');
        return data || [];
    },
    saveEquipamento: async (equipamentoData) => {
        const { data, error } = await supabase.from('equipamentos').upsert(equipamentoData).select();
        if (error) handleSupabaseError(error, 'saveEquipamento');
        return data;
    },
    deleteEquipamento: async (id) => {
        const { error } = await supabase.from('equipamentos').delete().eq('id', id);
        if (error) handleSupabaseError(error, 'deleteEquipamento');
    },
    getTemporaryEquipamentos: async () => {
        const { data, error } = await supabase.from('temporary_equipamentos').select('name');
        if (error) handleSupabaseError(error, 'getTemporaryEquipamentos');
        return (data || []).map(item => item.name);
    },
    addTemporaryEquipamento: async (name) => {
        // Manual upsert to bypass potential 'onConflict' issues.
        const { data, error: selectError } = await supabase
            .from('temporary_equipamentos')
            .select('id')
            .eq('name', name)
            .maybeSingle();

        if (selectError) {
            handleSupabaseError(selectError, 'addTemporaryEquipamento (select)');
            return;
        }

        if (!data) {
            // Only insert if it doesn't exist. There's nothing to update.
            const { error: insertError } = await supabase
                .from('temporary_equipamentos')
                .insert({ name });
            if (insertError) handleSupabaseError(insertError, 'addTemporaryEquipamento (insert)');
        }
    },
    deleteTemporaryEquipamento: async (name) => {
        const { error } = await supabase.from('temporary_equipamentos').delete().eq('name', name);
        if (error) handleSupabaseError(error, 'deleteTemporaryEquipamento');
    },

    // --- REGIÕES ---
    getRegioes: async () => {
        const { data, error } = await supabase.from('regioes').select('*').order('name', { ascending: true });
        if (error) handleSupabaseError(error, 'getRegioes');
        return data || [];
    },
    saveRegiao: async (regiaoData) => {
        const { data, error } = await supabase.from('regioes').upsert(regiaoData).select();
        if (error) handleSupabaseError(error, 'saveRegiao');
        return data;
    },
    deleteRegiao: async (id) => {
        const { error } = await supabase.from('regioes').delete().eq('id', id);
        if (error) handleSupabaseError(error, 'deleteRegiao');
    },
    syncFozRegions: async () => {
        // Step 1: Sync main data (name, neighborhoods) robustly.
        const { data: dbRegioes, error: fetchError } = await supabase.from('regioes').select('id, name, neighborhoods');
        if (fetchError) {
            handleSupabaseError(fetchError, 'syncFozRegions (fetch safe)');
            return;
        }

        const staticRegionsMap = new Map(REGIOES_FOZ.map(r => [r.name, r]));
        const dbRegioesMap = new Map((dbRegioes || []).map(r => [r.name, r]));
        const regionsToDelete = (dbRegioes || []).filter(dbR => !staticRegionsMap.has(dbR.name)).map(r => r.id);
        const regionsToUpsert: any[] = [];

        for (const staticRegion of REGIOES_FOZ) {
            // FIX: Cast dbRegion to 'any' to resolve properties 'neighborhoods' and 'id' not existing on type 'unknown'. This happens when TypeScript cannot infer the specific type of values stored in the Map.
            const dbRegion: any = dbRegioesMap.get(staticRegion.name);
            const staticNeighborhoods = [...staticRegion.neighborhoods].sort();
            if (!dbRegion) {
                regionsToUpsert.push({ name: staticRegion.name, neighborhoods: staticNeighborhoods });
            } else {
                const dbNeighborhoods = [...(dbRegion.neighborhoods || [])].sort();
                if (JSON.stringify(staticNeighborhoods) !== JSON.stringify(dbNeighborhoods)) {
                    regionsToUpsert.push({ id: dbRegion.id, name: staticRegion.name, neighborhoods: staticNeighborhoods });
                }
            }
        }

        if (regionsToDelete.length > 0) {
            const { error: deleteError } = await supabase.from('regioes').delete().in('id', regionsToDelete);
            if (deleteError) handleSupabaseError(deleteError, 'syncFozRegions (delete)');
        }
        if (regionsToUpsert.length > 0) {
            const { error: upsertError } = await supabase.from('regioes').upsert(regionsToUpsert);
            if (upsertError) handleSupabaseError(upsertError, 'syncFozRegions (upsert)');
        }

        // Step 2: Gracefully attempt to set initial coordinates for regions that don't have them.
        try {
            const { data: allCurrentRegioes, error: finalFetchError } = await supabase.from('regioes').select('id, name, center_coords');
            if (finalFetchError) throw finalFetchError;

            const updatesToPerform = [];
            for (const dbRegion of allCurrentRegioes || []) {
                if (!dbRegion.center_coords) { // Only update if null
                    const staticRegion = staticRegionsMap.get(dbRegion.name);
                    if (staticRegion && staticRegion.center) {
                        updatesToPerform.push({ id: dbRegion.id, center_coords: staticRegion.center });
                    }
                }
            }
            if (updatesToPerform.length > 0) {
                const { error: updateCoordsError } = await supabase.from('regioes').upsert(updatesToPerform);
                if (updateCoordsError) handleSupabaseError(updateCoordsError, 'syncFozRegions (set initial coords)');
            }
        } catch (e) {
            console.warn("Aviso: Não foi possível definir as coordenadas iniciais para as regiões. Isso pode ser devido à falta da coluna 'center_coords' ou a uma política de RLS restritiva. Execute a sincronização do esquema e verifique suas políticas de RLS.", e);
        }
    },
    getPendingNeighborhoods: async () => {
        const { data, error } = await supabase.from('pending_neighborhoods').select('*').order('name', { ascending: true });
        if (error) handleSupabaseError(error, 'getPendingNeighborhoods');
        return data || [];
    },
    deletePendingNeighborhood: async (name) => {
        const { error } = await supabase.from('pending_neighborhoods').delete().eq('name', name);
        if (error) handleSupabaseError(error, 'deletePendingNeighborhood');
    },
    updateEntitiesRegion: async (neighborhood, regionName) => {
        const { data: entitiesToUpdate, error: fetchError } = await supabase
            .from('entities')
            .select('id, address')
            .filter('address->>neighborhood', 'eq', neighborhood);
        if (fetchError) handleSupabaseError(fetchError, 'updateEntitiesRegion (fetch)');
        if (!entitiesToUpdate || entitiesToUpdate.length === 0) return;

        const updates = entitiesToUpdate.map(entity => ({
            id: entity.id, // Must include primary key for upsert
            address: { ...entity.address, region: regionName }
        }));
        
        const { error: updateError } = await supabase.from('entities').upsert(updates);
        if (updateError) handleSupabaseError(updateError, 'updateEntitiesRegion (update)');
    },

    // --- MARKET POINTS ---
    getMarketPoints: async () => {
        const { data, error } = await supabase.from('market_points').select('*');
        if (error) handleSupabaseError(error, 'getMarketPoints');
        return data || [];
    },
    saveMarketPoint: async (pointData) => {
        const { data, error } = await supabase.from('market_points').upsert(pointData).select();
        if (error) handleSupabaseError(error, 'saveMarketPoint');
        return data;
    },
    deleteMarketPoint: async (id) => {
        const { error } = await supabase.from('market_points').delete().eq('id', id);
        if (error) handleSupabaseError(error, 'deleteMarketPoint');
    },
    
    // --- ROTAS ---
    getRotas: async () => {
        const { data, error } = await supabase.from('rotas').select('*');
        if (error) handleSupabaseError(error, 'getRotas');
        return data || [];
    },
    saveRotas: async (rotas) => {
        const { data, error } = await supabase.from('rotas').upsert(rotas).select();
        if (error) handleSupabaseError(error, 'saveRotas');
        return data;
    },
    deleteRota: async (id) => {
        const { error } = await supabase.from('rotas').delete().eq('id', id);
        if (error) handleSupabaseError(error, 'deleteRota');
    },

    // --- FINANCEIRO ---
    getFinanceiroEntries: async () => {
        // Manual join to avoid relationship errors
        const { data: entries, error: entriesError } = await supabase.from('financeiro').select('*').order('due_date', { ascending: true });
        if (entriesError) handleSupabaseError(entriesError, 'getFinanceiroEntries');
        if (!entries || entries.length === 0) return [];
        
        const { data: entities, error: entitiesError } = await supabase.from('entities').select('id, trade_name, legal_name');
        if (entitiesError) handleSupabaseError(entitiesError, 'getFinanceiroEntries (entities)');

        const entityMap = new Map((entities || []).map(e => [e.id, e.trade_name || e.legal_name]));

        return entries.map(entry => ({
            ...entry,
            entity_name: entityMap.get(entry.entity_id) || 'Entidade não encontrada'
        }));
    },
    saveFinanceiroEntry: async (entryData) => {
        const { installments, ...baseEntry } = entryData;

        // Se for uma atualização, apenas faz o upsert
        if (baseEntry.id) {
            const { data, error } = await supabase.from('financeiro').upsert(baseEntry).select();
            if (error) handleSupabaseError(error, 'saveFinanceiroEntry (update)');
            return data;
        }

        // Se for uma nova entrada com parcelas
        if (installments && installments > 1) {
            const entriesToInsert = [];
            const originalDueDate = new Date(baseEntry.due_date + 'T12:00:00Z');

            for (let i = 0; i < installments; i++) {
                const newDueDate = new Date(originalDueDate);
                newDueDate.setUTCMonth(originalDueDate.getUTCMonth() + i);
                
                // Remove o ID para que o BD gere um novo para cada parcela
                const { id, ...installmentEntry } = baseEntry;

                entriesToInsert.push({
                    ...installmentEntry,
                    description: `${baseEntry.description || 'Lançamento'} ${i + 1}/${installments}`,
                    due_date: newDueDate.toISOString(),
                });
            }
            
            const { data, error } = await supabase.from('financeiro').insert(entriesToInsert).select();
            if (error) handleSupabaseError(error, 'saveFinanceiroEntry (recurring)');
            return data;
        }

        // Se for uma nova entrada única
        const { data, error } = await supabase.from('financeiro').insert(baseEntry).select();
        if (error) handleSupabaseError(error, 'saveFinanceiroEntry (single new)');
        return data;
    },
    saveMultipleFinanceiroEntries: async (entries) => {
        if (!entries || entries.length === 0) return [];
        const { data, error } = await supabase.from('financeiro').insert(entries).select();
        if (error) handleSupabaseError(error, 'saveMultipleFinanceiroEntries');
        return data;
    },
    deleteFinanceiroEntry: async (id) => {
        const { error } = await supabase.from('financeiro').delete().eq('id', id);
        if (error) handleSupabaseError(error, 'deleteFinanceiroEntry');
    },
    getPaymentHistoryForEntry: async (financeiroId) => {
        const { data, error } = await supabase
            .from('payment_history')
            .select('*')
            .eq('financeiro_id', financeiroId)
            .order('payment_date', { ascending: false });
        if (error) handleSupabaseError(error, 'getPaymentHistoryForEntry');
        return data || [];
    },
    makePayment: async ({ financeiroId, amountPaid, paymentDate }) => {
        // Step 1: Record the payment in the history
        const { error: historyError } = await supabase
            .from('payment_history')
            .insert({ financeiro_id: financeiroId, amount_paid: amountPaid, payment_date: paymentDate });
        if (historyError) handleSupabaseError(historyError, 'makePayment (history insert)');
        
        // Step 2: Get the current financial entry
        const { data: entryData, error: fetchError } = await supabase
            .from('financeiro')
            .select('amount, paid_amount')
            .eq('id', financeiroId)
            .single();
        if (fetchError) handleSupabaseError(fetchError, 'makePayment (fetch entry)');
        if (!entryData) throw new Error('Lançamento financeiro não encontrado.');

        // Step 3: Calculate new total paid and determine new status
        const currentPaid = entryData.paid_amount || 0;
        const newPaidAmount = currentPaid + amountPaid;
        const totalAmount = entryData.amount;
        const newStatus = newPaidAmount >= totalAmount ? 'Pago' : 'Pendente';

        // Step 4: Update the financial entry
        const { error: updateError } = await supabase
            .from('financeiro')
            .update({
                paid_amount: newPaidAmount,
                status: newStatus,
                payment_date: paymentDate // Update the latest payment date, even if partial
            })
            .eq('id', financeiroId);
        if (updateError) handleSupabaseError(updateError, 'makePayment (update entry)');
    },
    reversePayment: async ({ paymentHistoryId, financeiroId, amountToReverse }) => {
        // Step 1: Delete the payment from history
        const { error: deleteError } = await supabase
            .from('payment_history')
            .delete()
            .eq('id', paymentHistoryId);
        if (deleteError) handleSupabaseError(deleteError, 'reversePayment (delete history)');

        // Step 2: Get the current financial entry
        const { data: entryData, error: fetchError } = await supabase
            .from('financeiro')
            .select('amount, paid_amount')
            .eq('id', financeiroId)
            .single();
        if (fetchError) handleSupabaseError(fetchError, 'reversePayment (fetch entry)');
        if (!entryData) throw new Error('Lançamento financeiro não encontrado para estorno.');

        // Step 3: Calculate new total paid and determine new status
        const currentPaid = entryData.paid_amount || 0;
        const newPaidAmount = Math.max(0, currentPaid - amountToReverse);
        const newStatus = newPaidAmount < entryData.amount ? 'Pendente' : 'Pago';
        
        // Step 4: Update the financial entry
        const { error: updateError } = await supabase
            .from('financeiro')
            .update({
                paid_amount: newPaidAmount,
                status: newStatus,
            })
            .eq('id', financeiroId);
        if (updateError) handleSupabaseError(updateError, 'reversePayment (update entry)');
    },
    
    // --- LANÇAMENTOS RECORRENTES ---
    getRecurringEntries: async () => {
        const { data: entries, error } = await supabase.from('recurring_entries').select('*').order('created_at', { ascending: false });
        if (error) handleSupabaseError(error, 'getRecurringEntries');
        if (!entries || entries.length === 0) return [];
        
        const { data: entities, error: entitiesError } = await supabase.from('entities').select('id, trade_name, legal_name');
        if (entitiesError) handleSupabaseError(entitiesError, 'getRecurringEntries (entities)');

        const entityMap = new Map((entities || []).map(e => [e.id, e.trade_name || e.legal_name]));

        return entries.map(entry => ({
            ...entry,
            entity_name: entityMap.get(entry.entity_id) || 'Entidade não encontrada'
        }));
    },
    saveRecurringEntry: async (entryData) => {
        const { data, error } = await supabase.from('recurring_entries').upsert(entryData).select();
        if (error) handleSupabaseError(error, 'saveRecurringEntry');
        return data;
    },
    deleteRecurringEntry: async (id) => {
        const { error } = await supabase.from('recurring_entries').delete().eq('id', id);
        if (error) handleSupabaseError(error, 'deleteRecurringEntry');
    },

    // --- FATURAMENTO ---
    invoiceChamado: async (chamado, paymentMethod) => {
        const totalValue = chamado.items?.reduce((acc, item) => acc + item.totalPrice, 0) || 0;
        
        // Update chamado status regardless of value
        const { error: chamadoError } = await supabase.from('chamados').update({ status: 'Concluído', invoiced: true }).eq('id', chamado.id);
        if (chamadoError) handleSupabaseError(chamadoError, 'invoiceChamado (chamado)');
        
        // Only create financial entry if there's a value
        if (totalValue > 0) {
            const financeiroEntry = {
                description: `Faturamento Chamado #${chamado.id} - ${chamado.client_name}`,
                amount: totalValue,
                due_date: new Date().toISOString(),
                type: 'R', // A Receber
                status: paymentMethod === 'À Vista' ? 'Pago' : 'Pendente',
                paid_amount: paymentMethod === 'À Vista' ? totalValue : 0,
                payment_date: paymentMethod === 'À Vista' ? new Date().toISOString() : null,
                entity_id: chamado.entity_id,
                chamado_id: chamado.id,
            };
            const { error: finError } = await supabase.from('financeiro').insert(financeiroEntry);
            if (finError) handleSupabaseError(finError, 'invoiceChamado (financeiro)');
        }
        
        // Check if this was the last chamado on an open route
        const { data: rotas, error: rotasError } = await supabase.from('rotas').select('*').eq('status', 'Aberta');
        if (rotasError) handleSupabaseError(rotasError, 'invoiceChamado (check rotas)');
        
        if (rotas && rotas.length > 0) {
            for (const rota of rotas) {
                if (rota.chamado_ids?.includes(chamado.id)) {
                    const { data: chamadosOnRoute, error: chamadosRouteError } = await supabase
                        .from('chamados')
                        .select('id, status')
                        .in('id', rota.chamado_ids);
                    if (chamadosRouteError) handleSupabaseError(chamadosRouteError, 'invoiceChamado (check chamados on rota)');

                    const allFinished = chamadosOnRoute?.every(c => c.status === 'Concluído' || c.status === 'Cancelado');
                    if (allFinished) {
                        const { error: rotaUpdateError } = await supabase.from('rotas').update({ status: 'Finalizada' }).eq('id', rota.id);
                        if (rotaUpdateError) handleSupabaseError(rotaUpdateError, 'invoiceChamado (update rota status)');
                    }
                    break; 
                }
            }
        }
    },
    bulkInvoiceChamados: async (chamados, paymentMethod) => {
        if (!chamados || chamados.length === 0) return;

        const clientId = chamados[0].entity_id;
        const clientName = chamados[0].client_name;
        const totalValue = chamados.reduce((acc, chamado) => {
            const chamadoTotal = chamado.items?.reduce((itemAcc, item) => itemAcc + item.totalPrice, 0) || 0;
            return acc + chamadoTotal;
        }, 0);

        const chamadosIds = chamados.map(c => c.id);
        const { error: chamadoError } = await supabase.from('chamados').update({ status: 'Concluído', invoiced: true }).in('id', chamadosIds);
        if (chamadoError) handleSupabaseError(chamadoError, 'bulkInvoiceChamados (chamados)');

        if (totalValue > 0) {
            const financeiroEntry = {
                description: `Faturamento de ${chamados.length} chamados - ${clientName}`,
                amount: totalValue,
                due_date: new Date().toISOString(),
                type: 'R', // A Receber
                status: paymentMethod === 'À Vista' ? 'Pago' : 'Pendente',
                paid_amount: paymentMethod === 'À Vista' ? totalValue : 0,
                payment_date: paymentMethod === 'À Vista' ? new Date().toISOString() : null,
                entity_id: clientId,
            };

            const { error: finError } = await supabase.from('financeiro').insert(financeiroEntry);
            if (finError) handleSupabaseError(finError, 'bulkInvoiceChamados (financeiro)');
        }
    },
    
    // --- DADOS DA EMPRESA ---
    getCompanyProfile: async () => {
        const { data, error } = await supabase.from('company_profiles').select('*').eq('id', 1).single();
        if (error && error.code !== 'PGRST116') { // PGRST116 is "exact one row not found"
             handleSupabaseError(error, 'getCompanyProfile');
        }
        return data;
    },
    saveCompanyProfile: async (profileData) => {
        const dataToSave = { id: 1, ...profileData };
        const { data, error } = await supabase.from('company_profiles').upsert(dataToSave).select();
        if (error) handleSupabaseError(error, 'saveCompanyProfile');
        return data;
    },

    // --- DATABASE SCHEMA ---
    verifyAndSyncSchema: async (sync = false) => {
        const statusMessages: { text: string; status: 'ok' | 'missing' | 'error' }[] = [];
        const actionsTaken: string[] = [];
        const missingTables: string[] = [];
        const missingColumns: { [tableName: string]: { name: string; type: string }[] } = {};

        // Step 1: Get the current schema from the database using the RPC
        const { data: currentSchema, error: rpcError } = await supabase.rpc('get_public_schema_info');

        if (rpcError) {
            console.error('RPC Error fetching schema:', rpcError);
            if (rpcError.message.includes("function get_public_schema_info() does not exist")) {
                 throw new Error(`SCHEMA_INTROSPECTION_ERROR: A função 'get_public_schema_info' não existe no seu banco de dados. Por favor, siga as instruções na página para criá-la.`);
            }
            throw new Error(`Erro ao buscar o esquema do banco: ${rpcError.message}`);
        }

        const expectedSchema = DATABASE_SCHEMA;

        // Step 2: Compare with the expected schema (DATABASE_SCHEMA)
        const expectedTables = Object.keys(expectedSchema);
        const actualTables = [...new Set((currentSchema || []).map(col => col.table_name))];

        for (const tableName of expectedTables) {
            if (!actualTables.includes(tableName)) {
                statusMessages.push({ text: `Tabela '${tableName}' está faltando`, status: 'missing' });
                missingTables.push(tableName);
            } else {
                statusMessages.push({ text: `Tabela '${tableName}' encontrada`, status: 'ok' });
                const expectedColumnsMap = expectedSchema[tableName].columns;
                const actualColumns = (currentSchema || []).filter(col => col.table_name === tableName).map(col => col.column_name);
                
                for (const [columnName, columnDef] of Object.entries(expectedColumnsMap)) {
                    if (!actualColumns.includes(columnName)) {
                        const columnType = (columnDef as { dataType: string }).dataType;
                        statusMessages.push({ text: `  Coluna '${columnName}' está faltando`, status: 'missing' });
                        if (!missingColumns[tableName]) missingColumns[tableName] = [];
                        missingColumns[tableName].push({ name: columnName, type: columnType });
                    }
                }
            }
        }
        
        // Step 3: If sync is enabled, perform the necessary actions
        if (sync) {
            // Create missing tables
            for (const tableName of missingTables) {
                const columns = Object.entries(expectedSchema[tableName].columns).map(([name, columnDef]) => `${name} ${(columnDef as { dataType: string }).dataType}`);
                const { error } = await supabase.rpc('create_table_from_schema', { p_table_name: tableName, p_columns: columns });
                if (error) {
                    statusMessages.push({ text: `Erro ao criar tabela '${tableName}': ${error.message}`, status: 'error' });
                } else {
                    actionsTaken.push(`Tabela '${tableName}' criada com sucesso.`);
                }
            }
            // Add missing columns
            for (const tableName in missingColumns) {
                for (const column of missingColumns[tableName]) {
                    const { error } = await supabase.rpc('add_column_from_schema', { p_table_name: tableName, p_column_name: column.name, p_column_type: column.type });
                    if (error) {
                         statusMessages.push({ text: `Erro ao adicionar coluna '${column.name}' a '${tableName}': ${error.message}`, status: 'error' });
                    } else {
                        actionsTaken.push(`Coluna '${column.name}' adicionada a '${tableName}'.`);
                    }
                }
            }
        }
        
        return { statusMessages, actionsTaken, missingTables, missingColumns };
    },

    // --- DATA MIGRATION ---
    checkForMigrations: async () => {
        try {
            // This is a "canary" query. We try to select a column that only exists in the old schema.
            const { error } = await supabase.from('entities').select('is_recurring').limit(1);
    
            if (!error) {
                // The query succeeded, meaning the 'is_recurring' column exists.
                // Now we check if there's actually data to migrate.
                const { count: dataCount, error: dataError } = await supabase
                    .from('entities')
                    .select('id', { count: 'exact', head: true })
                    .or('entity_type.is.not.null,is_recurring.eq.true');
    
                if (dataError) {
                    // This could be a complex RLS issue. Log it but assume migration is needed since the columns are there.
                    console.warn("Migration check warning: Could not count legacy data, but columns exist.", dataError);
                    return true; // Show the button just in case.
                }
                return (dataCount || 0) > 0;
            }
    
            // An error occurred. '42703' is "undefined_column". This is the expected case for a new schema.
            if (error.code === '42703') {
                return false; // Column doesn't exist, no migration needed.
            }
    
            // Any other error (e.g., permission denied from RLS) is ambiguous.
            // It's safer to show the button if we get an unexpected error, rather than hide it.
            console.warn("Ambiguous error during migration check. Assuming migration might be needed.", error);
            return true;
    
        } catch (e) {
            console.error('A non-standard error occurred in checkForMigrations:', e);
            return false; // Fail safe on catastrophic errors
        }
    },

    runDataMigration: async () => {
        // Step 1: Fetch ALL entities first to avoid errors on schemas missing legacy columns.
        const { data: allEntities, error: fetchError } = await supabase
            .from('entities')
            .select('*');

        if (fetchError) handleSupabaseError(fetchError, 'runDataMigration (fetch)');
        if (!allEntities || allEntities.length === 0) return 'Nenhuma entidade encontrada para verificar.';

        // Step 2: Filter on the client-side to find entities that need migration.
        const entitiesToMigrate = allEntities.filter(entity => 
            entity.entity_type != null || entity.is_recurring === true
        );
        
        if (entitiesToMigrate.length === 0) return 'Nenhuma migração necessária.';

        const entityUpdates: any[] = [];
        const recurringEntriesToCreate: any[] = [];

        // Step 3: Process each entity
        for (const entity of entitiesToMigrate) {
            const update: { [key: string]: any } = { id: entity.id };
            let needsUpdate = false;

            // Migrate entity_type to is_client/is_supplier flags
            if (entity.entity_type) {
                if (entity.entity_type === 'Cliente') update.is_client = true;
                if (entity.entity_type === 'Fornecedor') update.is_supplier = true;
                update.entity_type = null;
                needsUpdate = true;
            }

            // Migrate old recurring fields to new recurring_entries table
            if (entity.is_recurring && entity.recurring_amount && entity.recurring_due_day) {
                const type = entity.is_client || entity.entity_type === 'Cliente' ? 'R' : 'P';
                recurringEntriesToCreate.push({
                    type: type,
                    entity_id: entity.id,
                    description: `Faturamento Recorrente - ${entity.trade_name || entity.legal_name}`,
                    amount: entity.recurring_amount,
                    frequency: 'Mensal',
                    due_day: entity.recurring_due_day,
                    start_date: new Date().toISOString(),
                    status: 'Ativo',
                    account_plan: type === 'R' ? 'Receita de Vendas' : 'Despesa Administrativa',
                    payment_method: 'Boleto',
                });

                update.is_recurring = null;
                update.recurring_amount = null;
                update.recurring_due_day = null;
                needsUpdate = true;
            }

            if (needsUpdate) {
                entityUpdates.push(update);
            }
        }

        // Step 4: Execute database operations
        if (recurringEntriesToCreate.length > 0) {
            const { error: insertError } = await supabase.from('recurring_entries').insert(recurringEntriesToCreate);
            if (insertError) handleSupabaseError(insertError, 'runDataMigration (insert recurring)');
        }

        if (entityUpdates.length > 0) {
            const { error: updateError } = await supabase.from('entities').upsert(entityUpdates);
            if (updateError) handleSupabaseError(updateError, 'runDataMigration (update entities)');
        }

        return `Migração concluída: ${entityUpdates.length} entidades atualizadas e ${recurringEntriesToCreate.length} recorrências criadas.`;
    },
};
