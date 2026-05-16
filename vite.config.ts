import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    
    // Mapeamento robusto de variáveis VITE_ para process.env (compatibilidade)
    const defineObj: any = {
      'process.env.API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY || ''),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY || '')
    };

    // Injeta automaticamente todas as chaves VITE_GEMINI_API_KEY_X
    Object.keys(env).forEach(key => {
      if (key.startsWith('VITE_GEMINI_API_KEY')) {
        const newKey = key.replace('VITE_', '');
        defineObj[`process.env.${newKey}`] = JSON.stringify(env[key]);
      }
    });

    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react(), tailwindcss()],
      define: defineObj,
      resolve: {
        alias: {
          '@': path.resolve(__dirname, './src'),
        }
      }
    };
});