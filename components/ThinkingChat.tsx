
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Chat, FunctionDeclaration, Type } from '@google/genai';
import { AURA_SYSTEM_INSTRUCTION, MODEL_NAMES } from '../constants';
import { ChatMessage, ConceptCardData } from '../types';
import { MemorySystem } from '../services/memorySystem';
import { ApiKeyManager } from '../services/apiKeyManager';
import ReactMarkdown from 'react-markdown';
import GamificationHUD from './GamificationHUD';

interface Props {
  onCardTrigger: (card: ConceptCardData) => void;
  selectedLanguage: string;
}

const ThinkingChat: React.FC<Props> = ({ onCardTrigger, selectedLanguage }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [xpUpdateTrigger, setXpUpdateTrigger] = useState(0);
  const [coins, setCoins] = useState(0);
  const [multiplier, setMultiplier] = useState(1.0);
  const [userIsLogged, setUserIsLogged] = useState(false);

  const chatSessionRef = useRef<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Tools Definition
  const renderCardTool: FunctionDeclaration = {
    name: 'render_concept_card',
    description: 'Displays a holographic concept card. ALL FIELDS MUST MATCH THE TERM EXACTLY.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        term: { type: Type.STRING, description: 'English Term.' },
        definition: { type: Type.STRING, description: 'Portuguese Translation of THIS term.' },
        phonetic: { type: Type.STRING, description: 'Brazilian Phonetics of THIS term (e.g., "Uó-ter"). NO SYMBOLS.' },
        instruction: { type: Type.STRING, description: 'Actionable instruction using THIS term.' },
        cardType: { 
          type: Type.STRING, 
          description: 'VOCAB (Blue/New Word), CORRECTION (Red/Mistake), CONTEXT (Purple/Flow), TRANSLATION (Green/How do you say), JACKPOT (Gold/Surprise).' 
        }
      },
      required: ['term', 'definition', 'phonetic', 'instruction', 'cardType'],
    },
  };

  const neuroEchoTool: FunctionDeclaration = {
    name: 'trigger_neuro_echo',
    description: 'Activates NEURO-ECHO mode. Use this to force the user to shadow/repeat a phrase instantly.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        phrase: { type: Type.STRING, description: 'The short phrase for the user to echo.' }
      },
      required: ['phrase']
    }
  };

  const memoryTool: FunctionDeclaration = {
    name: 'update_student_memory',
    description: 'Saves important facts (hooks), grammar gaps, or fluency ratings to the student Long Term Memory.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        category: { 
          type: Type.STRING, 
          description: 'Category: GRAMMAR_GAP, EMOTIONAL_HOOK, FLUENCY_RATING, or MASTERED_VOCAB.' 
        },
        value: { 
          type: Type.STRING, 
          description: 'The fact or value to save.' 
        }
      },
      required: ['category', 'value']
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const initChat = () => {
    if (!chatSessionRef.current) {
      MemorySystem.logSessionStart();
      const apiKey = ApiKeyManager.getValidKey();
      if (!apiKey) {
        console.error("API Key not found for ThinkingChat");
        setMessages([{
            id: 'init-err',
            role: 'model',
            text: "⚠️ **ERRO DE SISTEMA:** Nenhuma Chave de API Válida configurada no `.env`.",
            timestamp: new Date()
        }]);
        return;
      }
      const ai = new GoogleGenAI({ apiKey });
      
      const memoryContext = MemorySystem.getContextPrompt();
      const fullSystemInstruction = AURA_SYSTEM_INSTRUCTION
        .replace('{{MEMORY_CONTEXT}}', memoryContext)
        .replace(/English/g, selectedLanguage.toUpperCase());

      chatSessionRef.current = ai.chats.create({
        model: MODEL_NAMES.CHAT,
        config: {
          systemInstruction: fullSystemInstruction,
          tools: [{ functionDeclarations: [renderCardTool, neuroEchoTool, memoryTool] }],
        }
      });
      
      const prompts = [
        "HELLO PARTY ANIMAL! 🎉 I'm bored. Tell me something crazy that happened to you.",
        "AURA IN THE HOUSE! 🎧 Microphone check, one two. Are you ready to crush some English?",
        "Confession time! 🤫 What is your guiltiest pleasure? Tell me in English! Don't lie!"
      ];
      
      const initialText = prompts[Math.floor(Math.random() * prompts.length)];

      setMessages([{
        id: 'init',
        role: 'model',
        text: initialText,
        timestamp: new Date()
      }]);
    }
  };

  useEffect(() => {
    initChat();
  }, []);

  const simulateGoogleLogin = () => {
      // Simulate the effect of logging in
      setMessages(prev => [...prev, {
          id: Date.now().toString(),
          role: 'model',
          text: "✅ **NEURAL LINK ESTABLISHED.**\n\nWelcome back, Commander. Google Credentials synced. XP Multiplier set to **MAXIMUM**.",
          timestamp: new Date()
      }]);
      setUserIsLogged(true);
      setMultiplier(5.0); // Boost for logging in
      setCoins(prev => prev + 1000);
      setXpUpdateTrigger(Date.now());
  };

  const handleSend = async () => {
    if (!input.trim() || isThinking || !chatSessionRef.current) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsThinking(true);
    
    setCoins(prev => prev + 10);
    setMultiplier(prev => Math.min(prev + 0.1, 5.0));

    // [EIXO 1/2] Inject UI State Payload into the AI message
    const uiStatePayload = `
    [SYSTEM STRUCTURAL PAYLOAD - DO NOT SHOW TO USER]
    {
      "active_session": {
        "current_context": "MOD_02_LÓGICA",
        "ui_state": {
          "open_cards": [],
          "brainscape_metrics": { "active_flashcard": null, "user_filled_input": "${input.replace(/"/g, '\\"')}" }
        }
      }
    }
    [END PAYLOAD]

    ${input}
    `;

    try {
      const result = await chatSessionRef.current.sendMessageStream({ message: uiStatePayload });
      
      let fullText = '';
      const botMsgId = (Date.now() + 1).toString();
      
      setMessages(prev => [...prev, {
        id: botMsgId,
        role: 'model',
        text: '',
        timestamp: new Date()
      }]);

      for await (const chunk of result) {
        const text = chunk.text;
        if (text) {
          fullText += text;
          setMessages(prev => prev.map(m => m.id === botMsgId ? { ...m, text: fullText } : m));
        }

        if (chunk.functionCalls && chunk.functionCalls.length > 0) {
            const functionResponses = [];
            
            for (const toolCall of chunk.functionCalls) {
                let toolResult = { result: "Success" };
                
                try {
                    if (toolCall.name === 'render_concept_card') {
                        const args = toolCall.args as any;
                        const cardData: ConceptCardData = {
                          term: args.term,
                          definition: args.definition,
                          phonetic: args.phonetic,
                          context: args.instruction,
                          type: args.cardType || 'VOCAB'
                        };
                        
                        onCardTrigger(cardData);
                        MemorySystem.logCardTrigger(cardData);
                        setCoins(prev => prev + 500); 
                        setXpUpdateTrigger(Date.now()); 
                        toolResult = { result: 'Card displayed.' };

                    } else if (toolCall.name === 'trigger_neuro_echo') {
                        const args = toolCall.args as any;
                        const echoMsg = `\n\n**🛑 STOP! NEURO-ECHO PROTOCOL:**\n> *"${args.phrase}"*\n\nType it back to me exactly!`;
                        setMessages(prev => prev.map(m => m.id === botMsgId ? { ...m, text: (m.text + echoMsg) } : m));
                        toolResult = { result: 'Echo challenge displayed.' };

                    } else if (toolCall.name === 'update_student_memory') {
                        const args = toolCall.args as any;
                        MemorySystem.updateMemory(args.category, args.value);
                        toolResult = { result: 'Memory updated.' };
                    }
                } catch (e: any) {
                    console.error("Tool Error", e);
                    toolResult = { result: `Error: ${e.message}` };
                }

                functionResponses.push({
                    name: toolCall.name,
                    id: toolCall.id,
                    response: toolResult
                });
            }

            if (functionResponses.length > 0) {
                 const toolStream = await chatSessionRef.current.sendMessageStream({
                     message: functionResponses.map(fr => ({
                         functionResponse: fr
                     }))
                 });
                 for await (const chunk of toolStream) {
                   if (chunk.text) {
                     fullText += chunk.text;
                     setMessages(prev => prev.map(m => m.id === botMsgId ? { ...m, text: fullText } : m));
                   }
                 }
            }
        }
      }
      
    } catch (e: any) {
      console.error(e);
      const errorStr = String(e);
      
      // Auto-Key Switching Logic on Quota/429 Error
      if (errorStr.includes('429') || errorStr.toLowerCase().includes('quota') || errorStr.toLowerCase().includes('spending cap')) {
          const currentKey = ApiKeyManager.getValidKey();
          if (currentKey) {
             ApiKeyManager.reportKeyFailure(currentKey);
          }
          
          const nextKey = ApiKeyManager.getValidKey();
          if (nextKey && nextKey !== currentKey) {
              setMessages(prev => [...prev, {
                id: Date.now().toString(),
                role: 'model',
                text: "⚠️ **LIMITE ALCANÇADO:** Chave atual esgotada. Chave reserva acionada. Reiniciando núcleo cognitivo... Digite novamente.",
                timestamp: new Date()
              }]);
              chatSessionRef.current = null; // Force chat re-init
              initChat(); // Re-init with new key
          } else {
              setMessages(prev => [...prev, {
                id: Date.now().toString(),
                role: 'model',
                text: "⚠️ **FALHA CRÍTICA:** TODAS as suas Chaves de API esgotaram os créditos gratuitos do Google. Renove no AI Studio.",
                timestamp: new Date()
              }]);
          }
      } else {
          setMessages(prev => [...prev, {
            id: Date.now().toString(),
            role: 'model',
            text: "SYSTEM ERROR: Cognitive Overload.",
            timestamp: new Date()
          }]);
      }
    } finally {
      setIsThinking(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-neutral-900/50 rounded-lg border border-gray-800 relative">
      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-20">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div className={`max-w-[85%] p-4 rounded-lg relative ${
              msg.role === 'user' 
                ? 'bg-[#00f0ff]/20 border border-[#00f0ff]/50 text-white rounded-tr-none' 
                : 'bg-neutral-800 border border-gray-700 text-gray-200 rounded-tl-none'
            }`}>
              <div className="text-xs font-mono mb-1 opacity-50 uppercase flex justify-between items-center gap-4">
                <span>{msg.role === 'model' ? 'AURA ⚡' : 'YOU'}</span>
                {msg.role === 'model' && <span className="text-[9px] tracking-widest text-neutral-500">{new Date().toLocaleTimeString()}</span>}
              </div>
              
              <div className="prose prose-invert prose-sm font-tech leading-relaxed">
                <ReactMarkdown>{msg.text}</ReactMarkdown>
              </div>

              {/* ACTION BUTTON RENDERER */}
              {msg.actionRequired === 'LOGIN_GOOGLE' && !userIsLogged && (
                  <div className="mt-4 border-t border-white/10 pt-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                      <button 
                        onClick={simulateGoogleLogin}
                        className="w-full group relative overflow-hidden bg-white text-black font-bold py-3 rounded flex items-center justify-center gap-3 transition-transform hover:scale-[1.02] active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                      >
                         <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" className="w-5 h-5" alt="G" />
                         <span className="font-display tracking-wide">CONNECT NEURAL LINK</span>
                         <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent -translate-x-full group-hover:animate-[shine_1.5s_infinite]"></div>
                      </button>
                      <div className="text-[10px] text-center mt-2 text-gray-500 font-mono">SECURE OAUTH 2.0 BRIDGE DETECTED</div>
                  </div>
              )}
               {msg.actionRequired === 'LOGIN_GOOGLE' && userIsLogged && (
                  <div className="mt-4 border-t border-green-500/30 pt-2">
                       <div className="bg-green-500/10 text-green-400 text-xs font-mono py-2 px-3 rounded border border-green-500/30 text-center flex items-center justify-center gap-2">
                           <span>🔒</span> ACCESS GRANTED
                       </div>
                  </div>
              )}
            </div>
          </div>
        ))}
        {isThinking && (
           <div className="flex justify-start">
             <div className="bg-neutral-800 p-4 rounded-lg border border-gray-700 flex items-center gap-2">
               <div className="w-2 h-2 bg-[#ffff00] rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
               <div className="w-2 h-2 bg-[#ffff00] rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
               <div className="w-2 h-2 bg-[#ffff00] rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
               <span className="text-xs font-mono text-[#ffff00] ml-2">PROCESSING...</span>
             </div>
           </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      {/* GAMIFICATION HUD */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 w-full max-w-lg z-10 pointer-events-none opacity-80">
         <GamificationHUD triggerUpdate={xpUpdateTrigger} multiplier={multiplier} coins={coins} />
      </div>

      <div className="p-4 border-t border-gray-800 bg-black/40">
        <div className="flex gap-2">
          <input 
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type /google to sync or just chat..."
            className="flex-1 bg-neutral-900 border border-gray-700 rounded p-3 text-white focus:outline-none focus:border-[#00f0ff] transition-colors font-mono text-sm"
          />
          <button 
            onClick={handleSend}
            disabled={isThinking || !input}
            className="bg-[#00f0ff] text-black font-bold px-6 rounded hover:bg-[#00c0cc] disabled:opacity-50 transition-colors uppercase font-display"
          >
            SEND
          </button>
        </div>
      </div>
    </div>
  );
};

export default ThinkingChat;
