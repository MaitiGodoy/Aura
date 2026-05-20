import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');

  // ÚNICA chave Google utilizada por todas as funções (sandbox)
  const googleKey = env.GOOGLE_ACTIVE_API_KEY || env.VITE_GOOGLE_ACTIVE_API_KEY || '';

  // Suporte a múltiplas chaves para rotação futura
  const key1 = env.GOOGLE_API_KEY_1 || env.VITE_GOOGLE_API_KEY_1 || googleKey;
  const key2 = env.GOOGLE_API_KEY_2 || env.VITE_GOOGLE_API_KEY_2 || googleKey;
  const key3 = env.GOOGLE_API_KEY_3 || env.VITE_GOOGLE_API_KEY_3 || googleKey;
  const key4 = env.GOOGLE_API_KEY_4 || env.VITE_GOOGLE_API_KEY_4 || googleKey;
  const key5 = env.GOOGLE_API_KEY_5 || env.VITE_GOOGLE_API_KEY_5 || googleKey;

  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.GOOGLE_API_KEY_1': JSON.stringify(key1),
      'process.env.GOOGLE_API_KEY_2': JSON.stringify(key2),
      'process.env.GOOGLE_API_KEY_3': JSON.stringify(key3),
      'process.env.GOOGLE_API_KEY_4': JSON.stringify(key4),
      'process.env.GOOGLE_API_KEY_5': JSON.stringify(key5),

      // Groq desativada
      'process.env.GROQ_API_KEY': JSON.stringify(''),

      // Supabase
      'process.env.SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL || env.SUPABASE_URL || ''),
      'process.env.SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY || ''),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
  };
});
