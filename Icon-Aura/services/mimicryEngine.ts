export const MimicryEngine = {
  // Mimetização humana: Janela operacional 8h às 19h
  isWithinActiveWindow: (): boolean => {
    const hour = new Date().getHours();
    return hour >= 8 && hour < 19; // Bloqueio noturno anti-ban
  },

  // Simulação orgânica de digitação e delay cognitivo
  calculateOrganicDelay: (textLength: number): Promise<void> => {
    return new Promise(resolve => {
      const baseDelayMs = 1200;
      const typingSpeedMsPerChar = 42; 
      const jitter = Math.random() * 1000 - 500; 
      const totalDelay = Math.max(1000, baseDelayMs + (textLength * typingSpeedMsPerChar) + jitter);
      setTimeout(resolve, totalDelay);
    });
  },

  // Detecção de automação reversa e busca pelo decisor
  analyzeInputThreatLevel: (input: string): { isBot: boolean; requiresDecisionMaker: boolean } => {
    const botPatterns = ['/start', 'cancelar inscrição', 'bot', 'automático', 'http://', 'https://'];
    const decisionMakerKeywords = ['falar com atendente', 'gerente', 'comprar', 'preço', 'suporte humano'];
    
    const lowerInput = input.toLowerCase();
    return {
      isBot: botPatterns.some(p => lowerInput.includes(p)),
      requiresDecisionMaker: decisionMakerKeywords.some(kw => lowerInput.includes(kw))
    };
  }
};