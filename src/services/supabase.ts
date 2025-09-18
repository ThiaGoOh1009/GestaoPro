import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './key';

// As chaves são importadas do arquivo central src/services/key.ts
const supabaseUrl = SUPABASE_URL;
const supabaseAnonKey = SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Supabase URL and anon key are required. Make sure to configure them in src/services/key.ts.");
    // Display a user-friendly error on the screen
    document.body.innerHTML = `<div style="color: #f87171; background-color: #111827; height: 100vh; display: flex; flex-direction: column; justify-content: center; align-items: center; font-family: sans-serif;"><h1>Erro de Configuração</h1><p style="margin-top: 8px;">A aplicação não pôde se conectar ao banco de dados. Verifique o arquivo de configuração de chaves (key.ts).</p></div>`
    throw new Error("Supabase URL and anon key are required.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
