
export interface ConceptCardData {
  term: string;
  definition: string;
  phonetic: string;
  context?: string;
  imageUrl?: string;
  type?: 'VOCAB' | 'DRILL' | 'LEGENDARY' | 'SESSION_END' | 'TRANSLATION' | 'JACKPOT' | 'PENALTY' | 'CONTEXT' | 'HIGH_ROLLER' | 'CORRECTION' | 'BRAINSCAPE' | 'CHALLENGE' | 'MEMORY_GAP';
  isChallenge?: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
  isAudioTranscription?: boolean;
  actionRequired?: 'LOGIN_GOOGLE' | 'NONE'; // New field for interactive buttons
}

export enum AppState {
  LOGIN = 'LOGIN',
  LANGUAGE_SELECTION = 'LANGUAGE_SELECTION',
  MODE_SELECTION = 'MODE_SELECTION',
  IDLE = 'IDLE',
  LIVE_SESSION = 'LIVE_SESSION',
  TEXT_CHAT = 'TEXT_CHAT',
  SESSION_SUMMARY = 'SESSION_SUMMARY',
  SESSION_HISTORY = 'SESSION_HISTORY'
}

export type LiveGameMode = 'FREE_TALK' | 'VOCAB_BLITZ' | 'GRAMMAR_GAUNTLET' | 'RAPID_FIRE' | 'DECODE' | 'ICON_STUDY' | 'BRAINSCAPE';

export interface AudioVisualizerData {
  volume: number;
}

// User Profile agora é apenas uma casca temporária
export interface UserProfile {
  id: string;
  name: string;
  email?: string;
  picture?: string;
  coins: number; // Instant reward
  difficultyLevel?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'NATIVE_SHOCK' | 'AUTO';
  currentPhase?: 'PHASE_0' | 'PHASE_1' | 'PHASE_2' | 'PHASE_3' | 'PHASE_4';
  lastSeen?: number;
}

export interface AuraGraphState {
  student_id: string;
  last_checkpoint: string;
  knowledge_graph: {
    assimilated_concepts: string[];
    current_weakness: string[];
    user_background: string;
  };
  next_action: string;
}

export interface PronunciationFeedback {
  targetWord: string;
  userPhonetic: string; // What it sounded like
  accuracyScore: number; // 0-100
  feedback: string; // "Too hard on the 'R'", etc.
}

export interface SessionReport {
  durationSeconds: number;
  cardsCollected: ConceptCardData[];
  totalCoins: number;
  maxMultiplier: number;
  flowRating: string; 
  difficultyLevel?: string;
  aiBrief?: string;
}
