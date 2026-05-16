export const ApiKeyManager = {
  // Coleta todas as chaves disponíveis no ambiente (Vite usa import.meta.env)
  getAvailableKeys: (): string[] => {
    const keys: string[] = [];
    
    // No Vite, as variáveis de ambiente são expostas via import.meta.env
    // E devem começar com VITE_
    const env = import.meta.env;

    console.log("[API MANAGER] Verificando ambiente VITE...");

    // Tenta pegar a chave principal e chaves secundárias
    if (env.VITE_GEMINI_API_KEY) keys.push(env.VITE_GEMINI_API_KEY);
    if (env.VITE_GEMINI_API_KEY_2) keys.push(env.VITE_GEMINI_API_KEY_2);
    if (env.VITE_GEMINI_API_KEY_3) keys.push(env.VITE_GEMINI_API_KEY_3);
    if (env.VITE_GEMINI_API_KEY_4) keys.push(env.VITE_GEMINI_API_KEY_4);

    console.log(`[API MANAGER] Chaves encontradas: ${keys.length}`);
    
    // Retorna apenas chaves únicas que não estejam vazias
    return [...new Set(keys.filter(k => k && k.length > 10))];
  },

  // Retorna a primeira chave válida (que não falhou ainda)
  getValidKey: (): string | null => {
    const keys = ApiKeyManager.getAvailableKeys();
    const failedKeys = JSON.parse(localStorage.getItem('aura_failed_api_keys') || '[]');
    
    const validKeys = keys.filter(k => !failedKeys.includes(k));
    
    if (validKeys.length > 0) {
        return validKeys[0];
    }
    
    // Se TODAS falharem, nós resetamos o cache e tentamos de novo a partir da primeira
    if (keys.length > 0) {
        console.warn("[API MANAGER] Todas as chaves falharam. Resetando ciclo de chaves.");
        ApiKeyManager.resetFailedKeys();
        return keys[0];
    }

    return null;
  },

  // Marca uma chave como esgotada
  reportKeyFailure: (failedKey: string) => {
    if (!failedKey) return;
    console.warn(`[API MANAGER] Limit Exceeded on Key: ...${failedKey.slice(-6)}. Auto-switching to next key.`);
    const failedKeys = JSON.parse(localStorage.getItem('aura_failed_api_keys') || '[]');
    if (!failedKeys.includes(failedKey)) {
        failedKeys.push(failedKey);
        localStorage.setItem('aura_failed_api_keys', JSON.stringify(failedKeys));
    }
  },

  resetFailedKeys: () => {
      localStorage.removeItem('aura_failed_api_keys');
  }
};