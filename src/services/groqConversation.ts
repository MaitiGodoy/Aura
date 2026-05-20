/** Groq Conversation Engine — fallback ativo quando Google keys exaustam */

import { ApiRouter } from './apiRouter';
import { MemorySystem } from './memorySystem';
import { generateSystemInstruction } from './languageEngine';
import { Amplitude } from './amplitudeStore';
import { AURA_SYSTEM_INSTRUCTION, AURA_HANDS_FREE_SYSTEM_INSTRUCTION, AURA_ICON_SYSTEM_INSTRUCTION, AURA_AMOS_SYSTEM_INSTRUCTION } from '../constants';

type Message = { role: 'system' | 'user' | 'assistant'; content: string };

export interface GroqToolCall {
  name: string;
  args: Record<string, any>;
}

export type GroqCallback = {
  onTranscript: (text: string) => void;
  onResponse: (text: string) => void;
  onToolCall: (tool: GroqToolCall) => void;
  onError: (error: string) => void;
  onSpeakingChange: (speaking: boolean) => void;
};

class GroqConversationEngine {
  private isRunning = false;
  private messages: Message[] = [];
  private recognition: any = null;
  private synthesis: SpeechSynthesis | null = null;
  private callback: GroqCallback | null = null;
  private silenceTimer: ReturnType<typeof setTimeout> | null = null;
  private isSpeaking = false;
  private abortSpeaking = false;

  constructor() {
    if (typeof window === 'undefined') return;
    this.synthesis = window.speechSynthesis;
    this.setupRecognition();
  }

  private setupRecognition(): void {
    if (typeof window === 'undefined') return;
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    this.recognition = new SR();
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = 'en-US';
    this.recognition.onresult = (e: any) => this.onResult(e);
    this.recognition.onerror = (e: any) => {
      if (e.error === 'no-speech' || e.error === 'aborted') {
        if (this.isRunning) this.startListening();
      }
    };
    this.recognition.onend = () => {
      if (this.isRunning) this.startListening();
    };
  }

  get isAvailable(): boolean {
    return !!this.recognition && !!this.synthesis && ApiRouter.hasGroq;
  }

  setSystemInstruction(si: string): void {
    if (this.messages.length > 0 && this.messages[0].role === 'system') {
      this.messages[0] = { role: 'system', content: si };
    }
  }

  async start(selectedLanguage: string, mode: string, callback: GroqCallback, selectedIcon?: string): Promise<void> {
    if (this.isRunning) return;
    this.isRunning = true;
    this.callback = callback;

    let si: string;
    switch (mode) {
      case 'HANDS_FREE':
        si = generateSystemInstruction(AURA_HANDS_FREE_SYSTEM_INSTRUCTION, selectedLanguage, 'WOKE');
        break;
      case 'ICON_MODE':
        si = generateSystemInstruction(
          AURA_ICON_SYSTEM_INSTRUCTION.replace('{{SELECTED_ICON}}', selectedIcon || 'Ask user what they want to study today.'),
          selectedLanguage, 'ICON'
        );
        break;
      case 'BRAINSCAPE':
        si = generateSystemInstruction(AURA_AMOS_SYSTEM_INSTRUCTION, selectedLanguage, 'AMOS');
        break;
      default:
        si = generateSystemInstruction(AURA_SYSTEM_INSTRUCTION, selectedLanguage, 'FULL');
    }

    si = si.replace('{{MEMORY_CONTEXT}}', MemorySystem.getContextPrompt());

    si += `\n\nTOOL CALL INSTRUCTION: When you need to perform a UI action, include EXACTLY one of these markers in your response:
- To show a concept card: [TOOL:render_concept_card {"term":"...","definition":"...","phonetic":"...","instruction":"...","cardType":"VOCAB","semanticColor":"blue","hint":"description without revealing the word","exampleSentence":"complete sentence using the term","exampleTranslation":"Portuguese translation of the sentence"}]
- To switch mode: [TOOL:switch_game_mode {"mode":"VOCAB_FOCUS"}]
- To record a grammar gap: [TOOL:record_grammar_gap {"gap":"..."}]
- To trigger homework: [TOOL:trigger_homework {"exercise":"..."}]
- To switch difficulty: [TOOL:switch_difficulty {"level":"BEGINNER"}]
- To analyze pronunciation: [TOOL:analyze_pronunciation {"targetWord":"...","userPhonetic":"...","accuracyScore":75,"feedback":"detailed coaching feedback","syllableBreakdown":[{"syllable":"ta","correct":true},{"syllable":"ble","correct":false,"tip":"use softer L"}],"specificErrors":["L sound too hard, soften it"],"nativePhonetic":"tá-bou"}]
The marker will be parsed and the tool executed. Do NOT mention the marker itself to the user. Speak naturally around it. You may fire at most ONE tool per response. ALWAYS include exampleSentence on concept cards. ALWAYS include syllableBreakdown and specificErrors on pronunciation feedback.`;

    this.messages = [{ role: 'system', content: si }];

    callback.onSpeakingChange(true);
    const greeting = await ApiRouter.groqChat([
      { role: 'system', content: si },
      { role: 'user', content: 'Start the conversation. Greet the student warmly and ask how they are today.' }
    ], { max_tokens: 150, temperature: 0.8 });

    if (greeting) {
      const cleaned = this.processToolCalls(greeting);
      this.messages.push({ role: 'assistant', content: greeting });
      callback.onResponse(cleaned);
      await this.speak(cleaned);
    }

    callback.onSpeakingChange(false);
    this.startListening();
  }

  stop(): void {
    this.isRunning = false;
    this.abortSpeaking = true;
    this.stopListening();
    this.stopSpeaking();
    if (this.silenceTimer) clearTimeout(this.silenceTimer);
    this.messages = [];
    this.callback = null;
    this.isSpeaking = false;
  }

  private startListening(): void {
    if (!this.recognition || !this.isRunning) return;
    try { this.recognition.start(); } catch (e) {}
  }

  private stopListening(): void {
    if (!this.recognition) return;
    try { this.recognition.stop(); } catch (e) {}
  }

  private stopSpeaking(): void {
    if (this.synthesis) {
      this.synthesis.cancel();
      this.isSpeaking = false;
    }
  }

  private onResult(event: any): void {
    // Barge-in: if speaking and user says something, interrupt
    if (this.isSpeaking) {
      let hasFinal = false;
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) { hasFinal = true; break; }
      }
      if (hasFinal || this.hasSignificantVolume(event)) {
        this.stopSpeaking();
        this.callback?.onSpeakingChange(false);
        // Don't process turn — just stop TTS and listen
        if (this.silenceTimer) clearTimeout(this.silenceTimer);
        return;
      }
    }

    let final = '';
    for (let i = event.resultIndex; i < event.results.length; i++) {
      if (event.results[i].isFinal) final += event.results[i][0].transcript;
    }
    if (!final.trim()) return;

    this.callback?.onTranscript(final);
    if (this.silenceTimer) clearTimeout(this.silenceTimer);
    this.silenceTimer = setTimeout(() => this.processTurn(final), 800);
  }

  private hasSignificantVolume(event: any): boolean {
    return Amplitude.micInputVolume > 0.15;
  }

  private async processTurn(text: string): Promise<void> {
    if (!this.isRunning) return;

    this.stopListening();
    this.callback?.onSpeakingChange(true);

    this.messages.push({ role: 'user', content: text });

    const response = await ApiRouter.groqChat(this.messages, {
      max_tokens: 300, temperature: 0.7,
    });

    if (response) {
      this.messages.push({ role: 'assistant', content: response });
      const cleaned = this.processToolCalls(response);
      this.callback?.onResponse(cleaned);
      await this.speak(cleaned);
    } else {
      this.callback?.onError('Groq request failed');
    }

    this.callback?.onSpeakingChange(false);
    if (this.isRunning) this.startListening();
  }

  private processToolCalls(text: string): string {
    const toolRegex = /\[TOOL:(\w+)\s*(\{.*?\})\]/g;
    let match;
    while ((match = toolRegex.exec(text)) !== null) {
      try {
        const args = JSON.parse(match[2]);
        this.callback?.onToolCall({ name: match[1], args });
      } catch (e) {
        console.warn('[Groq] Failed to parse tool call args:', match[2]);
      }
    }
    return text.replace(/\[TOOL:\w+\s*\{.*?\}\]/g, '').trim();
  }

  private speak(text: string): Promise<void> {
    return new Promise((resolve) => {
      if (!this.synthesis || !text) { resolve(); return; }
      if (this.abortSpeaking) { this.abortSpeaking = false; resolve(); return; }
      this.synthesis.cancel();
      this.isSpeaking = true;
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 0.9; u.pitch = 1.0; u.volume = 1.0;
      u.lang = 'en-US';
      const voices = this.synthesis.getVoices();
      const en = voices.find(v => v.lang.startsWith('en'));
      if (en) u.voice = en;
      u.onend = () => { this.isSpeaking = false; resolve(); };
      u.onerror = () => { this.isSpeaking = false; resolve(); };
      this.synthesis.speak(u);
    });
  }

  async injectSystemMessage(content: string): Promise<void> {
    this.messages.push({ role: 'system', content });
    const response = await ApiRouter.groqChat(this.messages, { max_tokens: 100, temperature: 0.5 });
    if (response) {
      this.messages.push({ role: 'assistant', content: response });
      const cleaned = this.processToolCalls(response);
      this.callback?.onResponse(cleaned);
      await this.speak(cleaned);
    }
  }

  getHistory(): Message[] {
    return [...this.messages];
  }
}

export const GroqEngine = new GroqConversationEngine();
