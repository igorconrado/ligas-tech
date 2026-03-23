// ── Supabase Client ──
// Conexão principal com o Supabase.
// Substituir pelas credenciais reais do projeto antes de ir pra produção.

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

// TODO: Substituir pelas credenciais reais do projeto Supabase
const SUPABASE_URL = 'https://SEU_PROJETO.supabase.co'
const SUPABASE_ANON_KEY = 'SUA_CHAVE_ANONIMA'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
