import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('As variáveis de ambiente VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY são obrigatórias.');
}

// Criando o cliente do Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  db: {
    schema: 'luizart', // Define o schema padrão como luizart
  },
});
