
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Chat, FunctionDeclaration, Type } from '@google/genai';
import { AURA_SYSTEM_INSTRUCTION, MODEL_NAMES } from '../constants';
import { ChatMessage, ConceptCardData } from '../types';
import { MemorySystem } from '../services/memorySystem';
import { ApiRouter } from '../services/apiRouter';
import { generateSystemInstruction } from '../services/languageEngine';
import ReactMarkdown from 'react-markdown';

interface Props {
  onCardTrigger: (card: ConceptCardData) => void;
  selectedLanguage: string;
}

const ThinkingChat: React.FC<Props> = ({ onCardTrigger, selectedLanguage }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);

  const chatSessionRef = useRef<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const renderCardTool: FunctionDeclaration = {
    name: 'render_concept_card',
    description: 'Displays a concept card. ALL FIELDS MUST MATCH THE TERM EXACTLY.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        term: { type: Type.STRING, description: 'English Term.' },
        definition: { type: Type.STRING, description: 'Portuguese Translation of THIS term.' },
        phonetic: { type: Type.STRING, description: 'Brazilian Phonetics of THIS term. NO SYMBOLS.' },
        instruction: { type: Type.STRING, description: 'Actionable instruction using THIS term.' },
        cardType: { 
          type: Type.STRING, 
          description: 'VOCAB (Blue), CORRECTION (Red), CONTEXT (Purple), TRANSLATION (Green), MEMORY_GAP (Yellow).' 
        }
      },
      required: ['term', 'definition', 'phonetic', 'instruction', 'cardType'],
    },
  };

  const memoryTool: FunctionDeclaration = {
    name: 'update_student_memory',
    description: 'Saves important facts, grammar gaps, or fluency ratings to long term memory.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        category: { 
          type: Type.STRING, 
          description: 'Category: GRAMMAR_GAP, FLUENCY_RATING, or MASTERED_VOCAB.' 
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
      const apiKey = ApiRouter.getGoogleKey();
      if (!apiKey) {
        console.error("API Key not found for ThinkingChat");
        return;
      }
      const ai = new GoogleGenAI({ apiKey });
      
      const memoryContext = MemorySystem.getContextPrompt();
      const fullSystemInstruction = generateSystemInstruction(AURA_SYSTEM_INSTRUCTION, selectedLanguage, 'FULL')
        .replace('{{MEMORY_CONTEXT}}', memoryContext);

      chatSessionRef.current = ai.chats.create({
        model: MODEL_NAMES.CHAT,
        config: {
          systemInstruction: fullSystemInstruction,
          tools: [{ functionDeclarations: [renderCardTool, memoryTool] }],
        }
      });
      
      const prompts = [
        "Hi! I'm AURA. Tell me something that happened to you recently.",
        "Hey! Ready to practice some English? What's on your mind?",
        "Hello! Let's chat. What would you like to talk about today?"
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
    
    try {
      const result = await chatSessionRef.current.sendMessageStream({ message: input });
      
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
                          type: args.cardType || 'VOCAB',
                          semanticColor: args.semanticColor,
                          hint: args.hint,
                        };
                        
                        onCardTrigger(cardData);
                        MemorySystem.logCardTrigger(cardData);
                        toolResult = { result: 'Card displayed.' };

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
      
    } catch (e) {
      console.error(e);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'model',
        text: "SYSTEM ERROR: Please try again.",
        timestamp: new Date()
      }]);
    } finally {
      setIsThinking(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-black/40 backdrop-blur-sm rounded-lg border border-white/5 relative">
      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-20">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div className={`max-w-[85%] p-4 rounded-lg relative ${
              msg.role === 'user' 
                ? 'bg-blue-500/20 border border-blue-500/50 text-white rounded-tr-none' 
                : 'bg-neutral-800 border border-gray-700 text-gray-200 rounded-tl-none'
            }`}>
              <div className="text-xs font-mono mb-1 opacity-50 uppercase flex justify-between items-center gap-4">
                <span>{msg.role === 'model' ? 'AURA' : 'YOU'}</span>
                {msg.role === 'model' && <span className="text-[9px] tracking-widest text-neutral-500">{new Date().toLocaleTimeString()}</span>}
              </div>
              
              <div className="prose prose-invert prose-sm font-tech leading-relaxed">
                <ReactMarkdown>{msg.text}</ReactMarkdown>
              </div>
            </div>
          </div>
        ))}
        {isThinking && (
           <div className="flex justify-start">
             <div className="bg-neutral-800 p-4 rounded-lg border border-gray-700 flex items-center gap-2">
               <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
               <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
               <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
               <span className="text-xs font-mono text-blue-400 ml-2">THINKING...</span>
             </div>
           </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-gray-800 bg-black/40">
        <div className="flex gap-2">
          <input 
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type your message..."
            className="flex-1 bg-neutral-900 border border-gray-700 rounded p-3 text-white focus:outline-none focus:border-blue-500 transition-colors font-mono text-sm"
          />
          <button 
            onClick={handleSend}
            disabled={isThinking || !input}
            className="bg-blue-500 text-white font-bold px-6 rounded hover:bg-blue-600 disabled:opacity-50 transition-colors uppercase font-display"
          >
            SEND
          </button>
        </div>
      </div>
    </div>
  );
};

export default ThinkingChat;
